import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GroupOrder {
  id: string;
  user_id: string;
  group_id: string;
  sort_order: number;
}

// Fetch user's custom group order
export function useGroupOrder() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-order', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_group_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GroupOrder[];
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
      await supabase
        .from('user_group_orders')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new orders
      const orders = groupIds.map((groupId, index) => ({
        user_id: user.id,
        group_id: groupId,
        sort_order: index,
      }));
      
      if (orders.length > 0) {
        const { error } = await supabase
          .from('user_group_orders')
          .insert(orders);
        
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
