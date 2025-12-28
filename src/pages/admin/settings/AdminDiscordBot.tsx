import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, CheckCircle2, XCircle, Save, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdminDiscordBotSettings = () => {
  const { toast } = useToast();
  const [botConfig, setBotConfig] = useState({
    token: '',
    clientId: '',
    notificationChannelId: '',
    announcementChannelId: '',
  });
  const [testDiscordId, setTestDiscordId] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/admin/settings/discord-bot', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(botConfig),
      });

      if (!response.ok) throw new Error('Failed to save Discord bot settings');

      toast({
        title: 'Success',
        description: 'Discord bot settings saved successfully. Bot will restart.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTestBot = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/discord/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ discordId: testDiscordId }),
      });

      if (!response.ok) throw new Error('Failed to send test message');

      toast({
        title: 'Test Message Sent',
        description: 'Check the Discord user\'s DMs for the test message',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discord Bot Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure Discord bot for user notifications
        </p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test Bot</TabsTrigger>
          <TabsTrigger value="guide">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>
                Configure your Discord bot credentials and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token *</Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GaBcDe.fGhIjKlMnOpQrStUvWxYz1234567890"
                  value={botConfig.token}
                  onChange={(e) => setBotConfig({ ...botConfig, token: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Your Discord bot token from the Developer Portal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  placeholder="123456789012345678"
                  value={botConfig.clientId}
                  onChange={(e) => setBotConfig({ ...botConfig, clientId: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Application ID from Discord Developer Portal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationChannel">Notification Channel ID (Optional)</Label>
                <Input
                  id="notificationChannel"
                  placeholder="123456789012345678"
                  value={botConfig.notificationChannelId}
                  onChange={(e) => setBotConfig({ ...botConfig, notificationChannelId: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Channel for system notifications and logs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcementChannel">Announcement Channel ID (Optional)</Label>
                <Input
                  id="announcementChannel"
                  placeholder="123456789012345678"
                  value={botConfig.announcementChannelId}
                  onChange={(e) => setBotConfig({ ...botConfig, announcementChannelId: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Channel for promotional announcements
                </p>
              </div>

              <Button onClick={handleSaveConfig}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Bot Connection</CardTitle>
              <CardDescription>
                Send a test message to verify bot is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testDiscordId">Discord User ID</Label>
                <Input
                  id="testDiscordId"
                  placeholder="123456789012345678"
                  value={testDiscordId}
                  onChange={(e) => setTestDiscordId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a Discord user ID to send a test message
                </p>
              </div>

              <Button
                onClick={handleTestBot}
                disabled={!testDiscordId || isTesting}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Send Test Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discord Bot Setup Guide</CardTitle>
              <CardDescription>
                Follow these steps to create and configure your Discord bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">Step 1: Create Discord Application</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Go to <a href="https://discord.com/developers/applications" target="_blank" className="text-primary hover:underline">Discord Developer Portal</a></li>
                    <li>Click "New Application" and name it (e.g., "Prime Shop Bot")</li>
                    <li>Copy the "Application ID" (this is your Client ID)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 2: Create Bot</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Go to "Bot" section in left sidebar</li>
                    <li>Click "Add Bot" and confirm</li>
                    <li>Click "Reset Token" to get your bot token</li>
                    <li>Copy and save the token securely (you can only see it once)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 3: Configure Bot Permissions</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Under "Privileged Gateway Intents", enable "MESSAGE CONTENT INTENT"</li>
                    <li>Scroll to "Bot Permissions" and select: "Send Messages", "Embed Links"</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 4: Invite Bot to Server (Optional)</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Go to "OAuth2" → "URL Generator"</li>
                    <li>Select "bot" scope</li>
                    <li>Select permissions: "Send Messages", "Embed Links"</li>
                    <li>Copy the generated URL and open it to invite bot to your server</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 5: Configure in Prime Shop</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Go back to "Configuration" tab</li>
                    <li>Paste your Bot Token and Client ID</li>
                    <li>Optionally add channel IDs for notifications</li>
                    <li>Click "Save Configuration"</li>
                    <li>Test the bot in "Test Bot" tab</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-lg mt-4">
                  <h4 className="font-semibold mb-2">How Users Link Their Discord</h4>
                  <p className="text-sm text-muted-foreground">
                    Users need to enable Developer Mode in Discord (Settings → Advanced → Developer Mode), 
                    then right-click their username and select "Copy User ID". They paste this ID in their 
                    settings page to link their account and start receiving notifications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
