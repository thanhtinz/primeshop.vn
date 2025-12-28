import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Trash2, Edit, GripVertical, Type, AlignLeft, List, CheckSquare, Palette, Upload } from 'lucide-react';
import { useSellerDesignTemplates, useCreateDesignTemplate, useUpdateDesignTemplate, useDeleteDesignTemplate, FormField } from '@/hooks/useDesignAdvanced';
import { useSellerDesignServices } from '@/hooks/useDesignServices';

const fieldTypeIcons: Record<string, any> = {
  text: Type,
  textarea: AlignLeft,
  select: List,
  checkbox: CheckSquare,
  color: Palette,
  file: Upload,
};

const fieldTypeLabels: Record<string, string> = {
  text: 'Văn bản ngắn',
  textarea: 'Văn bản dài',
  select: 'Lựa chọn',
  checkbox: 'Checkbox',
  color: 'Màu sắc',
  file: 'Tệp đính kèm',
};

export default function SellerDesignTemplatesPage() {
  const { seller } = useOutletContext<any>();
  const { data: templates, isLoading } = useSellerDesignTemplates(seller?.id);
  const { data: services } = useSellerDesignServices(seller?.id);
  const createTemplate = useCreateDesignTemplate();
  const updateTemplate = useUpdateDesignTemplate();
  const deleteTemplate = useDeleteDesignTemplate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    service_id: '',
    name: '',
    description: '',
    is_default: false,
  });
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newField, setNewField] = useState<Partial<FormField>>({
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
  });
  
  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        service_id: template.service_id,
        name: template.name,
        description: template.description || '',
        is_default: template.is_default,
      });
      setFormFields(template.form_fields || []);
    } else {
      setEditingTemplate(null);
      setFormData({
        service_id: '',
        name: '',
        description: '',
        is_default: false,
      });
      setFormFields([]);
    }
    setIsDialogOpen(true);
  };
  
  const handleAddField = () => {
    if (!newField.label) return;
    
    setFormFields([
      ...formFields,
      {
        id: crypto.randomUUID(),
        type: newField.type as FormField['type'],
        label: newField.label,
        placeholder: newField.placeholder,
        required: newField.required || false,
        options: newField.type === 'select' ? newField.options : undefined,
      },
    ]);
    
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
    });
  };
  
  const handleRemoveField = (fieldId: string) => {
    setFormFields(formFields.filter(f => f.id !== fieldId));
  };
  
  const handleSubmit = async () => {
    if (!formData.service_id || !formData.name || !seller) return;
    
    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        name: formData.name,
        description: formData.description || undefined,
        is_default: formData.is_default,
        form_fields: formFields,
      });
    } else {
      await createTemplate.mutateAsync({
        service_id: formData.service_id,
        seller_id: seller.id,
        name: formData.name,
        description: formData.description || undefined,
        is_default: formData.is_default,
        form_fields: formFields,
      });
    }
    
    setIsDialogOpen(false);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;
    await deleteTemplate.mutateAsync(id);
  };
  
  if (!seller) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Template Form
          </h1>
          <p className="text-muted-foreground">Tạo form thu thập yêu cầu tùy chỉnh cho từng dịch vụ</p>
        </div>
        
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo template
        </Button>
      </div>
      
      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Template ({templates?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : !templates?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có template nào. Tạo template để thu thập yêu cầu từ buyer!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Template</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Số trường</TableHead>
                  <TableHead>Mặc định</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.service?.name || '-'}</TableCell>
                    <TableCell>{template.form_fields?.length || 0} trường</TableCell>
                    <TableCell>
                      {template.is_default && <Badge variant="secondary">Mặc định</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'outline'}>
                        {template.is_active ? 'Hoạt động' : 'Tắt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Chỉnh sửa Template' : 'Tạo Template mới'}</DialogTitle>
            <DialogDescription>Thiết kế form thu thập yêu cầu từ buyer</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Dịch vụ áp dụng</Label>
                <Select 
                  value={formData.service_id} 
                  onValueChange={(v) => setFormData(d => ({ ...d, service_id: v }))}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dịch vụ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service: any) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tên template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                  placeholder="VD: Form yêu cầu Logo"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                  placeholder="Mô tả ngắn về template này..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(d => ({ ...d, is_default: checked }))}
                />
                <Label>Đặt làm mặc định</Label>
              </div>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Các trường form</Label>
              </div>
              
              {/* Existing Fields */}
              <div className="space-y-2">
                {formFields.map((field, index) => {
                  const Icon = fieldTypeIcons[field.type];
                  return (
                    <div key={field.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{field.label}</span>
                      {field.required && <Badge variant="secondary">Bắt buộc</Badge>}
                      <Badge variant="outline">{fieldTypeLabels[field.type]}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveField(field.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              
              {/* Add New Field */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Thêm trường mới</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Loại trường</Label>
                      <Select
                        value={newField.type}
                        onValueChange={(v) => setNewField(f => ({ ...f, type: v as FormField['type'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(fieldTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nhãn</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) => setNewField(f => ({ ...f, label: e.target.value }))}
                        placeholder="VD: Tên thương hiệu"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={newField.placeholder}
                        onChange={(e) => setNewField(f => ({ ...f, placeholder: e.target.value }))}
                        placeholder="Gợi ý cho người dùng..."
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField(f => ({ ...f, required: checked }))}
                        />
                        <Label>Bắt buộc</Label>
                      </div>
                    </div>
                  </div>
                  
                  {newField.type === 'select' && (
                    <div className="space-y-2">
                      <Label>Các lựa chọn (mỗi dòng 1 lựa chọn)</Label>
                      <Textarea
                        value={newField.options?.join('\n')}
                        onChange={(e) => setNewField(f => ({ ...f, options: e.target.value.split('\n').filter(Boolean) }))}
                        placeholder="Lựa chọn 1&#10;Lựa chọn 2&#10;Lựa chọn 3"
                        rows={3}
                      />
                    </div>
                  )}
                  
                  <Button onClick={handleAddField} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm trường
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.service_id || !formData.name || createTemplate.isPending || updateTemplate.isPending}
            >
              {editingTemplate ? 'Lưu thay đổi' : 'Tạo template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
