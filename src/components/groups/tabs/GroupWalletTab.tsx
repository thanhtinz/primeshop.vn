import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useGroupWallet, useGroupWalletTransactions, useAddWalletIncome, useAddWalletExpense } from '@/hooks/useGroupWallet';
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface GroupWalletTabProps {
  groupId: string;
  canManage: boolean;
}

const categoryLabels: Record<string, string> = {
  entry_fee: 'Phí vào',
  monthly_fee: 'Phí tháng',
  deal_fee: 'Phí deal',
  other_income: 'Thu khác',
  member_reward: 'Thưởng member',
  project_cost: 'Chi phí dự án',
  refund: 'Hoàn tiền',
  other_expense: 'Chi khác',
};

export function GroupWalletTab({ groupId, canManage }: GroupWalletTabProps) {
  const { data: wallet, isLoading: walletLoading } = useGroupWallet(groupId);
  const { data: transactions, isLoading: txLoading } = useGroupWalletTransactions(groupId);
  const { formatDateTime } = useDateFormat();
  const addIncome = useAddWalletIncome();
  const addExpense = useAddWalletExpense();
  
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    description: '',
  });
  
  const handleAddIncome = async () => {
    await addIncome.mutateAsync({
      groupId,
      amount: formData.amount,
      category: formData.category as any,
      description: formData.description,
    });
    setIncomeOpen(false);
    resetForm();
  };
  
  const handleAddExpense = async () => {
    await addExpense.mutateAsync({
      groupId,
      amount: formData.amount,
      category: formData.category as any,
      description: formData.description,
    });
    setExpenseOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setFormData({ amount: 0, category: '', description: '' });
  };
  
  if (walletLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số dư</p>
                <p className="text-2xl font-bold">{(wallet?.balance || 0).toLocaleString()}đ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng thu</p>
                <p className="text-2xl font-bold text-green-600">
                  {(wallet?.total_income || 0).toLocaleString()}đ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng chi</p>
                <p className="text-2xl font-bold text-red-600">
                  {(wallet?.total_expense || 0).toLocaleString()}đ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions */}
      {canManage && (
        <div className="flex gap-2">
          <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm thu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm khoản thu</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Số tiền *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry_fee">Phí vào</SelectItem>
                      <SelectItem value="monthly_fee">Phí tháng</SelectItem>
                      <SelectItem value="deal_fee">Phí deal</SelectItem>
                      <SelectItem value="other_income">Thu khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddIncome}
                  disabled={addIncome.isPending || !formData.amount || !formData.category}
                >
                  {addIncome.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Thêm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Minus className="h-4 w-4" />
                Thêm chi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm khoản chi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Số tiền *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member_reward">Thưởng member</SelectItem>
                      <SelectItem value="project_cost">Chi phí dự án</SelectItem>
                      <SelectItem value="refund">Hoàn tiền</SelectItem>
                      <SelectItem value="other_expense">Chi khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddExpense}
                  disabled={addExpense.isPending || !formData.amount || !formData.category}
                >
                  {addExpense.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Thêm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Chưa có giao dịch</p>
          ) : (
            <div className="space-y-3">
              {transactions?.map((tx) => {
                const isIncome = tx.type === 'income';
                
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {isIncome ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {categoryLabels[tx.category] || tx.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(tx.created_at, 'dd/MM HH:mm')}
                        </span>
                      </div>
                      {tx.description && (
                        <p className="text-sm text-muted-foreground">{tx.description}</p>
                      )}
                    </div>
                    <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{tx.amount.toLocaleString()}đ
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
