import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('smm_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as SmmConfig | null;
    },
  });
};

// Fetch all SMM configs (providers)
export const useSmmConfigs = () => {
  return useQuery({
    queryKey: ['smm-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smm_config')
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
        const { data, error } = await supabase
          .from('smm_config')
          .update(rest as any)
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
        const { data, error } = await supabase
          .from('smm_config')
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
      const { data, error } = await supabase
        .from('smm_platforms')
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
      const { data, error } = await supabase
        .from('smm_platforms')
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
      const { data, error } = await supabase
        .from('smm_platforms')
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
      const { error } = await supabase.from('smm_platforms').delete().eq('id', id);
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
      let query = supabase
        .from('smm_service_types')
        .select('*, platform:smm_platforms(*)')
        .order('sort_order');
      
      if (platformId) {
        query = query.eq('platform_id', platformId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SmmServiceType[];
    },
  });
};

export const useCreateSmmServiceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceType: Omit<SmmServiceType, 'id' | 'created_at' | 'updated_at' | 'platform'>) => {
      const { data, error } = await supabase
        .from('smm_service_types')
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
      const { data, error } = await supabase
        .from('smm_service_types')
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
      const { error } = await supabase.from('smm_service_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-service-types'] }),
  });
};

// Category hooks (legacy, kept for backward compatibility)
export const useSmmCategories = () => {
  return useQuery({
    queryKey: ['smm-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smm_categories')
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
      const { data, error } = await supabase
        .from('smm_categories')
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
      const { data, error } = await supabase
        .from('smm_categories')
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
      const { error } = await supabase.from('smm_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smm-categories'] }),
  });
};

// Service hooks (now represents packages)
export const useSmmServices = (serviceTypeId?: string) => {
  return useQuery({
    queryKey: ['smm-services', serviceTypeId],
    queryFn: async () => {
      let query = supabase
        .from('smm_services')
        .select('*, category:smm_categories(*), service_type:smm_service_types(*, platform:smm_platforms(*))')
        .order('sort_order');
      
      if (serviceTypeId) {
        query = query.eq('service_type_id', serviceTypeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SmmService[];
    },
  });
};

export const useCreateSmmService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<SmmService, 'id' | 'created_at' | 'updated_at' | 'category' | 'service_type'>) => {
      const { data, error } = await supabase
        .from('smm_services')
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
      const { data, error } = await supabase
        .from('smm_services')
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
      const { error } = await supabase.from('smm_services').delete().eq('id', id);
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
      let query = supabase
        .from('smm_orders')
        .select('*, service:smm_services(*, category:smm_categories(*), service_type:smm_service_types(*, platform:smm_platforms(*)))')
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SmmOrder[];
    },
  });
};

export const useCreateSmmOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<SmmOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'service'>) => {
      const { data, error } = await supabase
        .from('smm_orders')
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
      // If status is changing to Completed, set completed_at
      const updateData: any = { ...order };
      if (order.status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('smm_orders')
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
      const { data, error } = await supabase.rpc('calculate_smm_avg_time', {
        p_service_id: serviceId
      });
      if (error) throw error;
      return data as string | null;
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
      
      const results: Record<string, string | null> = {};
      
      // Batch calculate for all services
      for (const serviceId of serviceIds) {
        const { data } = await supabase.rpc('calculate_smm_avg_time', {
          p_service_id: serviceId
        });
        results[serviceId] = data;
      }
      
      return results;
    },
    enabled: serviceIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
};

