import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Loader2, Send, Eye, EyeOff, Lock, Unlock, CheckCircle, Clock, 
  AlertTriangle, FileText, History 
} from 'lucide-react';
import { useSellerHandovers, useCreateHandover, useHandoverAuditLogs, AccountHandover } from '@/hooks/useAccountHandover';
import { Seller, SellerOrder } from '@/hooks/useMarketplace';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerHandoverManagerProps {
  seller: Seller;
  orders?: SellerOrder[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ gửi', color: 'bg-yellow-500' },
  delivered: { label: 'Đã gửi', color: 'bg-blue-500' },
  received: { label: 'Đã nhận', color: 'bg-green-500' },
  completed: { label: 'Hoàn tất', color: 'bg-green-600' },
  disputed: { label: 'Tranh chấp', color: 'bg-red-500' },
};

export const SellerHandoverManager = ({ seller, orders }: SellerHandoverManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    account_id: '',
    account_password: '',
    email_account: '',
    email_password: '',
    recovery_info: '',
  });

  const { data: handovers, isLoading } = useSellerHandovers(seller.id);
  const createHandover = useCreateHandover();

  // Orders that need handover (paid/delivered but no handover created)
  const ordersNeedingHandover = orders?.filter(order => 
    ['paid', 'delivered'].includes(order.status) &&
    !handovers?.some(h => h.order_id === order.id)
  ) || [];

  const handleCreateHandover = () => {
    if (!selectedOrder) return;

    if (!formData.account_id || !formData.account_password) {
      toast.error('Vui lòng nhập ID và mật khẩu tài khoản');
      return;
    }

    createHandover.mutate({
      order_id: selectedOrder.id,
      seller_id: seller.id,
      buyer_id: selectedOrder.buyer_id,
      account_id: formData.account_id,
      account_password: formData.account_password,
      email_account: formData.email_account || undefined,
      email_password: formData.email_password || undefined,
      recovery_info: formData.recovery_info || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedOrder(null);
        setFormData({
          account_id: '',
          account_password: '',
          email_account: '',
          email_password: '',
          recovery_info: '',
        });
      },
    });
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bàn giao tài khoản</h3>
          <p className="text-sm text-muted-foreground">
            Quản lý việc bàn giao thông tin tài khoản cho người mua
          </p>
        </div>
      </div>

      {/* Orders needing handover */}
      {ordersNeedingHandover.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Đơn hàng cần bàn giao ({ordersNeedingHandover.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ordersNeedingHandover.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {(order.product as { title: string })?.title}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Bàn giao
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handover list */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ nhận</TabsTrigger>
          <TabsTrigger value="completed">Hoàn tất</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {handovers?.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                Chưa có bàn giao nào
              </CardContent>
            </Card>
          ) : (
            handovers?.map(handover => (
              <HandoverCard
                key={handover.id}
                handover={handover}
                showPasswords={showPasswords}
                togglePassword={togglePassword}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {handovers?.filter(h => ['delivered', 'received'].includes(h.status)).map(handover => (
            <HandoverCard
              key={handover.id}
              handover={handover}
              showPasswords={showPasswords}
              togglePassword={togglePassword}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {handovers?.filter(h => h.status === 'completed').map(handover => (
            <HandoverCard
              key={handover.id}
              handover={handover}
              showPasswords={showPasswords}
              togglePassword={togglePassword}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Create handover dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bàn giao tài khoản</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="font-medium">{selectedOrder.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedOrder.product as { title: string })?.title}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>ID tài khoản *</Label>
              <Input
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                placeholder="Nhập ID/Username"
              />
            </div>

            <div className="space-y-2">
              <Label>Mật khẩu tài khoản *</Label>
              <Input
                type="password"
                value={formData.account_password}
                onChange={(e) => setFormData(prev => ({ ...prev, account_password: e.target.value }))}
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div className="space-y-2">
              <Label>Email đăng ký (nếu có)</Label>
              <Input
                value={formData.email_account}
                onChange={(e) => setFormData(prev => ({ ...prev, email_account: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Mật khẩu email</Label>
              <Input
                type="password"
                value={formData.email_password}
                onChange={(e) => setFormData(prev => ({ ...prev, email_password: e.target.value }))}
                placeholder="Mật khẩu email"
              />
            </div>

            <div className="space-y-2">
              <Label>Thông tin khôi phục</Label>
              <Textarea
                value={formData.recovery_info}
                onChange={(e) => setFormData(prev => ({ ...prev, recovery_info: e.target.value }))}
                placeholder="Mã khôi phục, câu hỏi bảo mật, số điện thoại..."
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCreateHandover}
              disabled={createHandover.isPending}
            >
              {createHandover.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Gửi thông tin bàn giao
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface HandoverCardProps {
  handover: AccountHandover;
  showPasswords: Record<string, boolean>;
  togglePassword: (id: string) => void;
}

const HandoverCard = ({ handover, showPasswords, togglePassword }: HandoverCardProps) => {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const { data: auditLogs } = useHandoverAuditLogs(showAuditLog ? handover.id : undefined);
  const { formatDateTime } = useDateFormat();
  const status = statusLabels[handover.status] || statusLabels.pending;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{handover.order?.order_number}</p>
              <Badge className={status.color}>{status.label}</Badge>
              {handover.is_locked && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {handover.order?.product?.title}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAuditLog(!showAuditLog)}
          >
            <History className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">ID tài khoản</Label>
            <p className="font-mono">{handover.account_id}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Mật khẩu</Label>
            <div className="flex items-center gap-1">
              <p className="font-mono">
                {showPasswords[handover.id] ? handover.account_password : '••••••••'}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => togglePassword(handover.id)}
              >
                {showPasswords[handover.id] ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          {handover.email_account && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-mono text-xs">{handover.email_account}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mật khẩu email</Label>
                <p className="font-mono">
                  {showPasswords[`${handover.id}-email`] ? handover.email_password : '••••••••'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Checklist progress */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center gap-4 text-xs">
            <span className={`flex items-center gap-1 ${handover.checklist_data?.changed_password ? 'text-green-500' : 'text-muted-foreground'}`}>
              <CheckCircle className="h-3 w-3" /> Đổi MK
            </span>
            <span className={`flex items-center gap-1 ${handover.checklist_data?.changed_email ? 'text-green-500' : 'text-muted-foreground'}`}>
              <CheckCircle className="h-3 w-3" /> Đổi Email
            </span>
            <span className={`flex items-center gap-1 ${handover.checklist_data?.added_2fa ? 'text-green-500' : 'text-muted-foreground'}`}>
              <CheckCircle className="h-3 w-3" /> 2FA
            </span>
            <span className={`flex items-center gap-1 ${handover.checklist_data?.verified_info ? 'text-green-500' : 'text-muted-foreground'}`}>
              <CheckCircle className="h-3 w-3" /> Xác nhận
            </span>
          </div>
        </div>

        {/* Audit log */}
        {showAuditLog && auditLogs && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs font-medium mb-2">Lịch sử hoạt động</p>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {auditLogs.map(log => (
                  <div key={log.id} className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {formatDateTime(log.created_at, 'dd/MM HH:mm')}
                    </span>
                    <Badge variant="outline" className="text-xs">{log.actor_type}</Badge>
                    <span>{log.action}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerHandoverManager;
