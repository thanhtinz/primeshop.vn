import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useSearchUsersToInvite, useInviteToGroup, useCreateInviteLink } from '@/hooks/useGroupInvitations';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserPlus, Link2, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InviteToGroupDialogProps {
  groupId: string;
  groupName: string;
  trigger?: React.ReactNode;
}

export function InviteToGroupDialog({ groupId, groupName, trigger }: InviteToGroupDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { data: searchResults = [], isLoading: isSearching } = useSearchUsersToInvite(search, groupId);
  const { data: friends = [] } = useFriends(user?.id);
  const inviteUser = useInviteToGroup();
  const createLink = useCreateInviteLink();

  const handleInvite = async (userId: string) => {
    await inviteUser.mutateAsync({ groupId, userId });
  };

  const handleCreateLink = async () => {
    const result = await createLink.mutateAsync({ groupId, expiresInDays: 7 });
    const link = `${window.location.origin}/groups/${groupId}?code=${result.invite_code}`;
    setInviteLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Đã copy link mời!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter friends not in group
  const friendsToInvite = friends.filter(f => {
    const friendId = f.friend_profile?.user_id;
    return !searchResults.find(s => s.user_id === friendId);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Mời
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mời vào {groupName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="search">Tìm kiếm</TabsTrigger>
            <TabsTrigger value="link">Tạo link</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : search.length >= 2 && searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div 
                    key={user.user_id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.full_name || 'Người dùng'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user.user_id)}
                      disabled={inviteUser.isPending}
                    >
                      {inviteUser.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mời'
                      )}
                    </Button>
                  </div>
                ))
              ) : search.length >= 2 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Không tìm thấy người dùng
                </p>
              ) : friendsToInvite.length > 0 ? (
                <>
                  <Label className="text-xs text-muted-foreground">Bạn bè của bạn</Label>
                  {friendsToInvite.slice(0, 5).map(friend => (
                    <div 
                      key={friend.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.friend_profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {friend.friend_profile?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm">
                          {friend.friend_profile?.full_name || 'Bạn bè'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(friend.friend_profile?.user_id!)}
                        disabled={inviteUser.isPending}
                      >
                        Mời
                      </Button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Nhập tên hoặc email để tìm kiếm
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            {!inviteLink ? (
              <div className="text-center py-8">
                <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Tạo link mời để chia sẻ với mọi người
                </p>
                <Button onClick={handleCreateLink} disabled={createLink.isPending}>
                  {createLink.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Tạo link mời
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Link mời (có hiệu lực 7 ngày)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      value={inviteLink} 
                      readOnly 
                      className="text-sm"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setInviteLink('')}
                >
                  Tạo link mới
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
