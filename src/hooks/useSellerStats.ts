import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfWeek, startOfMonth } from 'date-fns';

export interface SellerDailyStat {
  id: string;
  seller_id: string;
  stat_date: string;
  revenue: number;
  orders_count: number;
  products_sold: number;
  disputes_count: number;
  views_count: number;
}

export interface SellerOverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalProductsSold: number;
  totalDisputes: number;
  disputeRate: number;
  completionRate: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  topProducts: { id: string; title: string; sold: number; revenue: number }[];
}

export const useSellerDailyStats = (sellerId?: string, days = 30) => {
  return useQuery({
    queryKey: ['seller-daily-stats', sellerId, days],
    queryFn: async () => {
      if (!sellerId) return [];

      const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('seller_daily_stats')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('stat_date', fromDate)
        .order('stat_date', { ascending: true });

      if (error) throw error;
      return data as SellerDailyStat[];
    },
    enabled: !!sellerId,
  });
};

export const useSellerOverviewStats = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-overview-stats', sellerId],
    queryFn: async (): Promise<SellerOverviewStats> => {
      if (!sellerId) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalProductsSold: 0,
          totalDisputes: 0,
          disputeRate: 0,
          completionRate: 0,
          revenueToday: 0,
          revenueThisWeek: 0,
          revenueThisMonth: 0,
          ordersToday: 0,
          ordersThisWeek: 0,
          ordersThisMonth: 0,
          topProducts: [],
        };
      }

      // Get seller data
      const { data: seller } = await supabase
        .from('sellers')
        .select('total_sales, total_revenue, dispute_count, completed_orders_count')
        .eq('id', sellerId)
        .single();

      // Get daily stats
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: dailyStats } = await supabase
        .from('seller_daily_stats')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('stat_date', monthStart);

      // Calculate stats
      const todayStats = dailyStats?.find(s => s.stat_date === today);
      const weekStats = dailyStats?.filter(s => s.stat_date >= weekStart) || [];
      const monthStats = dailyStats || [];

      const weekRevenue = weekStats.reduce((sum, s) => sum + Number(s.revenue), 0);
      const weekOrders = weekStats.reduce((sum, s) => sum + s.orders_count, 0);
      const monthRevenue = monthStats.reduce((sum, s) => sum + Number(s.revenue), 0);
      const monthOrders = monthStats.reduce((sum, s) => sum + s.orders_count, 0);

      // Get top products
      const { data: topProducts } = await supabase
        .from('seller_orders')
        .select(`
          product_id,
          amount,
          product:seller_products(id, title)
        `)
        .eq('seller_id', sellerId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100);

      // Aggregate top products
      const productMap = new Map<string, { id: string; title: string; sold: number; revenue: number }>();
      topProducts?.forEach(order => {
        const existing = productMap.get(order.product_id);
        if (existing) {
          existing.sold += 1;
          existing.revenue += Number(order.amount);
        } else {
          productMap.set(order.product_id, {
            id: order.product_id,
            title: (order.product as unknown as { title: string })?.title || 'Sản phẩm',
            sold: 1,
            revenue: Number(order.amount),
          });
        }
      });

      const topProductsArray = Array.from(productMap.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const totalSales = seller?.total_sales || 0;
      const disputeCount = seller?.dispute_count || 0;
      const completedCount = seller?.completed_orders_count || 0;

      return {
        totalRevenue: seller?.total_revenue || 0,
        totalOrders: totalSales,
        totalProductsSold: totalSales,
        totalDisputes: disputeCount,
        disputeRate: totalSales > 0 ? (disputeCount / totalSales) * 100 : 0,
        completionRate: totalSales > 0 ? (completedCount / totalSales) * 100 : 0,
        revenueToday: todayStats?.revenue || 0,
        revenueThisWeek: weekRevenue,
        revenueThisMonth: monthRevenue,
        ordersToday: todayStats?.orders_count || 0,
        ordersThisWeek: weekOrders,
        ordersThisMonth: monthOrders,
        topProducts: topProductsArray,
      };
    },
    enabled: !!sellerId,
  });
};
