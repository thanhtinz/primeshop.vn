import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { paymentId } = await req.json();
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'paymentId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load payment and related order
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, order:orders(*)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for create-order-payment', paymentError);
      return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only handle PayOS
    if (payment.payment_provider !== 'payos') {
      return new Response(JSON.stringify({ error: 'Unsupported payment provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get PayOS creds from site_settings
    const { data: clientIdRow } = await supabase.from('site_settings').select('value').eq('key', 'payos_client_id').single();
    const { data: apiKeyRow } = await supabase.from('site_settings').select('value').eq('key', 'payos_api_key').single();
    const { data: checksumRow } = await supabase.from('site_settings').select('value').eq('key', 'payos_checksum_key').single();

    const clientId = clientIdRow?.value?.replace(/"/g, '') || Deno.env.get('PAYOS_CLIENT_ID');
    const apiKey = apiKeyRow?.value?.replace(/"/g, '') || Deno.env.get('PAYOS_API_KEY');
    const checksumKey = checksumRow?.value?.replace(/"/g, '') || Deno.env.get('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      console.error('PayOS not configured for create-order-payment');
      return new Response(JSON.stringify({ error: 'PayOS not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const amount = payment.amount;
    // Use payment id as orderCode derivation
    const orderCode = Math.abs(parseInt(String(paymentId).replace(/-/g, '').slice(0, 8), 16) % 1000000000);
    const frontend = Deno.env.get('FRONTEND_URL') || 'https://your.frontend';
    const returnUrl = `${frontend}/order/${payment.order?.order_number || ''}`;
    const cancelUrl = `${frontend}/order-lookup`;

    // Build checksum
    const encoder = new TextEncoder();
    const dataToSign = `amount=${amount}&cancelUrl=${cancelUrl}&description=Thanh toán đơn ${payment.order?.order_number || ''}&orderCode=${orderCode}&returnUrl=${returnUrl}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(checksumKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
    const checksum = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const requestBody: any = {
      orderCode,
      amount,
      description: `Thanh toán đơn ${payment.order?.order_number || ''}`,
      cancelUrl,
      returnUrl,
      signature: checksum,
    };

    const payosResponse = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': String(clientId),
        'x-api-key': String(apiKey),
      },
      body: JSON.stringify(requestBody),
    });

    const respText = await payosResponse.text();
    let payosData: any = null;
    try { payosData = JSON.parse(respText); } catch (e) { payosData = { raw: respText }; }

    if (!payosResponse.ok || (payosData && payosData.code && payosData.code !== '00' && payosData.code !== 0)) {
      console.error('Failed to create PayOS payment for order', { status: payosResponse.status, body: payosData });
      return new Response(JSON.stringify({ error: 'Failed to create PayOS payment', details: payosData }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update payment row with checkoutUrl/qr
    const { error: updateError } = await supabase.from('payments').update({
      payment_id: String(orderCode),
      payment_url: payosData.data?.checkoutUrl || null,
      payment_data: payosData.data || payosData,
      updated_at: new Date().toISOString(),
    }).eq('id', paymentId);

    if (updateError) console.error('Failed to update payment row with PayOS data', updateError);

    return new Response(JSON.stringify({ success: true, data: payosData.data || payosData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('create-order-payment error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
