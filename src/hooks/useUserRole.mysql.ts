import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

export type UserRole = 'user' | 'admin' | 'staff';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const response = await apiClient.get(`/users/${user.id}/role`);
        return response.data?.role as UserRole | null;
      } catch (error) {
        console.error('[useUserRole] Error fetching user role:', error);
        return null;
      }
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
