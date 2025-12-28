import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wallet, Send, ArrowDownLeft, ArrowUpRight, Clock, 
  Search, User, CheckCircle, XCircle, Loader2 
} from 'lucide-react';
import { useWalletBalance, useWalletTransactions, useCreateP2PTransfer, useSearchUsers } from '@/hooks/useWallet';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useAuth } from '@/contexts/AuthContext';

export const WalletTab = () => {
  const { formatPrice } = useCurrency();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: transactions = [], isLoading: transactionsLoading } = useWalletTransactions();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Số dư ví</p>
              {balanceLoading ? (
                <Skeleton className="h-10 w-40" />
              ) : (
                <p className="text-3xl font-bold text-primary">{formatPrice(balance)}</p>
              )}
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <TransferDialog />
            <Button variant="outline" className="flex-1">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Nạp tiền
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lịch sử giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có giao dịch nào</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} userId={user?.id} formatPrice={formatPrice} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TransactionItem = ({ transaction, userId, formatPrice }: any) => {
  const { formatDateTime } = useDateFormat();
  const isIncoming = transaction.type === 'transfer_in' || 
                     transaction.type === 'deposit' || 
                     transaction.type === 'refund' ||
                     transaction.type === 'commission' ||
                     transaction.type === 'reward';
  
  const getIcon = () => {
    switch (transaction.type) {
      case 'transfer_in':
      case 'transfer_out':
        return <Send className="h-4 w-4" />;
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4" />;
      case 'payment':
        return <ArrowUpRight className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (transaction.type) {
      case 'transfer_in': return 'Nhận chuyển khoản';
      case 'transfer_out': return 'Chuyển tiền';
      case 'deposit': return 'Nạp tiền';
      case 'withdraw': return 'Rút tiền';
      case 'payment': return 'Thanh toán';
      case 'refund': return 'Hoàn tiền';
      case 'commission': return 'Hoa hồng';
      case 'reward': return 'Thưởng';
      default: return transaction.type;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          isIncoming ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
        }`}>
          {getIcon()}
        </div>
        <div>
          <p className="font-medium">{getLabel()}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(transaction.created_at)}
          </p>
          {transaction.note && (
            <p className="text-xs text-muted-foreground mt-1">{transaction.note}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isIncoming ? 'text-green-500' : 'text-red-500'}`}>
          {isIncoming ? '+' : ''}{formatPrice(Math.abs(transaction.amount))}
        </p>
        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
          {transaction.status === 'completed' ? 'Thành công' : transaction.status}
        </Badge>
      </div>
    </div>
  );
};

const TransferDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(searchQuery);
  const transfer = useCreateP2PTransfer();
  const { formatPrice } = useCurrency();
  const { balance } = useWalletBalance();

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1">
          <Send className="h-4 w-4 mr-2" />
          Chuyển tiền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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
                <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                  {searchResults.map((user: any) => (
                    <button
                      key={user.user_id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.[0] || user.username?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>{selectedUser.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleTransfer}
            disabled={!selectedUser || !amount || Number(amount) <= 0 || Number(amount) > balance || transfer.isPending}
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

export default WalletTab;
