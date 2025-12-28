import { GroupProofsTab } from '@/components/groups/tabs/GroupProofsTab';
import { useGroupContext } from '@/components/groups/GroupLayout';

export default function GroupProofsPage() {
  const { groupId } = useGroupContext();
  
  return <GroupProofsTab groupId={groupId} />;
}
