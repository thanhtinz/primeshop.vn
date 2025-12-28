import React, { useState } from 'react';
import { 
  useGameAccountInventory, 
  useAddMultipleGameAccounts, 
  useDeleteGameAccount,
  useUpdateGameAccount 
} from '@/hooks/useGameAccountInventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Trash2, 
  Plus, 
  Package, 
  Eye, 
  EyeOff, 
  ShoppingCart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDateFormat } from '@/hooks/useDateFormat';

interface Props {
  productId: string;
  productName: string;
}

const statusConfig = {
  available: { label: 'Có sẵn', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Package },
  sold: { label: 'Đã bán', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: ShoppingCart },
  hidden: { label: 'Đã ẩn', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: EyeOff },
};

export const GameAccountInventoryManager: React.FC<Props> = ({ productId, productName }) => {
  const { formatDateTime } = useDateFormat();
  const { data: accounts, isLoading } = useGameAccountInventory(productId);
  const addAccounts = useAddMultipleGameAccounts();
  const deleteAccount = useDeleteGameAccount();
  const updateAccount = useUpdateGameAccount();
  
  const [bulkInput, setBulkInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<string | null>(null);

  const availableCount = accounts?.filter(a => a.status === 'available').length || 0;
  const soldCount = accounts?.filter(a => a.status === 'sold').length || 0;
  const hiddenCount = accounts?.filter(a => a.status === 'hidden').length || 0;

  const handleAddAccounts = async () => {
    if (!bulkInput.trim()) {
      toast.error('Vui lòng nhập thông tin account');
      return;
    }

    // Split by newline, each line is one account
    const accountsList = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (accountsList.length === 0) {
      toast.error('Không tìm thấy account hợp lệ');
      return;
    }

    try {
      await addAccounts.mutateAsync({ productId, accounts: accountsList });
      toast.success(`Đã thêm ${accountsList.length} account`);
      setBulkInput('');
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi thêm account');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount.mutateAsync(id);
      toast.success('Đã xóa account');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xóa');
    }
  };

  const handleToggleHidden = async (account: any) => {
    try {
      const newStatus = account.status === 'hidden' ? 'available' : 'hidden';
      await updateAccount.mutateAsync({ id: account.id, status: newStatus });
      toast.success(newStatus === 'hidden' ? 'Đã ẩn account' : 'Đã hiện account');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Kho Account</CardTitle>
            <CardDescription>{productName}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Thêm Account vào kho</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nhập thông tin account (mỗi dòng 1 account)</Label>
                  <Textarea
                    placeholder={`Ví dụ:\nusername1|password1|email1\nusername2|password2|email2\n...`}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mỗi dòng là một account. Định dạng tùy ý (VD: user|pass hoặc user:pass:email)
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleAddAccounts} disabled={addAccounts.isPending}>
                    {addAccounts.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Thêm
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-green-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{availableCount}</div>
            <div className="text-xs text-muted-foreground">Có sẵn</div>
          </div>
          <div className="rounded-lg border border-border bg-blue-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{soldCount}</div>
            <div className="text-xs text-muted-foreground">Đã bán</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-gray-500">{hiddenCount}</div>
            <div className="text-xs text-muted-foreground">Đã ẩn</div>
          </div>
        </div>

        {/* Random mode indicator */}
        {availableCount > 1 && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">
              Chế độ Random: Khách hàng sẽ nhận ngẫu nhiên 1 trong {availableCount} account
            </span>
          </div>
        )}

        {/* Account list */}
        {accounts && accounts.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {accounts.map((account) => {
              const config = statusConfig[account.status as keyof typeof statusConfig];
              const Icon = config.icon;
              
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      {viewingAccount === account.id ? (
                        <p className="font-mono text-sm break-all">{account.account_data}</p>
                      ) : (
                        <p className="font-mono text-sm text-muted-foreground">
                          ••••••••••••••••
                        </p>
                      )}
                      {account.sold_at && (
                        <p className="text-xs text-muted-foreground">
                          Bán: {formatDateTime(account.sold_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewingAccount(viewingAccount === account.id ? null : account.id)}
                    >
                      {viewingAccount === account.id ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {account.status !== 'sold' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleHidden(account)}
                        >
                          {account.status === 'hidden' ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Account này sẽ bị xóa vĩnh viễn khỏi kho.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(account.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có account nào trong kho</p>
            <p className="text-sm">Thêm account để bắt đầu bán</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
