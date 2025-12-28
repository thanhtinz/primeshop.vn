import { useState } from 'react';
import { useAllHeroBanners, useCreateHeroBanner, useUpdateHeroBanner, useDeleteHeroBanner, HeroBanner } from '@/hooks/useHeroBanners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ImageUrlInput from '@/components/admin/ImageUrlInput';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';

const AdminHeroBanners = () => {
  const { data: banners, isLoading } = useAllHeroBanners();
  const createBanner = useCreateHeroBanner();
  const updateBanner = useUpdateHeroBanner();
  const deleteBanner = useDeleteHeroBanner();

  const [showDialog, setShowDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setDescription('');
    setImageUrl('');
    setButtonText('');
    setButtonLink('');
    setIsActive(true);
    setSortOrder(0);
    setEditingBanner(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setDescription(banner.description || '');
    setImageUrl(banner.image_url);
    setButtonText(banner.button_text || '');
    setButtonLink(banner.button_link || '');
    setIsActive(banner.is_active);
    setSortOrder(banner.sort_order);
    setShowDialog(true);
  };


  const handleSubmit = () => {
    if (!imageUrl) {
      toast.error('Vui lòng tải lên hình ảnh banner');
      return;
    }

    const bannerData = {
      title: title || null,
      subtitle: subtitle || null,
      description: description || null,
      image_url: imageUrl,
      button_text: buttonText || null,
      button_link: buttonLink || null,
      is_active: isActive,
      sort_order: sortOrder,
    };

    if (editingBanner) {
      updateBanner.mutate({ id: editingBanner.id, ...bannerData }, {
        onSuccess: () => {
          setShowDialog(false);
          resetForm();
        },
      });
    } else {
      createBanner.mutate(bannerData, {
        onSuccess: () => {
          setShowDialog(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteBanner.mutate(id);
  };

  const toggleActive = (banner: HeroBanner) => {
    updateBanner.mutate({ id: banner.id, is_active: !banner.is_active });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hero Banners</h1>
          <p className="text-sm text-muted-foreground">Quản lý banner carousel trên trang chủ</p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm banner
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : banners && banners.length > 0 ? (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Image preview */}
                  <div className="relative w-full sm:w-48 h-28 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {banner.image_url ? (
                      <img 
                        src={banner.image_url} 
                        alt={banner.title || 'Banner'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate text-sm sm:text-base">
                          {banner.title || 'Không có tiêu đề'}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                        )}
                        {banner.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">{banner.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Thứ tự: {banner.sort_order}</span>
                          {banner.button_text && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {banner.button_text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActive(banner)}
                        >
                          {banner.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa banner này? Hành động không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(banner.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Chưa có banner nào</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm banner đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Sửa banner' : 'Thêm banner mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image upload */}
            <ImageUrlInput
              value={imageUrl}
              onChange={setImageUrl}
              label="Hình ảnh banner *"
              folder="banners"
              aspectHint="Kích thước khuyến nghị: 1920x600px (tỉ lệ 16:5)"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề chính</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Tiêu đề phụ</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Nhập tiêu đề phụ..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngắn..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Nút CTA - Văn bản</Label>
                <Input
                  id="buttonText"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Khám phá ngay"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonLink">Nút CTA - Link</Label>
                <Input
                  id="buttonLink"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="/category/game-account"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Hiển thị</Label>
                  <p className="text-xs text-muted-foreground">Banner có hiển thị không</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createBanner.isPending || updateBanner.isPending || !imageUrl}
            >
              {(createBanner.isPending || updateBanner.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingBanner ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHeroBanners;
