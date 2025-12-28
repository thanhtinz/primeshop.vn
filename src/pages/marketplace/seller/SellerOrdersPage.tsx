import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  ShoppingCart, ArrowDownToLine, RotateCcw, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { useDeliverOrder, useRefundOrder } from '@/hooks/useMarketplace';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

export default function SellerOrdersPage() {
  const { orders, formatPrice } = useOutletContext<any>();
  const deliverOrder = useDeliverOrder();
  const refundOrder = useRefundOrder();
  const { formatRelative } = useDateFormat();

  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryContent, setDeliveryContent] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const pendingOrders = orders?.filter((o: any) => o.status === 'paid') || [];

  const handleDeliver = async () => {
    if (!selectedOrder || !deliveryContent) {
      toast.error('Vui lòng nhập nội dung giao hàng');
      return;
    }
    try {
      await deliverOrder.mutateAsync({
        orderId: selectedOrder.id,
        deliveryContent
      });
      toast.success('Giao hàng thành công');
      setDeliverDialogOpen(false);
      setDeliveryContent('');
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder || !refundReason.trim()) {
      toast.error('Vui lòng nhập lý do hoàn tiền');
      return;
    }
    try {
      await refundOrder.mutateAsync({
        orderId: selectedOrder.id,
        reason: refundReason
      });
      toast.success('Hoàn tiền thành công');
      setRefundDialogOpen(false);
      setRefundReason('');
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      paid: { label: 'Chờ giao', variant: 'default' },
      delivered: { label: 'Đã giao', variant: 'secondary' },
      completed: { label: 'Hoàn tất', variant: 'outline' },
      refunded: { label: 'Đã hoàn tiền', variant: 'destructive' },
      disputed: { label: 'Tranh chấp', variant: 'destructive' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Đơn hàng</h2>
        <p className="text-muted-foreground">
          {pendingOrders.length > 0 ? `${pendingOrders.length} đơn chờ giao` : 'Không có đơn chờ giao'}
        </p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Card key={order.id} className={order.status === 'paid' ? 'border-amber-500/50 bg-amber-500/5' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {order.product?.images?.[0] ? (
                        <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <h3 className="font-medium mt-1 truncate">{order.product?.title || 'Sản phẩm'}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelative(order.created_at)}
                        </span>
                        <span className="font-bold text-foreground">{formatPrice(order.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {order.status === 'paid' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setSelectedOrder(order); setDeliverDialogOpen(true); }}
                      >
                        <ArrowDownToLine className="h-4 w-4 mr-1" />
                        Giao hàng
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedOrder(order); setRefundDialogOpen(true); }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Hoàn tiền
                      </Button>
                    </div>
                  )}

                  {order.status === 'delivered' && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Chờ xác nhận
                    </Badge>
                  )}

                  {order.status === 'completed' && (
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Hoàn tất
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium mb-2">Chưa có đơn hàng</p>
            <p className="text-sm text-muted-foreground">Đơn hàng sẽ xuất hiện khi có khách mua sản phẩm của bạn</p>
          </CardContent>
        </Card>
      )}

      {/* Deliver Dialog */}
      <Dialog open={deliverDialogOpen} onOpenChange={setDeliverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giao hàng</DialogTitle>
            <DialogDescription>
              Nhập thông tin tài khoản để giao cho khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Nhập thông tin tài khoản (username, password, email...)"
              value={deliveryContent}
              onChange={(e) => setDeliveryContent(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleDeliver} disabled={deliverOrder.isPending}>
              {deliverOrder.isPending ? 'Đang gửi...' : 'Xác nhận giao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn tiền</DialogTitle>
            <DialogDescription>
              Nhập lý do hoàn tiền cho đơn hàng này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Lý do hoàn tiền..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={refundOrder.isPending}>
              {refundOrder.isPending ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}