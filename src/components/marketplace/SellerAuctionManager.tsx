import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Gavel, Plus, Pencil, Trash2, Eye, Clock, TrendingUp, 
  Users, Ban, Play, Loader2, AlertCircle 
} from 'lucide-react';
import { useSellerAuctions, useCreateAuction, useUpdateAuction, Auction, AuctionType, AuctionStatus } from '@/hooks/useAuctions';
import { useMySellerProducts } from '@/hooks/useMarketplace';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { format, addDays, addHours } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Link } from 'react-router-dom';

interface SellerAuctionManagerProps {
  sellerId: string;
}

const defaultAuction = {
  auction_type: 'time_based' as AuctionType,
  title: '',
  description: '',
  starting_price: 0,
  reserve_price: null as number | null,
  buy_now_price: null as number | null,
  min_bid_increment: 10000,
  dutch_start_price: null as number | null,
  dutch_end_price: null as number | null,
  dutch_decrement_amount: null as number | null,
  dutch_decrement_interval: null as number | null,
  max_bids_per_user: null as number | null,
  auto_extend_minutes: 5,
  start_time: '',
  end_time: '',
  product_id: ''
};

export function SellerAuctionManager({ sellerId }: SellerAuctionManagerProps) {
  const { formatPrice } = useCurrency();
  const { formatRelative, formatDateTime } = useDateFormat();
  const { data: auctions = [], isLoading } = useSellerAuctions(sellerId);
  const { data: products = [] } = useMySellerProducts();
  const createAuction = useCreateAuction();
  const updateAuction = useUpdateAuction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [formData, setFormData] = useState(defaultAuction);

  const availableProducts = products.filter(p => p.status === 'available');

  const openCreateDialog = () => {
    setEditingAuction(null);
    const now = new Date();
    const startTime = addHours(now, 1);
    const endTime = addDays(startTime, 3);
    
    setFormData({
      ...defaultAuction,
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm")
    });
    setDialogOpen(true);
  };

  const openEditDialog = (auction: Auction) => {
    setEditingAuction(auction);
    setFormData({
      auction_type: auction.auction_type,
      title: auction.title,
      description: auction.description || '',
      starting_price: auction.starting_price,
      reserve_price: auction.reserve_price,
      buy_now_price: auction.buy_now_price,
      min_bid_increment: auction.min_bid_increment || 10000,
      dutch_start_price: auction.dutch_start_price,
      dutch_end_price: auction.dutch_end_price,
      dutch_decrement_amount: auction.dutch_decrement_amount,
      dutch_decrement_interval: auction.dutch_decrement_interval,
      max_bids_per_user: auction.max_bids_per_user,
      auto_extend_minutes: auction.auto_extend_minutes || 5,
      start_time: format(new Date(auction.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(auction.end_time), "yyyy-MM-dd'T'HH:mm"),
      product_id: auction.product_id
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.product_id) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!formData.starting_price || formData.starting_price <= 0) {
      toast.error('Giá khởi điểm phải lớn hơn 0');
      return;
    }

    const selectedProduct = products.find(p => p.id === formData.product_id);

    try {
      // Chuyển đổi datetime-local sang ISO string giữ nguyên múi giờ local
      const parseLocalDateTime = (dateTimeStr: string) => {
        // datetime-local trả về format "YYYY-MM-DDTHH:mm"
        // Tạo Date object từ string này (sẽ được hiểu là local time)
        const date = new Date(dateTimeStr);
        return date.toISOString();
      };

      const auctionPayload = {
        seller_id: sellerId,
        product_id: formData.product_id,
        auction_type: formData.auction_type,
        title: formData.title,
        description: formData.description || null,
        image_url: selectedProduct?.images?.[0] || null,
        starting_price: formData.starting_price,
        current_price: formData.starting_price,
        reserve_price: formData.reserve_price || null,
        buy_now_price: formData.buy_now_price || null,
        min_bid_increment: formData.min_bid_increment || 10000,
        dutch_start_price: formData.auction_type === 'dutch' ? formData.dutch_start_price : null,
        dutch_end_price: formData.auction_type === 'dutch' ? formData.dutch_end_price : null,
        dutch_decrement_amount: formData.auction_type === 'dutch' ? formData.dutch_decrement_amount : null,
        dutch_decrement_interval: formData.auction_type === 'dutch' ? formData.dutch_decrement_interval : null,
        max_bids_per_user: formData.auction_type === 'sealed' ? formData.max_bids_per_user : null,
        auto_extend_minutes: formData.auto_extend_minutes || 5,
        start_time: parseLocalDateTime(formData.start_time),
        end_time: parseLocalDateTime(formData.end_time),
        status: 'draft' as AuctionStatus
      };

      if (editingAuction) {
        await updateAuction.mutateAsync({ id: editingAuction.id, ...auctionPayload });
      } else {
        await createAuction.mutateAsync(auctionPayload);
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleActivate = async (auction: Auction) => {
    try {
      await updateAuction.mutateAsync({ id: auction.id, status: 'active' });
      toast.success('Đã kích hoạt đấu giá');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async (auction: Auction) => {
    if (!confirm('Bạn có chắc muốn hủy phiên đấu giá này?')) return;
    try {
      await updateAuction.mutateAsync({ id: auction.id, status: 'cancelled' });
      toast.success('Đã hủy đấu giá');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: AuctionStatus) => {
    const statusMap: Record<AuctionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: 'Nháp', variant: 'secondary' },
      active: { label: 'Đang diễn ra', variant: 'default' },
      ended: { label: 'Đã kết thúc', variant: 'outline' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
      sold: { label: 'Đã bán', variant: 'default' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAuctionTypeName = (type: AuctionType) => {
    const typeMap: Record<AuctionType, string> = {
      time_based: 'Đấu giá thời gian',
      buy_now: 'Mua ngay',
      dutch: 'Đấu giá Hà Lan',
      sealed: 'Đấu giá kín'
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Quản lý đấu giá</h2>
          <p className="text-sm text-muted-foreground">{auctions.length} phiên đấu giá</p>
        </div>
        <Button onClick={openCreateDialog} disabled={availableProducts.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo đấu giá
        </Button>
      </div>

      {availableProducts.length === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-sm">Bạn cần có sản phẩm đang bán để tạo đấu giá</p>
          </CardContent>
        </Card>
      )}

      {auctions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Chưa có phiên đấu giá</h3>
            <p className="text-muted-foreground mb-4">Tạo đấu giá để bán sản phẩm với giá tốt hơn</p>
            <Button onClick={openCreateDialog} disabled={availableProducts.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo đấu giá đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {auctions.map(auction => (
            <Card key={auction.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    {auction.image_url ? (
                      <img src={auction.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold truncate">{auction.title}</h3>
                        <p className="text-sm text-muted-foreground">{getAuctionTypeName(auction.auction_type)}</p>
                      </div>
                      {getStatusBadge(auction.status)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {formatPrice(auction.current_price)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {auction.bid_count} lượt đặt
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {auction.status === 'active' ? (
                          <>Còn {formatRelative(auction.end_time, { addSuffix: false })}</>
                        ) : (
                          formatDateTime(auction.end_time)
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Link to={`/shops/auction/${auction.id}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </Button>
                      </Link>
                      
                      {auction.status === 'draft' && (
                        <>
                          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => openEditDialog(auction)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </Button>
                          <Button size="sm" className="h-8 gap-1.5" onClick={() => handleActivate(auction)}>
                            <Play className="h-3.5 w-3.5" />
                            Kích hoạt
                          </Button>
                        </>
                      )}

                      {(auction.status === 'draft' || auction.status === 'active') && (
                        <Button variant="destructive" size="sm" className="h-8 gap-1.5" onClick={() => handleCancel(auction)}>
                          <Ban className="h-3.5 w-3.5" />
                          Hủy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              {editingAuction ? 'Chỉnh sửa đấu giá' : 'Tạo đấu giá mới'}
            </DialogTitle>
            <DialogDescription>
              {editingAuction ? 'Cập nhật thông tin phiên đấu giá' : 'Chọn sản phẩm và cấu hình đấu giá'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-2">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Sản phẩm *</Label>
                <Select 
                  value={formData.product_id} 
                  onValueChange={v => {
                    const product = products.find(p => p.id === v);
                    setFormData(prev => ({
                      ...prev,
                      product_id: v,
                      title: prev.title || product?.title || '',
                      starting_price: prev.starting_price || product?.price || 0
                    }));
                  }}
                  disabled={!!editingAuction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          {product.images?.[0] && (
                            <img src={product.images[0]} className="w-8 h-8 rounded object-cover" />
                          )}
                          <span>{product.title}</span>
                          <span className="text-muted-foreground">- {formatPrice(product.price)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auction Type */}
              <div className="space-y-2">
                <Label>Loại đấu giá *</Label>
                <Select 
                  value={formData.auction_type} 
                  onValueChange={v => setFormData(prev => ({ ...prev, auction_type: v as AuctionType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_based">
                      <div>
                        <div className="font-medium">Đấu giá thời gian</div>
                        <div className="text-xs text-muted-foreground">Người đặt giá cao nhất khi hết thời gian sẽ thắng</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="buy_now">
                      <div>
                        <div className="font-medium">Mua ngay</div>
                        <div className="text-xs text-muted-foreground">Có thể đấu giá hoặc mua ngay với giá cố định</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="dutch">
                      <div>
                        <div className="font-medium">Đấu giá Hà Lan</div>
                        <div className="text-xs text-muted-foreground">Giá giảm dần theo thời gian, người mua đầu tiên thắng</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="sealed">
                      <div>
                        <div className="font-medium">Đấu giá kín</div>
                        <div className="text-xs text-muted-foreground">Giá đặt ẩn, người cao nhất thắng khi kết thúc</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Tiêu đề *</Label>
                <Input 
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Tiêu đề phiên đấu giá"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả chi tiết về phiên đấu giá"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Price Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá khởi điểm *</Label>
                  <Input 
                    type="number"
                    value={formData.starting_price}
                    onChange={e => setFormData(prev => ({ ...prev, starting_price: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bước giá tối thiểu</Label>
                  <Input 
                    type="number"
                    value={formData.min_bid_increment || ''}
                    onChange={e => setFormData(prev => ({ ...prev, min_bid_increment: parseInt(e.target.value) || 10000 }))}
                    min={1000}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá bảo lưu (tùy chọn)</Label>
                  <Input 
                    type="number"
                    value={formData.reserve_price || ''}
                    onChange={e => setFormData(prev => ({ ...prev, reserve_price: parseInt(e.target.value) || null }))}
                    placeholder="Giá tối thiểu để bán"
                  />
                </div>
                {(formData.auction_type === 'time_based' || formData.auction_type === 'buy_now') && (
                  <div className="space-y-2">
                    <Label>Giá mua ngay (tùy chọn)</Label>
                    <Input 
                      type="number"
                      value={formData.buy_now_price || ''}
                      onChange={e => setFormData(prev => ({ ...prev, buy_now_price: parseInt(e.target.value) || null }))}
                      placeholder="Giá mua ngay"
                    />
                  </div>
                )}
              </div>

              {/* Dutch Auction Settings */}
              {formData.auction_type === 'dutch' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Cài đặt đấu giá Hà Lan</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Giá bắt đầu</Label>
                        <Input 
                          type="number"
                          value={formData.dutch_start_price || ''}
                          onChange={e => setFormData(prev => ({ ...prev, dutch_start_price: parseInt(e.target.value) || null }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Giá kết thúc</Label>
                        <Input 
                          type="number"
                          value={formData.dutch_end_price || ''}
                          onChange={e => setFormData(prev => ({ ...prev, dutch_end_price: parseInt(e.target.value) || null }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Giảm mỗi lần (VNĐ)</Label>
                        <Input 
                          type="number"
                          value={formData.dutch_decrement_amount || ''}
                          onChange={e => setFormData(prev => ({ ...prev, dutch_decrement_amount: parseInt(e.target.value) || null }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Giảm mỗi (phút)</Label>
                        <Input 
                          type="number"
                          value={formData.dutch_decrement_interval || ''}
                          onChange={e => setFormData(prev => ({ ...prev, dutch_decrement_interval: parseInt(e.target.value) || null }))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Sealed Auction Settings */}
              {formData.auction_type === 'sealed' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Số lần đặt tối đa mỗi người</Label>
                    <Input 
                      type="number"
                      value={formData.max_bids_per_user || ''}
                      onChange={e => setFormData(prev => ({ ...prev, max_bids_per_user: parseInt(e.target.value) || null }))}
                      placeholder="Để trống = không giới hạn"
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thời gian bắt đầu *</Label>
                  <Input 
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian kết thúc *</Label>
                  <Input 
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tự động gia hạn (phút)</Label>
                <Input 
                  type="number"
                  value={formData.auto_extend_minutes}
                  onChange={e => setFormData(prev => ({ ...prev, auto_extend_minutes: parseInt(e.target.value) || 5 }))}
                  min={0}
                  max={30}
                />
                <p className="text-xs text-muted-foreground">Gia hạn thêm khi có người đặt giá trong những phút cuối</p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createAuction.isPending || updateAuction.isPending}
            >
              {(createAuction.isPending || updateAuction.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingAuction ? 'Cập nhật' : 'Tạo đấu giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
