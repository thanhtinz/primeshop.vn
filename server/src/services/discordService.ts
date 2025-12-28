import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import { db } from '../lib/api-client.js';
import { getDiscordTemplate, DISCORD_COLORS } from '../templates/discordTemplates.js';

class DiscordNotificationService {
  private client: Client | null = null;
  private isReady: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Get Discord bot token from settings
      const settings = await this.getBotSettings();
      
      if (!settings?.token) {
        console.log('Discord bot not configured');
        return;
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.DirectMessages,
        ],
      });

      this.client.on('ready', () => {
        console.log(`✅ Discord bot logged in as ${this.client?.user?.tag}`);
        this.isReady = true;
      });

      this.client.on('error', (error) => {
        console.error('Discord bot error:', error);
        this.isReady = false;
      });

      await this.client.login(settings.token);
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
    }
  }

  private async getBotSettings() {
    try {
      const { data } = await db
        .from('site_settings')
        .select('value')
        .eq('key', 'discord_bot_config')
        .single();

      return data?.value ? JSON.parse(data.value) : null;
    } catch (error) {
      return null;
    }
  }

  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'order' | 'payment' | 'account' | 'system' | 'security' | 'social' | 'marketplace';
    url?: string;
    metadata?: any;
  }) {
    try {
      if (!this.isReady || !this.client) {
        console.log('Discord bot not ready');
        return false;
      }

      // Get user's Discord preferences
      const { data: user } = await db
        .from('users')
        .select('discordId, discordNotificationPreferences')
        .eq('id', userId)
        .single();

      if (!user?.discordId) {
        return false; // User hasn't linked Discord
      }

      // Check if this notification type is enabled
      const prefs = user.discordNotificationPreferences || {};
      const notificationKey = `${notification.type}Notifications`;
      
      if (prefs[notificationKey] === false) {
        return false; // User disabled this notification type
      }

      // Create embed message
      const embed = new EmbedBuilder()
        .setTitle(notification.title)
        .setDescription(notification.message)
        .setColor(this.getColorForType(notification.type))
        .setTimestamp()
        .setFooter({ text: 'Prime Shop' });

      if (notification.url) {
        embed.setURL(notification.url);
      }

      if (notification.metadata) {
        Object.entries(notification.metadata).forEach(([key, value]) => {
          embed.addFields({ name: key, value: String(value), inline: true });
        });
      }

      // Send DM to user
      const discordUser = await this.client.users.fetch(user.discordId);
      await discordUser.send({ embeds: [embed] });

      return true;
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      return false;
    }
  }

  // Send notification using template
  async sendTemplateNotification(
    userId: string, 
    templateKey: string, 
    templateData: any,
    type: 'order' | 'payment' | 'account' | 'system' | 'security' | 'social' | 'marketplace',
    url?: string
  ) {
    try {
      if (!this.isReady || !this.client) {
        console.log('Discord bot not ready');
        return false;
      }

      // Get user's Discord preferences
      const { data: user } = await db
        .from('users')
        .select('discordId, discordNotificationPreferences')
        .eq('id', userId)
        .single();

      if (!user?.discordId) {
        return false;
      }

      // Check if this notification type is enabled
      const prefs = user.discordNotificationPreferences || {};
      const notificationKey = `${type}Notifications`;
      
      if (prefs[notificationKey] === false) {
        return false;
      }

      // Get template
      const template = getDiscordTemplate(templateKey as any, templateData);

      // Create embed message
      const embed = new EmbedBuilder()
        .setTitle(template.title)
        .setDescription(template.message)
        .setColor(template.color)
        .setTimestamp()
        .setFooter({ text: 'Prime Shop' });

      if (url) {
        embed.setURL(url);
      }

      if (template.metadata) {
        Object.entries(template.metadata).forEach(([key, value]) => {
          embed.addFields({ name: key, value: String(value), inline: true });
        });
      }

      // Send DM to user
      const discordUser = await this.client.users.fetch(user.discordId);
      await discordUser.send({ embeds: [embed] });

      return true;
    } catch (error) {
      console.error('Failed to send template notification:', error);
      return false;
    }
  }

  async sendBulkNotification(channelId: string, message: {
    title: string;
    description: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }) {
    try {
      if (!this.isReady || !this.client) {
        return false;
      }

      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      
      if (!channel || !channel.isTextBased()) {
        return false;
      }

      const embed = new EmbedBuilder()
        .setTitle(message.title)
        .setDescription(message.description)
        .setColor(message.color || 0x0099FF)
        .setTimestamp();

      if (message.fields) {
        embed.addFields(message.fields);
      }

      await channel.send({ embeds: [embed] });
      return true;
    } catch (error) {
      console.error('Failed to send bulk Discord notification:', error);
      return false;
    }
  }

  private getColorForType(type: string): number {
    const colors = {
      order: 0x00D26A,      // Green
      payment: 0xF59E0B,    // Orange
      account: 0x3B82F6,    // Blue
      system: 0x6B7280,     // Gray
      security: 0xEF4444,   // Red
      social: 0xEC4899,     // Pink
      marketplace: 0x8B5CF6, // Purple
    };
    return colors[type as keyof typeof colors] || 0x0099FF;
  }

  async verifyDiscordUser(discordId: string): Promise<boolean> {
    try {
      if (!this.isReady || !this.client) {
        return false;
      }
      
      await this.client.users.fetch(discordId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
    }
  }

  isConnected(): boolean {
    return this.isReady;
  }
}

// Singleton instance
export const discordService = new DiscordNotificationService();
