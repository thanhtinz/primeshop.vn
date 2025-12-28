import { GroupDealsTab } from '@/components/groups/tabs/GroupDealsTab';
import { useGroupContext } from '@/components/groups/GroupLayout';

export default function GroupDealsPage() {
  const { groupId, membership, canManage } = useGroupContext();
  
  return <GroupDealsTab groupId={groupId} membership={membership} canManage={canManage} />;
}
