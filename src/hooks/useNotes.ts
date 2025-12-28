import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Note {
  id: string;
  user_id: string;
  content: string;
  background_style: string;
  music_url?: string;
  music_name?: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  user_profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  reactions?: { emoji: string; count: number }[];
  my_reaction?: string;
}

// Fetch notes from friends/following
export const useNotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      // Get notes that haven't expired
      const { data: notes, error } = await supabase
        .from('user_notes')
        .select('*')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(notes?.map(n => n.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Get reactions for each note
      const noteIds = notes?.map(n => n.id) || [];
      const { data: reactions } = await supabase
        .from('note_reactions')
        .select('note_id, emoji, user_id')
        .in('note_id', noteIds);

      // Group reactions by note
      const reactionMap = new Map<string, { emoji: string; count: number }[]>();
      const myReactionMap = new Map<string, string>();

      reactions?.forEach(r => {
        if (!reactionMap.has(r.note_id)) {
          reactionMap.set(r.note_id, []);
        }
        const noteReactions = reactionMap.get(r.note_id)!;
        const existing = noteReactions.find(er => er.emoji === r.emoji);
        if (existing) {
          existing.count++;
        } else {
          noteReactions.push({ emoji: r.emoji, count: 1 });
        }
        
        if (r.user_id === user?.id) {
          myReactionMap.set(r.note_id, r.emoji);
        }
      });

      return notes?.map(note => ({
        ...note,
        user_profile: profileMap.get(note.user_id),
        reactions: reactionMap.get(note.id) || [],
        my_reaction: myReactionMap.get(note.id)
      })) as Note[];
    },
    enabled: !!user?.id
  });
};

// Get current user's note
export const useMyNote = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-note', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
};

// Create or update note
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      background_style?: string;
      music_url?: string;
      music_name?: string;
      expires_in_hours?: number;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const expiresAt = data.expires_in_hours 
        ? new Date(Date.now() + data.expires_in_hours * 60 * 60 * 1000).toISOString()
        : null;

      const { data: note, error } = await supabase
        .from('user_notes')
        .insert({
          user_id: user.id,
          content: data.content,
          background_style: data.background_style || 'gradient-1',
          music_url: data.music_url,
          music_name: data.music_name,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast.success('Đã đăng ghi chú');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// Delete note
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast.success('Đã xóa ghi chú');
    }
  });
};

// React to note
export const useReactToNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // Check if already reacted
      const { data: existing } = await supabase
        .from('note_reactions')
        .select('id, emoji')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.emoji === emoji) {
          // Remove reaction
          await supabase.from('note_reactions').delete().eq('id', existing.id);
        } else {
          // Update reaction
          await supabase.from('note_reactions').update({ emoji }).eq('id', existing.id);
        }
      } else {
        // Add new reaction
        await supabase.from('note_reactions').insert({
          note_id: noteId,
          user_id: user.id,
          emoji
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
};
