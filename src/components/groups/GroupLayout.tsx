import { Link, Outlet, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { GroupHeader } from '@/components/groups/GroupHeader';
import { useGroup, useGroupMembership } from '@/hooks/useGroups';
import { useUpdateGroupLastView } from '@/hooks/useGroupLastViews';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function GroupLayout() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: group, isLoading: groupLoading, error } = useGroup(id || '');
  const { data: membership, isLoading: membershipLoading } = useGroupMembership(group?.id || '');
  const updateLastView = useUpdateGroupLastView();
  
  // Update last view when entering the group
  useEffect(() => {
    if (group?.id && user && membership) {
      updateLastView.mutate(group.id);
    }
  }, [group?.id, user, membership?.id]);
  
  if (groupLoading || membershipLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }
  
  if (error || !group) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Không tìm thấy nhóm</p>
          <Button asChild className="mt-4">
            <Link to="/groups">Quay lại</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  const isOwner = user?.id === group.owner_id;
  const canManage = isOwner || membership?.role === 'manager';
  
  return (
    <Layout>
      <GroupHeader 
        group={group} 
        membership={membership || null} 
        isOwner={isOwner}
        canManage={canManage}
        groupId={group.id}
      />
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Outlet context={{ groupId: group.id, membership, isOwner, canManage, group }} />
      </div>
    </Layout>
  );
}

// Hook to access group context in child routes
import { useOutletContext } from 'react-router-dom';
import { Group, GroupMember } from '@/hooks/useGroups';

interface GroupContext {
  groupId: string;
  membership: GroupMember | null;
  isOwner: boolean;
  canManage: boolean;
  group: Group;
}

export function useGroupContext() {
  return useOutletContext<GroupContext>();
}
