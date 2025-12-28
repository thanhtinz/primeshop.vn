import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SpendingData {
  date: string;
  amount: number;
}

export interface TopProduct {
  productName: string;
  count: number;
  totalSpent: number;
}

export interface VipHistory {
  date: string;
  vipLevel: string;
  totalSpent: number;
}

export const useUserAnalytics = () => {
  const { user } = useAuth();

  // Monthly spending data
  const { data: spendingData, isLoading: spendingLoading } = useQuery({
    queryKey: ['user-spending', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (!profile?.email) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('customer_email', profile.email)
        .in('status', ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED'])
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      const { data: smmOrders } = await supabase
        .from('smm_orders')
        .select('charge, created_at')
        .eq('user_id', user.id)
        .in('status', ['Completed', 'In progress', 'Processing', 'Pending'])
        .gte('created_at', sixMonthsAgo.toISOString());

      // Group by month
      const monthlyData: Record<string, number> = {};
      
      orders?.forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + Number(order.total_amount);
      });

      smmOrders?.forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + Number(order.charge);
      });

      return Object.entries(monthlyData)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!user?.id
  });

  // Top purchased products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['user-top-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (!profile?.email) return [];

      const { data: orders } = await supabase
        .from('orders')
        .select('product_snapshot, total_amount')
        .eq('customer_email', profile.email)
        .in('status', ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED']);

      const productStats: Record<string, { count: number; totalSpent: number }> = {};

      orders?.forEach(order => {
        const snapshot = order.product_snapshot as any;
        const productName = snapshot?.product?.name || 'Unknown';
        
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, total_spent, created_at')
        .eq('user_id', user.id)
        .single();

      if (!profile?.email) return [];

      const { data: vipLevels } = await supabase
        .from('vip_levels')
        .select('*')
        .order('min_spending', { ascending: true });

      if (!vipLevels) return [];

      // Calculate historical VIP levels based on cumulative spending over time
      const { data: orders } = await supabase
        .from('orders')
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
        const newVipIndex = vipLevels.findIndex(v => v.min_spending > cumulativeSpent) - 1;
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

  return {
    spendingData: spendingData || [],
    topProducts: topProducts || [],
    vipHistory: vipHistory || [],
    isLoading: spendingLoading || productsLoading || vipLoading
  };
};
