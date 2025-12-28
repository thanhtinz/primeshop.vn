import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { paymentId, reason } = await req.json();
    console.log('Processing refund for payment:', paymentId);

    if (!paymentId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, order:orders(*)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ success: false, message: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment.status !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, message: 'Only completed payments can be refunded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get site settings for API credentials
    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value');
    
    const settingsMap: Record<string, any> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    let refundResult = { success: false, message: '', provider_response: null as any };

    // Process refund based on payment provider
    if (payment.payment_provider === 'paypal') {
      refundResult = await processPayPalRefund(payment, settingsMap);
    } else if (payment.payment_provider === 'payos') {
      refundResult = await processPayOSRefund(payment, settingsMap);
    } else if (payment.payment_provider === 'balance') {
      // For balance payments, use atomic RPC function
      refundResult = await processBalanceRefund(payment, supabase, reason);
    } else {
      refundResult = { success: false, message: `Unsupported payment provider: ${payment.payment_provider}`, provider_response: null };
    }

    if (refundResult.success) {
      // For non-balance payments, update payment and order status here
      // Balance refunds are handled atomically by RPC
      if (payment.payment_provider !== 'balance') {
        // Update payment status to refunded
        await supabase
          .from('payments')
          .update({
            status: 'refunded',
            payment_data: {
              ...payment.payment_data,
              refund: {
                reason,
                processed_at: new Date().toISOString(),
                provider_response: refundResult.provider_response
              }
            }
          })
          .eq('id', paymentId);

        // Update order status to REFUNDED
        if (payment.order_id) {
          await supabase
            .from('orders')
            .update({ status: 'REFUNDED' })
            .eq('id', payment.order_id);
        }
      }

      // Send refund email notification to customer
      if (payment.order?.customer_email) {
        try {
          const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
          
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
              template_name: 'order_refunded',
              recipient: payment.order.customer_email,
              variables: {
                customer_name: payment.order.customer_name || 'Quý khách',
                customer_email: payment.order.customer_email,
                order_number: payment.order.order_number,
                refund_amount: payment.amount.toLocaleString('vi-VN'),
                refund_reason: reason || 'Theo yêu cầu',
                payment_provider: payment.payment_provider.toUpperCase(),
                date: new Date().toLocaleString('vi-VN')
              }
            })
          });
          console.log('Refund email sent to:', payment.order.customer_email);
        } catch (emailError) {
          console.error('Failed to send refund email:', emailError);
        }
      }

      // Send Discord notification
      const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
      if (discordWebhookUrl) {
        try {
          await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: '💸 Hoàn tiền thành công',
                color: 0xff9800,
                fields: [
                  { name: 'Mã đơn hàng', value: payment.order?.order_number || 'N/A', inline: true },
                  { name: 'Số tiền', value: `${payment.amount.toLocaleString()}đ`, inline: true },
                  { name: 'Cổng TT', value: payment.payment_provider.toUpperCase(), inline: true },
                  { name: 'Lý do', value: reason || 'Không có', inline: false },
                ],
                timestamp: new Date().toISOString()
              }]
            })
          });
        } catch (e) {
          console.error('Discord notification error:', e);
        }
      }

      console.log('Refund processed successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Refund processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('Refund failed:', refundResult.message);
      return new Response(
        JSON.stringify({ success: false, message: refundResult.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    const error = err as Error;
    console.error('Refund error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processPayPalRefund(payment: any, settings: Record<string, any>) {
  try {
    const clientId = settings.paypal_client_id;
    const clientSecret = settings.paypal_client_secret;
    const mode = settings.paypal_mode || 'sandbox';
    
    if (!clientId || !clientSecret) {
      return { success: false, message: 'PayPal credentials not configured', provider_response: null };
    }

    const baseUrl = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('PayPal auth error:', authError);
      return { success: false, message: 'Failed to authenticate with PayPal', provider_response: authError };
    }

    const { access_token } = await authResponse.json();

    // Get capture ID from payment data
    const captureId = payment.payment_data?.capture_id || payment.payment_id;
    
    if (!captureId) {
      return { success: false, message: 'Capture ID not found for PayPal refund', provider_response: null };
    }

    // Process refund
    const refundResponse = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        note_to_payer: 'Refund from store'
      })
    });

    const refundData = await refundResponse.json();

    if (refundResponse.ok && refundData.status === 'COMPLETED') {
      return { success: true, message: 'PayPal refund completed', provider_response: refundData };
    } else {
      console.error('PayPal refund failed:', refundData);
      return { success: false, message: refundData.message || 'PayPal refund failed', provider_response: refundData };
    }
  } catch (error) {
    console.error('PayPal refund error:', error);
    return { success: false, message: 'PayPal refund error', provider_response: String(error) };
  }
}

