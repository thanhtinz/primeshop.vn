import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ApiUsageLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  
  // Legacy snake_case fields
  api_key_id: string;
  status_code: number;
  response_time: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ApiKeyStats {
  apiKeyId: string;
  apiKeyName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsed?: string;
  
  // Legacy snake_case fields
  api_key_id: string;
  api_key_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  last_used?: string;
}

const mapUsageLog = (data: any): ApiUsageLog => ({
  id: data.id,
  apiKeyId: data.apiKeyId || data.api_key_id,
  endpoint: data.endpoint,
  method: data.method,
  statusCode: data.statusCode || data.status_code,
  responseTime: data.responseTime || data.response_time,
  ipAddress: data.ipAddress || data.ip_address,
  userAgent: data.userAgent || data.user_agent,
  createdAt: data.createdAt || data.created_at,
  
  // Legacy fields
  api_key_id: data.apiKeyId || data.api_key_id,
  status_code: data.statusCode || data.status_code,
  response_time: data.responseTime || data.response_time,
  ip_address: data.ipAddress || data.ip_address,
  user_agent: data.userAgent || data.user_agent,
  created_at: data.createdAt || data.created_at,
});

const mapKeyStats = (data: any): ApiKeyStats => ({
  apiKeyId: data.apiKeyId || data.api_key_id,
  apiKeyName: data.apiKeyName || data.api_key_name || 'Unknown',
  totalRequests: data.totalRequests || data.total_requests || 0,
  successfulRequests: data.successfulRequests || data.successful_requests || 0,
  failedRequests: data.failedRequests || data.failed_requests || 0,
  averageResponseTime: data.averageResponseTime || data.average_response_time || 0,
  lastUsed: data.lastUsed || data.last_used,
  
  // Legacy fields
  api_key_id: data.apiKeyId || data.api_key_id,
  api_key_name: data.apiKeyName || data.api_key_name || 'Unknown',
  total_requests: data.totalRequests || data.total_requests || 0,
  successful_requests: data.successfulRequests || data.successful_requests || 0,
  failed_requests: data.failedRequests || data.failed_requests || 0,
  average_response_time: data.averageResponseTime || data.average_response_time || 0,
  last_used: data.lastUsed || data.last_used,
});

// Get usage logs for a specific API key
export const useApiUsageLogs = (
  apiKeyId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['api-usage-logs', apiKeyId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.startDate) params.set('startDate', options.startDate);
      if (options?.endDate) params.set('endDate', options.endDate);
      if (options?.limit) params.set('limit', options.limit.toString());
      
      const queryString = params.toString();
      const url = `/api-keys/${apiKeyId}/usage-logs${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return (response.data || []).map(mapUsageLog);
    },
    enabled: !!apiKeyId,
  });
};

// Get stats for a specific API key
export const useApiKeyStats = (apiKeyId: string) => {
  return useQuery({
    queryKey: ['api-key-stats', apiKeyId],
    queryFn: async () => {
      const response = await apiClient.get(`/api-keys/${apiKeyId}/stats`);
      return mapKeyStats(response.data);
    },
    enabled: !!apiKeyId,
  });
};

// Get stats for all API keys (admin)
export const useAllApiKeyStats = () => {
  return useQuery({
    queryKey: ['all-api-key-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api-keys/stats');
      return (response.data || []).map(mapKeyStats);
    },
  });
};

// Get usage summary (daily/weekly/monthly aggregates)
export const useApiUsageSummary = (
  apiKeyId?: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
) => {
  return useQuery({
    queryKey: ['api-usage-summary', apiKeyId, period, days],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        days: days.toString(),
      });
      if (apiKeyId) params.set('apiKeyId', apiKeyId);
      
      const response = await apiClient.get(`/api-usage/summary?${params.toString()}`);
      return response.data as {
        date: string;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        
        // Legacy fields
        total_requests: number;
        successful_requests: number;
        failed_requests: number;
        average_response_time: number;
      }[];
    },
  });
};

// Get endpoint breakdown
export const useEndpointBreakdown = (apiKeyId?: string, days: number = 30) => {
  return useQuery({
    queryKey: ['endpoint-breakdown', apiKeyId, days],
    queryFn: async () => {
      const params = new URLSearchParams({ days: days.toString() });
      if (apiKeyId) params.set('apiKeyId', apiKeyId);
      
      const response = await apiClient.get(`/api-usage/endpoints?${params.toString()}`);
      return response.data as {
        endpoint: string;
        method: string;
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        
        // Legacy fields
        total_requests: number;
        average_response_time: number;
        error_rate: number;
      }[];
    },
  });
};