// API call hook
export const useSmmApiCall = () => {
  return useMutation({
    mutationFn: async (params: { action: string; [key: string]: any }) => {
      const { data, error } = await supabase.functions.invoke('smm-api', {
        body: params,
      });
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
      
      const { data: apiData, error: apiError } = await supabase.functions.invoke('smm-api', {
        body: { action: 'services' },
      });
      
      if (apiError) {
        console.error('API Error:', apiError);
        throw apiError;
      }
      if (apiData.error) {
        console.error('Data Error:', apiData.error);
        throw new Error(apiData.error);
      }

      const services = apiData as any[];
      console.log(`Received ${services.length} services from API`);
      
      // Get unique categories
      const categories = [...new Set(services.map(s => s.category))];
      console.log(`Found ${categories.length} unique categories`);
      
      // Batch upsert categories
      const categoryData = categories.map(categoryName => ({
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }));
      
      const { error: catError } = await supabase
        .from('smm_categories')
        .upsert(categoryData, { onConflict: 'slug' });
      
      if (catError) {
        console.error('Category upsert error:', catError);
        throw catError;
      }

      // Fetch all categories to get their IDs
      const { data: dbCategories, error: fetchCatError } = await supabase
        .from('smm_categories')
        .select('*');
      
      if (fetchCatError) {
        console.error('Fetch categories error:', fetchCatError);
        throw fetchCatError;
      }
      
      const categoryMap = new Map(dbCategories?.map(c => [c.name, c.id]) || []);
      console.log(`Category map size: ${categoryMap.size}`);

      // Log sample service to debug field names
      if (services.length > 0) {
        console.log('Sample service from API:', JSON.stringify(services[0]));
      }

      // Prepare services data for batch upsert (NOT including rate - admin sets price manually)
      const servicesData = services
        .map(service => {
          const categoryId = categoryMap.get(service.category);
          if (!categoryId) {
            console.warn(`Category not found for service: ${service.name}`);
            return null;
          }
          // Check multiple possible field names for average time
          const avgTime = service.average_time || service.avg_time || service.averageTime || 
                         service.average || service.time || service.estimated_time || '';
          return {
            category_id: categoryId,
            external_service_id: service.service,
            name: service.name,
            type: service.type || 'Default',
            rate: parseFloat(service.rate), // Only used for initial insert, not updates
            min_quantity: parseInt(service.min),
            max_quantity: parseInt(service.max),
            has_refill: service.refill === true,
            processing_time: avgTime,
          };
        })
        .filter(Boolean);

      // For existing services, we need to update WITHOUT changing rate
      // First get existing service IDs
      const { data: existingServices } = await supabase
        .from('smm_services')
        .select('external_service_id');
      
      const existingIds = new Set(existingServices?.map(s => s.external_service_id) || []);
      
      // Split into new services (will insert with rate) and existing services (update without rate)
      const newServices = servicesData.filter((s: any) => !existingIds.has(s.external_service_id));
      const existingServiceData = servicesData.filter((s: any) => existingIds.has(s.external_service_id));

      console.log(`Preparing to upsert ${servicesData.length} services`);

      const chunkSize = 100;
      let successCount = 0;
      
      // Insert new services with rate
      if (newServices.length > 0) {
        console.log(`Inserting ${newServices.length} new services...`);
        for (let i = 0; i < newServices.length; i += chunkSize) {
          const chunk = newServices.slice(i, i + chunkSize);
          const { error: insertError } = await supabase
            .from('smm_services')
            .insert(chunk as any[]);
          
          if (insertError) {
            console.error(`Service insert error at chunk ${i}:`, insertError);
            throw insertError;
          }
          successCount += chunk.length;
        }
      }

      // Update existing services WITHOUT changing rate
      if (existingServiceData.length > 0) {
        console.log(`Updating ${existingServiceData.length} existing services (without rate)...`);
        for (const service of existingServiceData as any[]) {
          const { error: updateError } = await supabase
            .from('smm_services')
            .update({
              category_id: service.category_id,
              name: service.name,
              type: service.type,
              min_quantity: service.min_quantity,
              max_quantity: service.max_quantity,
              has_refill: service.has_refill,
              processing_time: service.processing_time,
              updated_at: new Date().toISOString(),
            })
            .eq('external_service_id', service.external_service_id);
          
          if (updateError) {
            console.error(`Service update error for ${service.external_service_id}:`, updateError);
          }
          successCount++;
        }
      }

      console.log(`Sync completed: ${successCount} services`);
      return { success: true, count: successCount };
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
      
      const { data: apiData, error: apiError } = await supabase.functions.invoke('smm-api', {
        body: { action: 'services' },
      });
      
      if (apiError) throw apiError;
      if (apiData.error) throw new Error(apiData.error);

      const services = apiData as any[];
      const service = services.find((s: any) => s.service === externalServiceId);
      
      if (!service) {
        throw new Error('Service không tồn tại trên provider');
      }

      console.log('Single sync service from API:', JSON.stringify(service));
      
      // Check multiple possible field names for average time
      const avgTime = service.average_time || service.avg_time || service.averageTime || 
                     service.average || service.time || service.estimated_time || '';

      // Update the service in database (NOT including rate - admin sets price manually)
      const { error: updateError } = await supabase
        .from('smm_services')
        .update({
          name: service.name,
          type: service.type || 'Default',
          // rate is NOT updated - admin sets price manually
          min_quantity: parseInt(service.min),
          max_quantity: parseInt(service.max),
          has_refill: service.refill === true,
          processing_time: avgTime,
          updated_at: new Date().toISOString(),
        })
        .eq('external_service_id', externalServiceId);

      if (updateError) throw updateError;

      return { success: true, service };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smm-services'] });
    },
  });
};