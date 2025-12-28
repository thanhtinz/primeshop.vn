import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get SMM config
    const { data: config, error: configError } = await supabase
      .from('smm_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error('SMM API chưa được cấu hình');
    }

    const { action, ...params } = await req.json();
    console.log(`SMM API action: ${action}`, params);

    const apiUrl = config.api_domain.replace(/\/$/, '') + '/api/v2';
    let result;

    switch (action) {
      case 'balance':
        result = await smmRequest(apiUrl, config.api_key, { action: 'balance' });
        // Update balance in config
        if (result.balance) {
          await supabase
            .from('smm_config')
            .update({ 
              balance: parseFloat(result.balance), 
              currency: result.currency || 'USD',
              last_sync_at: new Date().toISOString()
            })
            .eq('id', config.id);
        }
        break;

      case 'services':
        result = await smmRequest(apiUrl, config.api_key, { action: 'services' });
        // Log first service to see structure
        if (Array.isArray(result) && result.length > 0) {
          console.log('Sample service structure:', JSON.stringify(result[0]));
        }
        break;

      case 'add':
        // Create order on SMM panel
        const orderBody: any = {
          action: 'add',
          service: params.service,
          link: params.link,
          quantity: params.quantity,
        };
        
        // Add optional parameters based on service type
        if (params.comments) orderBody.comments = params.comments;
        if (params.runs) orderBody.runs = params.runs;
        if (params.interval) orderBody.interval = params.interval;
        
        result = await smmRequest(apiUrl, config.api_key, orderBody);
        break;

      case 'status':
        result = await smmRequest(apiUrl, config.api_key, { 
          action: 'status', 
          order: params.order 
        });
        break;

      case 'multi_status':
        result = await smmRequest(apiUrl, config.api_key, { 
          action: 'status', 
          orders: params.orders 
        });
        break;

      case 'refill':
        result = await smmRequest(apiUrl, config.api_key, { 
          action: 'refill', 
          order: params.order 
        });
        break;

      case 'refill_status':
        result = await smmRequest(apiUrl, config.api_key, { 
          action: 'refill_status', 
          refill: params.refill 
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`SMM API response for ${action}:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SMM API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function smmRequest(apiUrl: string, apiKey: string, body: any): Promise<any> {
  const formData = new URLSearchParams();
  formData.append('key', apiKey);
  
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  console.log(`SMM request: POST ${apiUrl}`, body);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (data.error) {
    console.error(`SMM API error:`, data);
    throw new Error(data.error);
  }

  return data;
}
