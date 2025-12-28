import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StickerPack {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  stickers?: Sticker[];
}

export interface Sticker {
  id: string;
  pack_id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useStickerPacks = () => {
  return useQuery({
    queryKey: ['sticker-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sticker_packs')
        .select('*, stickers(*)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data as unknown as StickerPack[]) || [];
    },
  });
};

export const useAdminStickerPacks = () => {
  return useQuery({
    queryKey: ['admin-sticker-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sticker_packs')
        .select('*, stickers(*)')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data as unknown as StickerPack[]) || [];
    },
  });
};

export const useCreateStickerPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pack: Partial<StickerPack>) => {
      const { data, error } = await supabase
        .from('sticker_packs')
        .insert(pack as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const useUpdateStickerPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StickerPack> & { id: string }) => {
      const { data, error } = await supabase
        .from('sticker_packs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const useDeleteStickerPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sticker_packs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const useCreateSticker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sticker: Partial<Sticker>) => {
      const { data, error } = await supabase
        .from('stickers')
        .insert(sticker as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const useBulkCreateStickers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stickers: Partial<Sticker>[]) => {
      const { data, error } = await supabase
        .from('stickers')
        .insert(stickers as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const useUpdateSticker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sticker> & { id: string }) => {
      const { data, error } = await supabase
        .from('stickers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const useDeleteSticker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stickers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};

export const uploadStickerImage = async (file: File, packId: string): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${packId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  
  const { error } = await supabase.storage
    .from('stickers')
    .upload(fileName, file, { contentType: file.type });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('stickers')
    .getPublicUrl(fileName);
  
  return publicUrl;
};

export const extractStickerZip = async (file: File, packId: string): Promise<{ count: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pack_id', packId);
  
  const { data, error } = await supabase.functions.invoke('extract-sticker-zip', {
    body: formData,
  });
  
  if (error) throw error;
  return data;
};
