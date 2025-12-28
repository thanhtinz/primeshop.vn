// MySQL version - useSellerWebhooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface SellerApiKey {
  id: string;
  seller_id: string;
  name: string;
  api_key: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface SellerWebhook {
  id: string;
  seller_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  is_success: boolean;
  delivered_at: string;
}

export interface BulkImportJob {
  id: string;
  seller_id: string;
  file_name: string | null;
  file_url: string | null;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  failed_rows: number;
  errors: any[];
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export const webhookEvents = [
  { value: 'order.created', label: 'Đơn hàng mới' },
  { value: 'order.paid', label: 'Đơn hàng đã thanh toán' },
  { value: 'order.completed', label: 'Đơn hàng hoàn tất' },
  { value: 'order.cancelled', label: 'Đơn hàng bị hủy' },
  { value: 'dispute.opened', label: 'Tranh chấp mới' },
  { value: 'dispute.resolved', label: 'Tranh chấp đã giải quyết' },
  { value: 'review.created', label: 'Đánh giá mới' },
  { value: 'product.sold', label: 'Sản phẩm đã bán' }
];

// Legacy snake_case mapping
function mapSellerApiKey(data: any): SellerApiKey {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    name: data.name,
    api_key: data.apiKey || data.api_key,
    permissions: data.permissions || [],
    is_active: data.isActive ?? data.is_active ?? true,
    last_used_at: data.lastUsedAt || data.last_used_at,
    expires_at: data.expiresAt || data.expires_at,
    created_at: data.createdAt || data.created_at,
  };
}

function mapSellerWebhook(data: any): SellerWebhook {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    name: data.name,
    url: data.url,
    events: data.events || [],
    secret: data.secret,
    is_active: data.isActive ?? data.is_active ?? true,
    last_triggered_at: data.lastTriggeredAt || data.last_triggered_at,
    failure_count: data.failureCount || data.failure_count || 0,
    created_at: data.createdAt || data.created_at,
  };
}

function mapWebhookDelivery(data: any): WebhookDelivery {
  if (!data) return data;
  return {
    id: data.id,
    webhook_id: data.webhookId || data.webhook_id,
    event_type: data.eventType || data.event_type,
    payload: data.payload,
    response_status: data.responseStatus || data.response_status,
    response_body: data.responseBody || data.response_body,
    is_success: data.isSuccess ?? data.is_success,
    delivered_at: data.deliveredAt || data.delivered_at,
  };
}

function mapBulkImportJob(data: any): BulkImportJob {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    file_name: data.fileName || data.file_name,
    file_url: data.fileUrl || data.file_url,
    total_rows: data.totalRows || data.total_rows || 0,
    processed_rows: data.processedRows || data.processed_rows || 0,
    success_rows: data.successRows || data.success_rows || 0,
    failed_rows: data.failedRows || data.failed_rows || 0,
    errors: data.errors || [],
    status: data.status,
    started_at: data.startedAt || data.started_at,
    completed_at: data.completedAt || data.completed_at,
    created_at: data.createdAt || data.created_at,
  };
}

// =============== API KEYS ===============

export const useSellerApiKeys = (sellerId: string) => {
  return useQuery({
    queryKey: ['seller-api-keys', sellerId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('seller_api_keys')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapSellerApiKey);
    },
    enabled: !!sellerId
  });
};

export const useCreateSellerApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sellerId, 
      name, 
      permissions 
    }: { 
      sellerId: string; 
      name: string; 
      permissions: string[];
    }) => {
      const { data, error } = await apiClient.from('seller_api_keys')
        .insert({
          seller_id: sellerId,
          name,
          permissions
        })
        .select()
        .single();

      if (error) throw error;
      return mapSellerApiKey(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-api-keys'] });
      toast.success('Đã tạo API key mới');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteSellerApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await apiClient.from('seller_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-api-keys'] });
      toast.success('Đã xóa API key');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// =============== WEBHOOKS ===============

export const useSellerWebhooks = (sellerId: string) => {
  return useQuery({
    queryKey: ['seller-webhooks', sellerId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('seller_webhooks')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapSellerWebhook);
    },
    enabled: !!sellerId
  });
};

export const useCreateSellerWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhook: Omit<SellerWebhook, 'id' | 'secret' | 'last_triggered_at' | 'failure_count' | 'created_at'>) => {
      const { data, error } = await apiClient.from('seller_webhooks')
        .insert(webhook)
        .select()
        .single();

      if (error) throw error;
      return mapSellerWebhook(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-webhooks'] });
      toast.success('Đã tạo webhook mới');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateSellerWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SellerWebhook> & { id: string }) => {
      const { data, error } = await apiClient.from('seller_webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapSellerWebhook(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-webhooks'] });
      toast.success('Đã cập nhật webhook');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteSellerWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await apiClient.from('seller_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-webhooks'] });
      toast.success('Đã xóa webhook');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Get webhook delivery logs
export const useWebhookDeliveries = (webhookId: string) => {
  return useQuery({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(mapWebhookDelivery);
    },
    enabled: !!webhookId
  });
};

// =============== BULK IMPORT ===============

export const useBulkImportJobs = (sellerId: string) => {
  return useQuery({
    queryKey: ['bulk-import-jobs', sellerId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('bulk_import_jobs')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map(mapBulkImportJob);
    },
    enabled: !!sellerId
  });
};

export const useCreateBulkImportJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sellerId, 
      fileName, 
      fileUrl, 
      totalRows 
    }: { 
      sellerId: string; 
      fileName: string; 
      fileUrl: string; 
      totalRows: number;
    }) => {
      const { data, error } = await apiClient.from('bulk_import_jobs')
        .insert({
          seller_id: sellerId,
          file_name: fileName,
          file_url: fileUrl,
          total_rows: totalRows,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return mapBulkImportJob(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-import-jobs'] });
      toast.success('Đã tạo job import');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Test webhook
export const useTestWebhook = () => {
  return useMutation({
    mutationFn: async ({ webhookId, eventType }: { webhookId: string; eventType: string }) => {
      const { data, error } = await apiClient.post('/webhooks/test', {
        webhookId,
        eventType
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Đã gửi test webhook');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi test webhook');
    }
  });
};
