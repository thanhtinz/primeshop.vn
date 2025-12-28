import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Loader2, Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, 
  XCircle, Zap, TrendingUp, Lock, AlertCircle, RefreshCw, Building2 
} from 'lucide-react';
import { useSellerBalance, useSellerTransactions, useSellerWithdrawals, useCreateFastWithdrawal, useCreateNormalWithdrawal, useTransferToWebBalance } from '@/hooks/useSellerWallet';
import { Seller } from '@/hooks/useMarketplace';
import { useWithdrawalFees } from '@/hooks/useMarketplaceSettings';
import { useDateFormat } from '@/hooks/useDateFormat';

// List of Vietnamese banks
const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VTB', name: 'Vietinbank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'MSB', name: 'MSB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'LPB', name: 'LienVietPostBank' },
  { code: 'VAB', name: 'VietABank' },
  { code: 'BAB', name: 'Bac A Bank' },
  { code: 'AGR', name: 'Agribank' },
  { code: 'MoMo', name: 'Ví MoMo' },
  { code: 'ZaloPay', name: 'ZaloPay' },
  { code: 'VNPay', name: 'VNPay' },
];

// Default withdrawal fees (will be overridden by database settings)
const DEFAULT_NORMAL_FEE_RATE = 0.01; // 1% for normal
const DEFAULT_FAST_FEE_RATE = 0.02; // 2% for fast

interface SellerWalletSectionProps {
  seller: Seller;
}

const transactionTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sale: { label: 'Bán hàng', icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-green-500' },
  fee: { label: 'Phí hệ thống', icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-red-500' },
  withdrawal: { label: 'Rút tiền', icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-orange-500' },
  refund: { label: 'Hoàn tiền', icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-red-500' },
  boost: { label: 'Thuê Boost', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-500' },
  escrow_release: { label: 'Nhận tiền', icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-green-500' },
  escrow_lock: { label: 'Tạm giữ', icon: <Lock className="h-4 w-4" />, color: 'text-yellow-500' },
  dispute_lock: { label: 'Khóa tranh chấp', icon: <Lock className="h-4 w-4" />, color: 'text-red-500' },
  dispute_release: { label: 'Giải phóng', icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-green-500' },
  transfer_to_web: { label: 'Chuyển sang web', icon: <RefreshCw className="h-4 w-4" />, color: 'text-blue-500' },
};

export const SellerWalletSection = ({ seller }: SellerWalletSectionProps) => {
  const { formatDateTime } = useDateFormat();
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [withdrawType, setWithdrawType] = useState<'normal' | 'fast'>('normal');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    phone_number: '',
  });

  const { data: balance, isLoading: balanceLoading } = useSellerBalance(seller.id);
  const { data: transactions, isLoading: transactionsLoading } = useSellerTransactions(seller.id);
  const { data: withdrawals } = useSellerWithdrawals(seller.id);
  const { data: feeSettings } = useWithdrawalFees();
  const createFastWithdrawal = useCreateFastWithdrawal();
  const createNormalWithdrawal = useCreateNormalWithdrawal();
  const transferToWeb = useTransferToWebBalance();

  // Get fee rates from settings or use defaults
  const normalFeeRate = feeSettings?.normalFeeRate ?? DEFAULT_NORMAL_FEE_RATE;
  const fastFeeRate = feeSettings?.fastFeeRate ?? DEFAULT_FAST_FEE_RATE;

  // Calculate fees
  const withdrawAmountNum = Number(withdrawAmount) || 0;
  const feeRate = withdrawType === 'fast' ? fastFeeRate : normalFeeRate;
  const withdrawFee = withdrawAmountNum * feeRate;
  const actualAmount = withdrawAmountNum - withdrawFee;

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (amount > (balance?.available || 0)) {
      toast.error('Số dư không đủ');
      return;
    }

    if (!bankInfo.bank_name || !bankInfo.account_number || !bankInfo.account_name || !bankInfo.phone_number) {
      toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    const onSuccess = () => {
      setWithdrawDialog(false);
      setWithdrawAmount('');
      setBankInfo({ bank_name: '', account_number: '', account_name: '', phone_number: '' });
    };

    if (withdrawType === 'fast') {
      createFastWithdrawal.mutate({ sellerId: seller.id, amount, bankInfo }, { onSuccess });
    } else {
      createNormalWithdrawal.mutate({ sellerId: seller.id, amount, bankInfo }, { onSuccess });
    }
  };

  const handleTransferToWeb = () => {
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (amount > (balance?.available || 0)) {
      toast.error('Số dư không đủ');
      return;
    }

    transferToWeb.mutate({
      sellerId: seller.id,
      amount,
    }, {
      onSuccess: () => {
        setTransferDialog(false);
        setTransferAmount('');
      },
    });
  };

  const isWithdrawPending = createFastWithdrawal.isPending || createNormalWithdrawal.isPending;

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Khả dụng</span>
            </div>
            <p className="text-2xl font-bold">{(balance?.available || 0).toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Đang chờ (Escrow)</span>
            </div>
            <p className="text-2xl font-bold">{(balance?.pending || 0).toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Đang khóa</span>
            </div>
            <p className="text-2xl font-bold">{(balance?.locked || 0).toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Tổng cộng</span>
            </div>
            <p className="text-2xl font-bold">{(balance?.total || 0).toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
          <DialogTrigger asChild>
            <Button disabled={(balance?.available || 0) <= 0}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Rút tiền
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rút tiền về tài khoản</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Withdrawal type selection */}
              <div className="flex gap-2">
                <Button
                  variant={withdrawType === 'normal' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setWithdrawType('normal')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Rút thường ({(normalFeeRate * 100).toFixed(0)}%)
                </Button>
                <Button
                  variant={withdrawType === 'fast' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setWithdrawType('fast')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Rút nhanh ({(fastFeeRate * 100).toFixed(0)}%)
                </Button>
              </div>

              {/* Withdrawal type info */}
              <Card className={withdrawType === 'fast' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'}>
                <CardContent className="p-3 text-sm">
                  <div className="flex items-start gap-2">
                    {withdrawType === 'fast' ? (
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">
                        {withdrawType === 'fast' ? 'Rút nhanh' : 'Rút thường'}
                      </p>
                      <p className="text-muted-foreground">
                        {withdrawType === 'fast' 
                          ? `Phí ${(fastFeeRate * 100).toFixed(0)}%, xử lý trong 1-2 giờ` 
                          : `Phí ${(normalFeeRate * 100).toFixed(0)}%, xử lý trong 1-3 ngày làm việc`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank selection */}
              <div className="space-y-2">
                <Label>Chọn ngân hàng</Label>
                <Select
                  value={bankInfo.bank_name}
                  onValueChange={(value) => setBankInfo(prev => ({ ...prev, bank_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngân hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIETNAM_BANKS.map(bank => (
                      <SelectItem key={bank.code} value={bank.name}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {bank.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account number */}
              <div className="space-y-2">
                <Label>Số tài khoản</Label>
                <Input
                  value={bankInfo.account_number}
                  onChange={(e) => setBankInfo(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="Nhập số tài khoản"
                />
              </div>

              {/* Account holder name */}
              <div className="space-y-2">
                <Label>Họ tên chủ tài khoản</Label>
                <Input
                  value={bankInfo.account_name}
                  onChange={(e) => setBankInfo(prev => ({ ...prev, account_name: e.target.value.toUpperCase() }))}
                  placeholder="Nhập họ tên (không dấu, viết hoa)"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={bankInfo.phone_number}
                  onChange={(e) => setBankInfo(prev => ({ ...prev, phone_number: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Nhập số điện thoại"
                  maxLength={11}
                />
              </div>

              {/* Withdrawal amount */}
              <div className="space-y-2">
                <Label>Số tiền rút</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Nhập số tiền cần rút"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    type="button"
                    onClick={() => setWithdrawAmount(String(Math.floor((balance?.available || 0) / 2)))}
                  >
                    50%
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    type="button"
                    onClick={() => setWithdrawAmount(String(balance?.available || 0))}
                  >
                    Tất cả
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Số dư khả dụng: {(balance?.available || 0).toLocaleString('vi-VN')}đ
                </p>
              </div>

              {/* Fee calculation display */}
              {withdrawAmountNum > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Số tiền rút:</span>
                      <span>{withdrawAmountNum.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phí rút ({(feeRate * 100).toFixed(0)}%):</span>
                      <span className="text-red-500">-{withdrawFee.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Thực nhận:</span>
                      <span className="text-green-500">{actualAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </>
              )}

              <Button 
                className="w-full" 
                onClick={handleWithdraw} 
                disabled={isWithdrawPending || withdrawAmountNum <= 0}
              >
                {isWithdrawPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Gửi yêu cầu rút tiền
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transfer to Web Balance Dialog */}
        <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={(balance?.available || 0) <= 0}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Chuyển sang số dư web
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chuyển sang số dư website</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Chuyển tiền sang số dư website</p>
                      <p className="text-muted-foreground">
                        Tiền sẽ được chuyển vào số dư tài khoản website của bạn ngay lập tức.
                        Bạn có thể dùng để mua hàng hoặc thanh toán các dịch vụ trên website.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Số tiền chuyển</Label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Nhập số tiền"
                />
                <p className="text-xs text-muted-foreground">
                  Khả dụng: {(balance?.available || 0).toLocaleString('vi-VN')}đ
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTransferAmount(String(Math.floor((balance?.available || 0) / 2)))}
                >
                  50%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTransferAmount(String(balance?.available || 0))}
                >
                  Tất cả
                </Button>
              </div>

              <Button 
                className="w-full" 
                onClick={handleTransferToWeb} 
                disabled={transferToWeb.isPending}
              >
                {transferToWeb.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Xác nhận chuyển
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
          <TabsTrigger value="withdrawals">Yêu cầu rút tiền</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          {transactionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions?.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                Chưa có giao dịch nào
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {transactions?.map(tx => {
                  const typeInfo = transactionTypeLabels[tx.type] || { 
                    label: tx.type, 
                    icon: <ArrowDownLeft className="h-4 w-4" />, 
                    color: 'text-muted-foreground' 
                  };
                  
                  return (
                    <Card key={tx.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={typeInfo.color}>{typeInfo.icon}</div>
                            <div>
                              <p className="font-medium text-sm">{typeInfo.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(tx.created_at)}
                              </p>
                              {tx.note && (
                                <p className="text-xs text-muted-foreground mt-1">{tx.note}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Số dư: {tx.balance_after.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          {withdrawals?.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                Chưa có yêu cầu rút tiền
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {withdrawals?.map((w: { id: string; amount: number; status: string; withdrawal_type: string; fast_fee: number; actual_amount: number; created_at: string; bank_name: string; bank_account: string }) => (
                <Card key={w.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{w.amount.toLocaleString('vi-VN')}đ</p>
                          {w.withdrawal_type === 'fast' && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Nhanh
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {w.bank_name} - {w.bank_account}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(w.created_at)}
                        </p>
                      </div>
                      <Badge variant={
                        w.status === 'completed' ? 'default' :
                        w.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {w.status === 'completed' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Hoàn tất</>
                        ) : w.status === 'rejected' ? (
                          <><XCircle className="h-3 w-3 mr-1" /> Từ chối</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Đang xử lý</>
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerWalletSection;
