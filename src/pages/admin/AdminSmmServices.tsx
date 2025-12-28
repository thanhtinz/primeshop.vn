import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, RefreshCw, Search, Download } from 'lucide-react';
import { 
  useSmmServices, 
  useSmmServiceTypes, 
  useSmmPlatforms,
  useSmmConfigs,
  useCreateSmmService, 
  useUpdateSmmService, 
  useDeleteSmmService, 
  useSyncSmmServices,
  useSyncSingleSmmService,
  useSmmServicesAvgTimes,
  SmmService 
} from '@/hooks/useSmm';

const AdminSmmServices = () => {
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formPlatformId, setFormPlatformId] = useState<string>('');
  
  const { data: services = [], isLoading } = useSmmServices();
  const { data: serviceTypes = [] } = useSmmServiceTypes();
  const { data: platforms = [] } = useSmmPlatforms();
  const { data: smmConfigs = [] } = useSmmConfigs();
  
  // Get calculated average times for all services
  const serviceIds = services.map(s => s.id);
  const { data: avgTimes = {} } = useSmmServicesAvgTimes(serviceIds);
  
  const createService = useCreateSmmService();
  const updateService = useUpdateSmmService();
  const deleteService = useDeleteSmmService();
  const syncServices = useSyncSmmServices();
  const syncSingleService = useSyncSingleSmmService();
  const [syncingServiceId, setSyncingServiceId] = useState<number | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<SmmService | null>(null);
  const [serviceMode, setServiceMode] = useState<'manual' | 'api'>('api');
  const [formData, setFormData] = useState({
    category_id: '',
    service_type_id: null as string | null,
    external_service_id: 0,
    name: '',
    type: 'Default',
    rate: 0,
    min_quantity: 100,
    max_quantity: 10000,
    has_refill: false,
    has_drip_feed: false,
    description: '',
    processing_time: '',
    refill_policy: '',
    markup_percent: 0,
    markup_member: 20,
    markup_bronze: 18,
    markup_silver: 15,
    markup_gold: 12,
    markup_diamond: 10,
    is_active: true,
    sort_order: 0,
  });

  const filteredServices = services.filter(service => {
    const matchesServiceType = !selectedServiceType || service.service_type_id === selectedServiceType;
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.external_service_id.toString().includes(searchQuery);
    return matchesServiceType && matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      category_id: '',
      service_type_id: null as string | null,
      external_service_id: 0,
      name: '',
      type: 'Default',
      rate: 0,
      min_quantity: 100,
      max_quantity: 10000,
      has_refill: false,
      has_drip_feed: false,
      description: '',
      processing_time: '',
      refill_policy: '',
      markup_percent: 0,
      markup_member: 20,
      markup_bronze: 18,
      markup_silver: 15,
      markup_gold: 12,
      markup_diamond: 10,
      is_active: true,
      sort_order: 0,
    });
    setFormPlatformId('');
    setEditingService(null);
    setServiceMode('api');
  };

  const handleOpenDialog = (service?: SmmService) => {
    if (service) {
      setEditingService(service);
      setServiceMode(service.external_service_id ? 'api' : 'manual');
      // Set platform from service type
      const serviceType = serviceTypes.find(st => st.id === service.service_type_id);
      setFormPlatformId(serviceType?.platform_id || '');
      setFormData({
        category_id: service.category_id,
        service_type_id: service.service_type_id || null,
        external_service_id: service.external_service_id,
        name: service.name,
        type: service.type,
        rate: service.rate,
        min_quantity: service.min_quantity,
        max_quantity: service.max_quantity,
        has_refill: service.has_refill,
        has_drip_feed: false,
        description: service.description || '',
        processing_time: service.processing_time || '',
        refill_policy: service.refill_policy || '',
        markup_percent: service.markup_percent,
        markup_member: service.markup_member ?? 20,
        markup_bronze: service.markup_bronze ?? 18,
        markup_silver: service.markup_silver ?? 15,
        markup_gold: service.markup_gold ?? 12,
        markup_diamond: service.markup_diamond ?? 10,
        is_active: service.is_active,
        sort_order: service.sort_order,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.service_type_id || !formData.name) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (serviceMode === 'api' && !formData.external_service_id) {
      toast.error('Vui lòng nhập ID dịch vụ từ API');
      return;
    }

    try {
      // Remove fields that don't exist in database
      const { has_drip_feed, ...cleanData } = formData;
      
      const dataToSave = {
        ...cleanData,
        category_id: cleanData.category_id || null, // Convert empty string to null
        service_type_id: cleanData.service_type_id || null, // Convert empty string to null
        external_service_id: serviceMode === 'manual' ? 0 : cleanData.external_service_id,
      };

      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...dataToSave });
        toast.success('Đã cập nhật dịch vụ');
      } else {
        await createService.mutateAsync(dataToSave);
        toast.success('Đã tạo dịch vụ mới');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi lưu dịch vụ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    
    try {
      await deleteService.mutateAsync(id);
      toast.success('Đã xóa dịch vụ');
    } catch (error) {
      toast.error('Lỗi khi xóa dịch vụ');
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncServices.mutateAsync();
      toast.success(`Đã đồng bộ ${result.count} dịch vụ từ API`);
    } catch (error: any) {
      toast.error(`Lỗi đồng bộ: ${error.message}`);
    }
  };

  const handleSyncSingle = async (externalServiceId: number) => {
    if (!externalServiceId) {
      toast.error('Dịch vụ này không có ID từ provider');
      return;
    }
    setSyncingServiceId(externalServiceId);
    try {
      await syncSingleService.mutateAsync(externalServiceId);
      toast.success('Đã cập nhật dịch vụ từ provider');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setSyncingServiceId(null);
    }
  };

  const getSellingPrice = (rate: number, markup: number) => {
    return rate * (1 + markup / 100);
  };

  if (isLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
            Dịch vụ SMM
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Quản lý các dịch vụ SMM Panel</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Nhập từ API</span>
            <span className="sm:hidden">Nhập</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncServices.isPending} className="flex-1 sm:flex-none">
            <RefreshCw className={`w-4 h-4 mr-1 ${syncServices.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Đồng bộ</span>
            <span className="sm:hidden">Sync</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Thêm dịch vụ</span>
                <span className="sm:hidden">Thêm</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Platform */}
                <div className="space-y-2">
                  <Label>Nền tảng</Label>
                  <Select
                    value={formPlatformId}
                    onValueChange={(value) => {
                      setFormPlatformId(value);
                      setFormData({ ...formData, service_type_id: null });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nền tảng" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.filter(p => p.is_active).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Type */}
                <div className="space-y-2">
                  <Label>Loại dịch vụ</Label>
                  <Select
                    value={formData.service_type_id || ''}
                    onValueChange={(value) => setFormData({ ...formData, service_type_id: value })}
                    disabled={!formPlatformId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formPlatformId ? "Chọn loại dịch vụ" : "Chọn nền tảng trước"} />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes
                        .filter(st => st.platform_id === formPlatformId && st.is_active)
                        .map((st) => (
                          <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Name */}
                <div className="space-y-2">
                  <Label>Tên dịch vụ</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Facebook Page Likes"
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label>Giá (USD/1000)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    placeholder="Price"
                  />
                </div>

                {/* Status & Drip Feed */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <span className="text-sm">{formData.is_active ? 'Hiển thị' : 'Ẩn'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Drip Feed</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch
                        checked={formData.has_drip_feed}
                        onCheckedChange={(checked) => setFormData({ ...formData, has_drip_feed: checked })}
                      />
                      <span className="text-sm">{formData.has_drip_feed ? 'Bật' : 'Tắt'}</span>
                    </div>
                  </div>
                </div>

                {/* Manual/API Tabs */}
                <Tabs value={serviceMode} onValueChange={(v) => setServiceMode(v as 'manual' | 'api')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Thủ công</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Số lượng tối thiểu</Label>
                        <Input
                          type="number"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số lượng tối đa</Label>
                        <Input
                          type="number"
                          value={formData.max_quantity}
                          onChange={(e) => setFormData({ ...formData, max_quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="api" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Nhà cung cấp API</Label>
                      <Select defaultValue={smmConfigs.length > 0 ? smmConfigs[0].id : undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà cung cấp" />
                        </SelectTrigger>
                        <SelectContent>
                          {smmConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.api_domain} {config.is_active ? '(Active)' : ''}
                            </SelectItem>
                          ))}
                          {smmConfigs.length === 0 && (
                            <SelectItem value="none" disabled>Chưa có nhà cung cấp</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>ID dịch vụ</Label>
                      <Input
                        type="number"
                        value={formData.external_service_id}
                        onChange={(e) => setFormData({ ...formData, external_service_id: parseInt(e.target.value) || 0 })}
                        placeholder="API Service Id"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Số lượng tối thiểu</Label>
                        <Input
                          type="number"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số lượng tối đa</Label>
                        <Input
                          type="number"
                          value={formData.max_quantity}
                          onChange={(e) => setFormData({ ...formData, max_quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Loại dịch vụ</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Default">Default</SelectItem>
                          <SelectItem value="Custom Comments">Custom Comments</SelectItem>
                          <SelectItem value="Comment Likes">Comment Likes</SelectItem>
                          <SelectItem value="Mentions">Mentions</SelectItem>
                          <SelectItem value="Mentions Hashtag">Mentions Hashtag</SelectItem>
                          <SelectItem value="Package">Package</SelectItem>
                          <SelectItem value="Special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Refill</Label>
                      <Select
                        value={formData.has_refill ? 'on' : 'off'}
                        onValueChange={(value) => setFormData({ ...formData, has_refill: value === 'on' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="on">On</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* VIP Pricing */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-base font-semibold">Giá theo hạng VIP ($/1000)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Member ($)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.markup_member}
                        onChange={(e) => setFormData({ ...formData, markup_member: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bronze ($)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.markup_bronze}
                        onChange={(e) => setFormData({ ...formData, markup_bronze: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Silver ($)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.markup_silver}
                        onChange={(e) => setFormData({ ...formData, markup_silver: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Gold ($)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.markup_gold}
                        onChange={(e) => setFormData({ ...formData, markup_gold: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Diamond ($)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.markup_diamond}
                        onChange={(e) => setFormData({ ...formData, markup_diamond: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Mô tả dịch vụ</Label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Mô tả chi tiết dịch vụ"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave}>
                  Thêm Ngay
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nhập dịch vụ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nhà cung cấp API</Label>
              {smmConfigs.length > 0 ? (
                <Select defaultValue={smmConfigs.find(c => c.is_active)?.id || smmConfigs[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {smmConfigs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.api_domain.replace('https://', '').replace('http://', '')}
                        {config.is_active && ' (Active)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  Chưa cấu hình nhà cung cấp SMM. Vui lòng cấu hình trong mục <strong>SMM Config</strong>.
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Đóng
              </Button>
              <Button 
                onClick={() => {
                  handleSync();
                  setIsImportDialogOpen(false);
                }}
                disabled={smmConfigs.length === 0 || syncServices.isPending}
              >
                {syncServices.isPending ? 'Đang đồng bộ...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedServiceType || "all"} onValueChange={(v) => setSelectedServiceType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả loại dịch vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại dịch vụ</SelectItem>
            {serviceTypes.map((st) => (
              <SelectItem key={st.id} value={st.id}>{st.name} ({st.platform?.name})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredServices.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-2">{service.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {service.external_service_id || 'Manual'} • {service.category?.name}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                  service.is_active 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {service.is_active ? 'Hiển thị' : 'Ẩn'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <div className="text-muted-foreground">Giá gốc</div>
                  <div className="font-medium">${service.rate.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Giá bán</div>
                  <div className="font-medium">${getSellingPrice(service.rate, service.markup_percent).toFixed(4)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <div className="text-muted-foreground">Min/Max</div>
                  <div className="font-medium">{service.min_quantity}/{service.max_quantity}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Thời gian TB</div>
                  <div className="font-medium">
                    {avgTimes[service.id] || service.processing_time || '-'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {service.external_service_id > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSyncSingle(service.external_service_id)}
                    disabled={syncingServiceId === service.external_service_id}
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingServiceId === service.external_service_id ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(service)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(service.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có dịch vụ nào
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Danh sách dịch vụ ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tên dịch vụ</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá gốc</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>Thời gian TB</TableHead>
                <TableHead>Bảo hành</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-mono text-sm">{service.external_service_id || 'Manual'}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{service.name}</TableCell>
                  <TableCell>{service.category?.name}</TableCell>
                  <TableCell>${service.rate.toFixed(4)}</TableCell>
                  <TableCell className="font-medium">
                    ${getSellingPrice(service.rate, service.markup_percent).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {service.min_quantity} - {service.max_quantity}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {avgTimes[service.id] || service.processing_time || '-'}
                  </TableCell>
                  <TableCell>
                    {service.has_refill ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Có</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">Không</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {service.is_active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {service.external_service_id > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSyncSingle(service.external_service_id)}
                          disabled={syncingServiceId === service.external_service_id}
                          title="Đồng bộ từ provider"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncingServiceId === service.external_service_id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Không có dịch vụ nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSmmServices;
