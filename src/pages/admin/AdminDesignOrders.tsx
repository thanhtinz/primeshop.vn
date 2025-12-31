import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Palette, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rpc } from '@/lib/api-client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'react-router-dom';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_accept: { label: 'Chờ nhận', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  revision_requested: { label: 'Chờ chỉnh sửa', variant: 'outline' },
  delivered: { label: 'Đã giao', variant: 'default' },
  pending_confirm: { label: 'Chờ xác nhận', variant: 'outline' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  disputed: { label: 'Tranh chấp', variant: 'destructive' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

const escrowMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ thanh toán', variant: 'secondary' },
  holding: { label: 'Đang giữ', variant: 'outline' },
  released: { label: 'Đã thanh toán', variant: 'default' },
  refunded: { label: 'Đã hoàn', variant: 'destructive' },
};

export default function AdminDesignOrders() {
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [escrowFilter, setEscrowFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [resolution, setResolution] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-design-orders'],
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
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: string; action: 'seller' | 'buyer' }) => {
      // Use RPC function to properly handle money transfer
      const { data, error } = await rpc('resolve_design_dispute', {
        p_order_id: orderId,
        p_action: action,
        p_resolution_notes: resolution || null
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể xử lý tranh chấp');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-design-orders'] });
      toast.success('Đã xử lý tranh chấp và chuyển tiền thành công');
      setSelectedOrder(null);
      setResolution('');
    },
    onError: (error: Error) => toast.error(error.message || 'Lỗi xử lý tranh chấp'),
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesEscrow = escrowFilter === 'all' || order.escrow_status === escrowFilter;
    return matchesSearch && matchesStatus && matchesEscrow;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng thiết kế</h1>
          <p className="text-muted-foreground">Quản lý tất cả đơn hàng dịch vụ thiết kế</p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(statusMap).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={escrowFilter} onValueChange={setEscrowFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Thanh toán" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(escrowMap).map(([key, { label }]) => (
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
                <TableHead>Seller</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Không tìm thấy đơn hàng</TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_number}</TableCell>
                    <TableCell>{order.service?.name}</TableCell>
                    <TableCell>
                      <Link to={`/shops/${order.seller?.shop_slug}`} className="text-primary hover:underline">
                        {order.seller?.shop_name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(order.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[order.status]?.variant || 'secondary'}>
                        {statusMap[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={escrowMap[order.escrow_status]?.variant || 'secondary'}>
                        {escrowMap[order.escrow_status]?.label || order.escrow_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {order.status === 'disputed' && (
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <AlertCircle className="h-4 w-4 mr-1" /> Xử lý
                        </Button>
                      )}
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

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xử lý tranh chấp #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Lý do tranh chấp:</p>
              <p className="text-sm text-muted-foreground">{selectedOrder?.dispute_reason || 'Không có lý do'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú xử lý</label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Nhập ghi chú xử lý..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => resolveMutation.mutate({ orderId: selectedOrder.id, action: 'buyer' })}
              >
                Hoàn tiền Buyer
              </Button>
              <Button
                className="flex-1"
                onClick={() => resolveMutation.mutate({ orderId: selectedOrder.id, action: 'seller' })}
              >
                Thanh toán Seller
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
