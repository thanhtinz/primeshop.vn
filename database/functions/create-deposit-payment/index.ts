import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Vui lòng đăng nhập" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Phiên đăng nhập không hợp lệ" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { depositId, amount, description } = await req.json();

    console.log("Creating deposit payment:", { depositId, amount, description, userId: user.id });

    if (!amount || amount < 10000) {
      return new Response(JSON.stringify({ error: "Số tiền tối thiểu là 10,000đ" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount > 1000000000) {
      return new Response(JSON.stringify({ error: "Số tiền vượt quá giới hạn cho phép" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let actualDepositId = depositId;
    if (!actualDepositId) {
      const { data: newDeposit, error: createError } = await supabase
        .from("deposit_transactions")
        .insert({
          user_id: user.id,
          amount: amount,
          status: "pending",
          payment_provider: "payos",
        })
        .select()
        .single();

      if (createError || !newDeposit) {
        console.error("Error creating deposit:", createError);
        return new Response(JSON.stringify({ error: "Không thể tạo giao dịch nạp tiền" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      actualDepositId = newDeposit.id;
      console.log("Created new deposit transaction:", actualDepositId);
    } else {
      const { data: existingDeposit, error: checkError } = await supabase
        .from("deposit_transactions")
        .select("user_id, status")
        .eq("id", actualDepositId)
        .single();

      if (checkError || !existingDeposit) {
        return new Response(JSON.stringify({ error: "Giao dịch không tồn tại" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existingDeposit.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Không có quyền truy cập" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existingDeposit.status !== "pending") {
        return new Response(JSON.stringify({ error: "Giao dịch đã được xử lý" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: payosClientId } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payos_client_id")
      .single();

    const { data: payosApiKey } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payos_api_key")
      .single();

    const { data: payosChecksumKey } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payos_checksum_key")
      .single();

    if (!payosClientId?.value || !payosApiKey?.value || !payosChecksumKey?.value) {
      console.error("PayOS not configured");
      return new Response(JSON.stringify({ error: "PayOS chưa được cấu hình" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = String(payosClientId.value).replace(/"/g, "");
    const apiKey = String(payosApiKey.value).replace(/"/g, "");
    const checksumKey = String(payosChecksumKey.value).replace(/"/g, "");
    const debug = (Deno.env.get("PAYOS_DEBUG") || "0") === "1";

    const orderCode = Math.abs(parseInt(actualDepositId.replace(/-/g, "").slice(0, 8), 16) % 1000000000);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || req.headers.get("origin") || "https://wlfytumovijolhtlnilu.lovable.app";
    const origin = frontendUrl;
    const paymentDescription = description || `Nạp tiền - ${actualDepositId.slice(0, 8)}`;

    // Create checksum
    const encoder = new TextEncoder();
    const data = `amount=${amount}&cancelUrl=${origin}/settings/deposit&description=${paymentDescription}&orderCode=${orderCode}&returnUrl=${origin}/settings/deposit?deposit=${actualDepositId}`;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(checksumKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
    const checksum = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Prepare PayOS request body - NO webhookUrl!
    const payosRequestBody: any = {
      orderCode: orderCode,
      amount: amount,
      description: paymentDescription,
      cancelUrl: `${origin}/settings/deposit`,
      returnUrl: `${origin}/settings/deposit?deposit=${actualDepositId}`,
      signature: checksum,
    };

    // Optionally include webhook URL if provided in env (useful when PayOS needs explicit webhook in payload)
    const payosWebhookUrl = Deno.env.get("PAYOS_WEBHOOK_URL");
    if (payosWebhookUrl) {
      payosRequestBody.webhookUrl = String(payosWebhookUrl);
    }

    if (debug) {
      const masked = { ...payosRequestBody, signature: payosRequestBody.signature ? "<redacted>" : undefined };
      console.log("PayOS request body:", JSON.stringify(masked, null, 2));
    }

    const payosResponse = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payosRequestBody),
    });

    if (debug) console.log("PayOS response status:", payosResponse.status);

    if (!payosResponse.ok) {
      const errorText = await payosResponse.text();
      console.error("PayOS HTTP error:", {
        status: payosResponse.status,
        statusText: payosResponse.statusText,
      });
      if (debug) console.error("PayOS HTTP error body:", errorText);

      let errorMessage = "Lỗi kết nối với PayOS";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.desc || errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: `HTTP ${payosResponse.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payosData = await payosResponse.json();
    if (debug) console.log("PayOS response data:", JSON.stringify(payosData, null, 2));

    if (payosData.code !== "00" && payosData.code !== 0) {
      console.error("PayOS error:", payosData);
      return new Response(
        JSON.stringify({
          error: payosData.desc || payosData.message || "Lỗi tạo thanh toán PayOS",
          code: payosData.code,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: updateError } = await supabase
      .from("deposit_transactions")
      .update({
        payment_id: String(orderCode),
        payment_url: payosData.data?.checkoutUrl,
        payment_data: payosData.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actualDepositId);

    if (updateError) {
      console.error("Error updating deposit:", updateError);
    }

    return new Response(
      JSON.stringify({
        depositId: actualDepositId,
        paymentUrl: payosData.data?.checkoutUrl,
        checkoutUrl: payosData.data?.checkoutUrl,
        qrCode: payosData.data?.qrCode,
        qr_code: payosData.data?.qrCode,
        accountNo: payosData.data?.accountNumber,
        accountName: payosData.data?.accountName,
        description: payosData.data?.description,
        orderCode: orderCode,
        amount: amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error creating deposit payment:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
