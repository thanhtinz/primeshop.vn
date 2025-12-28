import { useOutletContext, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  History, Wallet, Send, ArrowDownLeft, ArrowUpRight, 
  ChevronLeft, ChevronRight, Filter, Copy, CheckCircle2,
  Search, Loader2, CreditCard, Gamepad2, Palette, Crown, ShoppingCart
} from 'lucide-react';
import { useWalletBalance, useWalletTransactions, useCreateP2PTransfer, useSearchUsers } from '@/hooks/useWallet';
import { useOrdersByEmail } from '@/hooks/useOrders';
import { useBuyerDesignOrders } from '@/hooks/useDesignServices';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Hook for buyer's game account orders
const useBuyerGameOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['buyer-game-orders-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('seller_orders')
        .select(`*, product:seller_products(title)`)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
interface SettingsContext {
  t: (key: string) => string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  note?: string;
  created_at: string;
  reference_id?: string;
  sender_id?: string;
  recipient_id?: string;
}

const ITEMS_PER_PAGE = 10;

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'transfer_in':
    case 'transfer_out':
      return <Send className="h-4 w-4" />;
    case 'deposit':
      return <ArrowDownLeft className="h-4 w-4" />;
    case 'payment':
      return <ArrowUpRight className="h-4 w-4" />;
    case 'order_topup':
    case 'order_premium':
      return <CreditCard className="h-4 w-4" />;
    case 'order_game':
      return <Gamepad2 className="h-4 w-4" />;
    case 'order_design':
      return <Palette className="h-4 w-4" />;
    default:
      return <Wallet className="h-4 w-4" />;
  }
};

const getTransactionLabel = (type: string) => {
  const labels: Record<string, string> = {
    transfer_in: 'Nhận tiền',
    transfer_out: 'Chuyển tiền',
    deposit: 'Nạp tiền',
    withdraw: 'Rút tiền',
    payment: 'Thanh toán',
    refund: 'Hoàn tiền',
    commission: 'Hoa hồng',
    reward: 'Thưởng',
    order_topup: 'Nạp game',
    order_premium: 'Premium',
    order_game: 'Mua Account',
    order_design: 'Thiết kế',
  };
  return labels[type] || type;
};

const isIncomingTransaction = (type: string) => {
  return ['transfer_in', 'deposit', 'refund', 'commission', 'reward'].includes(type);
};

const TransactionItem = ({ 
  transaction, 
  formatPrice,
  onClick 
}: { 
  transaction: Transaction; 
  formatPrice: (n: number) => string;
  onClick: () => void;
}) => {
  const { formatDateTime } = useDateFormat();
  const isIncoming = isIncomingTransaction(transaction.type);

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
        isIncoming ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
      )}>
        {getTransactionIcon(transaction.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{getTransactionLabel(transaction.type)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(transaction.created_at)}
        </p>
        {transaction.note && (
          <p className="text-xs text-muted-foreground truncate">{transaction.note}</p>
        )}
      </div>
      
      <div className="text-right flex-shrink-0">
        <p className={cn(
          "font-semibold text-sm",
          isIncoming ? 'text-green-500' : 'text-red-500'
        )}>
          {isIncoming ? '+' : '-'}{formatPrice(Math.abs(transaction.amount))}
        </p>
        <Badge 
          variant={transaction.status === 'completed' ? 'default' : 'secondary'} 
          className="text-[10px] px-1.5"
        >
          {transaction.status === 'completed' ? 'Thành công' : transaction.status}
        </Badge>
      </div>
    </div>
  );
};

