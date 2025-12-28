import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Store, Search, Check, X, Eye, Clock, Users,
  Wallet, TrendingUp, Package, AlertCircle, Loader2, BadgeCheck, Trash2, Settings, Percent, Handshake
} from 'lucide-react';
import { 
  useAllSellers, useUpdateSellerStatus, useAllWithdrawals, 
  useProcessWithdrawal, useVerificationRequests, useProcessVerification,
  useDeleteSeller, useUpdateSeller,
  Seller, WithdrawalRequest 
} from '@/hooks/useMarketplace';
import { useWithdrawalFees, useUpdateMarketplaceSetting } from '@/hooks/useMarketplaceSettings';
import { useSiteSetting, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';
import { PartnerBadge } from '@/components/ui/partner-badge';

export default function AdminMarketplace() {
  const { formatPrice } = useCurrency();
  const { formatDateTime } = useDateFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<(WithdrawalRequest & { seller: Seller }) | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [normalFeeInput, setNormalFeeInput] = useState('');
  const [fastFeeInput, setFastFeeInput] = useState('');
  const [minAmountInput, setMinAmountInput] = useState('');
  const [platformFeeInput, setPlatformFeeInput] = useState('');
  
  const { data: sellers = [], isLoading: loadingSellers } = useAllSellers();
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useAllWithdrawals();
  const { data: verificationRequests = [], isLoading: loadingVerifications } = useVerificationRequests();
  const { data: feeSettings, isLoading: loadingFees } = useWithdrawalFees();
  const { data: platformFeeSetting } = useSiteSetting('marketplace_platform_fee');
  const updateStatus = useUpdateSellerStatus();
  const updateSeller = useUpdateSeller();
  const processWithdrawal = useProcessWithdrawal();
  const processVerification = useProcessVerification();
  const deleteSeller = useDeleteSeller();
  const updateSetting = useUpdateMarketplaceSetting();
  const updateSiteSetting = useUpdateSiteSetting();
  
  const filteredSellers = sellers.filter(s => {
    const matchSearch = s.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shop_slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });
  
  const pendingSellers = sellers.filter(s => s.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  
  const handleUpdateSellerStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, admin_notes: adminNotes });
      toast.success(`Đã ${status === 'approved' ? 'duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật'} cửa hàng`);
      setSelectedSeller(null);
      setAdminNotes('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  const handleProcessWithdrawal = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await processWithdrawal.mutateAsync({ id, status, admin_notes: adminNotes });
      toast.success(`Đã ${status === 'completed' ? 'xử lý' : 'từ chối'} yêu cầu rút tiền`);
      setSelectedWithdrawal(null);
      setAdminNotes('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  const handleDeleteSeller = async (id: string, shopName: string) => {
    if (confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN cửa hàng "${shopName}"? Hành động này không thể hoàn tác!`)) {
      try {
        await deleteSeller.mutateAsync(id);
        toast.success('Đã xóa cửa hàng');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };
  
  const handleSaveFeeSettings = async () => {
    try {
      // User inputs percentage (e.g., 1 = 1%), we convert to decimal (0.01)
      const normalPercent = parseFloat(normalFeeInput) || (feeSettings?.normalFeeRate || 0.01) * 100;
      const fastPercent = parseFloat(fastFeeInput) || (feeSettings?.fastFeeRate || 0.02) * 100;
      const minAmount = parseFloat(minAmountInput) || feeSettings?.minWithdrawalAmount || 50000;
      const platformFee = parseFloat(platformFeeInput) || platformFeeSetting || 5;
      
      // Convert percentage to decimal for storage
      const normalRate = normalPercent / 100;
      const fastRate = fastPercent / 100;
      
      await Promise.all([
        updateSetting.mutateAsync({ key: 'withdrawal_normal_fee', value: { rate: normalRate } }),
        updateSetting.mutateAsync({ key: 'withdrawal_fast_fee', value: { rate: fastRate } }),
        updateSetting.mutateAsync({ key: 'min_withdrawal_amount', value: { amount: minAmount } }),
        updateSiteSetting.mutateAsync({ key: 'marketplace_platform_fee', value: platformFee }),
      ]);
      
      toast.success('Đã lưu cài đặt phí');
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu cài đặt');
    }
  };
  
  const stats = {
    totalSellers: sellers.length,
    approvedSellers: sellers.filter(s => s.status === 'approved').length,
    totalRevenue: sellers.reduce((sum, s) => sum + s.total_revenue, 0),
    totalSales: sellers.reduce((sum, s) => sum + s.total_sales, 0)
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Chợ</h1>
        <p className="text-muted-foreground">Quản lý cửa hàng và yêu cầu rút tiền</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalSellers}</p>
              <p className="text-xs text-muted-foreground">Tổng cửa hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.approvedSellers}</p>
              <p className="text-xs text-muted-foreground">Đã duyệt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalSales}</p>
              <p className="text-xs text-muted-foreground">Tổng giao dịch</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Alerts */}
      {(pendingSellers.length > 0 || pendingWithdrawals.length > 0 || verificationRequests.length > 0) && (
        <div className="space-y-2">
          {pendingSellers.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span>{pendingSellers.length} cửa hàng đang chờ duyệt</span>
              </CardContent>
            </Card>
          )}
          {verificationRequests.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span>{verificationRequests.length} yêu cầu xác minh tích xanh</span>
              </CardContent>
            </Card>
          )}
          {pendingWithdrawals.length > 0 && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-blue-500" />
                <span>{pendingWithdrawals.length} yêu cầu rút tiền đang chờ</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      <Tabs defaultValue="sellers">
        <TabsList>
          <TabsTrigger value="sellers">
            Cửa hàng
            {pendingSellers.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingSellers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verification">
            Xác minh
            {verificationRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{verificationRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Rút tiền
            {pendingWithdrawals.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingWithdrawals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Cài đặt phí
          </TabsTrigger>
        </TabsList>
        
        {/* Sellers Tab */}
        <TabsContent value="sellers" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm cửa hàng..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'suspended'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Tất cả' :
                   status === 'pending' ? 'Chờ duyệt' :
                   status === 'approved' ? 'Đã duyệt' : 'Tạm khóa'}
                </Button>
              ))}
            </div>
          </div>
          
          {loadingSellers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredSellers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Không có cửa hàng nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSellers.map((seller) => (
                <Card key={seller.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={seller.shop_avatar_url || undefined} />
                          <AvatarFallback><Store className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{seller.shop_name}</h3>
                            {seller.is_verified && (
                              <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                            )}
                            {seller.is_partner && (
                              <PartnerBadge size="sm" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{seller.shop_slug}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{seller.total_sales} đã bán</span>
                            <span>{formatPrice(seller.total_revenue)} doanh thu</span>
                            <span>{formatPrice(seller.balance)} số dư</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          seller.status === 'approved' ? 'default' :
                          seller.status === 'pending' ? 'secondary' :
                          seller.status === 'rejected' ? 'destructive' : 'outline'
                        }>
                          {seller.status === 'approved' ? 'Đã duyệt' :
                           seller.status === 'pending' ? 'Chờ duyệt' :
                           seller.status === 'rejected' ? 'Từ chối' : 'Tạm khóa'}
                        </Badge>
                        
                        {seller.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleUpdateSellerStatus(seller.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedSeller(seller);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {seller.status === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedSeller(seller);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Delete button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteSeller(seller.id, seller.shop_name)}
                          disabled={deleteSeller.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          {loadingWithdrawals ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Chưa có yêu cầu rút tiền nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{formatPrice(w.amount)}</span>
                          <Badge variant={
                            w.status === 'completed' ? 'default' :
                            w.status === 'pending' ? 'secondary' :
                            w.status === 'processing' ? 'outline' : 'destructive'
                          }>
                            {w.status === 'completed' ? 'Đã chuyển' :
                             w.status === 'pending' ? 'Chờ xử lý' :
                             w.status === 'processing' ? 'Đang xử lý' : 'Từ chối'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {w.seller?.shop_name} • @{w.seller?.shop_slug}
                        </p>
                        <p className="text-sm">
                          {w.bank_name} - {w.bank_account} - {w.bank_holder}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(w.created_at)}
                        </p>
                      </div>
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleProcessWithdrawal(w.id, 'completed')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Đã chuyển
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => setSelectedWithdrawal(w)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          {loadingVerifications ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : verificationRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BadgeCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Không có yêu cầu xác minh nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {verificationRequests.map((seller) => (
                <Card key={seller.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={seller.shop_avatar_url || undefined} />
                          <AvatarFallback><Store className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{seller.shop_name}</p>
                          <p className="text-sm text-muted-foreground">@{seller.shop_slug}</p>
                          <div className="flex items-center gap-3 text-sm mt-1">
                            <span>Uy tín: <span className="font-bold text-green-600">{seller.trust_score}%</span></span>
                            <span>Đánh giá: {seller.rating_average.toFixed(1)} ⭐</span>
                            <span>Đã bán: {seller.total_sales}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Yêu cầu lúc: {seller.verification_requested_at && formatDateTime(seller.verification_requested_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={async () => {
                            try {
                              await processVerification.mutateAsync({ sellerId: seller.id, approve: true });
                              toast.success('Đã duyệt xác minh');
                            } catch (error: any) {
                              toast.error(error.message);
                            }
                          }}
                          disabled={processVerification.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Duyệt
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              await processVerification.mutateAsync({ sellerId: seller.id, approve: false });
                              toast.success('Đã từ chối xác minh');
                            } catch (error: any) {
                              toast.error(error.message);
                            }
                          }}
                          disabled={processVerification.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Platform Fee Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Percent className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                Phí sàn (Platform Fee)
              </CardTitle>
              <p className="text-sm md:text-base text-muted-foreground">
                Phí này áp dụng cho cả đơn hàng Account và Design Services
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="platformFee" className="text-sm md:text-base font-medium">Phí sàn (%)</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder={String(platformFeeSetting || 5)}
                    value={platformFeeInput}
                    onChange={(e) => setPlatformFeeInput(e.target.value)}
                    className="h-11 md:h-12 text-base md:text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Hiện tại: <span className="font-semibold text-foreground">{Number(platformFeeSetting || 5)}%</span> - Trừ từ tiền seller nhận khi đơn hàng hoàn tất
                  </p>
                </div>
                <div className="p-4 md:p-6 rounded-xl bg-muted/50 border">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">Ví dụ tính toán</h4>
                  <p className="text-sm text-muted-foreground">
                    Đơn hàng 1,000,000đ với phí sàn {Number(platformFeeSetting || 5)}%:
                  </p>
                  <p className="text-base md:text-lg font-semibold mt-1">
                    Seller nhận: {(1000000 * (1 - Number(platformFeeSetting || 5) / 100)).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Fees Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Wallet className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                </div>
                Phí rút tiền
              </CardTitle>
              <p className="text-sm md:text-base text-muted-foreground">
                Phí áp dụng khi seller rút tiền từ ví shop
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingFees ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="space-y-3 p-4 md:p-5 rounded-xl border bg-card">
                    <Label htmlFor="normalFee" className="text-sm md:text-base font-medium">Phí rút thường (%)</Label>
                    <Input
                      id="normalFee"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder={((feeSettings?.normalFeeRate || 0.01) * 100).toFixed(1)}
                      value={normalFeeInput}
                      onChange={(e) => setNormalFeeInput(e.target.value)}
                      className="h-11 md:h-12 text-base md:text-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Hiện tại: <span className="font-semibold text-foreground">{((feeSettings?.normalFeeRate || 0.01) * 100).toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-muted-foreground">VD: Nhập 1 = 1%. Xử lý trong 1-3 ngày</p>
                  </div>
                  
                  <div className="space-y-3 p-4 md:p-5 rounded-xl border bg-card">
                    <Label htmlFor="fastFee" className="text-sm md:text-base font-medium">Phí rút nhanh (%)</Label>
                    <Input
                      id="fastFee"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder={((feeSettings?.fastFeeRate || 0.02) * 100).toFixed(1)}
                      value={fastFeeInput}
                      onChange={(e) => setFastFeeInput(e.target.value)}
                      className="h-11 md:h-12 text-base md:text-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Hiện tại: <span className="font-semibold text-foreground">{((feeSettings?.fastFeeRate || 0.02) * 100).toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-muted-foreground">VD: Nhập 2 = 2%. Xử lý trong 24 giờ</p>
                  </div>
                  
                  <div className="space-y-3 p-4 md:p-5 rounded-xl border bg-card">
                    <Label htmlFor="minAmount" className="text-sm md:text-base font-medium">Rút tối thiểu (VNĐ)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      step="1000"
                      min="0"
                      placeholder={String(feeSettings?.minWithdrawalAmount || 50000)}
                      value={minAmountInput}
                      onChange={(e) => setMinAmountInput(e.target.value)}
                      className="h-11 md:h-12 text-base md:text-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Hiện tại: <span className="font-semibold text-foreground">{(feeSettings?.minWithdrawalAmount || 50000).toLocaleString('vi-VN')}đ</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Seller phải có ít nhất số tiền này để rút</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveFeeSettings}
            disabled={updateSetting.isPending || updateSiteSetting.isPending}
            size="lg"
            className="w-full sm:w-auto text-base md:text-lg px-8"
          >
            {(updateSetting.isPending || updateSiteSetting.isPending) && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Lưu tất cả cài đặt
          </Button>
        </TabsContent>
      </Tabs>
      
      {/* Seller Action Dialog */}
      <Dialog open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSeller?.status === 'pending' ? 'Từ chối cửa hàng' : 'Quản lý cửa hàng'}
            </DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedSeller.shop_avatar_url || undefined} />
                  <AvatarFallback><Store /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedSeller.shop_name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedSeller.shop_slug}</p>
                </div>
              </div>
              
              {/* Partner Toggle */}
              {selectedSeller.status === 'approved' && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">Đối tác chính thức</p>
                      <p className="text-xs text-muted-foreground">Shop sẽ có badge Partner</p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedSeller.is_partner || false}
                    onCheckedChange={async (checked) => {
                      try {
                        await updateSeller.mutateAsync({ id: selectedSeller.id, is_partner: checked });
                        toast.success(checked ? 'Đã gắn Partner' : 'Đã gỡ Partner');
                        setSelectedSeller({ ...selectedSeller, is_partner: checked });
                      } catch (error: any) {
                        toast.error(error.message);
                      }
                    }}
                    disabled={updateSeller.isPending}
                  />
                </div>
              )}
              
              <Textarea
                placeholder="Ghi chú (lý do từ chối, tạm khóa...)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
              
              <div className="flex gap-2">
                {selectedSeller.status === 'pending' && (
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleUpdateSellerStatus(selectedSeller.id, 'rejected')}
                  >
                    Từ chối
                  </Button>
                )}
                {selectedSeller.status === 'approved' && (
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleUpdateSellerStatus(selectedSeller.id, 'suspended')}
                  >
                    Tạm khóa
                  </Button>
                )}
                {selectedSeller.status === 'suspended' && (
                  <Button 
                    className="flex-1"
                    onClick={() => handleUpdateSellerStatus(selectedSeller.id, 'approved')}
                  >
                    Mở khóa
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Withdrawal Reject Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div>
                <p className="font-bold">{formatPrice(selectedWithdrawal.amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedWithdrawal.seller?.shop_name}
                </p>
              </div>
              
              <Textarea
                placeholder="Lý do từ chối..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
              
              <Button 
                variant="destructive"
                className="w-full"
                onClick={() => handleProcessWithdrawal(selectedWithdrawal.id, 'rejected')}
              >
                Xác nhận từ chối
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Số tiền sẽ được hoàn lại vào số dư của người bán
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
