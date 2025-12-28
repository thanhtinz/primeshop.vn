import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useInventoryGroups, 
  useCreateInventoryGroup,
  useUpdateInventoryGroup,
  useDeleteInventoryGroup,
  useInventoryAlerts,
  useMarkAlertRead,
  useProductsWithInventory,
  type InventoryGroup 
} from '@/hooks/useInventoryManagement';
import { Package, Plus, FolderOpen, AlertTriangle, TrendingUp, DollarSign, Clock, Edit, Trash2 } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerInventoryManagerProps {
  sellerId: string;
}

export const SellerInventoryManager = ({ sellerId }: SellerInventoryManagerProps) => {
  const { data: groups, isLoading: isLoadingGroups } = useInventoryGroups(sellerId);
  const { data: alerts, isLoading: isLoadingAlerts } = useInventoryAlerts(sellerId);
  const { data: inventoryData } = useProductsWithInventory(sellerId);
  const createGroup = useCreateInventoryGroup();
  const updateGroup = useUpdateInventoryGroup();
  const deleteGroup = useDeleteInventoryGroup();
  const markAlertRead = useMarkAlertRead();
  const { formatDateTime } = useDateFormat();

  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<InventoryGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGroup) {
      await updateGroup.mutateAsync({
        id: editingGroup.id,
        ...groupFormData
      });
    } else {
      await createGroup.mutateAsync({
        seller_id: sellerId,
        name: groupFormData.name,
        description: groupFormData.description,
        color: groupFormData.color,
        icon: 'folder'
      });
    }
    
    setIsGroupDialogOpen(false);
    resetGroupForm();
  };

  const resetGroupForm = () => {
    setGroupFormData({ name: '', description: '', color: '#3B82F6' });
    setEditingGroup(null);
  };

  const handleEditGroup = (group: InventoryGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6'
    });
    setIsGroupDialogOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa nhóm này?')) {
      await deleteGroup.mutateAsync(id);
    }
  };

  const unreadAlerts = alerts?.filter(a => !a.is_read) || [];
  const totalInventory = inventoryData?.length || 0;
  const totalCostPrice = inventoryData?.reduce((sum, item) => sum + (item.costPrice || 0), 0) || 0;
  const totalProfit = inventoryData?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng kho</p>
                <p className="text-2xl font-bold">{totalInventory}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng giá vốn</p>
                <p className="text-2xl font-bold">{totalCostPrice.toLocaleString()}đ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng lợi nhuận</p>
                <p className="text-2xl font-bold text-green-600">+{totalProfit.toLocaleString()}đ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cảnh báo</p>
                <p className="text-2xl font-bold">{unreadAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList>
          <TabsTrigger value="groups">Nhóm sản phẩm</TabsTrigger>
          <TabsTrigger value="inventory">Chi tiết kho</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Cảnh báo
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isGroupDialogOpen} onOpenChange={(open) => {
              setIsGroupDialogOpen(open);
              if (!open) resetGroupForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo nhóm
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGroup ? 'Sửa nhóm' : 'Tạo nhóm mới'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tên nhóm</label>
                    <Input
                      value={groupFormData.name}
                      onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                      placeholder="VD: Acc Liên Quân"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mô tả</label>
                    <Textarea
                      value={groupFormData.description}
                      onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                      placeholder="Mô tả nhóm..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Màu sắc</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={groupFormData.color}
                        onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={groupFormData.color}
                        onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={createGroup.isPending || updateGroup.isPending}>
                      {editingGroup ? 'Cập nhật' : 'Tạo nhóm'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingGroups ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : groups && groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: `${group.color}20` }}
                        >
                          <FolderOpen 
                            className="h-5 w-5" 
                            style={{ color: group.color || '#3B82F6' }} 
                          />
                        </div>
                        <div>
                          <CardTitle className="text-base">{group.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {group.productCount || 0} sản phẩm
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditGroup(group)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {group.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có nhóm sản phẩm</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tạo nhóm để quản lý kho hàng tốt hơn
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết kho hàng</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryData && inventoryData.length > 0 ? (
                <div className="space-y-3">
                  {inventoryData.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.title || item.id.slice(0, 8)}...</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            Vốn: {(item.costPrice || 0).toLocaleString()}đ
                          </Badge>
                          {item.source && (
                            <Badge variant="secondary">{item.source}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${(item.profit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(item.profit || 0) > 0 ? '+' : ''}{(item.profit || 0).toLocaleString()}đ
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Giá bán: {(item.price || 0).toLocaleString()}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có dữ liệu kho
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Cảnh báo kho hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <p className="text-muted-foreground">Đang tải...</p>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start justify-between p-4 rounded-lg border ${
                        !alert.is_read ? 'bg-orange-500/10 border-orange-500/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.alert_type === 'low_stock' ? 'text-orange-500' :
                          alert.alert_type === 'stale' ? 'text-yellow-500' :
                          alert.alert_type === 'outdated' ? 'text-red-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {alert.alert_type === 'low_stock' ? 'Sắp hết hàng' :
                             alert.alert_type === 'stale' ? 'Tồn kho lâu' :
                             alert.alert_type === 'outdated' ? 'Có thể lỗi thời' : 'Cảnh báo'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(alert.created_at)}
                          </p>
                        </div>
                      </div>
                      {!alert.is_read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAlertRead.mutate(alert.id)}
                        >
                          Đã đọc
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Không có cảnh báo
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
