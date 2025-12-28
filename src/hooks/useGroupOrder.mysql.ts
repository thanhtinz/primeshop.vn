// Hooks for Group Order - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GroupOrder {
  id: string;
  userId: string;
  groupId: string;
  sortOrder: number;
  // Legacy mappings
  user_id?: string;
  group_id?: string;
  sort_order?: number;
}

const mapToLegacy = (o: any): GroupOrder => ({
  ...o,
  user_id: o.userId,
  group_id: o.groupId,
  sort_order: o.sortOrder,
});

// Fetch user's custom group order
export function useGroupOrder() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-order', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await db
        .from<any>('user_group_orders')
        .select('*')
        .eq('userId', user.id)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapToLegacy) as GroupOrder[];
    },
    enabled: !!user,
  });
}

// Save user's custom group order
export function useSaveGroupOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupIds: string[]) => {
      if (!user) throw new Error('Must be logged in');

      // Delete existing orders
      await db.from('user_group_orders').delete().eq('userId', user.id);

      // Insert new orders
      const orders = groupIds.map((groupId, index) => ({
        userId: user.id,
        groupId,
        sortOrder: index,
      }));

      if (orders.length > 0) {
        const { error } = await db.from('user_group_orders').insert(orders);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-order'] });
      queryClient.invalidateQueries({ queryKey: ['joined-groups-with-unread'] });
      toast.success('Đã lưu thứ tự nhóm');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể lưu thứ tự');
    },
  });
}
