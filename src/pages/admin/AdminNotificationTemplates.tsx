import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Mail, MessageSquare, Eye, RefreshCw, Send, Filter, Languages } from 'lucide-react';
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
} from '@/hooks/useEmailTemplates';
import {
  useDiscordTemplates,
  useCreateDiscordTemplate,
  useUpdateDiscordTemplate,
  useDeleteDiscordTemplate,
  useTestDiscordTemplate,
  type DiscordTemplate,
} from '@/hooks/useDiscordTemplates';
import { useLanguage } from '@/contexts/LanguageContext';

// Template categories
const TEMPLATE_CATEGORIES = {
  order: 'Đơn hàng',
  user: 'Người dùng',
  payment: 'Thanh toán',
  account: 'Tài khoản',
  security: 'Bảo mật',
  social: 'Mạng xã hội',
  marketplace: 'Marketplace',
  system: 'Hệ thống',
  other: 'Khác',
} as const;

// Discord color options
const DISCORD_COLORS = {
  green: { name: 'Xanh lá (Success)', value: 53578 },
  orange: { name: 'Cam (Warning)', value: 16027915 },
  red: { name: 'Đỏ (Error)', value: 15615044 },
  blue: { name: 'Xanh dương (Info)', value: 3906810 },
  pink: { name: 'Hồng (Social)', value: 15580345 },
  purple: { name: 'Tím (Marketplace)', value: 9109718 },
  gray: { name: 'Xám (System)', value: 7040640 },
};

