import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HMAC-SHA256 signature verification for PayOS
async function verifyPayOSSignature(body: string, signature: string, checksumKey: string): Promise<boolean> {
  if (!signature || !checksumKey) return false;

  // Normalize incoming signature: remove prefix like "sha256=", trim and lowercase hex
  signature = String(signature).replace(/^sha256=/i, "").trim().toLowerCase();

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(checksumKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase();

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return false;
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

        // Read body as text first for signature verification (do NOT parse JSON yet)
        const bodyText = await req.text();

        // Get PayOS signature from header (accept multiple header names)
        const signatureRaw =
          req.headers.get("x-payos-signature") || req.headers.get("x-payos-sign") || req.headers.get("signature") || req.headers.get("x-signature");

        // Normalize signature: remove common prefixes like "sha256=", trim
        const signature = signatureRaw ? String(signatureRaw).replace(/^sha256=/i, "").trim() : null;

    // Get checksum key from site_settings (more secure than env var for multi-tenant)
    const { data: checksumKeySetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payos_checksum_key")
      .single();

    const checksumKey = checksumKeySetting?.value?.replace(/"/g, "") || Deno.env.get("PAYOS_CHECKSUM_KEY");
    const debug = (Deno.env.get("PAYOS_DEBUG") || "0") === "1";

    // 🔒 CRITICAL: Always require signature verification
    if (!checksumKey) {
      console.error("SECURITY ERROR: PAYOS_CHECKSUM_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signature) {
      console.error("SECURITY ERROR: Missing webhook signature");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (debug) {
      console.log("PayOS webhook headers:", {
        signature_header: signature ? signature.slice(0, 16) + "..." : null,
        checksum_present: !!checksumKey,
      });
    }

    const isValid = await verifyPayOSSignature(bodyText, signature, checksumKey);
    if (!isValid) {
      console.error("SECURITY ERROR: Invalid webhook signature", { signatureHeader: signature ? signature.slice(0, 16) + "..." : null });
      return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Webhook signature verified successfully");

    // Only now parse the JSON body (prevents parsing errors before signature check)
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch (parseErr) {
      console.error("Invalid JSON payload after signature verified:", parseErr);
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, data } = body;

    // Get Discord webhook URL
    const { data: discordSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "discord_webhook_url")
      .single();
    const discordWebhookUrl = discordSetting?.value || Deno.env.get("DISCORD_WEBHOOK_URL");

    // PayOS sends code "00" for success
    if (code !== "00" && code !== 0) {
      console.log("Payment not successful, code:", code);

      // Send Discord notification for failed payment
      if (discordWebhookUrl) {
        try {
          await fetch(discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embeds: [
                {
                  title: "❌ Nạp tiền PayOS thất bại",
                  color: 0xff0000,
                  fields: [
                    { name: "Mã lỗi", value: String(code), inline: true },
                    { name: "Order Code", value: String(data?.orderCode || "N/A"), inline: true },
                  ],
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
        } catch (discordError) {
          console.error("Discord notification error:", discordError);
        }
      }

      return new Response(JSON.stringify({ success: false, message: "Payment not successful" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderCode, amount, transactionDateTime } = data || {};

    if (!orderCode) {
      console.error("Missing orderCode in webhook");
      return new Response(JSON.stringify({ success: false, message: "Missing orderCode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find deposit by payment_id (orderCode)
    const { data: deposit, error: depositError } = await supabase
      .from("deposit_transactions")
      .select("*")
      .eq("payment_id", String(orderCode))
      .single();

    if (depositError || !deposit) {
      console.error("Deposit not found for orderCode:", orderCode, depositError);
      return new Response(JSON.stringify({ success: false, message: "Deposit not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🔒 SECURITY: Verify amount matches what we expect
    if (deposit.amount !== amount) {
      console.error("SECURITY ERROR: Amount mismatch!", {
        expected: deposit.amount,
        received: amount,
        orderCode: orderCode,
      });

      // Send critical alert to Discord
      if (discordWebhookUrl) {
        try {
          await fetch(discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: "@everyone 🚨 CRITICAL SECURITY ALERT",
              embeds: [
                {
                  title: "🚨 Phát hiện gian lận nạp tiền",
                  color: 0xff0000,
                  fields: [
                    { name: "Order Code", value: String(orderCode), inline: true },
                    { name: "Số tiền mong đợi", value: `${deposit.amount.toLocaleString("vi-VN")}đ`, inline: true },
                    { name: "Số tiền nhận được", value: `${amount.toLocaleString("vi-VN")}đ`, inline: true },
                  ],
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
        } catch (err) {
          console.error("Failed to send security alert:", err);
        }
      }

      return new Response(JSON.stringify({ success: false, error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already processed (idempotency)
    if (deposit.status === "completed") {
      console.log("Deposit already completed (idempotent check):", deposit.id);
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use atomic RPC function to complete deposit
    const { data: result, error: rpcError } = await supabase.rpc("complete_deposit_transaction", {
      p_deposit_id: deposit.id,
      p_transaction_data: {
        webhook: body,
        transactionDateTime,
        verifiedAt: new Date().toISOString(),
      },
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw rpcError;
    }

    const rpcResult = result as {
      success: boolean;
      error?: string;
      amount?: number;
      new_balance?: number;
      email?: string;
      already_processed?: boolean;
    };

    if (!rpcResult.success) {
      throw new Error(rpcResult.error || "Failed to complete deposit");
    }

    if (rpcResult.already_processed) {
      console.log("Deposit already processed (RPC idempotent check):", deposit.id);
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = rpcResult.new_balance || 0;
    const userEmail = rpcResult.email || "";

    // Send email notification
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: userEmail,
          templateName: "deposit_success",
          variables: {
            customer_email: userEmail,
            amount: deposit.amount.toLocaleString("vi-VN") + "đ",
            new_balance: newBalance.toLocaleString("vi-VN") + "đ",
            date: new Date().toLocaleString("vi-VN"),
          },
        },
      });
    } catch (emailError) {
      console.error("Email notification error:", emailError);
    }

    // Send Discord notification
    if (discordWebhookUrl) {
      try {
        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: "💰 Nạp tiền PayOS thành công",
                color: 0x00ff00,
                fields: [
                  { name: "Email", value: userEmail || "N/A", inline: true },
                  { name: "Số tiền", value: `${deposit.amount.toLocaleString("vi-VN")}đ`, inline: true },
                  { name: "Số dư mới", value: `${newBalance.toLocaleString("vi-VN")}đ`, inline: true },
                  { name: "Order Code", value: String(orderCode), inline: false },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch (discordError) {
        console.error("Discord notification error:", discordError);
      }
    }

    // Create notification for user
    try {
      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        type: "order",
        title: "Nạp tiền thành công",
        message: `Bạn đã nạp thành công ${deposit.amount.toLocaleString("vi-VN")}đ vào tài khoản. Số dư hiện tại: ${newBalance.toLocaleString("vi-VN")}đ`,
        link: "/wallet",
      });
    } catch (notifyError) {
      console.error("Create notification error:", notifyError);
    }

    console.log("✅ Deposit completed successfully:", {
      depositId: deposit.id,
      amount: deposit.amount,
      email: userEmail,
      newBalance: newBalance,
    });

    return new Response(JSON.stringify({ success: true, message: "Deposit completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ PayOS webhook error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
