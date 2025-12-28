// MySQL version - useUserAnalytics
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface SpendingData {
  month: string;
  total: number;
}

interface TopProduct {
  productName: string;
  count: number;
  totalSpent: number;
}

interface VipHistory {
  date: string;
  vipLevel: string;
  totalSpent: number;
}

export const useUserAnalytics = () => {
  const { user } = useAuth();

  // Spending data over time (by month)
  const { data: spendingData, isLoading: spendingLoading } = useQuery({
    queryKey: ['user-spending-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's email from profile
      const { data: profile } = await apiClient.from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (!profile?.email) return [];

      // Get all completed orders
      const { data: orders } = await apiClient.from('orders')
        .select('total_amount, created_at')
        .eq('customer_email', profile.email)
        .in('status', ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED']);

      if (!orders || orders.length === 0) return [];

      // Group by month
      const monthlyData: Record<string, number> = {};
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(order.total_amount);
      });

      // Convert to array and sort
      return Object.entries(monthlyData)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!user?.id
  });

  // Top products purchased
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['user-top-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profile } = await apiClient.from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (!profile?.email) return [];

      const { data: orders } = await apiClient.from('orders')
        .select('product_snapshot, total_amount')
        .eq('customer_email', profile.email)
        .in('status', ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED']);

      if (!orders) return [];

      // Aggregate by product name
      const productStats: Record<string, { count: number; totalSpent: number }> = {};
      
      orders.forEach(order => {
        const snapshot = order.product_snapshot as any;
        const productName = snapshot?.product?.name || snapshot?.name || 'Unknown';
        
        if (!productStats[productName]) {
          productStats[productName] = { count: 0, totalSpent: 0 };
        }
        productStats[productName].count += 1;
        productStats[productName].totalSpent += Number(order.total_amount);
      });

      return Object.entries(productStats)
        .map(([productName, stats]) => ({
          productName,
          count: stats.count,
          totalSpent: stats.totalSpent
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: !!user?.id
  });

  // VIP tier history (based on spending milestones)
  const { data: vipHistory, isLoading: vipLoading } = useQuery({
    queryKey: ['user-vip-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profile } = await apiClient.from('profiles')
        .select('email, total_spent, created_at')
        .eq('user_id', user.id)
        .single();

      if (!profile?.email) return [];

      const { data: vipLevels } = await apiClient.from('vip_levels')
        .select('*')
        .order('min_spending', { ascending: true });

      if (!vipLevels || vipLevels.length === 0) return [];

      // Calculate historical VIP levels based on cumulative spending over time
      const { data: orders } = await apiClient.from('orders')
        .select('total_amount, created_at')
        .eq('customer_email', profile.email)
        .in('status', ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED'])
        .order('created_at', { ascending: true });

      const history: VipHistory[] = [];
      let cumulativeSpent = 0;
      let currentVipIndex = 0;

      // Add initial level
      history.push({
        date: profile.created_at,
        vipLevel: vipLevels[0]?.name || 'Member',
        totalSpent: 0
      });

      orders?.forEach(order => {
        cumulativeSpent += Number(order.total_amount);
        
        // Check if we've reached a new VIP level
        const newVipIndex = vipLevels.findIndex(v => Number(v.min_spending) > cumulativeSpent) - 1;
        const actualVipIndex = newVipIndex < 0 ? vipLevels.length - 1 : Math.max(0, newVipIndex);
        
        if (actualVipIndex > currentVipIndex) {
          currentVipIndex = actualVipIndex;
          history.push({
            date: order.created_at,
            vipLevel: vipLevels[actualVipIndex]?.name || 'Member',
            totalSpent: cumulativeSpent
          });
        }
      });

      return history;
    },
    enabled: !!user?.id
  });

  // SMM spending data
  const { data: smmSpendingData, isLoading: smmLoading } = useQuery({
    queryKey: ['user-smm-spending', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: orders } = await apiClient.from('smm_orders')
        .select('charge, created_at')
        .eq('user_id', user.id)
        .in('status', ['completed', 'partial']);

      if (!orders || orders.length === 0) return [];

      // Group by month
      const monthlyData: Record<string, number> = {};
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(order.charge);
      });

      return Object.entries(monthlyData)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!user?.id
  });

  // Combined spending (orders + SMM)
  const combinedSpending = (() => {
    if (!spendingData && !smmSpendingData) return [];
    
    const combined: Record<string, number> = {};
    
    spendingData?.forEach(item => {
      combined[item.month] = (combined[item.month] || 0) + item.total;
    });
    
    smmSpendingData?.forEach(item => {
      combined[item.month] = (combined[item.month] || 0) + item.total;
    });

    return Object.entries(combined)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  })();

  return {
    spendingData: spendingData || [],
    smmSpendingData: smmSpendingData || [],
    combinedSpending,
    topProducts: topProducts || [],
    vipHistory: vipHistory || [],
    isLoading: spendingLoading || productsLoading || vipLoading || smmLoading
  };
};
