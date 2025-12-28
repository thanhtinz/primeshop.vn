import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Trash2, Calculator, Users, Copy, Download, 
  Lock, History, RefreshCw, Share2, AlertTriangle, 
  CheckCircle2, Percent, DollarSign, Divide, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDateFormat } from '@/hooks/useDateFormat';

interface Participant {
  id: string;
  name: string;
  percentage: number;
  fixedAmount: number;
  calculatedAmount: number;
  notes: string;
}

interface Session {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  splitType: 'percentage' | 'fixed' | 'equal';
  platformFeePercent: number;
  platformFeeAmount: number;
  intermediaryFeePercent: number;
  intermediaryFeeAmount: number;
  totalExpense: number;
  totalIncome: number;
  profitLoss: number;
  notes: string;
  isLocked: boolean;
  shareToken: string | null;
  createdAt: string;
  participants: Participant[];
}

const CURRENCIES = [
  { value: 'VND', label: 'VNĐ', symbol: '₫' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'USDT', label: 'USDT', symbol: '₮' },
];

export function MoneySplitter() {
  const { user } = useAuth();
  const { formatDateTime } = useDateFormat();
  const [activeTab, setActiveTab] = useState('calculator');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Calculator state
  const [title, setTitle] = useState('Phiên chia tiền');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('VND');
  const [splitType, setSplitType] = useState<'percentage' | 'fixed' | 'equal'>('percentage');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: '', percentage: 0, fixedAmount: 0, calculatedAmount: 0, notes: '' }
  ]);
  
  // Fees
  const [platformFeePercent, setPlatformFeePercent] = useState(0);
  const [platformFeeAmount, setPlatformFeeAmount] = useState(0);
  const [intermediaryFeePercent, setIntermediaryFeePercent] = useState(0);
  const [intermediaryFeeAmount, setIntermediaryFeeAmount] = useState(0);
  const [feeType, setFeeType] = useState<'percent' | 'fixed'>('percent');

  // Profit/Loss
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [notes, setNotes] = useState('');

  // Calculations
  const totalFees = useMemo(() => {
    if (feeType === 'percent') {
      return (totalAmount * (platformFeePercent + intermediaryFeePercent)) / 100;
    }
    return platformFeeAmount + intermediaryFeeAmount;
  }, [totalAmount, platformFeePercent, intermediaryFeePercent, platformFeeAmount, intermediaryFeeAmount, feeType]);

  const amountAfterFees = useMemo(() => {
    return Math.max(0, totalAmount - totalFees);
  }, [totalAmount, totalFees]);

  const profitLoss = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const totalPercentage = useMemo(() => {
    return participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
  }, [participants]);

  const totalFixedAmount = useMemo(() => {
    return participants.reduce((sum, p) => sum + (p.fixedAmount || 0), 0);
  }, [participants]);

  const isValid = useMemo(() => {
    if (splitType === 'percentage') {
      return Math.abs(totalPercentage - 100) < 0.01;
    }
    if (splitType === 'fixed') {
      return Math.abs(totalFixedAmount - amountAfterFees) < 0.01;
    }
    return true;
  }, [splitType, totalPercentage, totalFixedAmount, amountAfterFees]);

  // Calculate amounts for each participant
  useEffect(() => {
    const updated = participants.map(p => {
      let calculated = 0;
      if (splitType === 'percentage') {
        calculated = (amountAfterFees * p.percentage) / 100;
      } else if (splitType === 'fixed') {
        calculated = p.fixedAmount;
      } else if (splitType === 'equal') {
        calculated = amountAfterFees / participants.length;
      }

      // If profit/loss mode, adjust by profit/loss ratio
      if (profitLoss !== 0 && splitType === 'percentage') {
        const ratio = p.percentage / 100;
        calculated = profitLoss * ratio;
      }

      return { ...p, calculatedAmount: calculated };
    });
    setParticipants(updated);
  }, [amountAfterFees, splitType, profitLoss]);

  const addParticipant = () => {
    setParticipants([
      ...participants,
      { id: Date.now().toString(), name: '', percentage: 0, fixedAmount: 0, calculatedAmount: 0, notes: '' }
    ]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string | number) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const splitEqually = () => {
    const equalPercent = 100 / participants.length;
    setParticipants(participants.map(p => ({ ...p, percentage: equalPercent })));
  };

  const formatCurrency = (amount: number) => {
    const curr = CURRENCIES.find(c => c.value === currency);
    if (currency === 'VND') {
      return `${amount.toLocaleString('vi-VN')}${curr?.symbol}`;
    }
    return `${curr?.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Load sessions
  const loadSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('money_split_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load participants for each session
      const sessionsWithParticipants = await Promise.all(
        (data || []).map(async (session) => {
          const { data: participantsData } = await supabase
            .from('money_split_participants')
            .select('*')
            .eq('session_id', session.id);

          return {
            id: session.id,
            title: session.title,
            totalAmount: Number(session.total_amount),
            currency: session.currency,
            splitType: session.split_type as 'percentage' | 'fixed' | 'equal',
            platformFeePercent: Number(session.platform_fee_percent),
            platformFeeAmount: Number(session.platform_fee_amount),
            intermediaryFeePercent: Number(session.intermediary_fee_percent),
            intermediaryFeeAmount: Number(session.intermediary_fee_amount),
            totalExpense: Number(session.total_expense),
            totalIncome: Number(session.total_income),
            profitLoss: Number(session.profit_loss),
            notes: session.notes || '',
            isLocked: session.is_locked,
            shareToken: session.share_token,
            createdAt: session.created_at,
            participants: (participantsData || []).map(p => ({
              id: p.id,
              name: p.name,
              percentage: Number(p.percentage),
              fixedAmount: Number(p.fixed_amount),
              calculatedAmount: Number(p.calculated_amount),
              notes: p.notes || '',
            })),
          };
        })
      );

      setSessions(sessionsWithParticipants);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // Save session
  const saveSession = async (lock = false) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu');
      return;
    }

    if (!isValid) {
      toast.error('Dữ liệu không hợp lệ');
      return;
    }

    if (participants.some(p => !p.name.trim())) {
      toast.error('Vui lòng nhập tên tất cả người tham gia');
      return;
    }

    try {
      const shareToken = lock ? crypto.randomUUID().substring(0, 8) : null;
      
      const { data: session, error: sessionError } = await supabase
        .from('money_split_sessions')
        .insert({
          user_id: user.id,
          title,
          total_amount: totalAmount,
          currency,
          split_type: splitType,
          platform_fee_percent: feeType === 'percent' ? platformFeePercent : 0,
          platform_fee_amount: feeType === 'fixed' ? platformFeeAmount : 0,
          intermediary_fee_percent: feeType === 'percent' ? intermediaryFeePercent : 0,
          intermediary_fee_amount: feeType === 'fixed' ? intermediaryFeeAmount : 0,
          total_expense: totalExpense,
          total_income: totalIncome,
          profit_loss: profitLoss,
          notes,
          share_token: shareToken,
          is_locked: lock,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Save participants
      const { error: participantsError } = await supabase
        .from('money_split_participants')
        .insert(
          participants.map(p => ({
            session_id: session.id,
            name: p.name,
            percentage: p.percentage,
            fixed_amount: p.fixedAmount,
            calculated_amount: p.calculatedAmount,
            notes: p.notes,
          }))
        );

      if (participantsError) throw participantsError;

      toast.success(lock ? 'Đã lưu và khóa phiên' : 'Đã lưu phiên');
      loadSessions();
      resetForm();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Lỗi khi lưu');
    }
  };

  const resetForm = () => {
    setTitle('Phiên chia tiền');
    setTotalAmount(0);
    setSplitType('percentage');
    setParticipants([{ id: '1', name: '', percentage: 0, fixedAmount: 0, calculatedAmount: 0, notes: '' }]);
    setPlatformFeePercent(0);
    setPlatformFeeAmount(0);
    setIntermediaryFeePercent(0);
    setIntermediaryFeeAmount(0);
    setTotalExpense(0);
    setTotalIncome(0);
    setNotes('');
  };

  const cloneSession = (session: Session) => {
    setTitle(`${session.title} (copy)`);
    setTotalAmount(session.totalAmount);
    setCurrency(session.currency);
    setSplitType(session.splitType);
    setPlatformFeePercent(session.platformFeePercent);
    setPlatformFeeAmount(session.platformFeeAmount);
    setIntermediaryFeePercent(session.intermediaryFeePercent);
    setIntermediaryFeeAmount(session.intermediaryFeeAmount);
    setTotalExpense(session.totalExpense);
    setTotalIncome(session.totalIncome);
    setNotes(session.notes);
    setParticipants(session.participants.map(p => ({ ...p, id: Date.now().toString() + Math.random() })));
    setActiveTab('calculator');
    toast.success('Đã clone phiên - chỉnh sửa và lưu lại');
  };

  const copyShareLink = (shareToken: string) => {
    const link = `${window.location.origin}/utilities/money-split?share=${shareToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Đã copy link chia sẻ');
  };

  const exportCSV = (session: Session) => {
    const headers = ['Tên', 'Tỷ lệ %', 'Số tiền cố định', 'Số tiền nhận', 'Ghi chú'];
    const rows = session.participants.map(p => [
      p.name,
      p.percentage.toString(),
      p.fixedAmount.toString(),
      p.calculatedAmount.toString(),
      p.notes
    ]);

    const csvContent = [
      `Phiên: ${session.title}`,
      `Tổng tiền: ${session.totalAmount} ${session.currency}`,
      `Kiểu chia: ${session.splitType}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chia-tien-${session.id.substring(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  const deleteSession = async (id: string) => {
    try {
      await supabase.from('money_split_sessions').delete().eq('id', id);
      toast.success('Đã xóa phiên');
      loadSessions();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Tính toán
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4 mt-4">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiêu đề phiên</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Chia tiền deal ABC..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Tổng tiền</Label>
                    <Input 
                      type="number"
                      value={totalAmount || ''}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loại tiền</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label} ({c.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kiểu chia</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={splitType === 'percentage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSplitType('percentage')}
                    className="gap-1"
                  >
                    <Percent className="h-3 w-3" />
                    Theo %
                  </Button>
                  <Button 
                    variant={splitType === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSplitType('fixed')}
                    className="gap-1"
                  >
                    <DollarSign className="h-3 w-3" />
                    Số tiền cố định
                  </Button>
                  <Button 
                    variant={splitType === 'equal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSplitType('equal')}
                    className="gap-1"
                  >
                    <Divide className="h-3 w-3" />
                    Chia đều
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Phí & Hoa hồng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-3">
                <Button 
                  variant={feeType === 'percent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeeType('percent')}
                >
                  Theo %
                </Button>
                <Button 
                  variant={feeType === 'fixed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeeType('fixed')}
                >
                  Số tiền cố định
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phí nền tảng {feeType === 'percent' ? '(%)' : ''}</Label>
                  <Input 
                    type="number"
                    value={feeType === 'percent' ? (platformFeePercent || '') : (platformFeeAmount || '')}
                    onChange={(e) => feeType === 'percent' 
                      ? setPlatformFeePercent(Number(e.target.value))
                      : setPlatformFeeAmount(Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phí trung gian {feeType === 'percent' ? '(%)' : ''}</Label>
                  <Input 
                    type="number"
                    value={feeType === 'percent' ? (intermediaryFeePercent || '') : (intermediaryFeeAmount || '')}
                    onChange={(e) => feeType === 'percent'
                      ? setIntermediaryFeePercent(Number(e.target.value))
                      : setIntermediaryFeeAmount(Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span>Tổng phí:</span>
                  <span className="font-medium text-destructive">-{formatCurrency(totalFees)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Còn lại để chia:</span>
                  <span className="font-medium text-primary">{formatCurrency(amountAfterFees)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Calculator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {profitLoss >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                Tính lãi / lỗ (tùy chọn)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tổng chi</Label>
                  <Input 
                    type="number"
                    value={totalExpense || ''}
                    onChange={(e) => setTotalExpense(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tổng thu</Label>
                  <Input 
                    type="number"
                    value={totalIncome || ''}
                    onChange={(e) => setTotalIncome(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              {(totalExpense > 0 || totalIncome > 0) && (
                <div className={`rounded-lg p-3 text-sm ${profitLoss >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="flex justify-between items-center">
                    <span>{profitLoss >= 0 ? 'Lãi:' : 'Lỗ:'}</span>
                    <span className={`font-bold text-lg ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(Math.abs(profitLoss))}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Người tham gia ({participants.length})
                </CardTitle>
                <div className="flex gap-2">
                  {splitType === 'percentage' && (
                    <Button variant="outline" size="sm" onClick={splitEqually}>
                      <Divide className="h-3 w-3 mr-1" />
                      Chia đều %
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={addParticipant}>
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Validation */}
              {splitType === 'percentage' && (
                <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                  isValid ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {isValid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>
                    Tổng: {totalPercentage.toFixed(2)}% 
                    {!isValid && ` (cần 100%)`}
                  </span>
                </div>
              )}

              {splitType === 'fixed' && (
                <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                  isValid ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {isValid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>
                    Tổng: {formatCurrency(totalFixedAmount)} / {formatCurrency(amountAfterFees)}
                  </span>
                </div>
              )}

              {participants.map((p, index) => (
                <div key={p.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                    <Input 
                      placeholder="Tên người tham gia"
                      value={p.name}
                      onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                      className="flex-1"
                    />
                    {participants.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeParticipant(p.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pl-8">
                    {splitType === 'percentage' && (
                      <div className="flex items-center gap-1">
                        <Input 
                          type="number"
                          value={p.percentage || ''}
                          onChange={(e) => updateParticipant(p.id, 'percentage', Number(e.target.value))}
                          className="w-20"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}

                    {splitType === 'fixed' && (
                      <Input 
                        type="number"
                        value={p.fixedAmount || ''}
                        onChange={(e) => updateParticipant(p.id, 'fixedAmount', Number(e.target.value))}
                        className="w-32"
                        placeholder="Số tiền"
                      />
                    )}

                    <div className="flex-1 text-right">
                      <span className="text-sm font-medium text-primary">
                        → {formatCurrency(p.calculatedAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="pl-8">
                    <Input 
                      placeholder="Ghi chú (tùy chọn)"
                      value={p.notes}
                      onChange={(e) => updateParticipant(p.id, 'notes', e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ghi chú chung</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về phiên chia tiền này..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => saveSession(false)} disabled={!user}>
              <History className="h-4 w-4 mr-2" />
              Lưu bản nháp
            </Button>
            <Button onClick={() => saveSession(true)} variant="secondary" disabled={!user}>
              <Lock className="h-4 w-4 mr-2" />
              Lưu & Khóa
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>

          {!user && (
            <p className="text-sm text-muted-foreground">
              Đăng nhập để lưu lịch sử chia tiền
            </p>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {!user ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Đăng nhập để xem lịch sử
              </CardContent>
            </Card>
          ) : loadingSessions ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Đang tải...
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có phiên chia tiền nào
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      {session.isLocked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Đã khóa
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(session.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-lg">{formatCurrency(session.totalAmount)}</span>
                    <Badge variant="outline">
                      {session.splitType === 'percentage' ? 'Theo %' : 
                       session.splitType === 'fixed' ? 'Cố định' : 'Chia đều'}
                    </Badge>
                    <span className="text-muted-foreground">
                      {session.participants.length} người
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {session.participants.map((p) => (
                      <div key={p.id} className="bg-muted/50 rounded p-2">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-primary text-xs">
                          {formatCurrency(p.calculatedAmount)}
                          {session.splitType === 'percentage' && ` (${p.percentage}%)`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => cloneSession(session)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Clone
                    </Button>
                    {session.shareToken && (
                      <Button variant="outline" size="sm" onClick={() => copyShareLink(session.shareToken!)}>
                        <Share2 className="h-3 w-3 mr-1" />
                        Copy link
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => exportCSV(session)}>
                      <Download className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                    {!session.isLocked && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteSession(session.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Xóa
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}