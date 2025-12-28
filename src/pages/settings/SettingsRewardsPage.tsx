import { useOutletContext } from 'react-router-dom';
import { PointsRewardsSection } from '@/components/checkin/PointsRewardsSection';
import { DailyCheckinWidget } from '@/components/checkin/DailyCheckinWidget';

interface SettingsContext {
  t: (key: string) => string;
}

export default function SettingsRewardsPage() {
  return (
    <div className="space-y-6">
      <DailyCheckinWidget />
      <PointsRewardsSection />
    </div>
  );
}
