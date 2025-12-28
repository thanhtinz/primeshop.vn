import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Sticker, Package, FileArchive, Loader2, ImagePlus, Upload, Images } from 'lucide-react';
import { toast } from 'sonner';
import ImageUrlInput from '@/components/admin/ImageUrlInput';
import {
  useAdminStickerPacks,
  useCreateStickerPack,
  useUpdateStickerPack,
  useDeleteStickerPack,
  useCreateSticker,
  useUpdateSticker,
  useDeleteSticker,
  useBulkCreateStickers,
  uploadStickerImage,
  extractStickerZip,
  StickerPack,
  Sticker as StickerType,
} from '@/hooks/useStickers';

const AdminStickers = () => {
  const { data: packs = [], isLoading, refetch } = useAdminStickerPacks();
  const createPack = useCreateStickerPack();
  const updatePack = useUpdateStickerPack();
  const deletePack = useDeleteStickerPack();
  const createSticker = useCreateSticker();
  const updateSticker = useUpdateSticker();
  const deleteSticker = useDeleteSticker();
  const bulkCreateStickers = useBulkCreateStickers();

  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [stickerDialogOpen, setStickerDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [quickZipDialogOpen, setQuickZipDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<StickerPack | null>(null);
  const [editingSticker, setEditingSticker] = useState<StickerType | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [quickZipPackId, setQuickZipPackId] = useState<string>('');
  const [quickZipNewPackName, setQuickZipNewPackName] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const quickZipInputRef = useRef<HTMLInputElement>(null);

  const [packForm, setPackForm] = useState({
    name: '',
    description: '',
    cover_url: '',
    is_active: true,
    sort_order: 0,
  });

  const [stickerForm, setStickerForm] = useState({
    name: '',
    image_url: '',
    is_active: true,
    sort_order: 0,
  });

  const openPackDialog = (pack?: StickerPack) => {
    if (pack) {
      setEditingPack(pack);
      setPackForm({
        name: pack.name,
        description: pack.description || '',
        cover_url: pack.cover_url || '',
        is_active: pack.is_active,
        sort_order: pack.sort_order,
      });
    } else {
      setEditingPack(null);
      setPackForm({ name: '', description: '', cover_url: '', is_active: true, sort_order: 0 });
    }
    setPackDialogOpen(true);
  };

  const openStickerDialog = (packId: string, sticker?: StickerType) => {
    setSelectedPackId(packId);
    if (sticker) {
      setEditingSticker(sticker);
      setStickerForm({
        name: sticker.name,
        image_url: sticker.image_url,
        is_active: sticker.is_active,
        sort_order: sticker.sort_order,
      });
    } else {
      setEditingSticker(null);
      setStickerForm({ name: '', image_url: '', is_active: true, sort_order: 0 });
    }
    setStickerDialogOpen(true);
  };

  const openBulkUploadDialog = (packId: string) => {
    setSelectedPackId(packId);
    setBulkUploadDialogOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadStickerImage(file, 'covers');
      setPackForm({ ...packForm, cover_url: url });
      toast.success('Đã upload ảnh bìa');
    } catch (error) {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleStickerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedPackId) {
      toast.error('Chưa chọn gói sticker');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadStickerImage(file, selectedPackId);
      setStickerForm({ ...stickerForm, image_url: url });
      toast.success('Đã upload ảnh sticker');
    } catch (error) {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedPackId) return;

    setUploading(true);
    const successCount = { value: 0 };
    
    try {
      const stickersToCreate: { pack_id: string; name: string; image_url: string; sort_order: number; is_active: boolean }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const url = await uploadStickerImage(file, selectedPackId);
          const name = file.name.replace(/\.[^/.]+$/, '');
          stickersToCreate.push({
            pack_id: selectedPackId,
            name,
            image_url: url,
            sort_order: i,
            is_active: true,
          });
          successCount.value++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      if (stickersToCreate.length > 0) {
        await bulkCreateStickers.mutateAsync(stickersToCreate);
      }

      toast.success(`Đã upload ${successCount.value}/${files.length} sticker`);
      setBulkUploadDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploading(false);
      if (bulkInputRef.current) bulkInputRef.current.value = '';
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPackId) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Vui lòng chọn file ZIP');
      return;
    }

    setUploading(true);
    try {
      const result = await extractStickerZip(file, selectedPackId);
      toast.success(`Đã giải nén và thêm ${result.count} sticker`);
      setBulkUploadDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('ZIP upload error:', error);
      toast.error('Lỗi giải nén file ZIP');
    } finally {
      setUploading(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleQuickZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Vui lòng chọn file ZIP');
      return;
    }

    setUploading(true);
    try {
      let targetPackId = quickZipPackId;

      // Nếu không chọn gói, tự tạo gói mới với tên file ZIP hoặc tên nhập vào
      if (!targetPackId) {
        const packName = quickZipNewPackName.trim() || file.name.replace('.zip', '');
        const newPack = await createPack.mutateAsync({
          name: packName,
          description: '',
          cover_url: '',
          is_active: true,
          sort_order: 0,
        });
        targetPackId = newPack.id;
      }

      const result = await extractStickerZip(file, targetPackId);
      toast.success(`Đã tạo gói và thêm ${result.count} sticker`);
      setQuickZipDialogOpen(false);
      setQuickZipPackId('');
      setQuickZipNewPackName('');
      refetch();
    } catch (error) {
      console.error('ZIP upload error:', error);
      toast.error('Lỗi giải nén file ZIP');
    } finally {
      setUploading(false);
      if (quickZipInputRef.current) quickZipInputRef.current.value = '';
    }
  };

  const handleSavePack = async () => {
    if (!packForm.name.trim()) {
      toast.error('Vui lòng nhập tên gói sticker');
      return;
    }
    try {
      if (editingPack) {
        await updatePack.mutateAsync({ id: editingPack.id, ...packForm });
        toast.success('Đã cập nhật gói sticker');
      } else {
        await createPack.mutateAsync(packForm);
        toast.success('Đã tạo gói sticker mới');
      }
      setPackDialogOpen(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeletePack = async (id: string) => {
    if (!confirm('Xóa gói sticker này? Tất cả sticker trong gói cũng sẽ bị xóa.')) return;
    try {
      await deletePack.mutateAsync(id);
      toast.success('Đã xóa gói sticker');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleSaveSticker = async () => {
    if (!stickerForm.name.trim() || !stickerForm.image_url.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      if (editingSticker) {
        await updateSticker.mutateAsync({ id: editingSticker.id, ...stickerForm });
        toast.success('Đã cập nhật sticker');
      } else {
        await createSticker.mutateAsync({ pack_id: selectedPackId!, ...stickerForm });
        toast.success('Đã thêm sticker mới');
      }
      setStickerDialogOpen(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeleteSticker = async (id: string) => {
    if (!confirm('Xóa sticker này?')) return;
    try {
      await deleteSticker.mutateAsync(id);
      toast.success('Đã xóa sticker');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  if (isLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Quản lý Sticker</h1>
          <p className="text-sm text-muted-foreground">Quản lý các gói sticker cho chat</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (packs.length === 0) {
                toast.error('Vui lòng tạo gói sticker trước');
                return;
              }
              setQuickZipDialogOpen(true);
            }}
          >
            <FileArchive className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Upload ZIP</span>
          </Button>
          <Button size="sm" onClick={() => openPackDialog()}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Thêm gói</span>
          </Button>
        </div>
      </div>

      {packs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
            <Sticker className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm md:text-base">Chưa có gói sticker nào</p>
            <Button className="mt-4" size="sm" onClick={() => openPackDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo gói sticker đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {packs.map((pack) => (
            <Card key={pack.id}>
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2 px-3 md:px-6">
                <div className="flex items-center gap-2 md:gap-3">
                  {pack.cover_url ? (
                    <img src={pack.cover_url} alt={pack.name} className="h-8 w-8 md:h-10 md:w-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <Package className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-1 md:gap-2">
                      <span className="truncate">{pack.name}</span>
                      <Badge variant={pack.is_active ? 'default' : 'secondary'} className="text-xs">
                        {pack.is_active ? 'Hoạt động' : 'Ẩn'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{pack.stickers?.length || 0}</Badge>
                    </CardTitle>
                    {pack.description && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{pack.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openBulkUploadDialog(pack.id)}>
                    <FileArchive className="h-3.5 w-3.5 md:mr-1" />
                    <span className="hidden md:inline">Upload</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openStickerDialog(pack.id)}>
                    <ImagePlus className="h-3.5 w-3.5 md:mr-1" />
                    <span className="hidden md:inline">Thêm</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPackDialog(pack)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePack(pack.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                {pack.stickers && pack.stickers.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 md:gap-2">
                    {pack.stickers
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((sticker) => (
                        <div
                          key={sticker.id}
                          className={`relative group aspect-square rounded border p-0.5 md:p-1 ${
                            !sticker.is_active ? 'opacity-50' : ''
                          }`}
                        >
                          <img
                            src={sticker.image_url}
                            alt={sticker.name}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5 md:gap-1 rounded">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 md:h-6 md:w-6 text-white hover:bg-white/20"
                              onClick={() => openStickerDialog(pack.id, sticker)}
                            >
                              <Pencil className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 md:h-6 md:w-6 text-white hover:bg-white/20"
                              onClick={() => handleDeleteSticker(sticker.id)}
                            >
                              <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
                    Chưa có sticker trong gói này
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pack Dialog */}
      <Dialog open={packDialogOpen} onOpenChange={setPackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPack ? 'Sửa gói sticker' : 'Thêm gói sticker'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên gói *</Label>
              <Input
                value={packForm.name}
                onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                placeholder="VD: Mèo dễ thương"
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input
                value={packForm.description}
                onChange={(e) => setPackForm({ ...packForm, description: e.target.value })}
                placeholder="Mô tả ngắn về gói sticker"
              />
            </div>
            <div>
              <Label>Ảnh bìa</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={packForm.cover_url}
                  onChange={(e) => setPackForm({ ...packForm, cover_url: e.target.value })}
                  placeholder="URL ảnh bìa hoặc upload"
                  className="flex-1"
                />
                <input
                  type="file"
                  ref={coverInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              {packForm.cover_url && (
                <img src={packForm.cover_url} alt="Cover preview" className="mt-2 h-16 w-16 object-cover rounded" />
              )}
            </div>
            <div>
              <Label>Thứ tự sắp xếp</Label>
              <Input
                type="number"
                value={packForm.sort_order}
                onChange={(e) => setPackForm({ ...packForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={packForm.is_active}
                onCheckedChange={(checked) => setPackForm({ ...packForm, is_active: checked })}
              />
              <Label>Hiển thị</Label>
            </div>
            <Button onClick={handleSavePack} className="w-full">
              {editingPack ? 'Cập nhật' : 'Tạo gói sticker'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticker Dialog */}
      <Dialog open={stickerDialogOpen} onOpenChange={setStickerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSticker ? 'Sửa sticker' : 'Thêm sticker'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên sticker *</Label>
              <Input
                value={stickerForm.name}
                onChange={(e) => setStickerForm({ ...stickerForm, name: e.target.value })}
                placeholder="VD: Mèo cười"
              />
            </div>
            <div>
              <Label>Ảnh sticker *</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={stickerForm.image_url}
                  onChange={(e) => setStickerForm({ ...stickerForm, image_url: e.target.value })}
                  placeholder="URL ảnh hoặc upload"
                  className="flex-1"
                />
                <input
                  type="file"
                  ref={stickerInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleStickerImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => stickerInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              {stickerForm.image_url && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={stickerForm.image_url}
                    alt="Preview"
                    className="h-20 w-20 object-contain border rounded"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Thứ tự sắp xếp</Label>
              <Input
                type="number"
                value={stickerForm.sort_order}
                onChange={(e) => setStickerForm({ ...stickerForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={stickerForm.is_active}
                onCheckedChange={(checked) => setStickerForm({ ...stickerForm, is_active: checked })}
              />
              <Label>Hiển thị</Label>
            </div>
            <Button onClick={handleSaveSticker} className="w-full">
              {editingSticker ? 'Cập nhật' : 'Thêm sticker'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialogOpen} onOpenChange={setBulkUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload sticker hàng loạt</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Multiple images upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Images className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Chọn nhiều ảnh để upload cùng lúc
              </p>
              <input
                type="file"
                ref={bulkInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleBulkImageUpload}
              />
              <Button
                variant="outline"
                onClick={() => bulkInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Chọn nhiều ảnh
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>

            {/* ZIP upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileArchive className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload file ZIP chứa nhiều ảnh sticker<br />
                <span className="text-xs">Hệ thống sẽ tự động giải nén</span>
              </p>
              <input
                type="file"
                ref={zipInputRef}
                className="hidden"
                accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
                onChange={handleZipUpload}
              />
              <Button
                variant="outline"
                onClick={() => zipInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang giải nén...
                  </>
                ) : (
                  <>
                    <FileArchive className="h-4 w-4 mr-2" />
                    Chọn file ZIP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick ZIP Upload Dialog */}
      <Dialog open={quickZipDialogOpen} onOpenChange={(open) => {
        setQuickZipDialogOpen(open);
        if (!open) {
          setQuickZipPackId('');
          setQuickZipNewPackName('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload file ZIP sticker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {packs.length > 0 && (
              <div className="space-y-2">
                <Label>Thêm vào gói có sẵn (tùy chọn)</Label>
                <Select 
                  value={quickZipPackId} 
                  onValueChange={(val) => {
                    setQuickZipPackId(val);
                    setQuickZipNewPackName('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Để trống = tạo gói mới" />
                  </SelectTrigger>
                  <SelectContent>
                    {packs.map((pack) => (
                      <SelectItem key={pack.id} value={pack.id}>
                        {pack.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tên gói mới (tùy chọn)</Label>
              <Input
                placeholder="Để trống = lấy tên file ZIP"
                value={quickZipNewPackName}
                onChange={(e) => {
                  setQuickZipNewPackName(e.target.value);
                  setQuickZipPackId('');
                }}
                disabled={!!quickZipPackId}
              />
              <p className="text-xs text-muted-foreground">
                Nếu không chọn gói và không nhập tên, hệ thống sẽ tạo gói mới với tên file ZIP
              </p>
            </div>

            <div className="border-2 border-dashed rounded-lg p-4 md:p-6 text-center">
              <FileArchive className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Chọn file ZIP chứa ảnh sticker
              </p>
              <input
                type="file"
                ref={quickZipInputRef}
                className="hidden"
                accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
                onChange={handleQuickZipUpload}
              />
              <Button
                onClick={() => quickZipInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FileArchive className="h-4 w-4 mr-2" />
                    Chọn file ZIP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStickers;
