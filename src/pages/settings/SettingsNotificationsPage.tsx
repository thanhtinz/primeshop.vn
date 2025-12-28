import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscordIntegrationSettings } from '@/components/settings/DiscordIntegrationSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { WebNotificationSettings } from '@/components/settings/WebNotificationSettings';
import { Bell, Mail, MessageSquare } from 'lucide-react';

export const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive notifications across different channels
        </p>
      </div>

      <Tabs defaultValue="web" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="web" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Web Notifications
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </TabsTrigger>
          <TabsTrigger value="discord" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discord Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="web" className="space-y-6">
          <WebNotificationSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="discord" className="space-y-6">
          <DiscordIntegrationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
