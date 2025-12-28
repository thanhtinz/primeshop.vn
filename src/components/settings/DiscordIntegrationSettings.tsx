import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useDiscordPreferences, 
  useLinkDiscord, 
  useUnlinkDiscord, 
  useUpdateDiscordPreferences,
  useTestDiscordNotification,
  useDiscordBotStatus,
} from '@/hooks/useDiscordIntegration';
import { MessageSquare, Link, Unlink, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DiscordIntegrationSettings = () => {
  const { data: preferences, isLoading } = useDiscordPreferences();
  const { data: botStatus } = useDiscordBotStatus();
  const linkDiscord = useLinkDiscord();
  const unlinkDiscord = useUnlinkDiscord();
  const updatePreferences = useUpdateDiscordPreferences();
  const testNotification = useTestDiscordNotification();

  const [discordId, setDiscordId] = useState('');
  const [localPrefs, setLocalPrefs] = useState(preferences?.preferences || {});

  const handleLinkDiscord = () => {
    if (discordId.trim()) {
      linkDiscord.mutate(discordId);
    }
  };

  const handleUpdatePreference = (key: string, value: boolean) => {
    const newPrefs = { ...localPrefs, [key]: value };
    setLocalPrefs(newPrefs);
    updatePreferences.mutate(newPrefs);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bot Status */}
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Discord Bot Status: {' '}
            {botStatus?.connected ? (
              <Badge variant="default" className="ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">
                <XCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </span>
        </AlertDescription>
      </Alert>

      {/* Link/Unlink Discord */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discord Connection
          </CardTitle>
          <CardDescription>
            Link your Discord account to receive notifications via Discord DMs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences?.isLinked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Discord ID: {preferences.discordId}</p>
                  <p className="text-sm text-muted-foreground">
                    Linked on {new Date(preferences.linkedAt || '').toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => testNotification.mutate()}
                  disabled={testNotification.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Message
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => unlinkDiscord.mutate()}
                  disabled={unlinkDiscord.isPending}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink Discord
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discordId">Your Discord User ID</Label>
                <Input
                  id="discordId"
                  placeholder="123456789012345678"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  To find your Discord ID: Enable Developer Mode in Discord Settings → User Settings → Advanced → Developer Mode. 
                  Then right-click your username and select "Copy User ID"
                </p>
              </div>

              <Button
                onClick={handleLinkDiscord}
                disabled={!discordId.trim() || linkDiscord.isPending || !botStatus?.connected}
              >
                <Link className="h-4 w-4 mr-2" />
                Link Discord Account
              </Button>

              {!botStatus?.connected && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Discord bot is currently offline. Please try again later or contact support.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discord Notification Preferences */}
      {preferences?.isLinked && (
        <Card>
          <CardHeader>
            <CardTitle>Discord Notification Preferences</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive on Discord
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
                  checked={localPrefs.orderNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('orderNotifications', checked)}
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
                  checked={localPrefs.paymentNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('paymentNotifications', checked)}
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
                  checked={localPrefs.accountNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('accountNotifications', checked)}
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
                  checked={localPrefs.systemNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('systemNotifications', checked)}
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
                  checked={localPrefs.securityNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('securityNotifications', checked)}
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
                  checked={localPrefs.socialNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('socialNotifications', checked)}
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
                  checked={localPrefs.marketplaceNotifications ?? true}
                  onCheckedChange={(checked) => handleUpdatePreference('marketplaceNotifications', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
