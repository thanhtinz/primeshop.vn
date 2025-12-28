import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Gift, Trophy, Flame } from 'lucide-react';
import { CheckinSettingsTab } from '@/components/admin/rewards/CheckinSettingsTab';
import { MilestoneRewardsTab } from '@/components/admin/rewards/MilestoneRewardsTab';
import { PointsRewardsTab } from '@/components/admin/rewards/PointsRewardsTab';
import { AchievementsTab } from '@/components/admin/rewards/AchievementsTab';

const AdminRewards = () => {
  const [activeTab, setActiveTab] = useState('checkin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý điểm thưởng & Thành tựu</h1>
        <p className="text-muted-foreground">Cài đặt hệ thống điểm danh, phần thưởng và huy hiệu</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="checkin" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Điểm danh</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Quà mốc</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Phần thưởng</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Thành tựu</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-4">
          <CheckinSettingsTab />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <MilestoneRewardsTab />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <PointsRewardsTab />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRewards;
