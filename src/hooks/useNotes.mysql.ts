// Hooks for Notes - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Note {
  id: string;
  userId: string;
  content: string;
  backgroundStyle: string;
  musicUrl?: string;
  musicName?: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  userProfile?: any;
  reactions?: { emoji: string; count: number }[];
  myReaction?: string;
  // Legacy mappings
  user_id?: string;
  background_style?: string;
  music_url?: string;
  music_name?: string;
  is_pinned?: boolean;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
  user_profile?: any;
  my_reaction?: string;
}

const mapToLegacy = (n: any): Note => ({
  ...n,
  user_id: n.userId,
  background_style: n.backgroundStyle,
  music_url: n.musicUrl,
  music_name: n.musicName,
  is_pinned: n.isPinned,
  view_count: n.viewCount,
  created_at: n.createdAt,
  updated_at: n.updatedAt,
  expires_at: n.expiresAt,
  user_profile: n.userProfile,
  my_reaction: n.myReaction,
});

// Fetch notes from friends/following
export const useNotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      // Get notes that haven't expired
      const { data: notes, error } = await db
        .from<any>('user_notes')
        .select('*')
        .or(`expiresAt.is.null,expiresAt.gt.${new Date().toISOString()}`)
        .order('isPinned', { ascending: false })
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(notes?.map((n: any) => n.userId) || [])];
      const { data: profiles } = userIds.length > 0 ? await db
        .from<any>('profiles')
        .select('userId, fullName, username, avatarUrl')
        .in('userId', userIds) : { data: [] };

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        username: p.username,
        avatar_url: p.avatarUrl,
      }]));

      // Get reactions for each note
      const noteIds = notes?.map((n: any) => n.id) || [];
      const { data: reactions } = noteIds.length > 0 ? await db
        .from<any>('note_reactions')
        .select('noteId, emoji, userId')
        .in('noteId', noteIds) : { data: [] };

      // Group reactions by note
      const reactionMap = new Map<string, { emoji: string; count: number }[]>();
      const myReactionMap = new Map<string, string>();

      reactions?.forEach((r: any) => {
        if (!reactionMap.has(r.noteId)) {
          reactionMap.set(r.noteId, []);
        }
        const noteReactions = reactionMap.get(r.noteId)!;
        const existing = noteReactions.find(er => er.emoji === r.emoji);
        if (existing) {
          existing.count++;
        } else {
          noteReactions.push({ emoji: r.emoji, count: 1 });
        }
        
        if (r.userId === user?.id) {
          myReactionMap.set(r.noteId, r.emoji);
        }
      });

      return notes?.map((note: any) => ({
        ...mapToLegacy(note),
        userProfile: profileMap.get(note.userId),
        user_profile: profileMap.get(note.userId),
        reactions: reactionMap.get(note.id) || [],
        myReaction: myReactionMap.get(note.id),
        my_reaction: myReactionMap.get(note.id),
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

      const { data, error } = await db
        .from<any>('user_notes')
        .select('*')
        .eq('userId', user.id)
        .or(`expiresAt.is.null,expiresAt.gt.${new Date().toISOString()}`)
        .order('createdAt', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] ? mapToLegacy(data[0]) : null;
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

      const { data: note, error } = await db
        .from<any>('user_notes')
        .insert({
          userId: user.id,
          content: data.content,
          backgroundStyle: data.background_style || 'gradient-1',
          musicUrl: data.music_url,
          musicName: data.music_name,
          expiresAt,
          isPinned: false,
          viewCount: 0,
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast.success('Đã đăng note');
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
      const { error } = await db
        .from('user_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast.success('Đã xóa note');
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

      // Delete existing reaction
      await db
        .from('note_reactions')
        .delete()
        .eq('noteId', noteId)
        .eq('userId', user.id);

      // Add new reaction
      const { error } = await db
        .from('note_reactions')
        .insert({
          noteId,
          userId: user.id,
          emoji
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
};

// Remove reaction
export const useRemoveNoteReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await db
        .from('note_reactions')
        .delete()
        .eq('noteId', noteId)
        .eq('userId', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
};

// Pin note
export const usePinNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // Unpin all user's notes first
      await db
        .from('user_notes')
        .update({ isPinned: false })
        .eq('userId', user.id);

      // Pin selected note
      const { error } = await db
        .from('user_notes')
        .update({ isPinned: true })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast.success('Đã ghim note');
    }
  });
};
