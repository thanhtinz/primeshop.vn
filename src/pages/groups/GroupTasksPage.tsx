import { GroupTasksTab } from '@/components/groups/tabs/GroupTasksTab';
import { useGroupContext } from '@/components/groups/GroupLayout';

export default function GroupTasksPage() {
  const { groupId, membership, canManage } = useGroupContext();
  
  return <GroupTasksTab groupId={groupId} membership={membership} canManage={canManage} />;
}
