import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';

export const WebNotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    orderNotifications: true,
    paymentNotifications: true,
    accountNotifications: true,
    systemNotifications: true,
    securityNotifications: true,
    socialNotifications: true,
    marketplaceNotifications: true,
  });

  const handleToggle = (key: string) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key as keyof typeof preferences],
    };
    setPreferences(newPreferences);
    
    // Save to localStorage
    localStorage.setItem('webNotificationPreferences', JSON.stringify(newPreferences));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Web Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to see on the website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Updates about your orders, deliveries, and confirmations
              </p>
            </div>
            <Switch
              checked={preferences.orderNotifications}
              onCheckedChange={() => handleToggle('orderNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Payment Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Deposits, withdrawals, and payment confirmations
              </p>
            </div>
            <Switch
              checked={preferences.paymentNotifications}
              onCheckedChange={() => handleToggle('paymentNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Account changes, profile updates, and settings
              </p>
            </div>
            <Switch
              checked={preferences.accountNotifications}
              onCheckedChange={() => handleToggle('accountNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Notifications</Label>
              <p className="text-sm text-muted-foreground">
                System maintenance, updates, and important announcements
              </p>
            </div>
            <Switch
              checked={preferences.systemNotifications}
              onCheckedChange={() => handleToggle('systemNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Login alerts, password changes, and security updates
              </p>
            </div>
            <Switch
              checked={preferences.securityNotifications}
              onCheckedChange={() => handleToggle('securityNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Social Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Follows, likes, comments, and social interactions
              </p>
            </div>
            <Switch
              checked={preferences.socialNotifications}
              onCheckedChange={() => handleToggle('socialNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketplace Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Seller updates, shop activities, and marketplace news
              </p>
            </div>
            <Switch
              checked={preferences.marketplaceNotifications}
              onCheckedChange={() => handleToggle('marketplaceNotifications')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
