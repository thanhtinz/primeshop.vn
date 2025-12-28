import { GroupMembersTab } from '@/components/groups/tabs/GroupMembersTab';
import { useGroupContext } from '@/components/groups/GroupLayout';

export default function GroupMembersPage() {
  const { groupId, canManage, isOwner } = useGroupContext();
  
  return <GroupMembersTab groupId={groupId} canManage={canManage} isOwner={isOwner} />;
}
