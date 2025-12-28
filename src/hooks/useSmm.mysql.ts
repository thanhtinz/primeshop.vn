// MySQL version - useSmm (SMM Panel Integration)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SmmConfig {
  id: string;
  api_domain: string;
  api_key: string;
  balance: number;
  currency: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmmPlatform {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmmServiceType {
  id: string;
  platform_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  platform?: SmmPlatform;
}

export interface SmmCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmmService {
  id: string;
  category_id: string;
  service_type_id: string | null;
  external_service_id: number;
  name: string;
  type: string;
  rate: number;
  min_quantity: number;
  max_quantity: number;
  has_refill: boolean;
  description: string | null;
  processing_time: string | null;
  refill_policy: string | null;
  markup_percent: number;
  markup_member: number;
  markup_bronze: number;
  markup_silver: number;
  markup_gold: number;
  markup_diamond: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: SmmCategory;
  service_type?: SmmServiceType;
}

export interface SmmOrder {
  id: string;
  user_id: string;
  service_id: string;
  external_order_id: number | null;
  order_number: string;
  link: string;
  quantity: number;
  charge: number;
  start_count: number | null;
  remains: number | null;
  status: string;
  refill_id: number | null;
  refill_status: string | null;
  refund_amount: number;
  refund_at: string | null;
  refund_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  service?: SmmService;
}

// Config hooks
export const useSmmConfig = () => {
  return useQuery({
    queryKey: ['smm-config'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('smm_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as SmmConfig | null;
    },
  });
};

export const useSmmConfigs = () => {
  return useQuery({
    queryKey: ['smm-configs'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('smm_config')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SmmConfig[];
    },
  });
};

export const useUpdateSmmConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<SmmConfig> & { id?: string }) => {
      const { id, ...rest } = config;
      if (id) {
        const { data, error } = await apiClient.from('smm_config')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const insertData = {
          api_domain: rest.api_domain || '',
          api_key: rest.api_key || '',
          ...rest
        };
        const { data, error } = await apiClient.from('smm_config')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-config'] }),
  });
};

// Platform hooks
export const useSmmPlatforms = () => {
  return useQuery({
    queryKey: ['smm-platforms'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('smm_platforms')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SmmPlatform[];
    },
  });
};

export const useCreateSmmPlatform = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (platform: Omit<SmmPlatform, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await apiClient.from('smm_platforms')
        .insert(platform)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-platforms'] }),
  });
};

export const useUpdateSmmPlatform = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...platform }: Partial<SmmPlatform> & { id: string }) => {
      const { data, error } = await apiClient.from('smm_platforms')
        .update(platform)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-platforms'] }),
  });
};

export const useDeleteSmmPlatform = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from('smm_platforms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-platforms'] }),
  });
};

// Service Type hooks
export const useSmmServiceTypes = (platformId?: string) => {
  return useQuery({
    queryKey: ['smm-service-types', platformId],
    queryFn: async () => {
      let query = apiClient.from('smm_service_types')
        .select('*')
        .order('sort_order');
      
      if (platformId) {
        query = query.eq('platform_id', platformId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch platforms for relation
      if (data && data.length > 0) {
        const platformIds = [...new Set(data.map((s: any) => s.platform_id || s.platformId))];
        const { data: platforms } = await apiClient.from('smm_platforms')
          .select('*')
          .in('id', platformIds);
        
        const platformMap = new Map((platforms || []).map((p: any) => [p.id, p]));
        return data.map((s: any) => ({
          ...s,
          platform: platformMap.get(s.platform_id || s.platformId)
        })) as SmmServiceType[];
      }
      
      return data as SmmServiceType[];
    },
  });
};

export const useCreateSmmServiceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceType: Omit<SmmServiceType, 'id' | 'created_at' | 'updated_at' | 'platform'>) => {
      const { data, error } = await apiClient.from('smm_service_types')
        .insert(serviceType)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-service-types'] }),
  });
};

export const useUpdateSmmServiceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...serviceType }: Partial<SmmServiceType> & { id: string }) => {
      const { data, error } = await apiClient.from('smm_service_types')
        .update(serviceType)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-service-types'] }),
  });
};

export const useDeleteSmmServiceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from('smm_service_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-service-types'] }),
  });
};

// Category hooks
export const useSmmCategories = () => {
  return useQuery({
    queryKey: ['smm-categories'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('smm_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SmmCategory[];
    },
  });
};

export const useCreateSmmCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<SmmCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await apiClient.from('smm_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-categories'] }),
  });
};

export const useUpdateSmmCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<SmmCategory> & { id: string }) => {
      const { data, error } = await apiClient.from('smm_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-categories'] }),
  });
};

export const useDeleteSmmCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from('smm_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-categories'] }),
  });
};

