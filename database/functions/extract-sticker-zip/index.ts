import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const zipFile = formData.get('file') as File;
    const packId = formData.get('pack_id') as string;

    if (!zipFile || !packId) {
      return new Response(
        JSON.stringify({ error: 'Missing file or pack_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ZIP file: ${zipFile.name}, size: ${zipFile.size}, pack_id: ${packId}`);

    const arrayBuffer = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const uploadedStickers: { name: string; image_url: string }[] = [];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    const files = Object.keys(zip.files).filter(filename => {
      const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      return imageExtensions.includes(ext) && !filename.startsWith('__MACOSX') && !filename.startsWith('.');
    });

    console.log(`Found ${files.length} image files in ZIP`);

    for (const filename of files) {
      try {
        const file = zip.files[filename];
        if (file.dir) continue;

        const content = await file.async('uint8array');
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        const baseName = filename.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'sticker';
        const storagePath = `${packId}/${Date.now()}_${baseName}${ext}`;

        const contentType = ext === '.png' ? 'image/png' 
          : ext === '.gif' ? 'image/gif'
          : ext === '.webp' ? 'image/webp'
          : 'image/jpeg';

        const { error: uploadError } = await supabase.storage
          .from('stickers')
          .upload(storagePath, content, { contentType });

        if (uploadError) {
          console.error(`Failed to upload ${filename}:`, uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('stickers')
          .getPublicUrl(storagePath);

        uploadedStickers.push({
          name: baseName,
          image_url: publicUrl,
        });

        console.log(`Uploaded: ${filename} -> ${publicUrl}`);
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
      }
    }

    // Insert stickers into database
    if (uploadedStickers.length > 0) {
      const stickersToInsert = uploadedStickers.map((s, i) => ({
        pack_id: packId,
        name: s.name,
        image_url: s.image_url,
        sort_order: i,
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('stickers')
        .insert(stickersToInsert);

      if (insertError) {
        console.error('Failed to insert stickers:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save stickers to database', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: uploadedStickers.length,
        stickers: uploadedStickers 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing ZIP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to process ZIP file', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
