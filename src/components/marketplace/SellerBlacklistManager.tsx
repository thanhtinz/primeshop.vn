import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Ban, Plus, Trash2, Search, UserX } from 'lucide-react';
import { useSellerBlacklist, useAddToBlacklist, useRemoveFromBlacklist } from '@/hooks/useSellerBlacklist';
import { useSearchUsers } from '@/hooks/useWallet';
import { Seller } from '@/hooks/useMarketplace';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerBlacklistManagerProps {
  seller: Seller;
}

export const SellerBlacklistManager = ({ seller }: SellerBlacklistManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; username: string; full_name: string; avatar_url: string } | null>(null);
  const { formatDate } = useDateFormat();
  const [reason, setReason] = useState('');

  const { data: blacklist, isLoading } = useSellerBlacklist(seller.id);
  const { data: searchResults } = useSearchUsers(searchQuery);
  const addToBlacklist = useAddToBlacklist();
  const removeFromBlacklist = useRemoveFromBlacklist();

  const handleAdd = () => {
    if (!selectedUser) {
      toast.error('Vui lòng chọn người dùng');
      return;
    }

    addToBlacklist.mutate({
      sellerId: seller.id,
      buyerId: selectedUser.user_id,
      reason: reason || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedUser(null);
        setSearchQuery('');
        setReason('');
      },
    });
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
          <h3 className="text-lg font-semibold">Danh sách đen</h3>
          <p className="text-sm text-muted-foreground">
            Chặn người mua có hành vi xấu
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm vào DS đen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm vào danh sách đen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tìm người dùng</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Nhập username hoặc email"
                    className="pl-9"
                  />
                </div>
              </div>

              {searchQuery && searchResults && searchResults.length > 0 && !selectedUser && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.map(user => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchQuery('');
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.full_name || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.avatar_url} />
                        <AvatarFallback>{selectedUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                        <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Lý do (không bắt buộc)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Hủy đơn nhiều lần, spam..."
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAdd}
                disabled={!selectedUser || addToBlacklist.isPending}
              >
                {addToBlacklist.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Ban className="h-4 w-4 mr-2" />
                Thêm vào danh sách đen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Blacklist */}
      {blacklist?.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Danh sách đen trống</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blacklist?.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.buyer?.avatar_url} />
                      <AvatarFallback>
                        {item.buyer?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {item.buyer?.full_name || item.buyer?.username || 'Người dùng'}
                      </p>
                      {item.buyer?.username && (
                        <p className="text-sm text-muted-foreground">@{item.buyer.username}</p>
                      )}
                      {item.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Lý do: {item.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Thêm ngày: {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa khỏi danh sách đen?')) {
                        removeFromBlacklist.mutate(item.id);
                      }
                    }}
                    disabled={removeFromBlacklist.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerBlacklistManager;
