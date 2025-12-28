# Discord Bot Integration Setup Guide

## Overview

Prime Shop now supports Discord bot integration, allowing users to receive notifications via Discord DMs instead of (or in addition to) email.

## Features

- ✅ **Direct Message Notifications** - Send notifications to users via Discord DMs
- ✅ **Granular Preferences** - Users control which notification types they receive
- ✅ **Admin Configuration** - Easy bot setup through admin panel
- ✅ **User Self-Service** - Users link their Discord account themselves
- ✅ **Fallback Support** - Email notifications still work if Discord is unavailable
- ✅ **Rich Embeds** - Beautiful formatted messages with colors and metadata

## Admin Setup

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it (e.g., "Prime Shop Notifications")
3. Go to "Bot" section and click "Add Bot"
4. Click "Reset Token" and copy the token (save it securely!)
5. Copy the "Application ID" from the "General Information" page

### 2. Configure Bot Permissions

In the Bot section:
- Enable "MESSAGE CONTENT INTENT" under Privileged Gateway Intents
- Bot Permissions needed:
  - Send Messages
  - Embed Links

### 3. Configure in Admin Panel

1. Go to Admin Panel → Settings → Discord Bot
2. Enter your Bot Token and Client ID
3. (Optional) Add notification/announcement channel IDs
4. Click "Save Configuration"
5. Bot will restart automatically

### 4. Test the Bot

1. Go to "Test Bot" tab in admin
2. Enter a Discord User ID
3. Click "Send Test Message"
4. Check if the user received the DM

## User Setup

### 1. Get Discord User ID

1. Enable Developer Mode in Discord:
   - User Settings → Advanced → Developer Mode
2. Right-click your username anywhere
3. Select "Copy User ID"

### 2. Link Discord Account

1. Go to Settings → Notifications → Discord Notifications tab
2. Paste your Discord User ID
3. Click "Link Discord Account"
4. You'll receive a welcome message in your Discord DMs

### 3. Configure Notification Preferences

Choose which types of notifications to receive:
- Order Notifications
- Payment Notifications  
- Account Notifications
- System Notifications
- Security Notifications
- Social Notifications
- Marketplace Notifications

## Notification Types

| Type | Description | Color |
|------|-------------|-------|
| `order` | Order updates, deliveries | Green |
| `payment` | Deposits, withdrawals | Orange |
| `account` | Profile changes | Blue |
| `system` | System announcements | Gray |
| `security` | Security alerts | Red |
| `social` | Social interactions | Pink |
| `marketplace` | Shop activities | Purple |

## API Integration

### Send Notification to User

```typescript
import { discordService } from './services/discordService';

await discordService.sendNotification(userId, {
  title: '🎉 Order Delivered!',
  message: 'Your order #12345 has been delivered.',
  type: 'order',
  url: 'https://primeshop.vn/orders/12345',
  metadata: {
    'Order Number': '#12345',
    'Total': '$99.99'
  }
});
```

### Send Bulk Announcement

```typescript
await discordService.sendBulkNotification(channelId, {
  title: '📢 New Feature Released!',
  description: 'Check out our latest features...',
  color: 0x0099FF,
  fields: [
    { name: 'Feature 1', value: 'Description', inline: true }
  ]
});
```

## Database Schema

```sql
-- Users table additions
discordId VARCHAR(255)                  -- Discord user ID
discordLinkedAt DATETIME                -- When Discord was linked
discordNotificationPreferences JSON     -- Notification preferences

-- Site settings
discord_bot_config JSON                 -- Bot configuration
```

## Environment Variables

```env
# Discord bot is configured via database, no env vars needed
# But you can add Redis for better performance:
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

### Bot Not Sending Messages

1. **Check Bot Status**: Settings → Notifications → Discord tab shows bot status
2. **Verify Token**: Make sure bot token is correct in admin panel
3. **Check Intents**: MESSAGE CONTENT INTENT must be enabled
4. **User ID**: Verify the Discord User ID is correct
5. **Privacy Settings**: User must allow DMs from server members

### Bot Shows Offline

- Check if token is valid
- Verify bot has correct permissions
- Check server logs for errors
- Restart server if needed

### User Not Receiving Notifications

1. Check if Discord is linked in user settings
2. Verify notification type is enabled in preferences
3. Test with "Send Test Message" button
4. Check if user has DMs disabled
5. Verify bot is online

## Best Practices

1. **Always Test First**: Use the test function before going live
2. **Respect User Preferences**: Check notification settings before sending
3. **Provide Context**: Include relevant metadata in notifications
4. **Use Appropriate Types**: Choose correct notification type for proper coloring
5. **Handle Errors**: Discord API can fail, always have email fallback

## Security

- Bot token is stored in database (encrypted recommended)
- Users can only link their own Discord ID
- Bot can only send DMs to users who link their accounts
- Admin bypass is available for testing
- Rate limiting applies to Discord API calls

## Performance

- Bot maintains persistent WebSocket connection
- Notifications are sent asynchronously
- Failed deliveries don't block order processing
- Consider Redis for distributed deployments

## Migration Guide

If you have existing users:

1. Run migration SQL to add Discord columns
2. Configure bot in admin panel
3. Announce feature to users via email/banner
4. Users can opt-in by linking their Discord
5. Email notifications continue to work as fallback

## Support

- **Bot Issues**: Check admin panel logs
- **User Issues**: Direct users to settings page
- **API Issues**: Check Discord.js documentation
- **Feature Requests**: Contact development team
