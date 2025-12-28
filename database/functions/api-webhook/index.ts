import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

async function sendWebhook(url: string, payload: WebhookPayload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
      },
      body: JSON.stringify(payload),
    });
    
    console.log(`Webhook sent to ${url}: ${response.status}`);
    return { success: response.ok, status: response.status };
  } catch (error: unknown) {
    console.error(`Webhook failed for ${url}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { event, data } = await req.json();
    console.log(`Processing webhook event: ${event}`);

    // Get all active, approved API keys with callback URLs
    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('id, callback_url, api_type, user_id')
      .eq('is_active', true)
      .eq('status', 'approved')
      .not('callback_url', 'is', null);

    if (error) {
      throw error;
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.log('No API keys with callback URLs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No webhooks to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // Filter keys based on event type and API type
    const relevantKeys = apiKeys.filter(key => {
      // Order events are relevant to all API types
      if (event.startsWith('order.')) return true;
      // Product events filter by style matching api_type
      if (event.startsWith('product.') && data.style) {
        return key.api_type === data.style;
      }
      return true;
    });

    // Send webhooks in parallel
    const results = await Promise.all(
      relevantKeys.map(key => 
        sendWebhook(key.callback_url!, payload)
      )
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`Webhooks sent: ${successCount}/${relevantKeys.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: relevantKeys.length,
        successful: successCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
