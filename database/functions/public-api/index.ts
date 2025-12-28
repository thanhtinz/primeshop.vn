import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to send rate limit warning email (fire and forget)
async function sendRateLimitWarning(
  supabase: any, 
  keyData: any, 
  percent: number, 
  period: string, 
  current: number, 
  limit: number
) {
  try {
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', keyData.user_id)
      .single();
    
    if (!profile?.email) return;

    await supabase.functions.invoke('send-email', {
      body: {
        to: profile.email,
        subject: `⚠️ Cảnh báo: API Key "${keyData.name}" đạt ${percent}% giới hạn ${period}`,
        html: `
          <h2>Cảnh báo Rate Limit</h2>
          <p>Xin chào ${profile.full_name || profile.email},</p>
          <p>API Key <strong>"${keyData.name}"</strong> của bạn đã sử dụng <strong>${percent}%</strong> giới hạn ${period}.</p>
          <table style="border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Đã sử dụng:</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>${current.toLocaleString()} requests</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Giới hạn:</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>${limit.toLocaleString()} requests/${period}</strong></td>
            </tr>
          </table>
          <p style="color: ${percent >= 95 ? '#dc2626' : '#f59e0b'};">
            ${percent >= 95 
              ? '🚨 Bạn sắp đạt giới hạn! Các request tiếp theo có thể bị từ chối.' 
              : '⚠️ Vui lòng theo dõi mức sử dụng để tránh bị giới hạn.'}
          </p>
          <p>Liên hệ admin nếu bạn cần tăng giới hạn rate limit.</p>
        `,
      },
    });
    console.log(`Rate limit warning email sent to ${profile.email} for key ${keyData.name}`);
  } catch (err) {
    console.error('Failed to send rate limit warning:', err);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Validate API key - must be active AND approved
    const { data: keyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .eq('status', 'approved')
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid, inactive, or unapproved API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP whitelist if configured
    if (keyData.ip_whitelist) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       req.headers.get('cf-connecting-ip') || 
                       'unknown';
      const allowedIps = keyData.ip_whitelist.split(',').map((ip: string) => ip.trim());
      if (!allowedIps.includes(clientIp) && clientIp !== 'unknown') {
        console.log(`IP blocked: ${clientIp} not in whitelist: ${allowedIps.join(', ')}`);
        return new Response(
          JSON.stringify({ success: false, error: 'IP address not allowed' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get client info for logging
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const startTime = Date.now();

    // Rate limiting check
    const rateLimitPerMinute = keyData.rate_limit_per_minute || 60;
    const rateLimitPerDay = keyData.rate_limit_per_day || 10000;

    // Check per-minute rate limit
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: minuteCount } = await supabase
      .from('api_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', keyData.id)
      .gte('created_at', oneMinuteAgo);

    if ((minuteCount || 0) >= rateLimitPerMinute) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded (per minute)',
          limit: rateLimitPerMinute,
          reset_in: '60 seconds'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Limit': String(rateLimitPerMinute) } }
      );
    }

    // Check per-day rate limit
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count: dayCount } = await supabase
      .from('api_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', keyData.id)
      .gte('created_at', oneDayAgo);

    if ((dayCount || 0) >= rateLimitPerDay) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded (per day)',
          limit: rateLimitPerDay,
          reset_in: '24 hours'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Limit': String(rateLimitPerDay) } }
      );
    }

    // Check if approaching rate limit and send warning email (at 80% and 95%)
    const dayUsagePercent = ((dayCount || 0) / rateLimitPerDay) * 100;
    const minuteUsagePercent = ((minuteCount || 0) / rateLimitPerMinute) * 100;
    
    // Send warning at 80% or 95% of daily limit
    if (dayUsagePercent >= 80 && dayUsagePercent < 81) {
      sendRateLimitWarning(supabase, keyData, 80, 'ngày', dayCount || 0, rateLimitPerDay);
    } else if (dayUsagePercent >= 95 && dayUsagePercent < 96) {
      sendRateLimitWarning(supabase, keyData, 95, 'ngày', dayCount || 0, rateLimitPerDay);
    }

    // Update last_used_at and increment request_count
    await supabase
      .from('user_api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        request_count: (keyData.request_count || 0) + 1
      })
      .eq('id', keyData.id);

    // Parse URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'public-api' from path if present
    const apiPath = pathParts.slice(pathParts.indexOf('public-api') + 1);
    const endpoint = apiPath[0];
    const param = apiPath[1];

    const apiType = keyData.api_type; // 'premium', 'game_account', 'game_topup'
    console.log(`API Request: ${endpoint}/${param || ''} | Type: ${apiType} | User: ${keyData.user_id}`);

    // Helper function to log usage and return response
    const logUsage = async (statusCode: number) => {
      const responseTime = Date.now() - startTime;
      try {
        await supabase
          .from('api_usage_logs')
          .insert({
            api_key_id: keyData.id,
            endpoint: endpoint || 'unknown',
            method: req.method,
            status_code: statusCode,
            response_time_ms: responseTime,
            ip_address: clientIp,
            user_agent: userAgent,
          });
      } catch (err) {
        console.error('Failed to log API usage:', err);
      }
    };

    const respond = (statusCode: number, body: object) => {
      logUsage(statusCode);
      return new Response(
        JSON.stringify(body),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    };

    // Handle different endpoints based on API type
    switch (endpoint) {
      case 'products': {
        // Determine style filter based on API type
        const styleFilter = apiType === 'premium' ? 'premium' : 
                           apiType === 'game_account' ? 'game_account' : 
                           apiType === 'game_topup' ? 'game_topup' : null;

        if (param) {
          // Get single product by slug
          let query = supabase
            .from('products')
            .select(`
              *,
              category:categories(*),
              images:product_images(*),
              packages:product_packages(*)
            `)
            .eq('slug', param)
            .eq('is_active', true);

          // Apply style filter based on API type
          if (styleFilter) {
            query = query.eq('style', styleFilter);
          }

          const { data: product, error } = await query.single();

          if (error || !product) {
            return respond(404, { success: false, error: 'Product not found or not accessible with this API key' });
          }

          return respond(200, { success: true, data: product });
        }

        // Get products list
        const category = url.searchParams.get('category');
        const featured = url.searchParams.get('featured');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        let query = supabase
          .from('products')
          .select(`
            id, name, name_en, slug, price, image_url, style, is_featured, short_description, short_description_en,
            category:categories(id, name, name_en, slug)
          `, { count: 'exact' })
          .eq('is_active', true)
          .order('sort_order')
          .range(offset, offset + limit - 1);

        // Apply style filter based on API type
        if (styleFilter) {
          query = query.eq('style', styleFilter);
        }

        if (category) {
          const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single();
          if (cat) query = query.eq('category_id', cat.id);
        }
        if (featured === 'true') query = query.eq('is_featured', true);

        const { data: products, count, error } = await query;

        if (error) {
          return respond(500, { success: false, error: error.message });
        }

        return respond(200, { success: true, data: products, total: count, limit, offset, api_type: apiType });
      }

      case 'categories': {
        // Only allow category access for premium and game_account types
        if (apiType === 'game_topup') {
          return respond(403, { success: false, error: 'Categories not available for game_topup API type' });
        }

        const styleFilter = apiType === 'premium' ? 'premium' : 'game_account';
        
        const { data: categories, error } = await supabase
          .from('categories')
          .select('id, name, name_en, slug, description, description_en, image_url, style')
          .eq('is_active', true)
          .eq('style', styleFilter)
          .order('sort_order');

        if (error) {
          return respond(500, { success: false, error: error.message });
        }

        return respond(200, { success: true, data: categories, api_type: apiType });
      }

      case 'flash-sales': {
        const now = new Date().toISOString();
        
        // Get flash sales with products filtered by API type
        const styleFilter = apiType === 'premium' ? 'premium' : 
                           apiType === 'game_account' ? 'game_account' : 
                           apiType === 'game_topup' ? 'game_topup' : null;

        const { data: flashSales, error } = await supabase
          .from('flash_sales')
          .select(`
            id, name, description, banner_url, start_date, end_date,
            items:flash_sale_items(
              id, product_id, package_id, original_price, sale_price, discount_percent, quantity_limit, quantity_sold,
              product:products!inner(id, name, name_en, slug, image_url, style)
            )
          `)
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now);

        if (error) {
          return respond(500, { success: false, error: error.message });
        }

        // Filter flash sale items by product style
        const filteredSales = flashSales?.map(sale => ({
          ...sale,
          items: sale.items?.filter((item: any) => item.product?.style === styleFilter)
        })).filter(sale => sale.items && sale.items.length > 0);

        return respond(200, { success: true, data: filteredSales, api_type: apiType });
      }

      case 'account-inventory': {
        // Only available for game_account API type
        if (apiType !== 'game_account') {
          return respond(403, { success: false, error: 'Endpoint only available for game_account API type' });
        }

        const productId = url.searchParams.get('product_id');
        
        if (!productId) {
          return respond(400, { success: false, error: 'product_id is required' });
        }

        // Only return count of available accounts, not actual account data
        const { count, error } = await supabase
          .from('game_account_inventory')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId)
          .eq('status', 'available');

        if (error) {
          return respond(500, { success: false, error: error.message });
        }

        return respond(200, { success: true, data: { available_count: count } });
      }

      case 'smm': {
        // Only available for SMM API type
        if (apiType !== 'smm') {
          return respond(403, { success: false, error: 'Endpoint only available for SMM API type' });
        }

        const smmAction = apiPath[1]; // services, balance, order, status, refill
        
        // Get SMM config
        const { data: smmConfig } = await supabase
          .from('smm_config')
          .select('*')
          .eq('is_active', true)
          .single();

        if (!smmConfig) {
          return respond(500, { success: false, error: 'SMM service not configured' });
        }

        const smmApiUrl = `https://${smmConfig.api_domain}/api/v2`;
        
        switch (smmAction) {
          case 'services': {
            const response = await fetch(smmApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ key: smmConfig.api_key, action: 'services' }),
            });
            const data = await response.json();
            return respond(200, { success: true, data });
          }

          case 'balance': {
            const response = await fetch(smmApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ key: smmConfig.api_key, action: 'balance' }),
            });
            const data = await response.json();
            return respond(200, { success: true, balance: data.balance, currency: data.currency || 'USD' });
          }

          case 'order': {
            if (req.method !== 'POST') {
              return respond(405, { success: false, error: 'Method not allowed. Use POST.' });
            }
            
            const body = await req.json();
            const { service, link, quantity } = body;

            if (!service || !link || !quantity) {
              return respond(400, { success: false, error: 'Missing required fields: service, link, quantity' });
            }

            // Check user balance
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('balance')
              .eq('user_id', keyData.user_id)
              .single();

            // Get service rate
            const { data: smmService } = await supabase
              .from('smm_services')
              .select('rate, markup_percent')
              .eq('external_service_id', service)
              .single();

            if (!smmService) {
              return respond(404, { success: false, error: 'Service not found' });
            }

            const baseRate = smmService.rate;
            const markup = smmService.markup_percent || 0;
            const finalRate = baseRate * (1 + markup / 100);
            const charge = (finalRate / 1000) * quantity;

            if ((userProfile?.balance || 0) < charge) {
              return respond(400, { success: false, error: 'Insufficient balance', required: charge, available: userProfile?.balance || 0 });
            }

            // Create order with SMM provider
            const response = await fetch(smmApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                key: smmConfig.api_key,
                action: 'add',
                service: String(service),
                link,
                quantity: String(quantity),
              }),
            });
            const result = await response.json();

            if (result.error) {
              return respond(400, { success: false, error: result.error });
            }

            // Generate order number
            const orderNumber = `SMM-${Date.now().toString(36).toUpperCase()}`;

            // Get service ID
            const { data: serviceData } = await supabase
              .from('smm_services')
              .select('id')
              .eq('external_service_id', service)
              .single();

            // Use atomic RPC function to deduct balance and create order
            const { data: rpcResult, error: rpcError } = await supabase.rpc('create_smm_order_with_balance', {
              p_user_id: keyData.user_id,
              p_charge: charge,
              p_external_order_id: result.order,
              p_service_id: serviceData?.id || null,
              p_link: link,
              p_quantity: quantity,
              p_order_number: orderNumber
            });

            if (rpcError) {
              console.error('RPC error:', rpcError);
              return respond(500, { success: false, error: 'Failed to process order' });
            }

            const rpcData = rpcResult as { success: boolean; error?: string };
            if (!rpcData.success) {
              return respond(400, { success: false, error: rpcData.error || 'Failed to create order' });
            }

            return respond(200, { success: true, order_id: orderNumber, external_order_id: result.order, charge, status: 'Pending' });
          }

          case 'status': {
            const orderId = url.searchParams.get('order_id');
            if (!orderId) {
              return respond(400, { success: false, error: 'order_id is required' });
            }

            const response = await fetch(smmApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ key: smmConfig.api_key, action: 'status', order: orderId }),
            });
            const data = await response.json();
            return respond(200, { success: true, ...data });
          }

          case 'refill': {
            if (req.method !== 'POST') {
              return respond(405, { success: false, error: 'Method not allowed. Use POST.' });
            }
            
            const body = await req.json();
            const { order_id } = body;

            if (!order_id) {
              return respond(400, { success: false, error: 'order_id is required' });
            }

            const response = await fetch(smmApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ key: smmConfig.api_key, action: 'refill', order: order_id }),
            });
            const data = await response.json();

            if (data.error) {
              return respond(400, { success: false, error: data.error });
            }

            return respond(200, { success: true, refill_id: data.refill });
          }

          default:
            return respond(404, { success: false, error: 'SMM endpoint not found. Available: services, balance, order, status, refill' });
        }
      }

      default:
        return respond(404, { success: false, error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
