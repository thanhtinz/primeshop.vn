import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Search, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AddPeopleDialogProps {
  roomId?: string;
  onCreateRoom?: (userId: string, userName: string) => Promise<void>;
  children?: React.ReactNode;
}

export function AddPeopleDialog({ roomId, onCreateRoom, children }: AddPeopleDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, open]);

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .neq('user_id', user?.id)
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddPeople = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người');
      return;
    }

    setIsAdding(true);
    try {
      if (onCreateRoom && selectedUsers.length === 1) {
        // Create new chat room with selected user
        const selectedUser = users.find(u => u.user_id === selectedUsers[0]);
        await onCreateRoom(selectedUsers[0], selectedUser?.full_name || selectedUser?.username || 'Người dùng');
      } else if (roomId) {
        // Add members to existing room
        const membersToAdd = selectedUsers.map(userId => ({
          room_id: roomId,
          user_id: userId
        }));

        const { error } = await supabase
          .from('chat_room_members')
          .insert(membersToAdd);

        if (error) throw error;
        toast.success(`Đã thêm ${selectedUsers.length} người vào cuộc trò chuyện`);
      }

      setOpen(false);
      setSelectedUsers([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding people:', error);
      toast.error('Không thể thêm người');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserPlus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm người vào cuộc trò chuyện</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(userId => {
                const userInfo = users.find(u => u.user_id === userId);
                return (
                  <div 
                    key={userId}
                    className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{userInfo?.full_name || userInfo?.username || 'User'}</span>
                    <button onClick={() => toggleUser(userId)}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* User List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nhập ít nhất 2 ký tự để tìm kiếm
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy người dùng
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((userInfo) => (
                  <button
                    key={userInfo.user_id}
                    onClick={() => toggleUser(userInfo.user_id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                      selectedUsers.includes(userInfo.user_id)
                        ? "bg-blue-500/10"
                        : "hover:bg-secondary"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userInfo.avatar_url} />
                      <AvatarFallback>
                        {(userInfo.full_name || userInfo.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">
                        {userInfo.full_name || userInfo.username || 'Người dùng'}
                      </p>
                      {userInfo.username && (
                        <p className="text-sm text-muted-foreground">@{userInfo.username}</p>
                      )}
                    </div>
                    {selectedUsers.includes(userInfo.user_id) && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleAddPeople} 
            disabled={isAdding || selectedUsers.length === 0}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Thêm ({selectedUsers.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
