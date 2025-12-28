import { useOutletContext } from 'react-router-dom';
import VoucherTab from '@/components/profile/VoucherTab';

interface SettingsContext {
  t: (key: string) => string;
}

export default function SettingsVouchersPage() {
  return <VoucherTab />;
}
