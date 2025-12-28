import { useLanguage } from '@/contexts/LanguageContext';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { Mail } from 'lucide-react';

export default function SettingsEmailPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cài đặt Email</h1>
          <p className="text-muted-foreground">
            Quản lý thông báo email bạn muốn nhận
          </p>
        </div>
      </div>

      {/* Email Settings Component */}
      <EmailSettings />
    </div>
  );
}
