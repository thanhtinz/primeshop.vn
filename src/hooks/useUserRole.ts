import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'user' | 'admin' | 'staff';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Use RPC function with SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) {
        console.error('[useUserRole] Error fetching user role:', error);
        return null;
      }

      return data as UserRole | null;
    },
    enabled: !!user?.id,
  });
};

export const useIsAdmin = () => {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === 'admin', isLoading };
};

export const useIsStaff = () => {
  const { data: role, isLoading } = useUserRole();
  return { isStaff: role === 'staff' || role === 'admin', isLoading };
};

export const useHasAccess = (allowedRoles: UserRole[]) => {
  const { data: role, isLoading } = useUserRole();
  return { hasAccess: role ? allowedRoles.includes(role) : false, isLoading };
};
