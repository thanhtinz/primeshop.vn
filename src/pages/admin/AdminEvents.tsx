import { useState } from 'react';
import { Plus, Edit, Trash2, Gift, Calendar, Settings, Percent, RotateCcw, Award } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ImageUrlInput from '@/components/admin/ImageUrlInput';
import {
  useAllEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEventSpinPrizes,
  useCreateSpinPrize,
  useUpdateSpinPrize,
  useDeleteSpinPrize,
  Event,
  EventSpinPrize,
} from '@/hooks/useEvents';
import { useProducts } from '@/hooks/useProducts';
import { useVouchers } from '@/hooks/useVouchers';

type EventType = 'spin_wheel' | 'reward_exchange';

export default function AdminEvents() {
  const { data: events, isLoading } = useAllEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { formatDateTime } = useDateFormat();

  const [activeTab, setActiveTab] = useState<EventType>('spin_wheel');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    image_url: '',
    banner_url: '',
    start_date: '',
    end_date: '',
    is_active: false,
    event_type: 'spin_wheel' as EventType,
    points_type: 'per_amount' as 'fixed' | 'per_amount',
    points_value: 1,
    points_per_amount: 10000,
    spin_cost: 10,
  });

  const resetEventForm = () => {
    setEventForm({
      name: '',
      description: '',
      image_url: '',
      banner_url: '',
      start_date: '',
      end_date: '',
      is_active: false,
      event_type: activeTab,
      points_type: 'per_amount',
      points_value: 1,
      points_per_amount: 10000,
      spin_cost: 10,
    });
    setEditingEvent(null);
  };

  const handleCreateNew = () => {
    resetEventForm();
    setEventForm(prev => ({ ...prev, event_type: activeTab }));
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      description: event.description || '',
      image_url: event.image_url || '',
      banner_url: event.banner_url || '',
      start_date: event.start_date.slice(0, 16),
      end_date: event.end_date.slice(0, 16),
      is_active: event.is_active,
      event_type: event.event_type || 'spin_wheel',
      points_type: event.points_type,
      points_value: event.points_value,
      points_per_amount: event.points_per_amount,
      spin_cost: event.spin_cost,
    });
    setIsEventDialogOpen(true);
  };

  const handleSubmitEvent = async () => {
    if (!eventForm.name || !eventForm.start_date || !eventForm.end_date) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, ...eventForm });
        toast.success('Cập nhật sự kiện thành công');
      } else {
        await createEvent.mutateAsync(eventForm);
        toast.success('Tạo sự kiện thành công');
      }
      setIsEventDialogOpen(false);
      resetEventForm();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    try {
      await deleteEvent.mutateAsync(id);
      toast.success('Xóa sự kiện thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (!event.is_active) return { label: 'Tắt', variant: 'secondary' as const };
    if (now < start) return { label: 'Chưa bắt đầu', variant: 'outline' as const };
    if (now > end) return { label: 'Đã kết thúc', variant: 'destructive' as const };
    return { label: 'Đang diễn ra', variant: 'default' as const };
  };

  const spinWheelEvents = events?.filter(e => e.event_type !== 'reward_exchange') || [];
  const rewardExchangeEvents = events?.filter(e => e.event_type === 'reward_exchange') || [];

  const renderEventCard = (event: Event, isSpinWheel: boolean) => {
    const status = getEventStatus(event);
    return (
      <Card key={event.id}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {event.image_url && (
                <img src={event.image_url} alt={event.name} className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div>
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(event.start_date)} - {formatDateTime(event.end_date)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Percent className="w-4 h-4 text-muted-foreground" />
              {event.points_type === 'fixed' 
                ? `${event.points_value} điểm/đơn`
                : `${event.points_value} điểm/${event.points_per_amount.toLocaleString()}đ`
              }
            </div>
            {isSpinWheel && (
              <div className="flex items-center gap-1">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                {event.spin_cost} điểm/lượt quay
              </div>
            )}
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
            >
              <Gift className="w-4 h-4 mr-2" />
              Quản lý phần thưởng
            </Button>
          </div>
          {selectedEventId === event.id && (
            <div className="mt-4 border-t pt-4">
              {isSpinWheel ? (
                <SpinPrizesManager eventId={event.id} />
              ) : (
                <RewardExchangeManager eventId={event.id} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý sự kiện</h1>
          <p className="text-muted-foreground">Cấu hình sự kiện vòng quay và đổi thưởng</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EventType)} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="spin_wheel" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Vòng quay
            </TabsTrigger>
            <TabsTrigger value="reward_exchange" className="gap-2">
              <Award className="w-4 h-4" />
              Đổi thưởng
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" /> 
            {activeTab === 'spin_wheel' ? 'Tạo sự kiện vòng quay' : 'Tạo sự kiện đổi thưởng'}
          </Button>
        </div>

        <TabsContent value="spin_wheel" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : spinWheelEvents.length > 0 ? (
            <div className="space-y-4">
              {spinWheelEvents.map((event) => renderEventCard(event, true))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có sự kiện vòng quay nào</p>
                <p className="text-sm mt-1">Người dùng tích điểm và quay vòng quay may mắn để nhận thưởng ngẫu nhiên</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reward_exchange" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : rewardExchangeEvents.length > 0 ? (
            <div className="space-y-4">
              {rewardExchangeEvents.map((event) => renderEventCard(event, false))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có sự kiện đổi thưởng nào</p>
                <p className="text-sm mt-1">Người dùng tích điểm và đổi trực tiếp lấy phần thưởng cụ thể</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={(open) => {
        setIsEventDialogOpen(open);
        if (!open) resetEventForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Sửa sự kiện' : eventForm.event_type === 'spin_wheel' ? 'Tạo sự kiện vòng quay' : 'Tạo sự kiện đổi thưởng'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Tên sự kiện *</Label>
                <Input
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder={eventForm.event_type === 'spin_wheel' ? 'VD: Vòng quay Giáng Sinh 2024' : 'VD: Đổi quà Tết 2024'}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Mô tả chi tiết sự kiện..."
                />
              </div>
              <ImageUrlInput
                value={eventForm.image_url}
                onChange={(url) => setEventForm({ ...eventForm, image_url: url })}
                label="Ảnh sự kiện"
                folder="events"
              />
              <ImageUrlInput
                value={eventForm.banner_url}
                onChange={(url) => setEventForm({ ...eventForm, banner_url: url })}
                label="Banner sự kiện"
                folder="events"
              />
              <div>
                <Label>Thời gian bắt đầu *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Thời gian kết thúc *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" /> Cấu hình điểm thưởng
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Cách tính điểm</Label>
                  <Select
                    value={eventForm.points_type}
                    onValueChange={(value: 'fixed' | 'per_amount') => setEventForm({ ...eventForm, points_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Điểm cố định mỗi đơn</SelectItem>
                      <SelectItem value="per_amount">Theo giá trị đơn hàng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    {eventForm.points_type === 'fixed' ? 'Số điểm mỗi đơn' : 'Số điểm nhận được'}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={eventForm.points_value}
                    onChange={(e) => setEventForm({ ...eventForm, points_value: parseInt(e.target.value) || 1 })}
                  />
                </div>
                {eventForm.points_type === 'per_amount' && (
                  <div>
                    <Label>Mỗi bao nhiêu đồng</Label>
                    <Input
                      type="number"
                      min={1000}
                      step={1000}
                      value={eventForm.points_per_amount}
                      onChange={(e) => setEventForm({ ...eventForm, points_per_amount: parseInt(e.target.value) || 10000 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      VD: Mỗi {eventForm.points_per_amount.toLocaleString()}đ = {eventForm.points_value} điểm
                    </p>
                  </div>
                )}
                {eventForm.event_type === 'spin_wheel' && (
                  <div>
                    <Label>Điểm/lượt quay</Label>
                    <Input
                      type="number"
                      min={1}
                      value={eventForm.spin_cost}
                      onChange={(e) => setEventForm({ ...eventForm, spin_cost: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={eventForm.is_active}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, is_active: checked })}
              />
              <Label>Kích hoạt sự kiện</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmitEvent} disabled={createEvent.isPending || updateEvent.isPending}>
                {editingEvent ? 'Cập nhật' : 'Tạo sự kiện'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Spin Wheel Prizes Manager (with win rates)
function SpinPrizesManager({ eventId }: { eventId: string }) {
  const { data: prizes, isLoading } = useEventSpinPrizes(eventId);
  const { data: products } = useProducts();
  const { data: vouchers } = useVouchers();
  const createPrize = useCreateSpinPrize();
  const updatePrize = useUpdateSpinPrize();
  const deletePrize = useDeleteSpinPrize();

  const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<EventSpinPrize | null>(null);

  const [prizeForm, setPrizeForm] = useState({
    name: '',
    description: '',
    image_url: '',
    prize_type: 'points' as EventSpinPrize['prize_type'],
    prize_reference_id: '' as string,
    prize_value: 0,
    win_rate: 0,
    quantity_total: -1,
    quantity_remaining: -1,
    sort_order: 0,
    is_active: true,
  });

  const resetPrizeForm = () => {
    setPrizeForm({
      name: '',
      description: '',
      image_url: '',
      prize_type: 'points',
      prize_reference_id: '',
      prize_value: 0,
      win_rate: 0,
      quantity_total: -1,
      quantity_remaining: -1,
      sort_order: 0,
      is_active: true,
    });
    setEditingPrize(null);
  };

  const handleEditPrize = (prize: EventSpinPrize) => {
    setEditingPrize(prize);
    setPrizeForm({
      name: prize.name,
      description: prize.description || '',
      image_url: prize.image_url || '',
      prize_type: prize.prize_type,
      prize_reference_id: prize.prize_reference_id || '',
      prize_value: prize.prize_value,
      win_rate: prize.win_rate,
      quantity_total: prize.quantity_total,
      quantity_remaining: prize.quantity_remaining,
      sort_order: prize.sort_order,
      is_active: prize.is_active,
    });
    setIsPrizeDialogOpen(true);
  };

  const handleSubmitPrize = async () => {
    if (!prizeForm.name || prizeForm.win_rate < 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const totalRate = (prizes || [])
      .filter(p => editingPrize ? p.id !== editingPrize.id : true)
      .reduce((sum, p) => sum + p.win_rate, 0) + prizeForm.win_rate;

    if (totalRate > 100) {
      toast.error('Tổng tỷ lệ trúng thưởng không được vượt quá 100%');
      return;
    }

    try {
      const data = {
        ...prizeForm,
        event_id: eventId,
        prize_reference_id: prizeForm.prize_reference_id || null,
      };

      if (editingPrize) {
        await updatePrize.mutateAsync({ id: editingPrize.id, ...data });
        toast.success('Cập nhật phần thưởng thành công');
      } else {
        await createPrize.mutateAsync(data);
        toast.success('Thêm phần thưởng thành công');
      }
      setIsPrizeDialogOpen(false);
      resetPrizeForm();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phần thưởng này?')) return;
    try {
      await deletePrize.mutateAsync(id);
      toast.success('Xóa phần thưởng thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const totalWinRate = prizes?.reduce((sum, p) => sum + p.win_rate, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Phần thưởng vòng quay</h4>
          <p className="text-sm text-muted-foreground">
            Tổng tỷ lệ: <span className={totalWinRate > 100 ? 'text-destructive' : ''}>{totalWinRate}%</span> / 100%
          </p>
        </div>
        <Dialog open={isPrizeDialogOpen} onOpenChange={(open) => {
          setIsPrizeDialogOpen(open);
          if (!open) resetPrizeForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Thêm phần thưởng</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPrize ? 'Sửa phần thưởng' : 'Thêm phần thưởng'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên phần thưởng *</Label>
                <Input
                  value={prizeForm.name}
                  onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                  placeholder="VD: 100 điểm thưởng"
                />
              </div>
              <div>
                <Label>Loại phần thưởng</Label>
                <Select
                  value={prizeForm.prize_type}
                  onValueChange={(value: EventSpinPrize['prize_type']) => setPrizeForm({ ...prizeForm, prize_type: value, prize_reference_id: '' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Điểm thưởng</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="product">Sản phẩm</SelectItem>
                    <SelectItem value="balance">Số dư</SelectItem>
                    <SelectItem value="nothing">Không trúng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {prizeForm.prize_type === 'product' && (
                <div>
                  <Label>Chọn sản phẩm</Label>
                  <Select
                    value={prizeForm.prize_reference_id}
                    onValueChange={(value) => setPrizeForm({ ...prizeForm, prize_reference_id: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn sản phẩm..." /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {prizeForm.prize_type === 'voucher' && (
                <div>
                  <Label>Chọn voucher</Label>
                  <Select
                    value={prizeForm.prize_reference_id}
                    onValueChange={(value) => setPrizeForm({ ...prizeForm, prize_reference_id: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn voucher..." /></SelectTrigger>
                    <SelectContent>
                      {vouchers?.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.code} - {v.discount_value}{v.discount_type === 'percentage' ? '%' : 'đ'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(prizeForm.prize_type === 'points' || prizeForm.prize_type === 'balance') && (
                <div>
                  <Label>{prizeForm.prize_type === 'points' ? 'Số điểm' : 'Số tiền'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={prizeForm.prize_value}
                    onChange={(e) => setPrizeForm({ ...prizeForm, prize_value: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tỷ lệ trúng (%) *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={prizeForm.win_rate}
                    onChange={(e) => setPrizeForm({ ...prizeForm, win_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Số lượng (-1 = vô hạn)</Label>
                  <Input
                    type="number"
                    min={-1}
                    value={prizeForm.quantity_total}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || -1;
                      setPrizeForm({ ...prizeForm, quantity_total: qty, quantity_remaining: qty });
                    }}
                  />
                </div>
              </div>
              <ImageUrlInput
                value={prizeForm.image_url || ''}
                onChange={(url) => setPrizeForm({ ...prizeForm, image_url: url })}
                label="Ảnh phần thưởng"
                folder="event-prizes"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={prizeForm.is_active}
                  onCheckedChange={(checked) => setPrizeForm({ ...prizeForm, is_active: checked })}
                />
                <Label>Kích hoạt</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPrizeDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleSubmitPrize} disabled={createPrize.isPending || updatePrize.isPending}>
                  {editingPrize ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Đang tải...</div>
      ) : prizes && prizes.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phần thưởng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Tỷ lệ</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizes.map((prize) => (
              <TableRow key={prize.id}>
                <TableCell className="font-medium">{prize.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {prize.prize_type === 'points' && 'Điểm'}
                    {prize.prize_type === 'voucher' && 'Voucher'}
                    {prize.prize_type === 'product' && 'Sản phẩm'}
                    {prize.prize_type === 'balance' && 'Số dư'}
                    {prize.prize_type === 'nothing' && 'Không trúng'}
                  </Badge>
                </TableCell>
                <TableCell>{prize.win_rate}%</TableCell>
                <TableCell>
                  {prize.quantity_total === -1 ? '∞' : `${prize.quantity_remaining}/${prize.quantity_total}`}
                </TableCell>
                <TableCell>
                  <Badge variant={prize.is_active ? 'default' : 'secondary'}>
                    {prize.is_active ? 'Hoạt động' : 'Tắt'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditPrize(prize)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePrize(prize.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-muted-foreground">Chưa có phần thưởng nào</div>
      )}
    </div>
  );
}

// Reward Exchange Manager (without win rates - direct exchange)
function RewardExchangeManager({ eventId }: { eventId: string }) {
  const { data: prizes, isLoading } = useEventSpinPrizes(eventId);
  const { data: products } = useProducts();
  const { data: vouchers } = useVouchers();
  const createPrize = useCreateSpinPrize();
  const updatePrize = useUpdateSpinPrize();
  const deletePrize = useDeleteSpinPrize();

  const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<EventSpinPrize | null>(null);

  const [prizeForm, setPrizeForm] = useState({
    name: '',
    description: '',
    image_url: '',
    prize_type: 'voucher' as EventSpinPrize['prize_type'],
    prize_reference_id: '' as string,
    prize_value: 0, // Used as points cost for exchange
    quantity_total: -1,
    quantity_remaining: -1,
    sort_order: 0,
    is_active: true,
  });

  const resetPrizeForm = () => {
    setPrizeForm({
      name: '',
      description: '',
      image_url: '',
      prize_type: 'voucher',
      prize_reference_id: '',
      prize_value: 0,
      quantity_total: -1,
      quantity_remaining: -1,
      sort_order: 0,
      is_active: true,
    });
    setEditingPrize(null);
  };

  const handleEditPrize = (prize: EventSpinPrize) => {
    setEditingPrize(prize);
    setPrizeForm({
      name: prize.name,
      description: prize.description || '',
      image_url: prize.image_url || '',
      prize_type: prize.prize_type,
      prize_reference_id: prize.prize_reference_id || '',
      prize_value: prize.prize_value,
      quantity_total: prize.quantity_total,
      quantity_remaining: prize.quantity_remaining,
      sort_order: prize.sort_order,
      is_active: prize.is_active,
    });
    setIsPrizeDialogOpen(true);
  };

  const handleSubmitPrize = async () => {
    if (!prizeForm.name || prizeForm.prize_value <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin và số điểm cần đổi');
      return;
    }

    try {
      const data = {
        ...prizeForm,
        event_id: eventId,
        prize_reference_id: prizeForm.prize_reference_id || null,
        win_rate: 100, // Always 100% for reward exchange
      };

      if (editingPrize) {
        await updatePrize.mutateAsync({ id: editingPrize.id, ...data });
        toast.success('Cập nhật phần thưởng thành công');
      } else {
        await createPrize.mutateAsync(data);
        toast.success('Thêm phần thưởng thành công');
      }
      setIsPrizeDialogOpen(false);
      resetPrizeForm();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phần thưởng này?')) return;
    try {
      await deletePrize.mutateAsync(id);
      toast.success('Xóa phần thưởng thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Phần thưởng đổi điểm</h4>
          <p className="text-sm text-muted-foreground">Người dùng dùng điểm để đổi trực tiếp phần thưởng</p>
        </div>
        <Dialog open={isPrizeDialogOpen} onOpenChange={(open) => {
          setIsPrizeDialogOpen(open);
          if (!open) resetPrizeForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Thêm phần thưởng</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPrize ? 'Sửa phần thưởng' : 'Thêm phần thưởng đổi điểm'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên phần thưởng *</Label>
                <Input
                  value={prizeForm.name}
                  onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                  placeholder="VD: Voucher giảm 50K"
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={prizeForm.description}
                  onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                  placeholder="Mô tả chi tiết phần thưởng..."
                />
              </div>
              <div>
                <Label>Loại phần thưởng</Label>
                <Select
                  value={prizeForm.prize_type}
                  onValueChange={(value: EventSpinPrize['prize_type']) => setPrizeForm({ ...prizeForm, prize_type: value, prize_reference_id: '' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="product">Sản phẩm</SelectItem>
                    <SelectItem value="balance">Số dư</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {prizeForm.prize_type === 'product' && (
                <div>
                  <Label>Chọn sản phẩm</Label>
                  <Select
                    value={prizeForm.prize_reference_id}
                    onValueChange={(value) => setPrizeForm({ ...prizeForm, prize_reference_id: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn sản phẩm..." /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {prizeForm.prize_type === 'voucher' && (
                <div>
                  <Label>Chọn voucher</Label>
                  <Select
                    value={prizeForm.prize_reference_id}
                    onValueChange={(value) => setPrizeForm({ ...prizeForm, prize_reference_id: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn voucher..." /></SelectTrigger>
                    <SelectContent>
                      {vouchers?.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.code} - {v.discount_value}{v.discount_type === 'percentage' ? '%' : 'đ'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {prizeForm.prize_type === 'balance' && (
                <div>
                  <Label>Số tiền nhận được</Label>
                  <Input
                    type="number"
                    min={0}
                    value={prizeForm.prize_value}
                    onChange={(e) => setPrizeForm({ ...prizeForm, prize_value: parseInt(e.target.value) || 0 })}
                    placeholder="VD: 50000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Với loại balance, số này là số tiền user nhận được</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số điểm cần đổi *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={prizeForm.prize_type === 'balance' ? prizeForm.sort_order : prizeForm.prize_value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (prizeForm.prize_type === 'balance') {
                        setPrizeForm({ ...prizeForm, sort_order: val });
                      } else {
                        setPrizeForm({ ...prizeForm, prize_value: val });
                      }
                    }}
                    placeholder="VD: 100"
                  />
                </div>
                <div>
                  <Label>Số lượng (-1 = vô hạn)</Label>
                  <Input
                    type="number"
                    min={-1}
                    value={prizeForm.quantity_total}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || -1;
                      setPrizeForm({ ...prizeForm, quantity_total: qty, quantity_remaining: qty });
                    }}
                  />
                </div>
              </div>
              <ImageUrlInput
                value={prizeForm.image_url || ''}
                onChange={(url) => setPrizeForm({ ...prizeForm, image_url: url })}
                label="Ảnh phần thưởng"
                folder="event-prizes"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={prizeForm.is_active}
                  onCheckedChange={(checked) => setPrizeForm({ ...prizeForm, is_active: checked })}
                />
                <Label>Kích hoạt</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPrizeDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleSubmitPrize} disabled={createPrize.isPending || updatePrize.isPending}>
                  {editingPrize ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Đang tải...</div>
      ) : prizes && prizes.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phần thưởng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Điểm cần đổi</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizes.map((prize) => (
              <TableRow key={prize.id}>
                <TableCell className="font-medium">{prize.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {prize.prize_type === 'voucher' && 'Voucher'}
                    {prize.prize_type === 'product' && 'Sản phẩm'}
                    {prize.prize_type === 'balance' && 'Số dư'}
                    {prize.prize_type === 'points' && 'Điểm'}
                  </Badge>
                </TableCell>
                <TableCell>{prize.prize_value} điểm</TableCell>
                <TableCell>
                  {prize.quantity_total === -1 ? '∞' : `${prize.quantity_remaining}/${prize.quantity_total}`}
                </TableCell>
                <TableCell>
                  <Badge variant={prize.is_active ? 'default' : 'secondary'}>
                    {prize.is_active ? 'Hoạt động' : 'Tắt'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditPrize(prize)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePrize(prize.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-muted-foreground">Chưa có phần thưởng nào</div>
      )}
    </div>
  );
}