import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApiUsageLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ApiUsageStats {
  total_requests: number;
  avg_response_time: number;
  success_rate: number;
  requests_by_endpoint: { endpoint: string; count: number }[];
  requests_by_day: { date: string; count: number }[];
}

export const useApiUsageLogs = (apiKeyId: string) => {
  return useQuery({
    queryKey: ['api-usage-logs', apiKeyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('api_key_id', apiKeyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ApiUsageLog[];
    },
    enabled: !!apiKeyId,
  });
};

export const useApiKeyStats = (apiKeyId: string) => {
  return useQuery({
    queryKey: ['api-key-stats', apiKeyId],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('api_key_id', apiKeyId);

      if (error) throw error;

      const totalRequests = logs?.length || 0;
      const successfulRequests = logs?.filter(l => l.status_code < 400).length || 0;
      const avgResponseTime = logs?.length 
        ? logs.reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / logs.length 
        : 0;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      // Group by endpoint
      const endpointCounts: Record<string, number> = {};
      logs?.forEach(l => {
        endpointCounts[l.endpoint] = (endpointCounts[l.endpoint] || 0) + 1;
      });
      const requestsByEndpoint = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count);

      // Group by day (last 7 days)
      const dayCounts: Record<string, number> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dayCounts[date.toISOString().split('T')[0]] = 0;
      }
      logs?.forEach(l => {
        const date = l.created_at.split('T')[0];
        if (dayCounts[date] !== undefined) {
          dayCounts[date]++;
        }
      });
      const requestsByDay = Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }));

      return {
        total_requests: totalRequests,
        avg_response_time: Math.round(avgResponseTime),
        success_rate: Math.round(successRate),
        requests_by_endpoint: requestsByEndpoint,
        requests_by_day: requestsByDay,
      } as ApiUsageStats;
    },
    enabled: !!apiKeyId,
  });
};

export const useAllApiKeyStats = () => {
  return useQuery({
    queryKey: ['all-api-key-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('api_key_id, endpoint, status_code, response_time_ms, created_at');

      if (error) throw error;

      // Group stats by API key
      const statsByKey: Record<string, { 
        total: number; 
        success: number; 
        totalTime: number;
        lastUsed: string;
      }> = {};

      data?.forEach(log => {
        if (!statsByKey[log.api_key_id]) {
          statsByKey[log.api_key_id] = { total: 0, success: 0, totalTime: 0, lastUsed: log.created_at };
        }
        statsByKey[log.api_key_id].total++;
        if (log.status_code < 400) statsByKey[log.api_key_id].success++;
        statsByKey[log.api_key_id].totalTime += log.response_time_ms || 0;
        if (log.created_at > statsByKey[log.api_key_id].lastUsed) {
          statsByKey[log.api_key_id].lastUsed = log.created_at;
        }
      });

      return statsByKey;
    },
  });
};
