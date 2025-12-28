import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Palette, Package, ShoppingCart, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link, Navigate } from 'react-router-dom';
import { useDateFormat } from '@/hooks/useDateFormat';

export default function DesignManagerDashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if user is a design manager
  const { data: isManager, isLoading: checkingManager } = useQuery({
    queryKey: ['is-design-manager', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('design_managers')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch all design orders
  const { data: orders } = useQuery({
    queryKey: ['manager-design-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select(`
          *,
          service:design_services!design_orders_service_id_fkey(id, name),
          seller:sellers!design_orders_seller_id_fkey(id, shop_name, shop_slug)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isManager === true,
  });

  // Fetch all design services
  const { data: services } = useQuery({
    queryKey: ['manager-design-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_services')
        .select(`
          *,
          seller:sellers!design_services_seller_id_fkey(id, shop_name),
          category:design_categories!design_services_category_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isManager === true,
  });

  if (checkingManager) {
    return (
      <Layout>
        <div className="container py-8 text-center">Đang kiểm tra quyền truy cập...</div>
      </Layout>
    );
  }

  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  const filteredOrders = orders?.filter(order =>
    statusFilter === 'all' || order.status === statusFilter
  );

  // Stats
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
  const disputedOrders = orders?.filter(o => o.status === 'disputed').length || 0;
  const totalServices = services?.length || 0;

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Chờ nhận', variant: 'secondary' },
    in_progress: { label: 'Đang thực hiện', variant: 'default' },
    revision: { label: 'Chờ chỉnh sửa', variant: 'outline' },
    delivered: { label: 'Đã giao', variant: 'default' },
    completed: { label: 'Hoàn thành', variant: 'default' },
    disputed: { label: 'Tranh chấp', variant: 'destructive' },
    cancelled: { label: 'Đã hủy', variant: 'destructive' },
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quản lý Thiết kế</h1>
            <p className="text-muted-foreground">Dashboard quản lý dịch vụ thiết kế</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <ShoppingCart className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Package className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dịch vụ</p>
                <p className="text-2xl font-bold">{totalServices}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <CheckCircle className="h-10 w-10 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chờ nhận</p>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Tranh chấp</p>
                <p className="text-2xl font-bold">{disputedOrders}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Dịch vụ</TableHead>
                      <TableHead>Designer</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">Không có đơn hàng</TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders?.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.order_number}</TableCell>
                          <TableCell>{order.service?.name}</TableCell>
                          <TableCell>{order.seller?.shop_name}</TableCell>
                          <TableCell className="font-medium">{formatPrice(order.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusMap[order.status]?.variant || 'secondary'}>
                              {statusMap[order.status]?.label || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/design/order/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dịch vụ</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Đơn hoàn thành</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">Không có dịch vụ</TableCell>
                      </TableRow>
                    ) : (
                      services?.map((service: any) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{service.seller?.shop_name}</TableCell>
                          <TableCell>{service.category?.name}</TableCell>
                          <TableCell>{formatPrice(service.price)}</TableCell>
                          <TableCell>{service.completed_orders}/{service.total_orders}</TableCell>
                          <TableCell>
                            <Badge variant={service.is_active ? 'default' : 'secondary'}>
                              {service.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/design/service/${service.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
