import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Music, Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface DownloadLink {
  quality: string;
  format: string;
  url: string;
  size?: string;
  isExternal?: boolean;
  note?: string;
}

interface VideoInfo {
  title: string;
  thumbnail?: string;
  author?: string;
  duration?: string;
  platform: 'tiktok' | 'unknown';
  downloads: DownloadLink[];
  error?: string;
}

export function VideoDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const detectPlatform = (inputUrl: string): 'tiktok' | 'unknown' => {
    if (inputUrl.includes('tiktok.com')) {
      return 'tiktok';
    }
    return 'unknown';
  };

  const handleDownload = async (downloadUrl: string, filename: string, format: string) => {
    setDownloading(downloadUrl);
    try {
      toast.info('Đang tải video...');
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Không thể tải video');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      toast.success('Tải video thành công!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Lỗi tải video. Thử mở link trong tab mới.');
      window.open(downloadUrl, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  const handleCheck = async () => {
    if (!url.trim()) {
      toast.error('Vui lòng nhập link video');
      return;
    }

    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      toast.error('Chỉ hỗ trợ TikTok');
      return;
    }

    setLoading(true);
    setVideoInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('video-downloader', {
        body: { url, platform },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setVideoInfo(data);
      toast.success('Đã lấy thông tin video');
    } catch (error: any) {
      console.error('Video download error:', error);
      toast.error(error.message || 'Không thể lấy thông tin video');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return <Music className="h-5 w-5 text-pink-500" />;
      default:
        return <Video className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return 'bg-pink-500/10 text-pink-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Link Video</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://www.tiktok.com/@user/video/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <Button onClick={handleCheck} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lấy link'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Hỗ trợ: TikTok
        </p>
      </div>

      {videoInfo && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="flex gap-4">
            {videoInfo.thumbnail && (
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-32 h-20 object-cover rounded-md"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getPlatformIcon(videoInfo.platform)}
                <Badge variant="outline" className={getPlatformColor(videoInfo.platform)}>
                  {videoInfo.platform.toUpperCase()}
                </Badge>
              </div>
              <h3 className="font-medium text-sm line-clamp-2">{videoInfo.title}</h3>
              {videoInfo.author && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tác giả: {videoInfo.author}
                </p>
              )}
              {videoInfo.duration && (
                <p className="text-xs text-muted-foreground mt-1">
                  Thời lượng: {videoInfo.duration}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {videoInfo.downloads.some(l => !l.isExternal) ? (
              <p className="text-sm font-medium">Tải video:</p>
            ) : (
              <>
                <p className="text-sm font-medium">Chọn trang web để tải:</p>
                <p className="text-xs text-muted-foreground">
                  Nhấn vào link bên dưới và dán link video của bạn vào trang web đó để tải
                </p>
              </>
            )}
            <div className="grid gap-2">
              {videoInfo.downloads.map((link, index) => (
                link.isExternal ? (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-background rounded-md p-3 hover:bg-accent transition-colors border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {link.format === 'mp3' ? (
                          <Music className="h-4 w-4 text-green-500" />
                        ) : (
                          <Video className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm font-medium">
                          {link.quality}
                        </span>
                      </div>
                      {link.note && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {link.note}
                        </p>
                      )}
                      {link.size && (
                        <span className="text-xs text-muted-foreground ml-6">
                          {link.size}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </a>
                ) : (
                  <button
                    key={index}
                    onClick={() => handleDownload(link.url, videoInfo.title || 'video', link.format)}
                    disabled={downloading === link.url}
                    className="flex items-center justify-between bg-primary text-primary-foreground rounded-md p-3 hover:bg-primary/90 transition-colors w-full disabled:opacity-70"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        {link.format === 'mp3' ? (
                          <Music className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {link.quality}
                        </span>
                      </div>
                      {link.size && (
                        <span className="text-xs opacity-80 ml-6">
                          {link.size}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {downloading === link.url ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      <span className="font-medium">
                        {downloading === link.url ? 'Đang tải...' : 'Tải xuống'}
                      </span>
                    </div>
                  </button>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
