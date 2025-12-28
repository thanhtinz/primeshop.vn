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

    const body = await req.json();
    console.log('PayPal webhook received:', JSON.stringify(body));

    // Get PayPal credentials from site_settings
    const { data: paypalSettings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['paypal_client_id', 'paypal_client_secret', 'paypal_mode']);

    const paypalClientId = paypalSettings?.find((s: any) => s.key === 'paypal_client_id')?.value;
    const paypalSecret = paypalSettings?.find((s: any) => s.key === 'paypal_client_secret')?.value;
    const paypalMode = paypalSettings?.find((s: any) => s.key === 'paypal_mode')?.value || 'sandbox';
    const paypalBaseUrl = paypalMode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get Discord webhook URL for notifications
    const { data: discordSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'discord_webhook_url')
      .single();
    const discordWebhookUrl = discordSetting?.value || Deno.env.get('DISCORD_WEBHOOK_URL');

    // Handle create deposit action (for USD currency)
    if (body.action === 'create_deposit') {
      const { depositId, amount, description } = body;
      
      if (!paypalClientId || !paypalSecret) {
        return new Response(
          JSON.stringify({ success: false, error: 'PayPal not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get PayPal access token
      const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!authResponse.ok) {
        const authError = await authResponse.text();
        console.error('PayPal auth error:', authError);
        return new Response(
          JSON.stringify({ success: false, error: 'PayPal authentication failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Get return URLs from site settings
      const { data: siteUrlSetting } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'site_url')
        .single();
      const siteUrl = siteUrlSetting?.value || 'https://example.com';

      // Create PayPal order for deposit
      const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: depositId,
            description: description || 'Account Deposit',
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
          }],
          application_context: {
            brand_name: 'Account Deposit',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${siteUrl}/profile?deposit_success=true&depositId=${depositId}`,
            cancel_url: `${siteUrl}/profile?deposit_cancelled=true&depositId=${depositId}`,
          },
        }),
      });

      if (!orderResponse.ok) {
        const orderError = await orderResponse.text();
        console.error('PayPal order creation error:', orderError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create PayPal order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const orderData = await orderResponse.json();
      const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

      // Update deposit transaction with PayPal order ID
      await supabase
        .from('deposit_transactions')
        .update({
          payment_id: orderData.id,
          payment_url: approvalUrl,
          payment_data: { paypal_order: orderData },
        })
        .eq('id', depositId);

      console.log('PayPal deposit order created:', orderData.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          orderId: orderData.id,
          approvalUrl: approvalUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle capture deposit action (after user approves)
    if (body.action === 'capture_deposit') {
      const { depositId, paypalOrderId } = body;

      if (!paypalClientId || !paypalSecret) {
        return new Response(
          JSON.stringify({ success: false, error: 'PayPal not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get PayPal access token
      const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
        },
        body: 'grant_type=client_credentials',
      });

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Capture the PayPal order
      const captureResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const captureData = await captureResponse.json();
      console.log('PayPal deposit capture result:', captureData);

      if (captureData.status === 'COMPLETED') {
        // Get deposit to find user and amount
        const { data: deposit } = await supabase
          .from('deposit_transactions')
          .select('*')
          .eq('id', depositId)
          .single();

        if (deposit) {
          // Use atomic RPC function to complete deposit
          const { data: result, error: rpcError } = await supabase.rpc('complete_deposit_transaction', {
            p_deposit_id: deposit.id,
            p_transaction_data: { 
              paypal_capture: captureData,
              paypal_order_id: paypalOrderId
            }
          });

          if (rpcError) {
            console.error('RPC error:', rpcError);
            throw rpcError;
          }

          const rpcResult = result as { success: boolean; new_balance?: number; email?: string };

          if (rpcResult.success) {
            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: deposit.user_id,
                type: 'deposit',
                title: 'Nạp tiền thành công',
                message: `Bạn đã nạp thành công ${deposit.amount.toLocaleString()}đ vào tài khoản qua PayPal`,
                link: '/profile?tab=history',
              });

            // Send Discord notification
            if (discordWebhookUrl) {
              await fetch(discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  embeds: [{
                    title: '💵 Nạp tiền PayPal thành công',
                    color: 0x0070ba,
                    fields: [
                      { name: 'Số tiền VND', value: deposit.amount.toLocaleString() + 'đ', inline: true },
                      { name: 'Số dư mới', value: (rpcResult.new_balance || 0).toLocaleString() + 'đ', inline: true },
                      { name: 'PayPal Order', value: paypalOrderId, inline: true },
                    ],
                    timestamp: new Date().toISOString()
                  }]
                })
              }).catch(console.error);
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, status: 'completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, status: captureData.status, error: 'Payment not completed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const eventType = body.event_type;
    const resource = body.resource;

    // Handle payment completed events
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const paypalOrderId = resource?.id || resource?.supplementary_data?.related_ids?.order_id;
      const amount = resource?.amount?.value || resource?.purchase_units?.[0]?.amount?.value;
      const currency = resource?.amount?.currency_code || resource?.purchase_units?.[0]?.amount?.currency_code;

      console.log('PayPal payment completed:', { paypalOrderId, amount, currency, eventType });

      if (!paypalOrderId) {
        console.error('Missing PayPal order ID in webhook');
        return new Response(
          JSON.stringify({ success: false, message: 'Missing order ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find payment by PayPal order ID
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*, order:orders(*)')
        .eq('payment_id', paypalOrderId)
        .eq('payment_provider', 'paypal')
        .single();

      if (paymentError || !payment) {
        console.error('Payment not found:', paypalOrderId, paymentError);
        return new Response(
          JSON.stringify({ success: false, message: 'Payment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already processed
      if (payment.status === 'completed') {
        console.log('Payment already completed:', payment.id);
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update payment status with capture details
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_data: { 
            ...payment.payment_data, 
            webhook: body,
            capture_id: resource?.id,
            capture_status: resource?.status,
            payer_email: resource?.payer?.email_address || body.resource?.payer?.email_address,
          }
        })
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error('Error updating payment:', updatePaymentError);
        throw updatePaymentError;
      }

      // Update order status to PAID
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: 'PAID' })
        .eq('id', payment.order_id);

      if (updateOrderError) {
        console.error('Error updating order:', updateOrderError);
        throw updateOrderError;
      }

      // Send Discord notification
      if (discordWebhookUrl) {
        try {
          await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: '💵 Thanh toán PayPal thành công',
                color: 0x0070ba,
                fields: [
                  { name: 'Mã đơn hàng', value: payment.order?.order_number || 'N/A', inline: true },
                  { name: 'Số tiền', value: `$${amount} ${currency}`, inline: true },
                  { name: 'PayPal ID', value: paypalOrderId, inline: false },
                  { name: 'Email', value: payment.order?.customer_email || 'N/A', inline: true },
                ],
                timestamp: new Date().toISOString()
              }]
            })
          });
        } catch (discordError) {
          console.error('Discord notification error:', discordError);
        }
      }

      console.log('PayPal payment completed successfully:', payment.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Payment completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle payment denied/cancelled
    if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'CHECKOUT.ORDER.CANCELLED') {
      const paypalOrderId = resource?.id || resource?.supplementary_data?.related_ids?.order_id;
      console.log('PayPal payment denied/cancelled:', paypalOrderId);

      if (paypalOrderId) {
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update({ 
            status: 'failed', 
            payment_data: { webhook: body, failure_reason: eventType } 
          })
          .eq('payment_id', paypalOrderId)
          .eq('payment_provider', 'paypal');

        if (updatePaymentError) {
          console.error('Error updating failed payment:', updatePaymentError);
        }

        // Send Discord notification
        if (discordWebhookUrl) {
          try {
            await fetch(discordWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                embeds: [{
                  title: '❌ Thanh toán PayPal thất bại',
                  color: 0xff0000,
                  fields: [
                    { name: 'PayPal ID', value: paypalOrderId, inline: true },
                    { name: 'Lý do', value: eventType, inline: true },
                  ],
                  timestamp: new Date().toISOString()
                }]
              })
            });
          } catch (discordError) {
            console.error('Discord notification error:', discordError);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment failure recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle refund events
    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const captureId = resource?.id;
      const refundAmount = resource?.amount?.value;
      const refundCurrency = resource?.amount?.currency_code;

      console.log('PayPal refund received:', { captureId, refundAmount, refundCurrency });

      // Find payment by capture ID in payment_data
      const { data: payments } = await supabase
        .from('payments')
        .select('*, order:orders(*)')
        .eq('payment_provider', 'paypal');

      const payment = payments?.find((p: any) => 
        p.payment_data?.capture_id === captureId || 
        p.payment_id === captureId
      );

      if (payment) {
        // Update payment status to refunded
        await supabase
          .from('payments')
          .update({
            status: 'refunded',
            payment_data: {
              ...payment.payment_data,
              refund_webhook: body,
              refund_amount: refundAmount,
              refund_currency: refundCurrency,
              refunded_at: new Date().toISOString()
            }
          })
          .eq('id', payment.id);

        // Update order status
        if (payment.order_id) {
          await supabase
            .from('orders')
            .update({ status: 'REFUNDED' })
            .eq('id', payment.order_id);
        }

        // Send Discord notification
        if (discordWebhookUrl) {
          try {
            await fetch(discordWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                embeds: [{
                  title: '💸 PayPal đã xác nhận hoàn tiền',
                  color: 0x9b59b6,
                  fields: [
                    { name: 'Mã đơn hàng', value: payment.order?.order_number || 'N/A', inline: true },
                    { name: 'Số tiền hoàn', value: `$${refundAmount} ${refundCurrency}`, inline: true },
                    { name: 'Capture ID', value: captureId || 'N/A', inline: false },
                  ],
                  timestamp: new Date().toISOString()
                }]
              })
            });
          } catch (discordError) {
            console.error('Discord notification error:', discordError);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Refund recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle IPN verification for legacy integrations
    if (eventType === 'PAYMENT.SALE.COMPLETED') {
      const saleId = resource?.id;
      const amount = resource?.amount?.total;
      const currency = resource?.amount?.currency;
      const invoiceNumber = resource?.invoice_number;

      console.log('PayPal IPN sale completed:', { saleId, amount, currency, invoiceNumber });

      if (invoiceNumber) {
        // Find order by invoice number (order_number)
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', invoiceNumber)
          .single();

        if (order) {
          // Update payment by order_id
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              payment_data: { ipn_webhook: body, sale_id: saleId }
            })
            .eq('order_id', order.id)
            .eq('payment_provider', 'paypal');

          // Update order status
          await supabase
            .from('orders')
            .update({ status: 'PAID' })
            .eq('id', order.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'IPN sale processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success for unhandled event types
    console.log('Unhandled PayPal event type:', eventType);
    return new Response(
      JSON.stringify({ success: true, message: 'Event received', event_type: eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('PayPal webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
