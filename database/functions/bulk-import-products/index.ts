import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccountInfoField {
  name: string;
  value: string;
}

interface ProductRow {
  title: string;
  description?: string;
  price: number;
  category?: string;
  images?: string;
  tags?: string;
  account_info?: string; // Format: "Tên trường 1:Giá trị 1|Tên trường 2:Giá trị 2"
  account_data?: string; // Private login info
  status?: string;
}

function parseCSV(csvText: string): ProductRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  const products: ProductRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const product: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      product[header] = values[index] || '';
    });
    
    if (product.title && product.price) {
      products.push({
        title: product.title,
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        category: product.category || '',
        images: product.images || '',
        tags: product.tags || '',
        account_info: product.account_info || '',
        account_data: product.account_data || '',
        status: product.status || 'available'
      });
    }
  }
  
  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse account_info string to array of {name, value}
// Format: "Level:50|Rank:Cao Thủ|Server:Việt Nam"
function parseAccountInfo(infoString: string): AccountInfoField[] {
  if (!infoString) return [];
  
  return infoString.split('|').map(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) {
      return { name: pair.trim(), value: '' };
    }
    return {
      name: pair.substring(0, colonIndex).trim(),
      value: pair.substring(colonIndex + 1).trim()
    };
  }).filter(field => field.name);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sellerId = formData.get('seller_id') as string;
    const categoryId = formData.get('category_id') as string;

    if (!file || !sellerId) {
      return new Response(JSON.stringify({ error: 'Missing file or seller_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing CSV import for seller: ${sellerId}, file: ${file.name}`);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('bulk_import_jobs')
      .insert({
        seller_id: sellerId,
        file_name: file.name,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Parse CSV
    const csvText = await file.text();
    const products = parseCSV(csvText);

    console.log(`Parsed ${products.length} products from CSV`);

    await supabase.from('bulk_import_jobs').update({
      total_rows: products.length
    }).eq('id', job.id);

    let successCount = 0;
    let failCount = 0;
    const errors: Array<{ row: number; title: string; error: string }> = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Parse images array
        const imageUrls = product.images 
          ? product.images.split(',').map(url => url.trim()).filter(Boolean)
          : [];

        // Parse tags array  
        const tagsArray = product.tags
          ? product.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        // Parse account_info to array of {name, value}
        const accountInfo = parseAccountInfo(product.account_info || '');

        // Insert product
        const { error: insertError } = await supabase
          .from('seller_products')
          .insert({
            seller_id: sellerId,
            category_id: categoryId || null,
            title: product.title,
            description: product.description,
            category: product.category,
            price: product.price,
            images: imageUrls,
            tags: tagsArray,
            status: product.status === 'sold' ? 'sold' : 'available',
            account_info: accountInfo.length > 0 ? accountInfo : null,
            account_data: product.account_data || null
          });

        if (insertError) {
          throw insertError;
        }

        successCount++;
      } catch (err: unknown) {
        failCount++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({
          row: i + 2,
          title: product.title,
          error: errorMessage
        });
        console.error(`Error inserting row ${i + 2}:`, errorMessage);
      }

      // Update progress every 10 rows
      if ((i + 1) % 10 === 0 || i === products.length - 1) {
        await supabase.from('bulk_import_jobs').update({
          processed_rows: i + 1,
          success_rows: successCount,
          failed_rows: failCount
        }).eq('id', job.id);
      }
    }

    // Finalize job
    await supabase.from('bulk_import_jobs').update({
      status: 'completed',
      processed_rows: products.length,
      success_rows: successCount,
      failed_rows: failCount,
      errors: errors.length > 0 ? errors : null,
      completed_at: new Date().toISOString()
    }).eq('id', job.id);

    console.log(`Import complete: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      job_id: job.id,
      total: products.length,
      success_count: successCount,
      fail_count: failCount,
      errors: errors.slice(0, 10)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in bulk-import-products:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
