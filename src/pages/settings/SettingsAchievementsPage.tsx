import { useOutletContext } from 'react-router-dom';
import { AchievementsDisplay } from '@/components/achievements/AchievementsDisplay';

interface SettingsContext {
  t: (key: string) => string;
}

export default function SettingsAchievementsPage() {
  return <AchievementsDisplay />;
}
