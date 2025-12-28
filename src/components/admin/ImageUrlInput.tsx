import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Link as LinkIcon, Loader2, X, Image as ImageIcon } from 'lucide-react';

interface ImageUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  bucket?: string;
  folder?: string;
  aspectHint?: string;
  showPreview?: boolean;
}

const ImageUrlInput: React.FC<ImageUrlInputProps> = ({
  value,
  onChange,
  label = 'Hình ảnh',
  placeholder = 'https://...',
  bucket = 'product-images',
  folder = 'uploads',
  aspectHint,
  showPreview = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(value?.startsWith('http') ? 'url' : 'upload');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File ảnh không được vượt quá 10MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Đã tải lên hình ảnh');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="upload" className="text-xs gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1.5">
            <LinkIcon className="h-3.5 w-3.5" />
            URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-2">
          <div className="space-y-2">
            <div 
              className="relative border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {value && showPreview ? (
                <div className="relative">
                  <img 
                    src={value} 
                    alt="Preview" 
                    className="max-h-32 mx-auto rounded object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  ) : (
                    <ImageIcon className="h-8 w-8 mb-2" />
                  )}
                  <span className="text-sm">
                    {uploading ? 'Đang tải lên...' : 'Click để chọn ảnh'}
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="mt-2">
          <div className="space-y-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
            {value && showPreview && (
              <div className="relative inline-block">
                <img 
                  src={value} 
                  alt="Preview" 
                  className="max-h-32 rounded object-contain border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {aspectHint && (
        <p className="text-xs text-muted-foreground">{aspectHint}</p>
      )}
    </div>
  );
};

export default ImageUrlInput;
