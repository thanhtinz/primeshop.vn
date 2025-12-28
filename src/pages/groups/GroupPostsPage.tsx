import { GroupPostsTab } from '@/components/groups/tabs/GroupPostsTab';
import { useGroupContext } from '@/components/groups/GroupLayout';

export default function GroupPostsPage() {
  const { groupId, membership, group } = useGroupContext();
  
  return (
    <GroupPostsTab 
      groupId={groupId} 
      membership={membership}
      groupInfo={{
        name: group.name,
        avatar_url: group.avatar_url,
      }}
    />
  );
}
