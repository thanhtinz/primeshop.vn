import { GroupInsightsTab } from '@/components/groups/tabs/GroupInsightsTab';
import { useGroupContext } from '@/components/groups/GroupLayout';
import { Navigate } from 'react-router-dom';

export default function GroupInsightsPage() {
  const { groupId, canManage } = useGroupContext();
  
  if (!canManage) {
    return <Navigate to={`/groups/${groupId}`} replace />;
  }
  
  return <GroupInsightsTab groupId={groupId} />;
}
