import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TikTok API - Try multiple APIs for reliability
async function downloadTikTok(url: string) {
  // Try primary API first
  try {
    const apiUrl = `https://tdownv4.sl-bjs.workers.dev/?down=${encodeURIComponent(url)}`;
    console.log('Calling TikTok API (primary):', apiUrl);
    
    const response = await fetch(apiUrl, { 
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('TikTok API response:', JSON.stringify(data));
      
      if (data.download_url) {
        return {
          title: data.title || 'Video TikTok',
          thumbnail: '',
          author: data.author?.nickname || data.author?.username || '',
          platform: 'tiktok',
          downloads: [
            {
              quality: 'Video không watermark',
              format: 'mp4',
              url: data.download_url,
              size: `${(data.author?.like_count || 0).toLocaleString()} likes`,
              isExternal: false,
            },
            ...(data.author?.audio_url ? [{
              quality: 'Audio (MP3)',
              format: 'mp3',
              url: data.author.audio_url,
              size: 'Chỉ âm thanh',
              isExternal: false,
            }] : []),
          ],
        };
      }
    }
  } catch (error) {
    console.error('Primary TikTok API error:', error);
  }

  // Try backup API
  try {
    const backupApiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    console.log('Calling TikTok API (backup):', backupApiUrl);
    
    const response = await fetch(backupApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('TikTok backup API response:', JSON.stringify(data));
      
      if (data.code === 0 && data.data) {
        const videoData = data.data;
        return {
          title: videoData.title || 'Video TikTok',
          thumbnail: videoData.cover || videoData.origin_cover || '',
          author: videoData.author?.nickname || videoData.author?.unique_id || '',
          platform: 'tiktok',
          downloads: [
            {
              quality: 'Video không watermark',
              format: 'mp4',
              url: videoData.play || videoData.hdplay || videoData.wmplay,
              size: `${(videoData.digg_count || 0).toLocaleString()} likes`,
              isExternal: false,
            },
            ...(videoData.music ? [{
              quality: 'Audio (MP3)',
              format: 'mp3',
              url: videoData.music,
              size: 'Chỉ âm thanh',
              isExternal: false,
            }] : []),
          ],
        };
      }
    }
  } catch (error) {
    console.error('Backup TikTok API error:', error);
  }

  // Fallback to external sites
  console.log('All TikTok APIs failed, returning external links');
  return {
    title: 'Video TikTok',
    thumbnail: '',
    author: '',
    platform: 'tiktok',
    downloads: [
      {
        quality: 'Tải qua SnapTik',
        format: 'mp4',
        url: `https://snaptik.app/vi?url=${encodeURIComponent(url)}`,
        size: 'Không watermark',
        isExternal: true,
        note: 'API tạm thời lỗi - dùng trang web ngoài',
      },
      {
        quality: 'Tải qua SSSTikTok',
        format: 'mp4',
        url: `https://ssstik.io/vi?url=${encodeURIComponent(url)}`,
        size: 'Không watermark',
        isExternal: true,
      },
    ],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`Processing video: ${url}, platform: ${platform}`);

    let videoInfo = null;

    if (platform === 'tiktok') {
      videoInfo = await downloadTikTok(url);
    }

    if (!videoInfo) {
      return new Response(JSON.stringify({ 
        error: 'Không thể lấy thông tin video. Vui lòng thử lại sau.',
        platform: platform,
        downloads: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(videoInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process video';
    console.error('Video downloader error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});