// Service hooks
export const useSmmServices = (serviceTypeId?: string) => {
  return useQuery({
    queryKey: ['smm-services', serviceTypeId],
    queryFn: async () => {
      let query = apiClient.from('smm_services')
        .select('*')
        .order('sort_order');
      
      if (serviceTypeId) {
        query = query.eq('service_type_id', serviceTypeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch categories and service types for relations
      if (data && data.length > 0) {
        const categoryIds = [...new Set(data.map((s: any) => s.category_id || s.categoryId))];
        const serviceTypeIds = [...new Set(data.filter((s: any) => s.service_type_id || s.serviceTypeId).map((s: any) => s.service_type_id || s.serviceTypeId))];
        
        const [{ data: categories }, { data: serviceTypes }] = await Promise.all([
          apiClient.from('smm_categories').select('*').in('id', categoryIds),
          serviceTypeIds.length > 0 ? apiClient.from('smm_service_types').select('*').in('id', serviceTypeIds) : { data: [] }
        ]);
        
        const categoryMap = new Map((categories || []).map((c: any) => [c.id, c]));
        const serviceTypeMap = new Map((serviceTypes || []).map((st: any) => [st.id, st]));
        
        return data.map((s: any) => ({
          ...s,
          category: categoryMap.get(s.category_id || s.categoryId),
          service_type: serviceTypeMap.get(s.service_type_id || s.serviceTypeId)
        })) as SmmService[];
      }
      
      return data as SmmService[];
    },
  });
};

export const useCreateSmmService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<SmmService, 'id' | 'created_at' | 'updated_at' | 'category' | 'service_type'>) => {
      const { data, error } = await apiClient.from('smm_services')
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-services'] }),
  });
};

export const useUpdateSmmService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...service }: Partial<SmmService> & { id: string }) => {
      const { data, error } = await apiClient.from('smm_services')
        .update(service)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-services'] }),
  });
};

export const useDeleteSmmService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from('smm_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-services'] }),
  });
};

// Order hooks
export const useSmmOrders = (userId?: string) => {
  return useQuery({
    queryKey: ['smm-orders', userId],
    queryFn: async () => {
      let query = apiClient.from('smm_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch services for relations
      if (data && data.length > 0) {
        const serviceIds = [...new Set(data.map((o: any) => o.service_id || o.serviceId))];
        const { data: services } = await apiClient.from('smm_services')
          .select('*')
          .in('id', serviceIds);
        
        const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));
        
        return data.map((o: any) => ({
          ...o,
          service: serviceMap.get(o.service_id || o.serviceId)
        })) as SmmOrder[];
      }
      
      return data as SmmOrder[];
    },
  });
};

export const useCreateSmmOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<SmmOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'service'>) => {
      const { data, error } = await apiClient.from('smm_orders')
        .insert(order)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-orders'] }),
  });
};

export const useUpdateSmmOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...order }: Partial<SmmOrder> & { id: string }) => {
      const updateData: any = { ...order };
      if (order.status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await apiClient.from('smm_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-orders'] }),
  });
};

// Hook to get calculated average time for a service
export const useSmmServiceAvgTime = (serviceId: string | undefined) => {
  return useQuery({
    queryKey: ['smm-service-avg-time', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await apiClient.post('/smm/calculate-avg-time', {
        serviceId
      });
      if (error) throw error;
      return data?.avgTime as string | null;
    },
    enabled: !!serviceId,
  });
};

// Hook to get calculated average times for all services
export const useSmmServicesAvgTimes = (serviceIds: string[]) => {
  return useQuery({
    queryKey: ['smm-services-avg-times', serviceIds],
    queryFn: async () => {
      if (!serviceIds.length) return {};
      
      const { data, error } = await apiClient.post('/smm/calculate-avg-times', {
        serviceIds
      });
      if (error) throw error;
      return data?.avgTimes || {};
    },
    enabled: serviceIds.length > 0,
    staleTime: 60000,
  });
};

// API call hook
export const useSmmApiCall = () => {
  return useMutation({
    mutationFn: async (params: { action: string; [key: string]: any }) => {
      const { data, error } = await apiClient.post('/integrations/smm-api', params);
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
  });
};

// Sync services from API
export const useSyncSmmServices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      console.log('Starting SMM sync...');
      
      const { data, error } = await apiClient.post('/integrations/smm-api', {
        action: 'sync_services'
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      console.log(`Sync completed: ${data.count} services`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smm-categories'] });
      queryClient.invalidateQueries({ queryKey: ['smm-services'] });
    },
  });
};

// Sync single service from API
export const useSyncSingleSmmService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (externalServiceId: number) => {
      console.log(`Syncing single service: ${externalServiceId}`);
      
      const { data, error } = await apiClient.post('/integrations/smm-api', {
        action: 'sync_single_service',
        externalServiceId
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smm-services'] });
    },
  });
};
