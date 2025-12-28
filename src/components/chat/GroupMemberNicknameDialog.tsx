import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Loader2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMemberNicknameDialogProps {
  roomId: string;
  isGroup?: boolean;
  children?: React.ReactNode;
  onUpdate?: () => void;
}

interface MemberWithNickname {
  user_id: string;
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  nickname: string | null;
}

export function GroupMemberNicknameDialog({ roomId, isGroup, children, onUpdate }: GroupMemberNicknameDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<MemberWithNickname[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, roomId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Get room members
      const { data: roomMembers, error: membersError } = await supabase
        .from('chat_room_members')
        .select('user_id')
        .eq('room_id', roomId);

      if (membersError) throw membersError;

      // Also get room creator and target user
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('user_id, target_user_id')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Combine all user IDs
      const memberIds = [
        ...new Set([
          room.user_id,
          room.target_user_id,
          ...(roomMembers?.map(m => m.user_id) || [])
        ].filter(Boolean))
      ].filter(id => id !== user?.id) as string[];

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, email')
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;

      // Get nicknames set by current user
      const { data: nicknames, error: nicknamesError } = await supabase
        .from('chat_member_nicknames')
        .select('target_user_id, nickname')
        .eq('room_id', roomId)
        .eq('setter_user_id', user?.id);

      if (nicknamesError && nicknamesError.code !== 'PGRST116') throw nicknamesError;

      const nicknameMap = new Map(nicknames?.map(n => [n.target_user_id, n.nickname]));

      setMembers(memberIds.map(userId => ({
        user_id: userId,
        profile: profiles?.find(p => p.user_id === userId) || null,
        nickname: nicknameMap.get(userId) || null
      })));
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (userId: string, currentNickname: string | null) => {
    setEditingUserId(userId);
    setEditNickname(currentNickname || '');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditNickname('');
  };

  const handleSaveNickname = async (targetUserId: string) => {
    setIsSaving(true);
    try {
      if (editNickname.trim()) {
        // Upsert nickname
        const { error } = await supabase
          .from('chat_member_nicknames')
          .upsert({
            room_id: roomId,
            setter_user_id: user?.id,
            target_user_id: targetUserId,
            nickname: editNickname.trim(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'room_id,setter_user_id,target_user_id'
          });

        if (error) throw error;
        toast.success('Đã lưu biệt danh');
      } else {
        // Delete nickname if empty
        const { error } = await supabase
          .from('chat_member_nicknames')
          .delete()
          .eq('room_id', roomId)
          .eq('setter_user_id', user?.id)
          .eq('target_user_id', targetUserId);

        if (error) throw error;
        toast.success('Đã xóa biệt danh');
      }

      // Update local state
      setMembers(prev => prev.map(m => 
        m.user_id === targetUserId 
          ? { ...m, nickname: editNickname.trim() || null }
          : m
      ));
      
      setEditingUserId(null);
      setEditNickname('');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving nickname:', error);
      toast.error('Không thể lưu biệt danh');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Thành viên & Biệt danh
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isGroup ? 'Thành viên nhóm' : 'Đặt biệt danh'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có thành viên nào
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {members.map((member) => {
                const displayName = member.profile?.full_name || member.profile?.username || 'Người dùng';
                const isEditing = editingUserId === member.user_id;
                
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {displayName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName}</p>
                      {member.nickname && !isEditing && (
                        <p className="text-sm text-muted-foreground truncate">
                          Biệt danh: {member.nickname}
                        </p>
                      )}
                      
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            placeholder="Nhập biệt danh..."
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleSaveNickname(member.user_id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleStartEdit(member.user_id, member.nickname)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
