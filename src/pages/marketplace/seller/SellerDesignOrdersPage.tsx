import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Palette, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useCurrentSeller } from '@/hooks/useMarketplace';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSellerDesignOrders } from '@/hooks/useDesignServices';
import { Link } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending_accept: { label: 'Chờ nhận', variant: 'secondary', icon: Clock },
  in_progress: { label: 'Đang thực hiện', variant: 'default', icon: Palette },
  revision_requested: { label: 'Chờ chỉnh sửa', variant: 'outline', icon: AlertCircle },
  delivered: { label: 'Đã giao', variant: 'default', icon: CheckCircle },
  pending_confirm: { label: 'Chờ xác nhận', variant: 'outline', icon: Clock },
  completed: { label: 'Hoàn thành', variant: 'default', icon: CheckCircle },
  disputed: { label: 'Tranh chấp', variant: 'destructive', icon: AlertCircle },
  cancelled: { label: 'Đã hủy', variant: 'destructive', icon: AlertCircle },
};

export default function SellerDesignOrdersPage() {
  const { data: seller } = useCurrentSeller();
  const { formatPrice } = useCurrency();
  const { data: orders, isLoading } = useSellerDesignOrders(seller?.id);
  const [statusFilter, setStatusFilter] = useState('all');
  const { formatDate } = useDateFormat();

  const filteredOrders = orders?.filter(order =>
    statusFilter === 'all' || order.status === statusFilter
  );

  // Stats
  const pendingCount = orders?.filter(o => o.status === 'pending_accept').length || 0;
  const inProgressCount = orders?.filter(o => ['in_progress', 'revision_requested'].includes(o.status)).length || 0;
  const completedCount = orders?.filter(o => o.status === 'completed').length || 0;
  const totalEarnings = orders?.filter(o => o.escrow_status === 'released').reduce((acc, o) => acc + o.seller_amount, 0) || 0;
  const pendingEarnings = orders?.filter(o => o.escrow_status === 'holding').reduce((acc, o) => acc + o.seller_amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng thiết kế</h1>
          <p className="text-muted-foreground">Quản lý các đơn hàng dịch vụ thiết kế</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chờ nhận</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Đang làm</p>
                <p className="text-xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Đã nhận</p>
                <p className="text-xl font-bold">{formatPrice(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Đang giữ</p>
                <p className="text-xl font-bold">{formatPrice(pendingEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
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

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Chưa có đơn hàng nào</TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => {
                  const StatusIcon = statusMap[order.status]?.icon || Clock;
                  const daysLeft = order.deadline ? differenceInDays(new Date(order.deadline), new Date()) : null;
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>{order.service?.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatPrice(order.seller_amount)}</div>
                          <div className="text-xs text-muted-foreground">Phí: {formatPrice(order.platform_fee)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.deadline && (
                          <div className={daysLeft !== null && daysLeft < 0 ? 'text-destructive' : ''}>
                            {formatDate(order.deadline)}
                            {daysLeft !== null && (
                              <span className="text-xs ml-1">
                                ({daysLeft >= 0 ? `còn ${daysLeft} ngày` : 'quá hạn'})
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[order.status]?.variant || 'secondary'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusMap[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.escrow_status === 'released' ? 'default' : 'outline'}>
                          {order.escrow_status === 'holding' ? 'Đang giữ' :
                           order.escrow_status === 'released' ? 'Đã nhận' :
                           order.escrow_status === 'refunded' ? 'Đã hoàn' : 'Chờ TT'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/design/order/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
