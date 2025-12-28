import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { REACTION_EMOJIS, ReactionType } from './ReactionPicker';

interface ReactionUser {
  id: string;
  user_id: string;
  reaction_type: string;
  user_profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    username?: string;
  } | null;
}

interface ReactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reactions: ReactionUser[];
  isLoading?: boolean;
  totalCount: number;
  reactionCounts: Record<string, number>;
}

export function ReactionsModal({ 
  open, 
  onOpenChange, 
  reactions, 
  isLoading,
  totalCount,
  reactionCounts 
}: ReactionsModalProps) {
  const activeReactionTypes = (Object.keys(REACTION_EMOJIS) as ReactionType[]).filter(
    type => (reactionCounts[type] || 0) > 0
  );

  const renderUserList = (users: ReactionUser[]) => (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 p-2">
        {users.map((reaction) => (
          <Link
            key={reaction.id}
            to={`/user/${reaction.user_profile?.username || reaction.user_id}`}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={reaction.user_profile?.avatar_url || ''} />
                <AvatarFallback>
                  {reaction.user_profile?.full_name?.[0] || reaction.user_profile?.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 text-sm">
                {REACTION_EMOJIS[reaction.reaction_type as ReactionType]?.emoji || '👍'}
              </span>
            </div>
            <span className="font-medium">
              {reaction.user_profile?.full_name || reaction.user_profile?.email || 'Người dùng'}
            </span>
          </Link>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cảm xúc</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full flex overflow-x-auto">
              <TabsTrigger value="all" className="flex-1 gap-1">
                Tất cả <span className="text-muted-foreground">{totalCount}</span>
              </TabsTrigger>
              {activeReactionTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="flex-1 gap-1">
                  <span>{REACTION_EMOJIS[type].emoji}</span>
                  <span className="text-muted-foreground">{reactionCounts[type]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {renderUserList(reactions)}
            </TabsContent>
            
            {activeReactionTypes.map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                {renderUserList(reactions.filter(r => r.reaction_type === type))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
