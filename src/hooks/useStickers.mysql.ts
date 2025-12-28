// Hooks for Stickers - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface StickerPack {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  stickers?: Sticker[];
  // Legacy mappings
  cover_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Sticker {
  id: string;
  packId: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  pack_id?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const mapPackToLegacy = (p: any): StickerPack => ({
  ...p,
  cover_url: p.coverUrl,
  is_active: p.isActive,
  sort_order: p.sortOrder,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  stickers: p.stickers?.map(mapStickerToLegacy),
});

const mapStickerToLegacy = (s: any): Sticker => ({
  ...s,
  pack_id: s.packId,
  image_url: s.imageUrl,
  sort_order: s.sortOrder,
  is_active: s.isActive,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

export const useStickerPacks = () => {
  return useQuery({
    queryKey: ['sticker-packs'],
    queryFn: async () => {
      const { data: packs, error } = await db
        .from<any>('sticker_packs')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });
      
      if (error) throw error;

      // Get stickers for each pack
      const packIds = packs?.map((p: any) => p.id) || [];
      const { data: stickers } = packIds.length > 0 ? await db
        .from<any>('stickers')
        .select('*')
        .in('packId', packIds)
        .eq('isActive', true)
        .order('sortOrder', { ascending: true }) : { data: [] };

      // Group stickers by pack
      const stickerMap = new Map<string, any[]>();
      stickers?.forEach((s: any) => {
        if (!stickerMap.has(s.packId)) {
          stickerMap.set(s.packId, []);
        }
        stickerMap.get(s.packId)!.push(mapStickerToLegacy(s));
      });

      return (packs || []).map((p: any) => ({
        ...mapPackToLegacy(p),
        stickers: stickerMap.get(p.id) || [],
      })) as StickerPack[];
    },
  });
};

export const useAdminStickerPacks = () => {
  return useQuery({
    queryKey: ['admin-sticker-packs'],
    queryFn: async () => {
      const { data: packs, error } = await db
        .from<any>('sticker_packs')
        .select('*')
        .order('sortOrder', { ascending: true });
      
      if (error) throw error;

      // Get all stickers
      const packIds = packs?.map((p: any) => p.id) || [];
      const { data: stickers } = packIds.length > 0 ? await db
        .from<any>('stickers')
        .select('*')
        .in('packId', packIds)
        .order('sortOrder', { ascending: true }) : { data: [] };

      const stickerMap = new Map<string, any[]>();
      stickers?.forEach((s: any) => {
        if (!stickerMap.has(s.packId)) {
          stickerMap.set(s.packId, []);
        }
        stickerMap.get(s.packId)!.push(mapStickerToLegacy(s));
      });

      return (packs || []).map((p: any) => ({
        ...mapPackToLegacy(p),
        stickers: stickerMap.get(p.id) || [],
      })) as StickerPack[];
    },
  });
};

export const useCreateStickerPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pack: {
      name: string;
      description?: string;
      coverUrl?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) => {
      const { data, error } = await db
        .from<any>('sticker_packs')
        .insert({
          name: pack.name,
          description: pack.description || null,
          coverUrl: pack.coverUrl || null,
          isActive: pack.isActive ?? true,
          sortOrder: pack.sortOrder || 0,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapPackToLegacy(data);
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
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.coverUrl !== undefined || updates.cover_url !== undefined) {
        updateData.coverUrl = updates.coverUrl ?? updates.cover_url;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.sortOrder !== undefined || updates.sort_order !== undefined) {
        updateData.sortOrder = updates.sortOrder ?? updates.sort_order;
      }

      const { data, error } = await db
        .from<any>('sticker_packs')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapPackToLegacy(data);
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
      // Delete stickers first
      await db.from('stickers').delete().eq('packId', id);
      // Delete pack
      const { error } = await db.from('sticker_packs').delete().eq('id', id);
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
    mutationFn: async (sticker: {
      packId: string;
      name: string;
      imageUrl: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => {
      const { data, error } = await db
        .from<any>('stickers')
        .insert({
          packId: sticker.packId,
          name: sticker.name,
          imageUrl: sticker.imageUrl,
          sortOrder: sticker.sortOrder || 0,
          isActive: sticker.isActive ?? true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapStickerToLegacy(data);
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
    mutationFn: async (stickers: {
      packId: string;
      name: string;
      imageUrl: string;
      sortOrder?: number;
      isActive?: boolean;
    }[]) => {
      const insertData = stickers.map(s => ({
        packId: s.packId,
        name: s.name,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder || 0,
        isActive: s.isActive ?? true,
      }));

      const { data, error } = await db
        .from<any>('stickers')
        .insert(insertData)
        .select('*');
      if (error) throw error;
      return (data || []).map(mapStickerToLegacy);
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
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl ?? updates.image_url;
      }
      if (updates.sortOrder !== undefined || updates.sort_order !== undefined) {
        updateData.sortOrder = updates.sortOrder ?? updates.sort_order;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }

      const { data, error } = await db
        .from<any>('stickers')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapStickerToLegacy(data);
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
      const { error } = await db.from('stickers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sticker-packs'] });
    },
  });
};
