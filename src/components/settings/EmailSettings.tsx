import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  BellOff, 
  Bell, 
  Shield, 
  Loader2,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import {
  useEmailPreferences,
  useUpdateEmailPreferences,
  useToggleAllEmails,
  useEnableAllCategories,
  useDisableAllCategories,
  EMAIL_CATEGORIES,
  EMAIL_GROUPS,
  type EmailPreferenceKey,
} from '@/hooks/useEmailPreferences';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function EmailSettings() {
  const { data: preferences, isLoading } = useEmailPreferences();
  const updatePrefs = useUpdateEmailPreferences();
  const toggleAll = useToggleAllEmails();
  const enableAll = useEnableAllCategories();
  const disableAll = useDisableAllCategories();
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleToggle = (key: EmailPreferenceKey, value: boolean) => {
    updatePrefs.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Không thể tải cài đặt email
      </div>
    );
  }

  // Group categories
  const groupedCategories = Object.entries(EMAIL_CATEGORIES).reduce((acc, [key, config]) => {
    const group = 'group' in config ? config.group : 'essential';
    if (!acc[group]) acc[group] = [];
    acc[group].push({ key: key as EmailPreferenceKey, ...config });
    return acc;
  }, {} as Record<string, Array<{ key: EmailPreferenceKey } & typeof EMAIL_CATEGORIES[EmailPreferenceKey]>>);

  const essentialCategories = groupedCategories['essential'] || [];
  delete groupedCategories['essential'];

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card className={!preferences.emailEnabled ? 'border-destructive' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${preferences.emailEnabled ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                {preferences.emailEnabled ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Nhận thông báo Email</CardTitle>
                <CardDescription>
                  {preferences.emailEnabled 
                    ? 'Bạn đang nhận email từ hệ thống'
                    : 'Bạn đã tắt tất cả email (trừ email bảo mật quan trọng)'}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => toggleAll.mutate(checked)}
              disabled={toggleAll.isPending}
            />
          </div>
        </CardHeader>
        
        {preferences.emailEnabled && (
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => enableAll.mutate()}
                disabled={enableAll.isPending}
              >
                Bật tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disableAll.mutate()}
                disabled={disableAll.isPending}
              >
                Chỉ giữ bảo mật
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Essential Categories (Always Enabled Warning) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Bảo mật (Luôn bật)</CardTitle>
          </div>
          <CardDescription>
            Các email quan trọng liên quan đến bảo mật tài khoản - không thể tắt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {essentialCategories.map((category) => (
            <div key={category.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <div>
                  <p className="font-medium">{category.label}</p>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Bắt buộc</Badge>
                <Switch checked disabled />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optional Categories by Group */}
      {preferences.emailEnabled && Object.entries(EMAIL_GROUPS).map(([groupKey, groupConfig]) => {
        const categories = groupedCategories[groupKey];
        if (!categories || categories.length === 0) return null;

        const enabledCount = categories.filter(
          (c) => preferences[c.key as keyof typeof preferences]
        ).length;
        const isExpanded = expandedGroups[groupKey] ?? true;

        return (
          <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{groupConfig.icon}</span>
                      <div className="text-left">
                        <CardTitle className="text-lg">{groupConfig.label}</CardTitle>
                        <CardDescription>
                          {enabledCount}/{categories.length} danh mục đang bật
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={enabledCount === categories.length ? 'default' : 'secondary'}>
                        {enabledCount}/{categories.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <Separator />
                  {categories.map((category, index) => (
                    <div key={category.key}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <div>
                            <p className="font-medium">{category.label}</p>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences[category.key as keyof typeof preferences] as boolean}
                          onCheckedChange={(checked) => handleToggle(category.key, checked)}
                          disabled={updatePrefs.isPending}
                        />
                      </div>
                      {index < categories.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Info Note */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Lưu ý:</strong> Một số email quan trọng như xác thực bảo mật, 
                cảnh báo đăng nhập sẽ luôn được gửi để bảo vệ tài khoản của bạn.
              </p>
              <p className="mt-2">
                Bạn có thể hủy đăng ký từ email bất kỳ bằng cách nhấn link "Hủy đăng ký" 
                ở cuối mỗi email.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailSettings;
