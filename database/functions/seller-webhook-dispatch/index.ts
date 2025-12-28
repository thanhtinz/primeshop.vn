import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  seller_id: string;
}

async function generateSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface WebhookRecord {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  failure_count: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendWebhook(
  supabase: any,
  webhook: WebhookRecord,
  payload: WebhookPayload
): Promise<{ success: boolean; status?: number; error?: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = await generateSignature(webhook.secret || 'default-secret', payloadString);
  
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp
      },
      body: payloadString
    });

    const responseBody = await response.text().catch(() => null);
    const isSuccess = response.status >= 200 && response.status < 300;

    // Log delivery
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      payload: payload,
      response_status: response.status,
      response_body: responseBody?.substring(0, 1000),
      is_success: isSuccess
    });

    // Update webhook stats
    if (isSuccess) {
      await supabase.from('seller_webhooks').update({
        last_triggered_at: new Date().toISOString(),
        failure_count: 0
      }).eq('id', webhook.id);
    } else {
      await supabase.from('seller_webhooks').update({
        failure_count: (webhook.failure_count || 0) + 1
      }).eq('id', webhook.id);
    }

    return { success: isSuccess, status: response.status };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook send error:', errorMessage);
    
    // Log failed delivery
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      payload: payload,
      response_status: null,
      response_body: errorMessage,
      is_success: false
    });

    // Update failure count
    await supabase.from('seller_webhooks').update({
      failure_count: (webhook.failure_count || 0) + 1
    }).eq('id', webhook.id);

    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event, seller_id, data, test } = await req.json();

    console.log(`Processing webhook: ${event} for seller: ${seller_id}`);

    // Fetch active webhooks for this seller that listen to this event
    const { data: webhooks, error: webhookError } = await supabase
      .from('seller_webhooks')
      .select('*')
      .eq('seller_id', seller_id)
      .eq('is_active', true)
      .lt('failure_count', 5);

    if (webhookError) throw webhookError;

    // Filter webhooks that subscribe to this event
    const matchingWebhooks = (webhooks as WebhookRecord[] | null)?.filter(wh => 
      wh.events && wh.events.includes(event)
    ) || [];

    console.log(`Found ${matchingWebhooks.length} webhooks for event ${event}`);

    if (matchingWebhooks.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No webhooks configured for this event',
        sent: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload: WebhookPayload = {
      event,
      data: test ? { test: true, message: 'This is a test webhook' } : data,
      timestamp: new Date().toISOString(),
      seller_id
    };

    // Send webhooks in parallel
    const results = await Promise.all(
      matchingWebhooks.map(webhook => sendWebhook(supabase, webhook, payload))
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Webhook dispatch complete: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      sent: matchingWebhooks.length,
      success_count: successCount,
      fail_count: failCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in seller-webhook-dispatch:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
