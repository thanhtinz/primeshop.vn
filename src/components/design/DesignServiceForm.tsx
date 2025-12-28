import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCheck, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Clock, 
  DollarSign,
  Info,
  Palette,
  FileType,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import { DesignService, useDesignCategories } from '@/hooks/useDesignServices';
import { useDesignLicenseTypes } from '@/hooks/useDesignAdvanced';

interface DesignServiceFormProps {
  service?: DesignService | null;
  sellerId: string;
  onSubmit: (data: any) => Promise<void>;
  isPending?: boolean;
  onCancel: () => void;
}

const DELIVERY_FORMATS = [
  { value: 'PNG', label: 'PNG', description: 'Ảnh nền trong suốt' },
  { value: 'JPG', label: 'JPG', description: 'Ảnh nén chất lượng cao' },
  { value: 'PSD', label: 'PSD', description: 'File Photoshop' },
  { value: 'AI', label: 'AI', description: 'File Illustrator' },
  { value: 'PDF', label: 'PDF', description: 'Tài liệu in ấn' },
  { value: 'SVG', label: 'SVG', description: 'Vector đồ họa web' },
  { value: 'WEBP', label: 'WEBP', description: 'Ảnh tối ưu web' },
  { value: 'GIF', label: 'GIF', description: 'Ảnh động' },
  { value: 'MP4', label: 'MP4', description: 'Video' },
  { value: 'SOURCE', label: 'Source Files', description: 'Tất cả file gốc' },
];

export default function DesignServiceForm({ 
  service, 
  sellerId, 
  onSubmit, 
  isPending,
  onCancel 
}: DesignServiceFormProps) {
  const { formatPrice } = useCurrency();
  const { data: categories } = useDesignCategories();
  const { data: licenseTypes } = useDesignLicenseTypes();
  
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: 0,
    delivery_days: 3,
    revision_count: 2,
    delivery_formats: ['PNG', 'JPG'] as string[],
    portfolio_images: [] as string[],
    is_active: true,
    supported_license_ids: [] as string[],
  });

  useEffect(() => {
    if (service?.id) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category_id: service.category_id,
        price: service.price,
        delivery_days: service.delivery_days,
        revision_count: service.revision_count,
        delivery_formats: service.delivery_formats || ['PNG', 'JPG'],
        portfolio_images: service.portfolio_images || [],
        is_active: service.is_active,
        supported_license_ids: (service as any).supported_license_ids || [],
      });
    }
  }, [service?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${sellerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('design-portfolios')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('design-portfolios')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        portfolio_images: [...prev.portfolio_images, ...newImages],
      }));
      toast.success(`Đã tải lên ${newImages.length} ảnh`);
    } catch (error) {
      toast.error('Lỗi khi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: prev.portfolio_images.filter((_, i) => i !== index),
    }));
  };

  const toggleFormat = (format: string) => {
    setFormData(prev => ({
      ...prev,
      delivery_formats: prev.delivery_formats.includes(format)
        ? prev.delivery_formats.filter(f => f !== format)
        : [...prev.delivery_formats, format],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (formData.delivery_formats.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 định dạng giao hàng');
      return;
    }
    // Remove supported_license_ids as it's not a column in design_services table
    const { supported_license_ids, ...submitData } = formData;
    await onSubmit({
      ...submitData,
      seller_id: sellerId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="basic" className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Cơ bản
          </TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Giá
          </TabsTrigger>
          <TabsTrigger value="formats" className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Định dạng
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Portfolio
          </TabsTrigger>
        </TabsList>

        {/* Tab Cơ bản */}
        <TabsContent value="basic" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Tên dịch vụ <span className="text-destructive">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Thiết kế Avatar Gaming"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Danh mục <span className="text-destructive">*</span></Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Mô tả</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả về dịch vụ của bạn..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm">Kích hoạt</Label>
              <p className="text-xs text-muted-foreground">Hiển thị cho khách hàng</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </TabsContent>

        {/* Tab Giá & Thời gian */}
        <TabsContent value="pricing" className="space-y-3 mt-3">
          {/* Giá + Thời gian - Grid 2 cột */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-medium">Giá dịch vụ</Label>
              </div>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                min={0}
                step={1000}
                required
                className="h-9 text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">= {formatPrice(formData.price)}</p>
            </div>

            <div className="p-2.5 border rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-medium">Thời gian</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={formData.delivery_days}
                  onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={30}
                  required
                  className="h-9 text-sm flex-1"
                />
                <span className="text-xs text-muted-foreground">ngày</span>
              </div>
            </div>
          </div>

          {/* Số lần chỉnh sửa */}
          <div className="p-2.5 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-medium">Lượt chỉnh sửa miễn phí</Label>
              </div>
              <Input
                type="number"
                value={formData.revision_count}
                onChange={(e) => setFormData({ ...formData, revision_count: parseInt(e.target.value) || 0 })}
                min={0}
                max={10}
                className="h-8 w-16 text-sm text-center"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">💡 Khách có thể mua thêm lượt nếu cần</p>
          </div>

          {/* License Types */}
          {licenseTypes && licenseTypes.length > 0 && (
            <div className="p-2.5 border rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <FileCheck className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-medium">Loại License hỗ trợ</Label>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {licenseTypes.map((license) => {
                  const isSelected = formData.supported_license_ids.includes(license.id);
                  return (
                    <label 
                      key={license.id} 
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            supported_license_ids: checked
                              ? [...prev.supported_license_ids, license.id]
                              : prev.supported_license_ids.filter(id => id !== license.id),
                          }));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{license.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{license.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab Định dạng */}
        <TabsContent value="formats" className="space-y-3 mt-3">
          <div>
            <Label className="text-sm">Định dạng giao hàng <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground">Chọn các định dạng file bạn sẽ giao</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {DELIVERY_FORMATS.map((format) => {
              const isSelected = formData.delivery_formats.includes(format.value);
              return (
                <div
                  key={format.value}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleFormat(format.value)}
                >
                  <Badge 
                    variant={isSelected ? 'default' : 'outline'} 
                    className="text-xs shrink-0"
                  >
                    {format.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">{format.description}</span>
                </div>
              );
            })}
          </div>

          {formData.delivery_formats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground mr-1">Đã chọn:</span>
              {formData.delivery_formats.map((format) => (
                <Badge key={format} variant="secondary" className="gap-1 text-xs">
                  {format}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFormat(format);
                    }}
                  />
                </Badge>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Portfolio */}
        <TabsContent value="portfolio" className="space-y-3 mt-3">
          <div>
            <Label className="text-sm">Ảnh mẫu Portfolio</Label>
            <p className="text-xs text-muted-foreground">
              Thêm ảnh mẫu để khách hàng xem phong cách của bạn
            </p>
          </div>

          {/* Upload Area */}
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Click để tải ảnh lên</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (tối đa 5MB)</p>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>

          {/* Image Grid */}
          {formData.portfolio_images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {formData.portfolio_images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có ảnh portfolio</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t">
        <Button type="button" variant="outline" className="flex-1 h-10" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" className="flex-1 h-10" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {service ? 'Cập nhật' : 'Tạo dịch vụ'}
        </Button>
      </div>
    </form>
  );
}