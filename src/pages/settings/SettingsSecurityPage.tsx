import { useOutletContext } from 'react-router-dom';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { PrivacySettings } from '@/components/profile/PrivacySettings';

interface SettingsContext {
  t: (key: string) => string;
}

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-6">
      <SecuritySettings />
      <PrivacySettings />
    </div>
  );
}
