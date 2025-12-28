import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useJoinGroup } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GroupDiscoverCardProps {
  id: string;
  name: string;
  cover_url?: string | null;
  avatar_url?: string | null;
  visibility: 'public' | 'private' | 'hidden';
  member_count: number;
  onDismiss?: (id: string) => void;
}

export function GroupDiscoverCard({
  id,
  name,
  cover_url,
  avatar_url,
  visibility,
  member_count,
  onDismiss,
}: GroupDiscoverCardProps) {
  const { user } = useAuth();
  const joinGroup = useJoinGroup();
  
  // Get mutual friends who are members of this group
  const { data: mutualFriends } = useQuery({
    queryKey: ['group-mutual-friends', id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user's friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      if (!friendships || friendships.length === 0) return [];
      
      const friendIds = friendships.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );
      
      // Get friends who are members of this group
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', id)
        .eq('is_active', true)
        .in('user_id', friendIds);
      
      if (!members || members.length === 0) return [];
      
      // Get profiles of these friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', members.map(m => m.user_id))
        .limit(3);
      
      return profiles || [];
    },
    enabled: !!user,
  });
  
  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    joinGroup.mutate({ groupId: id });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDismiss?.(id);
  };

  const visibilityLabel = visibility === 'public' ? 'Nhóm Công khai' : 'Nhóm Riêng tư';

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <Link to={`/groups/${id}`} className="block relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {(cover_url || avatar_url) && (
            <img 
              src={cover_url || avatar_url || undefined} 
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
          {/* Dismiss button */}
          {onDismiss && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Link>
      
      <div className="p-3">
        <Link to={`/groups/${id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        
        <p className="text-xs text-muted-foreground mt-1">
          {visibilityLabel} · {member_count >= 1000 
            ? `${Math.floor(member_count / 1000)}K` 
            : member_count
          } thành viên
        </p>
        
        {/* Mutual friends */}
        {mutualFriends && mutualFriends.length > 0 ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-2">
              {mutualFriends.slice(0, 3).map((friend) => (
                <Avatar key={friend.user_id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted">
                    {friend.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {mutualFriends.length === 1 
                ? `${mutualFriends[0].full_name} là thành viên`
                : `${mutualFriends[0].full_name} và ${mutualFriends.length - 1} bạn bè khác là thành viên`
              }
            </span>
          </div>
        ) : (
          <div className="h-8 mt-2" /> // Spacer when no mutual friends
        )}
        
        <Button 
          className="w-full mt-3"
          onClick={handleJoin}
          disabled={joinGroup.isPending}
        >
          Tham gia
        </Button>
      </div>
    </Card>
  );
}
