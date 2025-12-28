import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NAPERIS_BASE_URL = 'https://api.clone.erisvn.net';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NAPERIS_API_KEY = Deno.env.get('NAPERIS_API_KEY');
    if (!NAPERIS_API_KEY) {
      throw new Error('NAPERIS_API_KEY is not configured');
    }

    const { action, ...params } = await req.json();
    console.log(`Naperis action: ${action}`, params);

    let result;

    switch (action) {
      case 'get_balance':
        result = await naperisRequest('/api/v2/balance', 'GET', null, NAPERIS_API_KEY);
        break;

      case 'get_categories':
        result = await naperisRequest('/api/v2/categories', 'GET', null, NAPERIS_API_KEY);
        break;

      case 'get_category':
        result = await naperisRequest(`/api/v2/categories/${params.categoryId}`, 'GET', null, NAPERIS_API_KEY);
        break;

      case 'create_order':
        // Create order on naperis
        const purchaseBody: any = {
          categoryId: params.categoryId,
          productId: params.productId,
        };
        
        // Add form data if provided
        if (params.data && Object.keys(params.data).length > 0) {
          purchaseBody.data = params.data;
        }
        
        result = await naperisRequest('/api/v2/purchase', 'POST', purchaseBody, NAPERIS_API_KEY);
        break;

      case 'get_order':
        result = await naperisRequest(`/api/v2/orders/${params.orderId}`, 'GET', null, NAPERIS_API_KEY);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Naperis response for ${action}:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Naperis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 500 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function naperisRequest(
  endpoint: string, 
  method: string, 
  body: any, 
  apiKey: string
): Promise<any> {
  const url = `${NAPERIS_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log(`Naperis request: ${method} ${url}`, body);
  
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`Naperis API error: ${response.status}`, data);
    throw new Error(data.message || `Naperis API error: ${response.status}`);
  }

  return data;
}
