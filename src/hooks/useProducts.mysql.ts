// Hooks for Products - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';

export interface DbProduct {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  warrantyInfo: string | null;
  usageGuide: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  style: string;
  price: number | null;
  accountInfo: Record<string, string> | null;
  externalApi: string | null;
  externalCategoryId: string | null;
  tags: string[];
  viewCount: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  category_id?: string | null;
  short_description?: string | null;
  warranty_info?: string | null;
  usage_guide?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  sort_order?: number;
  account_info?: Record<string, string> | null;
  external_api?: string | null;
  external_category_id?: string | null;
  view_count?: number;
  sold_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbProductPackage {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  isActive: boolean;
  isInStock: boolean;
  order: number;
  imageUrl: string | null;
  externalProductId: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  product_id?: string;
  original_price?: number | null;
  is_active?: boolean;
  is_in_stock?: boolean;
  sort_order?: number;
  image_url?: string | null;
  external_product_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbProductCustomField {
  id: string;
  productId: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  placeholder: string | null;
  options: string[] | null; // For selection type
  order: number;
  createdAt: string;
  // Legacy mappings
  product_id?: string;
  field_name?: string;
  field_type?: string;
  is_required?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface DbProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  order: number;
  isPrimary: boolean;
  createdAt: string;
  // Legacy mappings
  product_id?: string;
  image_url?: string;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export interface ProductWithRelations extends DbProduct {
  packages: DbProductPackage[];
  customFields?: DbProductCustomField[];
  images?: DbProductImage[];
  category?: { id: string; name: string; nameEn?: string | null; slug: string } | null;
  // Legacy
  custom_fields?: DbProductCustomField[];
}

const mapProductToLegacy = (product: any): DbProduct => ({
  ...product,
  category_id: product.categoryId,
  short_description: product.shortDescription,
  warranty_info: product.warrantyInfo,
  usage_guide: product.usageGuide,
  image_url: product.imageUrl,
  is_active: product.isActive,
  is_featured: product.isFeatured,
  sort_order: product.order,
  account_info: product.accountInfo,
  external_api: product.externalApi,
  external_category_id: product.externalCategoryId,
  view_count: product.viewCount,
  sold_count: product.soldCount,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
});

const mapPackageToLegacy = (pkg: any): DbProductPackage => ({
  ...pkg,
  product_id: pkg.productId,
  original_price: pkg.originalPrice,
  is_active: pkg.isActive,
  is_in_stock: pkg.isInStock,
  sort_order: pkg.order,
  image_url: pkg.imageUrl,
  external_product_id: pkg.externalProductId,
  created_at: pkg.createdAt,
  updated_at: pkg.updatedAt,
});

const mapCustomFieldToLegacy = (field: any): DbProductCustomField => ({
  ...field,
  product_id: field.productId,
  field_name: field.fieldName,
  field_type: field.fieldType,
  is_required: field.isRequired,
  sort_order: field.order,
  created_at: field.createdAt,
});

const mapImageToLegacy = (img: any): DbProductImage => ({
  ...img,
  product_id: img.productId,
  image_url: img.imageUrl,
  sort_order: img.order,
  is_primary: img.isPrimary,
  created_at: img.createdAt,
});

const mapProductWithRelations = (product: any): ProductWithRelations => ({
  ...mapProductToLegacy(product),
  packages: (product.packages || []).map(mapPackageToLegacy),
  customFields: (product.customFields || []).map(mapCustomFieldToLegacy),
  custom_fields: (product.customFields || []).map(mapCustomFieldToLegacy),
  images: (product.images || []).map(mapImageToLegacy),
  category: product.category ? {
    ...product.category,
    name_en: product.category.nameEn,
  } : null,
});

export const useProducts = (activeOnly = true) => {
  return useQuery({
    queryKey: ['products', activeOnly],
    queryFn: async () => {
      let query = db
        .from<any>('products')
        .select('*, category:categories(id, name, nameEn, slug), packages:product_packages(*), customFields:product_custom_fields(*), images:product_images(*)')
        .order('order', { ascending: true });
      
      if (activeOnly) {
        query = query.eq('isActive', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapProductWithRelations);
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('products')
        .select('*, category:categories(id, name, nameEn, slug), packages:product_packages(*), customFields:product_custom_fields(*), images:product_images(*)')
        .eq('slug', slug)
        .eq('isActive', true)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProductWithRelations(data) : null;
    },
    enabled: !!slug,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('products')
        .select('*, category:categories(id, name, nameEn, slug), packages:product_packages(*), images:product_images(*)')
        .eq('isActive', true)
        .eq('isFeatured', true)
        .order('order', { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []).map(mapProductWithRelations);
    },
  });
};

export const useProductsByCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: async () => {
      // First get category ID
      const { data: category } = await db
        .from<any>('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      
      if (!category) return [];
      
      const { data, error } = await db
        .from<any>('products')
        .select('*, category:categories(id, name, nameEn, slug), packages:product_packages(*), images:product_images(*)')
        .eq('categoryId', category.id)
        .eq('isActive', true)
        .order('order', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapProductWithRelations);
    },
    enabled: !!categorySlug,
  });
};

export const useProductsByStyle = (style: string) => {
  return useQuery({
    queryKey: ['products', 'style', style],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('products')
        .select('*, category:categories(id, name, nameEn, slug), packages:product_packages(*), images:product_images(*)')
        .eq('style', style)
        .eq('isActive', true)
        .order('order', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapProductWithRelations);
    },
    enabled: !!style,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<DbProduct>) => {
      const { data, error } = await db
        .from<DbProduct>('products')
        .insert({
          categoryId: product.categoryId || product.category_id,
          name: product.name || '',
          slug: product.slug || '',
          description: product.description,
          shortDescription: product.shortDescription || product.short_description,
          warrantyInfo: product.warrantyInfo || product.warranty_info,
          usageGuide: product.usageGuide || product.usage_guide,
          imageUrl: product.imageUrl || product.image_url,
          isActive: product.isActive ?? product.is_active ?? true,
          isFeatured: product.isFeatured ?? product.is_featured ?? false,
          order: product.order ?? product.sort_order ?? 0,
          style: product.style || 'default',
          price: product.price,
          accountInfo: product.accountInfo || product.account_info,
          tags: product.tags || [],
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapProductToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProduct> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.categoryId !== undefined || updates.category_id !== undefined) {
        updateData.categoryId = updates.categoryId || updates.category_id;
      }
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.shortDescription !== undefined || updates.short_description !== undefined) {
        updateData.shortDescription = updates.shortDescription || updates.short_description;
      }
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl || updates.image_url;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.isFeatured !== undefined || updates.is_featured !== undefined) {
        updateData.isFeatured = updates.isFeatured ?? updates.is_featured;
      }
      if (updates.order !== undefined || updates.sort_order !== undefined) {
        updateData.order = updates.order ?? updates.sort_order;
      }
      if (updates.style !== undefined) updateData.style = updates.style;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await db
        .from<DbProduct>('products')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapProductToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

// Product Packages
export const useCreateProductPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pkg: Partial<DbProductPackage>) => {
      const { data, error } = await db
        .from<DbProductPackage>('product_packages')
        .insert({
          productId: pkg.productId || pkg.product_id || '',
          name: pkg.name || '',
          description: pkg.description,
          price: pkg.price || 0,
          originalPrice: pkg.originalPrice || pkg.original_price,
          isActive: pkg.isActive ?? pkg.is_active ?? true,
          isInStock: pkg.isInStock ?? pkg.is_in_stock ?? true,
          order: pkg.order ?? pkg.sort_order ?? 0,
          imageUrl: pkg.imageUrl || pkg.image_url,
          externalProductId: pkg.externalProductId || pkg.external_product_id,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapPackageToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProductPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProductPackage> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.originalPrice !== undefined || updates.original_price !== undefined) {
        updateData.originalPrice = updates.originalPrice ?? updates.original_price;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.isInStock !== undefined || updates.is_in_stock !== undefined) {
        updateData.isInStock = updates.isInStock ?? updates.is_in_stock;
      }
      if (updates.order !== undefined || updates.sort_order !== undefined) {
        updateData.order = updates.order ?? updates.sort_order;
      }
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl || updates.image_url;
      }

      const { data, error } = await db
        .from<DbProductPackage>('product_packages')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapPackageToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProductPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('product_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

// Search products
export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await db
        .from<any>('products')
        .select('*, category:categories(id, name, slug), packages:product_packages(*)')
        .eq('isActive', true)
        .ilike('name', `%${query}%`)
        .limit(10);
      if (error) throw error;
      return (data || []).map(mapProductWithRelations);
    },
    enabled: query.length >= 2,
  });
};

