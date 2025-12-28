import { useState } from 'react';
import { useTranslationsAdmin, useUpdateTranslation, useDeleteTranslation, useCreateTranslation } from '@/hooks/useTranslationsAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit2, Trash2, Plus, Save, X, Languages, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminTranslations = () => {
  const [targetLang, setTargetLang] = useState('en');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState({
    source_text: '',
    translated_text: '',
  });

  const { data: translations, isLoading, refetch } = useTranslationsAdmin(targetLang);
  const updateMutation = useUpdateTranslation();
  const deleteMutation = useDeleteTranslation();
  const createMutation = useCreateTranslation();

  const filteredTranslations = translations?.filter(t =>
    t.source_text.toLowerCase().includes(search.toLowerCase()) ||
    t.translated_text.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSave = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, translated_text: editValue });
      toast.success('Đã cập nhật bản dịch');
      setEditingId(null);
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bản dịch này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xóa');
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleCreate = async () => {
    if (!newTranslation.source_text || !newTranslation.translated_text) {
      toast.error('Vui lòng điền đầy đủ');
      return;
    }
    try {
      await createMutation.mutateAsync({
        source_text: newTranslation.source_text,
        translated_text: newTranslation.translated_text,
        source_lang: 'vi',
        target_lang: targetLang,
      });
      toast.success('Đã thêm bản dịch');
      setIsAddOpen(false);
      setNewTranslation({ source_text: '', translated_text: '' });
    } catch (error) {
      toast.error('Lỗi khi thêm');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Languages className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý bản dịch</h1>
            <p className="text-sm text-muted-foreground">Chỉnh sửa các bản dịch đã cache từ AI</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex-1 sm:flex-initial">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-initial">
                <Plus className="h-4 w-4 mr-2" />
                Thêm mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm bản dịch mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Văn bản gốc (Tiếng Việt)</Label>
                  <Textarea
                    value={newTranslation.source_text}
                    onChange={(e) => setNewTranslation(prev => ({ ...prev, source_text: e.target.value }))}
                    placeholder="Nhập văn bản tiếng Việt..."
                  />
                </div>
                <div>
                  <Label>Bản dịch ({targetLang === 'en' ? 'Tiếng Anh' : targetLang})</Label>
                  <Textarea
                    value={newTranslation.translated_text}
                    onChange={(e) => setNewTranslation(prev => ({ ...prev, translated_text: e.target.value }))}
                    placeholder="Nhập bản dịch..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Languages className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng bản dịch</p>
              <p className="text-xl font-bold">{translations?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div>
              <CardTitle className="text-base">Danh sách bản dịch</CardTitle>
              <CardDescription>
                {filteredTranslations.length} bản dịch
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : filteredTranslations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Không có bản dịch nào</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredTranslations.map((translation) => (
                  <div key={translation.id} className="p-3 border rounded-lg space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Tiếng Việt</p>
                      <p className="font-medium line-clamp-2">{translation.source_text}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Bản dịch</p>
                      {editingId === translation.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 text-sm"
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleSave(translation.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="line-clamp-2">{translation.translated_text}</p>
                      )}
                    </div>
                    {editingId !== translation.id && (
                      <div className="flex justify-end gap-1 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(translation.id, translation.translated_text)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" /> Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(translation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Xóa
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Tiếng Việt (Gốc)</TableHead>
                    <TableHead className="min-w-[200px]">Bản dịch</TableHead>
                    <TableHead className="w-[100px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.map((translation) => (
                    <TableRow key={translation.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[300px] truncate" title={translation.source_text}>
                          {translation.source_text}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === translation.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1"
                            />
                            <Button size="icon" variant="ghost" onClick={() => handleSave(translation.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="max-w-[300px] truncate" title={translation.translated_text}>
                            {translation.translated_text}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(translation.id, translation.translated_text)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(translation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTranslations;