async function processPayOSRefund(payment: any, settings: Record<string, any>) {
  try {
    const clientId = settings.payos_client_id;
    const apiKey = settings.payos_api_key;
    const checksumKey = settings.payos_checksum_key;
    const debug = (Deno.env.get("PAYOS_DEBUG") || "0") === "1";
    
    if (!clientId || !apiKey) {
      return { success: false, message: 'PayOS credentials not configured', provider_response: null };
    }

    if (debug) {
      console.log('processPayOSRefund settings:', {
        clientId_present: !!clientId,
        apiKey_present: !!apiKey,
        checksum_present: !!checksumKey,
        paymentId: payment.id,
        orderCode: payment.payment_id || payment.payment_data?.orderCode,
      });
    }

    // PayOS Cancel/Refund API
    const orderCode = payment.payment_id || payment.payment_data?.orderCode;
    
    if (!orderCode) {
      return { success: false, message: 'Order code not found for PayOS refund', provider_response: null };
    }

    // PayOS uses cancel endpoint for refunds on pending transactions
    // For completed transactions, manual refund through PayOS dashboard is required
    const maxAttempts = 3;
    let lastResponse: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`PayOS cancel attempt ${attempt}/${maxAttempts} for orderCode=${orderCode}`);
        const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            cancellationReason: 'Refund requested by admin'
          })
        });

        const text = await response.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

        lastResponse = { status: response.status, body: data };

        if (response.ok && (data.code === '00' || data.code === 0)) {
          console.log('PayOS refund/cancel successful', { orderCode });
          return { success: true, message: 'PayOS refund/cancel completed', provider_response: data };
        }

        console.warn('PayOS cancel returned non-success', { orderCode, status: response.status, body: data });

        // Retry on server errors (5xx) or network issues
        if (attempt < maxAttempts && (response.status >= 500 || response.status === 0)) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, backoff));
          continue;
        }

        // If not retrying, break to mark for manual refund
        break;
      } catch (err) {
        console.error('PayOS cancel attempt error', err);
        lastResponse = { error: String(err) };
        if (attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, backoff));
          continue;
        }
        break;
      }
    }

    // After attempts, if we didn't return success, mark manual refund required (PayOS often needs manual refund for completed tx)
    return {
      success: true,
      message: 'PayOS: Đã đánh dấu hoàn tiền. Vui lòng hoàn tiền thủ công qua PayOS Dashboard nếu giao dịch đã hoàn tất.',
      provider_response: lastResponse,
    };
  } catch (error) {
    console.error('PayOS refund error:', error);
    // For PayOS, we mark it as manual refund needed
    return { 
      success: true, 
      message: 'PayOS: Đã đánh dấu hoàn tiền. Vui lòng hoàn tiền thủ công qua PayOS Dashboard.',
      provider_response: String(error)
    };
  }
}

async function processBalanceRefund(payment: any, supabase: any, reason?: string) {
  try {
    // Use atomic RPC function for balance refund
    const { data: result, error: rpcError } = await supabase.rpc('refund_balance_payment', {
      p_payment_id: payment.id,
      p_reason: reason || 'Theo yêu cầu'
    });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return { success: false, message: 'Failed to process refund: ' + rpcError.message, provider_response: rpcError };
    }

    const rpcResult = result as { success: boolean; error?: string; amount?: number; new_balance?: number; already_refunded?: boolean };

    if (!rpcResult.success) {
      return { success: false, message: rpcResult.error || 'Failed to process refund', provider_response: rpcResult };
    }

    if (rpcResult.already_refunded) {
      return { success: true, message: 'Already refunded', provider_response: rpcResult };
    }

    return { 
      success: true, 
      message: `Refunded ${(rpcResult.amount || 0).toLocaleString()}đ to user balance`, 
      provider_response: { new_balance: rpcResult.new_balance } 
    };
  } catch (error) {
    console.error('Balance refund error:', error);
    return { success: false, message: 'Balance refund error', provider_response: String(error) };
  }
}