const TransactionDetailDialog = ({
  transaction,
  open,
  onClose,
  formatPrice
}: {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  formatPrice: (n: number) => string;
}) => {
  const [copied, setCopied] = useState(false);
  const { formatDateTime } = useDateFormat();

  if (!transaction) return null;

  const isIncoming = isIncomingTransaction(transaction.type);

  const copyId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    toast.success('Đã sao chép mã giao dịch');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Chi tiết giao dịch</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center py-4">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3",
              isIncoming ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            )}>
              {getTransactionIcon(transaction.type)}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              isIncoming ? 'text-green-500' : 'text-red-500'
            )}>
              {isIncoming ? '+' : '-'}{formatPrice(Math.abs(transaction.amount))}
            </p>
            <Badge 
              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {transaction.status === 'completed' ? 'Thành công' : transaction.status}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Loại giao dịch</span>
              <span className="font-medium">{getTransactionLabel(transaction.type)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Thời gian</span>
              <span className="font-medium">
                {formatDateTime(transaction.created_at, 'HH:mm:ss dd/MM/yyyy')}
              </span>
            </div>

            {transaction.note && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Nội dung</span>
                <span className="font-medium text-right max-w-[60%]">{transaction.note}</span>
              </div>
            )}

            {transaction.reference_id && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Mã tham chiếu</span>
                <span className="font-medium font-mono text-xs">
                  {transaction.reference_id.slice(0, 8)}...
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Mã giao dịch</span>
              <button
                onClick={copyId}
                className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
              >
                {transaction.id.slice(0, 8)}...
                {copied ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Transfer Dialog Component
const TransferDialog = ({ formatPrice, balance }: { formatPrice: (n: number) => string; balance: number }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(searchQuery);
  const transfer = useCreateP2PTransfer();

  const handleTransfer = async () => {
    if (!selectedUser || !amount) return;
    
    await transfer.mutateAsync({
      recipientUsername: selectedUser.username || selectedUser.email,
      amount: Number(amount),
      message: message || undefined
    });
    
    setOpen(false);
    setSelectedUser(null);
    setAmount('');
    setMessage('');
    setSearchQuery('');
  };

  const resetDialog = () => {
    setSelectedUser(null);
    setAmount('');
    setMessage('');
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button size="icon" className="h-8 w-8" title="Chuyển tiền">
          <Send className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Chuyển tiền</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Recipient search */}
          {!selectedUser ? (
            <div className="space-y-2">
              <Label>Tìm người nhận</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Nhập username hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              
              {searchResults.length > 0 && (
                <ScrollArea className="max-h-48">
                  <div className="border rounded-lg divide-y">
                    {searchResults.map((user: any) => (
                      <button
                        key={user.user_id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="text-xs">{user.full_name?.[0] || user.username?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{user.full_name || user.username}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Không tìm thấy người dùng</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="text-xs">{selectedUser.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{selectedUser.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Đổi
              </Button>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Số tiền</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Số dư: {formatPrice(balance)}</p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Lời nhắn (tùy chọn)</Label>
            <Input
              placeholder="Nhập lời nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} size="sm">Hủy</Button>
          <Button 
            onClick={handleTransfer}
            disabled={!selectedUser || !amount || Number(amount) <= 0 || Number(amount) > balance || transfer.isPending}
            size="sm"
          >
            {transfer.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Chuyển {amount ? formatPrice(Number(amount)) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SettingsHistoryPage() {
  const { t } = useOutletContext<SettingsContext>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: walletTransactions = [], isLoading: transactionsLoading } = useWalletTransactions();
  
  // Fetch order data
  const { data: topupOrders = [], isLoading: loadingTopup } = useOrdersByEmail(profile?.email || '');
  const { data: gameOrders = [], isLoading: loadingGame } = useBuyerGameOrders(user?.id);
  const { data: designOrders = [], isLoading: loadingDesign } = useBuyerDesignOrders();
  
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const isLoading = transactionsLoading || loadingTopup || loadingGame || loadingDesign;

  // Merge all transactions
  const allTransactions = useMemo(() => {
    const transactions: Transaction[] = [];

    // Wallet transactions
    walletTransactions.forEach((tx: any) => {
      transactions.push({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        note: tx.note,
        created_at: tx.created_at,
        reference_id: tx.reference_id,
        sender_id: tx.sender_id,
        recipient_id: tx.recipient_id,
      });
    });

    // Topup/Premium orders
    topupOrders.forEach((order: any) => {
      const snapshot = order.product_snapshot;
      const style = snapshot?.product?.style || 'topup';
      const productName = snapshot?.product?.name || 'Sản phẩm';
      const packageName = snapshot?.selectedPackage?.name;
      
      transactions.push({
        id: `order-${order.id}`,
        type: style === 'premium' ? 'order_premium' : 'order_topup',
        amount: -(order.total_amount || 0),
        status: order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'paid' ? 'completed' : order.status?.toLowerCase(),
        note: packageName ? `${productName} - ${packageName}` : productName,
        created_at: order.created_at,
        reference_id: order.order_number,
      });
    });

    // Game account orders
    gameOrders.forEach((order: any) => {
      transactions.push({
        id: `game-${order.id}`,
        type: 'order_game',
        amount: -(order.amount || 0),
        status: order.status === 'completed' || order.status === 'delivered' ? 'completed' : order.status,
        note: order.product?.title || 'Mua account game',
        created_at: order.created_at,
        reference_id: order.order_number,
      });
    });

    // Design orders
    designOrders.forEach((order: any) => {
      transactions.push({
        id: `design-${order.id}`,
        type: 'order_design',
        amount: -(order.amount || 0),
        status: order.status === 'completed' ? 'completed' : order.status,
        note: order.service?.name || 'Đặt thiết kế',
        created_at: order.created_at,
        reference_id: order.order_number,
      });
    });

    // Sort by date descending
    return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [walletTransactions, topupOrders, gameOrders, designOrders]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return allTransactions;
    return allTransactions.filter((tx: Transaction) => tx.type === filter);
  }, [allTransactions, filter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('transactionHistory')}
          </CardTitle>
          <CardDescription>{t('viewAllTransactions')}</CardDescription>
        </CardHeader>
      </Card>

      {/* Balance Card - Compact */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Số dư ví</p>
              {balanceLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-lg sm:text-2xl font-bold text-primary truncate">{formatPrice(balance)}</p>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <TransferDialog formatPrice={formatPrice} balance={balance} />
              <Button size="icon" variant="outline" className="h-8 w-8" title="Nạp tiền" onClick={() => navigate('/settings/deposit')}>
                <ArrowDownLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Giao dịch ({filteredTransactions.length})
            </CardTitle>
            <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="payment">Thanh toán</SelectItem>
                <SelectItem value="deposit">Nạp tiền</SelectItem>
                <SelectItem value="transfer_in">Nhận tiền</SelectItem>
                <SelectItem value="transfer_out">Chuyển tiền</SelectItem>
                <SelectItem value="refund">Hoàn tiền</SelectItem>
                <SelectItem value="order_topup">Nạp game</SelectItem>
                <SelectItem value="order_premium">Premium</SelectItem>
                <SelectItem value="order_game">Mua Account</SelectItem>
                <SelectItem value="order_design">Thiết kế</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {paginatedTransactions.map((tx: Transaction) => (
                  <TransactionItem 
                    key={tx.id} 
                    transaction={tx} 
                    formatPrice={formatPrice}
                    onClick={() => setSelectedTransaction(tx)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        formatPrice={formatPrice}
      />
    </div>
  );
}
