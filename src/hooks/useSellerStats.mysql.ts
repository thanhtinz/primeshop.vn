// Hooks for Seller Stats - MySQL version
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { subDays, format, startOfWeek, startOfMonth } from 'date-fns';

export interface SellerDailyStat {
  id: string;
  sellerId: string;
  statDate: string;
  revenue: number;
  ordersCount: number;
  productsSold: number;
  disputesCount: number;
  viewsCount: number;
  // Legacy mappings
  seller_id?: string;
  stat_date?: string;
  orders_count?: number;
  products_sold?: number;
  disputes_count?: number;
  views_count?: number;
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

const mapStatToLegacy = (s: any): SellerDailyStat => ({
  ...s,
  seller_id: s.sellerId,
  stat_date: s.statDate,
  orders_count: s.ordersCount,
  products_sold: s.productsSold,
  disputes_count: s.disputesCount,
  views_count: s.viewsCount,
});

export const useSellerDailyStats = (sellerId?: string, days = 30) => {
  return useQuery({
    queryKey: ['seller-daily-stats', sellerId, days],
    queryFn: async () => {
      if (!sellerId) return [];

      const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await db
        .from<any>('seller_daily_stats')
        .select('*')
        .eq('sellerId', sellerId)
        .gte('statDate', fromDate)
        .order('statDate', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapStatToLegacy) as SellerDailyStat[];
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
      const { data: seller } = await db
        .from<any>('sellers')
        .select('totalSales, totalRevenue, disputeCount, completedOrdersCount')
        .eq('id', sellerId)
        .single();

      // Get daily stats
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: dailyStats } = await db
        .from<any>('seller_daily_stats')
        .select('*')
        .eq('sellerId', sellerId)
        .gte('statDate', monthStart);

      // Calculate stats
      const todayStats = dailyStats?.find((s: any) => s.statDate === today);
      const weekStats = dailyStats?.filter((s: any) => s.statDate >= weekStart) || [];
      const monthStats = dailyStats || [];

      const weekRevenue = weekStats.reduce((sum: number, s: any) => sum + Number(s.revenue), 0);
      const weekOrders = weekStats.reduce((sum: number, s: any) => sum + s.ordersCount, 0);
      const monthRevenue = monthStats.reduce((sum: number, s: any) => sum + Number(s.revenue), 0);
      const monthOrders = monthStats.reduce((sum: number, s: any) => sum + s.ordersCount, 0);

      // Get top products
      const { data: topProducts } = await db
        .from<any>('seller_orders')
        .select('productId, amount')
        .eq('sellerId', sellerId)
        .eq('status', 'completed')
        .order('createdAt', { ascending: false })
        .limit(100);

      // Get product titles
      const productIds = [...new Set(topProducts?.map((o: any) => o.productId) || [])];
      let productMap = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: products } = await db
          .from<any>('seller_products')
          .select('id, title')
          .in('id', productIds);
        productMap = new Map(products?.map((p: any) => [p.id, p.title]) || []);
      }

      // Aggregate top products
      const productStatsMap = new Map<string, { id: string; title: string; sold: number; revenue: number }>();
      topProducts?.forEach((order: any) => {
        const existing = productStatsMap.get(order.productId);
        if (existing) {
          existing.sold += 1;
          existing.revenue += Number(order.amount);
        } else {
          productStatsMap.set(order.productId, {
            id: order.productId,
            title: productMap.get(order.productId) || 'Sản phẩm',
            sold: 1,
            revenue: Number(order.amount),
          });
        }
      });

      const topProductsArray = Array.from(productStatsMap.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const totalSales = seller?.totalSales || 0;
      const disputeCount = seller?.disputeCount || 0;
      const completedCount = seller?.completedOrdersCount || 0;

      return {
        totalRevenue: seller?.totalRevenue || 0,
        totalOrders: totalSales,
        totalProductsSold: totalSales,
        totalDisputes: disputeCount,
        disputeRate: totalSales > 0 ? (disputeCount / totalSales) * 100 : 0,
        completionRate: totalSales > 0 ? (completedCount / totalSales) * 100 : 0,
        revenueToday: todayStats?.revenue || 0,
        revenueThisWeek: weekRevenue,
        revenueThisMonth: monthRevenue,
        ordersToday: todayStats?.ordersCount || 0,
        ordersThisWeek: weekOrders,
        ordersThisMonth: monthOrders,
        topProducts: topProductsArray,
      };
    },
    enabled: !!sellerId,
  });
};

// Get seller wallet balance
export const useSellerWalletBalance = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-wallet-balance', sellerId],
    queryFn: async () => {
      if (!sellerId) return { available: 0, pending: 0 };

      const { data: seller } = await db
        .from<any>('sellers')
        .select('walletBalance, pendingBalance')
        .eq('id', sellerId)
        .single();

      return {
        available: seller?.walletBalance || 0,
        pending: seller?.pendingBalance || 0,
      };
    },
    enabled: !!sellerId,
  });
};

// Get seller recent orders
export const useSellerRecentOrders = (sellerId?: string, limit = 10) => {
  return useQuery({
    queryKey: ['seller-recent-orders', sellerId, limit],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await db
        .from<any>('seller_orders')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((order: any) => ({
        ...order,
        seller_id: order.sellerId,
        buyer_id: order.buyerId,
        product_id: order.productId,
        order_number: order.orderNumber,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        completed_at: order.completedAt,
        account_data: order.accountData,
      }));
    },
    enabled: !!sellerId,
  });
};
