import { GroupWalletTab } from '@/components/groups/tabs/GroupWalletTab';
import { useGroupContext } from '@/components/groups/GroupLayout';

export default function GroupWalletPage() {
  const { groupId, canManage } = useGroupContext();
  
  return <GroupWalletTab groupId={groupId} canManage={canManage} />;
}
