import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, Check, Loader2, X, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreateGroupDialogProps {
  onGroupCreated?: (roomId: string) => void;
  children?: React.ReactNode;
}

export function CreateGroupDialog({ onGroupCreated, children }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      searchUsers();
    } else if (searchQuery.length < 2) {
      setUsers([]);
    }
  }, [searchQuery, open]);

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, email')
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

  const toggleUser = (userInfo: any) => {
    setSelectedUsers(prev => 
      prev.some(u => u.user_id === userInfo.user_id)
        ? prev.filter(u => u.user_id !== userInfo.user_id)
        : [...prev, userInfo]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error('Nhóm cần ít nhất 3 thành viên (bao gồm bạn)');
      return;
    }

    setIsCreating(true);
    try {
      // Create group chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: user?.id,
          subject: groupName,
          group_name: groupName,
          is_group: true,
          room_type: 'user'
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add all selected members to the group
      const members = [
        { room_id: room.id, user_id: user?.id },
        ...selectedUsers.map(u => ({ room_id: room.id, user_id: u.user_id }))
      ];

      const { error: membersError } = await supabase
        .from('chat_room_members')
        .insert(members);

      if (membersError) throw membersError;

      toast.success(`Đã tạo nhóm "${groupName}" với ${selectedUsers.length + 1} thành viên`);
      
      setOpen(false);
      setGroupName('');
      setSelectedUsers([]);
      setSearchQuery('');
      
      onGroupCreated?.(room.id);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Không thể tạo nhóm');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Users className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tạo nhóm chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label>Tên nhóm</Label>
            <Input 
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Selected Members */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Thành viên đã chọn ({selectedUsers.length + 1})</Label>
              <div className="flex flex-wrap gap-2">
                {/* Current user */}
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                  <span>Bạn</span>
                </div>
                {selectedUsers.map(userInfo => (
                  <div 
                    key={userInfo.user_id}
                    className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{userInfo.full_name || userInfo.username || 'User'}</span>
                    <button onClick={() => toggleUser(userInfo)}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="space-y-2">
            <Label>Thêm thành viên</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User List */}
          <ScrollArea className="h-[250px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nhập ít nhất 2 ký tự để tìm kiếm
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Không tìm thấy người dùng
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((userInfo) => {
                  const isSelected = selectedUsers.some(u => u.user_id === userInfo.user_id);
                  return (
                    <button
                      key={userInfo.user_id}
                      onClick={() => toggleUser(userInfo)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                        isSelected ? "bg-blue-500/10" : "hover:bg-secondary"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userInfo.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
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
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreating || !groupName.trim() || selectedUsers.length < 2}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Tạo nhóm
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
