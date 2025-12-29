// Re-export from MySQL version for backward compatibility
// All database operations now go through MySQL backend
export * from './useProducts.mysql';
  sort_order: number;
  created_at: string;
}

export interface DbProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductWithRelations extends DbProduct {
  packages: DbProductPackage[];
  custom_fields?: DbProductCustomField[];
  images?: DbProductImage[];
  category?: { id: string; name: string; name_en?: string | null; slug: string } | null;
}

export const useProducts = (activeOnly = true) => {
  return useQuery({
    queryKey: ['products', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, name_en, slug),
          packages:product_packages(*),
          custom_fields:product_custom_fields(*),
          images:product_images(*)
        `)
        .order('sort_order');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ProductWithRelations[];
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, name_en, slug),
          packages:product_packages(*),
          custom_fields:product_custom_fields(*),
          images:product_images(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as ProductWithRelations | null;
    },
    enabled: !!slug,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, name_en, slug),
          packages:product_packages(*),
          images:product_images(*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order')
        .limit(8);
      if (error) throw error;
      return data as ProductWithRelations[];
    },
  });
};

export const useProductsByCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: async () => {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      
      if (!category) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, name_en, slug),
          packages:product_packages(*),
          images:product_images(*)
        `)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as ProductWithRelations[];
    },
    enabled: !!categorySlug,
  });
};

export const useProductsByStyle = (style: 'premium' | 'game_account' | 'game_topup') => {
  return useQuery({
    queryKey: ['products', 'style', style],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, name_en, slug),
          packages:product_packages(*),
          images:product_images(*)
        `)
        .eq('style', style)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as ProductWithRelations[];
    },
    enabled: !!style,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('products').insert([product]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProduct> & { id: string }) => {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

// Package mutations
export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pkg: Omit<DbProductPackage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('product_packages').insert([pkg]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProductPackage> & { id: string }) => {
      const { data, error } = await supabase.from('product_packages').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

// Custom field mutations
export const useCreateCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (field: Omit<DbProductCustomField, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('product_custom_fields').insert([field]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProductCustomField> & { id: string }) => {
      const { data, error } = await supabase.from('product_custom_fields').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};
