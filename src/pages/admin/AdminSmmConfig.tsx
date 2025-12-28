import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings, RefreshCw, Wallet, CheckCircle, XCircle, Plus, Server, Activity, AlertCircle } from 'lucide-react';
import { useSmmConfig, useUpdateSmmConfig, useSmmApiCall } from '@/hooks/useSmm';

const AdminSmmConfig = () => {
  const { data: config, isLoading } = useSmmConfig();
  const updateConfig = useUpdateSmmConfig();
  const apiCall = useSmmApiCall();
  
  const [formData, setFormData] = useState({
    api_domain: '',
    api_key: '',
    is_active: true,
  });
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        api_domain: config.api_domain,
        api_key: config.api_key,
        is_active: config.is_active,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!formData.api_domain || !formData.api_key) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      await updateConfig.mutateAsync({
        id: config?.id,
        ...formData,
      });
      toast.success('Đã lưu cấu hình SMM');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình');
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    try {
      const result = await apiCall.mutateAsync({ action: 'balance' });
      toast.success(`Kết nối thành công! Số dư: ${result.balance} ${result.currency}`);
    } catch (error: any) {
      toast.error(`Lỗi kết nối: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      const result = await apiCall.mutateAsync({ action: 'balance' });
      toast.success(`Số dư: ${result.balance} ${result.currency}`);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  // Stats
  const stats = {
    total: config ? 1 : 0,
    active: config?.is_active ? 1 : 0,
    inactive: config && !config.is_active ? 1 : 0,
  };

  if (isLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
            Cấu hình SMM API
          </h1>
          <p className="text-sm text-muted-foreground">Quản lý nhà cung cấp SMM Panel API</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Thêm Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{config ? 'Cập nhật Provider' : 'Thêm Provider mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_domain">Domain API</Label>
                <Input
                  id="api_domain"
                  placeholder="https://example.com"
                  value={formData.api_domain}
                  onChange={(e) => setFormData({ ...formData, api_domain: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Ví dụ: https://1dg.me (không cần /api/v2)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Nhập API key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Kích hoạt</Label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-primary/10 rounded-full">
                <Server className="w-4 h-4 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Tổng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Activity className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Hoạt động</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold text-red-600">{stats.inactive}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Tắt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Info */}
      {config ? (
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Wallet className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <CardTitle className="text-base md:text-lg">Thông tin Provider</CardTitle>
                  <CardDescription className="text-xs md:text-sm break-all">{config.api_domain}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTestApi} disabled={isTestingApi} className="flex-1 sm:flex-none">
                  {isTestingApi ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Test API
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)} className="flex-1 sm:flex-none">
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-2 md:pt-2 space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Số dư</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl md:text-2xl font-bold">
                    {typeof config.balance === 'number' ? config.balance.toFixed(4) : '0.0000'} {config.currency || 'USD'}
                  </p>
                  <Button variant="ghost" size="icon" onClick={handleRefreshBalance} className="h-8 w-8">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Trạng thái</p>
                <div className="flex items-center gap-2">
                  {config.is_active ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-base md:text-lg font-medium text-green-600">Đang hoạt động</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-base md:text-lg font-medium text-red-600">Đã tắt</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {config.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Đồng bộ lần cuối: {new Date(config.last_sync_at).toLocaleString('vi-VN')}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 md:py-12">
            <div className="text-center">
              <Server className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium mb-2">Chưa có Provider nào</h3>
              <p className="text-sm text-muted-foreground mb-4">Thêm SMM Provider để bắt đầu</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm Provider
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSmmConfig;
