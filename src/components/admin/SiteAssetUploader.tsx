import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, X, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteAssetUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  assetType: 'logo' | 'favicon';
  description?: string;
  previewSize?: 'small' | 'medium' | 'large';
}

export const SiteAssetUploader: React.FC<SiteAssetUploaderProps> = ({
  label,
  value,
  onChange,
  assetType,
  description,
  previewSize = 'medium',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-16 w-auto max-w-[200px]',
    large: 'h-24 w-auto max-w-[300px]',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Định dạng file không hỗ trợ. Vui lòng chọn PNG, JPG, GIF, SVG, ICO hoặc WEBP.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 2MB.');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetType}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      onChange(urlWithCacheBust);
      toast.success('Tải lên thành công!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Không thể tải lên file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'upload' | 'url')}>
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="h-3 w-3" />
            Tải lên
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1">
            <Link className="h-3 w-3" />
            Nhập URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/svg+xml,image/x-icon,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Chọn file
                </>
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Xóa
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.png"
          />
        </TabsContent>
      </Tabs>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {value && (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Xem trước:</p>
          <img
            src={value}
            alt={`${assetType} preview`}
            className={`${sizeClasses[previewSize]} object-contain border rounded bg-white p-1`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};