// Alias exports for backward compatibility
export const useCreatePackage = useCreateProductPackage;
export const useUpdatePackage = useUpdateProductPackage;
export const useDeletePackage = useDeleteProductPackage;

// Custom field mutations
export const useCreateCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (field: Partial<DbProductCustomField>) => {
      const { data, error } = await db
        .from<DbProductCustomField>('product_custom_fields')
        .insert({
          productId: field.productId || field.product_id || '',
          fieldName: field.fieldName || field.field_name || '',
          fieldType: field.fieldType || field.field_type || 'text',
          isRequired: field.isRequired ?? field.is_required ?? false,
          placeholder: field.placeholder,
          options: field.options,
          order: field.order ?? field.sort_order ?? 0,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapCustomFieldToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProductCustomField> & { id: string }) => {
      const updateData: any = {};
      if (updates.fieldName !== undefined || updates.field_name !== undefined) {
        updateData.fieldName = updates.fieldName || updates.field_name;
      }
      if (updates.fieldType !== undefined || updates.field_type !== undefined) {
        updateData.fieldType = updates.fieldType || updates.field_type;
      }
      if (updates.isRequired !== undefined || updates.is_required !== undefined) {
        updateData.isRequired = updates.isRequired ?? updates.is_required;
      }
      if (updates.placeholder !== undefined) updateData.placeholder = updates.placeholder;
      if (updates.options !== undefined) updateData.options = updates.options;
      if (updates.order !== undefined || updates.sort_order !== undefined) {
        updateData.order = updates.order ?? updates.sort_order;
      }

      const { data, error } = await db
        .from<DbProductCustomField>('product_custom_fields')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapCustomFieldToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('product_custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};