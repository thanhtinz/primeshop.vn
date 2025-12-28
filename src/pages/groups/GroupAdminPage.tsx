import { useSearchParams, Navigate } from 'react-router-dom';
import { useGroupContext } from '@/components/groups/GroupLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, Zap, BarChart3, Crown, Award } from 'lucide-react';
import { OwnerSettingsTab } from '@/components/groups/manage/OwnerSettingsTab';
import { MemberManagementTab } from '@/components/groups/manage/MemberManagementTab';
import { RolePermissionsTab } from '@/components/groups/manage/RolePermissionsTab';
import { RuleEngineTab } from '@/components/groups/manage/RuleEngineTab';
import { GroupStatsTab } from '@/components/groups/manage/GroupStatsTab';
import { GroupBadgeManager } from '@/components/groups/GroupBadgeManager';

export default function GroupAdminPage() {
  const { groupId, canManage, isOwner, group } = useGroupContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'settings';

  if (!canManage) {
    return <Navigate to={`/groups/${groupId}`} replace />;
  }

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Quản lý Group</h1>
          <p className="text-sm text-muted-foreground">
            {isOwner ? 'Quyền Owner' : 'Quyền Manager'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap gap-1 bg-transparent p-0 mb-4">
          {isOwner && (
            <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Crown className="h-4 w-4" />
              Owner
            </TabsTrigger>
          )}
          <TabsTrigger value="members" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4" />
            Thành viên
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="roles" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" />
              Vai trò
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="rules" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="h-4 w-4" />
              Rules
            </TabsTrigger>
          )}
          <TabsTrigger value="badges" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Award className="h-4 w-4" />
            Huy hiệu
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        {isOwner && (
          <TabsContent value="settings" className="mt-0">
            <OwnerSettingsTab 
              groupId={groupId} 
              group={{
                name: group.name,
                description: group.description,
                avatar_url: group.avatar_url,
                cover_url: group.cover_url,
                is_private: group.visibility === 'private',
                join_type: group.join_type,
                min_reputation: group.min_reputation_to_join,
                join_fee: group.entry_fee,
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="members" className="mt-0">
          <MemberManagementTab groupId={groupId} isOwner={isOwner} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="roles" className="mt-0">
            <RolePermissionsTab groupId={groupId} isOwner={isOwner} />
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="rules" className="mt-0">
            <RuleEngineTab groupId={groupId} isOwner={isOwner} />
          </TabsContent>
        )}

        <TabsContent value="badges" className="mt-0">
          <GroupBadgeManager groupId={groupId} />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <GroupStatsTab groupId={groupId} isOwner={isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
