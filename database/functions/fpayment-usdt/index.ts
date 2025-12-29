import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FPaymentConfig {
  api_key: string;
  merchant_id: string;
  callback_url: string;
}

interface CreatePaymentRequest {
  amount: number;
  currency: 'VND' | 'USD';
  type: 'deposit' | 'order';
  reference_id?: string;
  description?: string;
}

interface FPaymentResponse {
  status: number;
  message: string;
  data?: {
    payment_id: string;
    address: string;
    amount_usdt: number;
    qr_code: string;
    expire_at: string;
  };
}

// Convert VND/USD to USDT (approximate rates - should be fetched from API in production)
async function convertToUSDT(amount: number, currency: 'VND' | 'USD'): Promise<number> {
  try {
    // Fetch current USDT rate from Binance or similar
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTUSDC');
    const data = await response.json();
    const usdtRate = parseFloat(data.price) || 1;
    
    if (currency === 'USD') {
      return amount / usdtRate;
    } else {
      // VND to USD rate (approximate, should use real-time API)
      const vndToUsd = amount / 24500;
      return vndToUsd / usdtRate;
    }
  } catch (error) {
    console.error('Error fetching USDT rate:', error);
    // Fallback rates
    if (currency === 'USD') {
      return amount; // 1 USD ≈ 1 USDT
    }
    return amount / 24500; // VND to USDT approximate
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

    const url = new URL(req.url);
    let action = url.searchParams.get('action') || '';

    // Also check body for action (used by frontend)
    let body: any = null;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json') && req.method === 'POST') {
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
        if (body.action) {
          action = body.action;
        }
      } catch {
        body = {};
      }
    }
    
    // Default action
    if (!action) action = 'create';

    // Get FPayment config from settings
    const { data: fpaymentApiKey } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "fpayment_api_key")
      .single();

    const { data: fpaymentMerchantId } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "fpayment_merchant_id")
      .single();

    // Allow webhook without full config
    if (action === 'webhook') {
      return await handleWebhook(req, supabase, body);
    }

    if (!fpaymentApiKey?.value || !fpaymentMerchantId?.value) {
      return new Response(JSON.stringify({ error: "FPayment chưa được cấu hình" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config: FPaymentConfig = {
      api_key: String(fpaymentApiKey.value).replace(/"/g, ""),
      merchant_id: String(fpaymentMerchantId.value).replace(/"/g, ""),
      callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/fpayment-usdt?action=webhook`,
    };

    // Handle create payment request
    if (action === 'create') {
      return await handleCreatePayment(req, supabase, config, body);
    }

    // Handle check status
    if (action === 'check_status' || action === 'status') {
      return await handleCheckStatus(req, supabase, config, body);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("FPayment error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleCreatePayment(req: Request, supabase: any, config: FPaymentConfig, parsedBody?: any) {
  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Vui lòng đăng nhập" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Phiên đăng nhập không hợp lệ" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Use pre-parsed body or parse again
  const body: CreatePaymentRequest = parsedBody || await req.json();
  const { amount, currency, type, reference_id, description } = body;

  if (!amount || amount <= 0) {
    return new Response(JSON.stringify({ error: "Số tiền không hợp lệ" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Convert to USDT
  const amountUsdt = await convertToUSDT(amount, currency);
  const roundedUsdt = Math.round(amountUsdt * 100) / 100;

  // Minimum USDT amount check
  if (roundedUsdt < 1) {
    return new Response(JSON.stringify({ error: "Số tiền tối thiểu là 1 USDT" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create payment record
  const paymentId = crypto.randomUUID();
  
  // Store in database for tracking
  const { error: insertError } = await supabase
    .from("crypto_payments")
    .insert({
      id: paymentId,
      user_id: user.id,
      amount_original: amount,
      currency_original: currency,
      amount_usdt: roundedUsdt,
      payment_type: type,
      reference_id: reference_id || null,
      description: description || `${type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'} USDT`,
      status: 'pending',
      provider: 'fpayment',
    });

  if (insertError) {
    console.error("Error creating crypto payment record:", insertError);
    return new Response(JSON.stringify({ error: "Không thể tạo giao dịch" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Call FPayment API to create payment
  try {
    const fpaymentResponse = await fetch("https://app.fpayment.net/api/v1/payment/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        merchant_id: config.merchant_id,
        order_id: paymentId,
        amount: roundedUsdt,
        currency: "USDT",
        network: "TRC20", // Default to TRC20 (TRON) for lower fees
        callback_url: config.callback_url,
        description: description || "Payment",
        expire_time: 3600, // 1 hour
      }),
    });

    const fpData: FPaymentResponse = await fpaymentResponse.json();

    if (fpData.status !== 1 || !fpData.data) {
      // Update payment as failed
      await supabase
        .from("crypto_payments")
        .update({ status: 'failed', error_message: fpData.message })
        .eq("id", paymentId);

      return new Response(JSON.stringify({ error: fpData.message || "Không thể tạo thanh toán USDT" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment record with FPayment data
    await supabase
      .from("crypto_payments")
      .update({
        provider_payment_id: fpData.data.payment_id,
        wallet_address: fpData.data.address,
        qr_code: fpData.data.qr_code,
        expires_at: fpData.data.expire_at,
      })
      .eq("id", paymentId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        payment_id: paymentId,
        amount_usdt: roundedUsdt,
        amount_original: amount,
        currency_original: currency,
        wallet_address: fpData.data.address,
        qr_code: fpData.data.qr_code,
        network: "TRC20",
        expires_at: fpData.data.expire_at,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("FPayment API error:", error);
    
    // Update payment as failed
    await supabase
      .from("crypto_payments")
      .update({ status: 'failed', error_message: error.message })
      .eq("id", paymentId);

    return new Response(JSON.stringify({ error: "Lỗi kết nối đến FPayment" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleWebhook(req: Request, supabase: any, parsedBody?: any) {
  try {
    const body = parsedBody || await req.json();
    console.log("FPayment webhook received:", body);

    const { order_id, status, txid, amount, payment_id } = body;

    if (!order_id || !status) {
      return new Response(JSON.stringify({ error: "Invalid webhook data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from("crypto_payments")
      .select("*")
      .eq("id", order_id)
      .single();

    if (fetchError || !payment) {
      console.error("Payment not found:", order_id);
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already processed
    if (payment.status === 'completed') {
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment status
    const newStatus = status === 'completed' || status === 'success' ? 'completed' : 
                      status === 'failed' || status === 'expired' ? 'failed' : 'pending';

    await supabase
      .from("crypto_payments")
      .update({
        status: newStatus,
        transaction_hash: txid || null,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq("id", order_id);

    // If completed, process the payment
    if (newStatus === 'completed') {
      if (payment.payment_type === 'deposit') {
        // Add balance to user
        const { error: balanceError } = await supabase.rpc('add_user_balance', {
          p_user_id: payment.user_id,
          p_amount: payment.amount_original,
          p_note: `Nạp tiền USDT - ${txid || payment_id}`,
        });

        if (balanceError) {
          console.error("Error adding balance:", balanceError);
        }

        // Create deposit transaction record
        await supabase.from("deposit_transactions").insert({
          user_id: payment.user_id,
          amount: payment.amount_original,
          status: 'completed',
          payment_provider: 'fpayment_usdt',
          payment_id: txid || payment_id,
        });

      } else if (payment.payment_type === 'order' && payment.reference_id) {
        // Update order status
        await supabase
          .from("orders")
          .update({ status: 'PAID', payment_method: 'crypto_usdt' })
          .eq("id", payment.reference_id);

        // Update payment record
        await supabase
          .from("payments")
          .update({ status: 'completed' })
          .eq("order_id", payment.reference_id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleCheckStatus(req: Request, supabase: any, config: FPaymentConfig, parsedBody?: any) {
  // Get payment ID from body or query params
  const url = new URL(req.url);
  const paymentId = parsedBody?.paymentId || url.searchParams.get('payment_id');

  if (!paymentId) {
    return new Response(JSON.stringify({ error: "Payment ID required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: payment, error } = await supabase
    .from("crypto_payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    return new Response(JSON.stringify({ error: "Payment not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      payment_id: payment.id,
      status: payment.status,
      amount_usdt: payment.amount_usdt,
      amount_original: payment.amount_original,
      currency_original: payment.currency_original,
      transaction_hash: payment.transaction_hash,
      completed_at: payment.completed_at,
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