const AdminNotificationTemplates = () => {
  const { language } = useLanguage();
  
  // Email hooks
  const { data: emailTemplates, isLoading: emailLoading, refetch: refetchEmail } = useEmailTemplates();
  const createEmail = useCreateEmailTemplate();
  const updateEmail = useUpdateEmailTemplate();
  const deleteEmail = useDeleteEmailTemplate();
  
  // Discord hooks
  const { data: discordTemplates, isLoading: discordLoading } = useDiscordTemplates();
  const createDiscord = useCreateDiscordTemplate();
  const updateDiscord = useUpdateDiscordTemplate();
  const deleteDiscord = useDeleteDiscordTemplate();
  const testDiscord = useTestDiscordTemplate();

  const [activeTab, setActiveTab] = useState<'email' | 'discord'>('discord');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editLanguage, setEditLanguage] = useState<'vi' | 'en'>('vi');
  
  const [discordFormData, setDiscordFormData] = useState({
    name: '',
    title: '',
    title_en: '',
    message: '',
    message_en: '',
    description: '',
    description_en: '',
    category: 'other',
    color: 3906810,
    is_active: true,
    variables: [] as string[],
  });

  const [testData, setTestData] = useState<Record<string, string>>({});

  // Open create Discord template dialog
  const openCreateDiscordDialog = () => {
    setEditingTemplate(null);
    setDiscordFormData({
      name: '',
      title: '',
      title_en: '',
      message: '',
      message_en: '',
      description: '',
      description_en: '',
      category: 'other',
      color: 3906810,
      is_active: true,
      variables: [],
    });
    setEditLanguage('vi');
    setDialogOpen(true);
  };

  // Open edit Discord template dialog
  const openEditDiscordDialog = (template: DiscordTemplate) => {
    setEditingTemplate(template);
    setDiscordFormData({
      name: template.name,
      title: template.title,
      title_en: template.title_en || '',
      message: template.message,
      message_en: template.message_en || '',
      description: template.description || '',
      description_en: template.description_en || '',
      category: template.category || 'other',
      color: template.color,
      is_active: template.is_active,
      variables: template.variables || [],
    });
    setEditLanguage('vi');
    setDialogOpen(true);
  };

  // Handle save Discord template
  const handleSaveDiscord = async () => {
    if (!discordFormData.name || !discordFormData.title || !discordFormData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      if (editingTemplate) {
        await updateDiscord.mutateAsync({
          id: editingTemplate.id,
          ...discordFormData,
        });
      } else {
        await createDiscord.mutateAsync(discordFormData);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving Discord template:', error);
    }
  };

  // Handle delete Discord template
  const handleDeleteDiscord = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;
    
    try {
      await deleteDiscord.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting Discord template:', error);
    }
  };

  // Handle test Discord template
  const handleTestDiscord = async (template: DiscordTemplate) => {
    // Build test data from variables
    const data: Record<string, string> = {};
    
    template.variables?.forEach(varName => {
      data[varName] = testData[varName] || `[${varName}]`;
    });

    try {
      await testDiscord.mutateAsync({
        templateId: template.id,
        testData: data,
      });
    } catch (error) {
      console.error('Error testing template:', error);
    }
  };

  // Open preview dialog
  const openPreview = (template: any, type: 'email' | 'discord') => {
    setPreviewTemplate({ ...template, type });
    setPreviewOpen(true);
  };

  // Filter templates by category
  const filteredDiscordTemplates = discordTemplates?.filter(t => 
    categoryFilter === 'all' || t.category === categoryFilter
  ) || [];

  const filteredEmailTemplates = emailTemplates?.filter((t: any) => 
    categoryFilter === 'all' || t.category === categoryFilter
  ) || [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Quản lý Templates</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý templates cho Email và Discord notifications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discord" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discord Templates ({discordTemplates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Templates ({emailTemplates?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Discord Templates Tab */}
        <TabsContent value="discord" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Discord Notification Templates</CardTitle>
                  <CardDescription>
                    Tạo và quản lý templates cho Discord bot notifications
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Lọc danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={openCreateDiscordDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo mới
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {discordLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : filteredDiscordTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có template nào
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Variables</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiscordTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-mono text-sm">{template.name}</TableCell>
                          <TableCell>{template.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES] || template.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {template.variables?.length || 0} biến
                          </TableCell>
                          <TableCell>
                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPreview(template, 'discord')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestDiscord(template)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDiscordDialog(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDiscord(template.id)}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Quản lý templates cho email notifications (tính năng cũ)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Email templates được quản lý tại trang Email riêng
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/admin/email'}>
                  <Mail className="h-4 w-4 mr-2" />
                  Đến trang Email Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Discord Template Edit Dialog */}
      <Dialog open={dialogOpen && activeTab === 'discord'} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Chỉnh sửa Discord Template' : 'Tạo Discord Template mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <Button
                variant={editLanguage === 'vi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditLanguage('vi')}
              >
                Tiếng Việt
              </Button>
              <Button
                variant={editLanguage === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditLanguage('en')}
              >
                English
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4">
              <div>
                <Label>Template Name (Key) *</Label>
                <Input
                  value={discordFormData.name}
                  onChange={(e) => setDiscordFormData({ ...discordFormData, name: e.target.value })}
                  placeholder="ORDER_PLACED"
                  disabled={!!editingTemplate}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Danh mục</Label>
                  <Select
                    value={discordFormData.category}
                    onValueChange={(value) => setDiscordFormData({ ...discordFormData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Màu sắc</Label>
                  <Select
                    value={discordFormData.color.toString()}
                    onValueChange={(value) => setDiscordFormData({ ...discordFormData, color: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DISCORD_COLORS).map(([key, { name, value }]) => (
                        <SelectItem key={key} value={value.toString()}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editLanguage === 'vi' ? (
                <>
                  <div>
                    <Label>Tiêu đề (Tiếng Việt) *</Label>
                    <Input
                      value={discordFormData.title}
                      onChange={(e) => setDiscordFormData({ ...discordFormData, title: e.target.value })}
                      placeholder="🎉 Đơn hàng đã đặt"
                    />
                  </div>

                  <div>
                    <Label>Nội dung (Tiếng Việt) *</Label>
                    <Textarea
                      value={discordFormData.message}
                      onChange={(e) => setDiscordFormData({ ...discordFormData, message: e.target.value })}
                      placeholder="Đơn hàng #{orderNumber} đã được đặt..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label>Mô tả (Tiếng Việt)</Label>
                    <Input
                      value={discordFormData.description}
                      onChange={(e) => setDiscordFormData({ ...discordFormData, description: e.target.value })}
                      placeholder="Thông báo khi đơn hàng được tạo"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Title (English)</Label>
                    <Input
                      value={discordFormData.title_en}
                      onChange={(e) => setDiscordFormData({ ...discordFormData, title_en: e.target.value })}
                      placeholder="🎉 Order Placed"
                    />
                  </div>

                  <div>
                    <Label>Message (English)</Label>
                    <Textarea
                      value={discordFormData.message_en}
                      onChange={(e) => setDiscordFormData({ ...discordFormData, message_en: e.target.value })}
                      placeholder="Your order #{orderNumber} has been placed..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label>Description (English)</Label>
                    <Input
                      value={discordFormData.description_en}
                      onChange={(e) => setDiscordFormData({ ...discordFormData, description_en: e.target.value })}
                      placeholder="Notification when order is placed"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Variables (phân cách bằng dấu phẩy)</Label>
                <Input
                  value={discordFormData.variables.join(', ')}
                  onChange={(e) => setDiscordFormData({
                    ...discordFormData,
                    variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                  })}
                  placeholder="orderNumber, total, items"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Sử dụng {'{variable}'} trong nội dung. VD: {'{orderNumber}'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={discordFormData.is_active}
                  onCheckedChange={(checked) => setDiscordFormData({ ...discordFormData, is_active: checked })}
                />
                <Label>Kích hoạt template</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveDiscord}>
                {editingTemplate ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Template</DialogTitle>
          </DialogHeader>

          {previewTemplate?.type === 'discord' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4" style={{ borderLeftColor: `#${previewTemplate.color.toString(16)}`, borderLeftWidth: 4 }}>
                <h3 className="font-bold text-lg mb-2">{previewTemplate.title}</h3>
                <div className="text-sm whitespace-pre-wrap">{previewTemplate.message}</div>
                {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground font-semibold mb-2">Variables:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {previewTemplate.variables.map((varName: string) => (
                        <div key={varName} className="text-xs">
                          <span className="font-mono bg-muted px-1 rounded">{varName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotificationTemplates;
