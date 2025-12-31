// Settings helper - đọc từ database và cache
import prisma from './prisma.js';

// Cache settings để tránh query database mỗi lần
let settingsCache: Record<string, any> = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

// Load tất cả settings từ database
export async function loadSettings(): Promise<Record<string, any>> {
  const now = Date.now();
  
  // Return cache nếu còn hạn
  if (cacheTimestamp > 0 && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }
  
  try {
    const settings = await prisma.siteSetting.findMany();
    settingsCache = {};
    
    settings.forEach((s: { key: string; value: any }) => {
      settingsCache[s.key] = s.value;
    });
    
    cacheTimestamp = now;
    return settingsCache;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return settingsCache; // Return old cache if error
  }
}

// Get single setting
export async function getSetting(key: string, defaultValue: any = null): Promise<any> {
  const settings = await loadSettings();
  return settings[key] ?? defaultValue;
}

// Get multiple settings by prefix
export async function getSettingsByPrefix(prefix: string): Promise<Record<string, any>> {
  const settings = await loadSettings();
  const result: Record<string, any> = {};
  
  Object.entries(settings).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      result[key] = value;
    }
  });
  
  return result;
}

// Clear cache (call after updating settings)
export function clearSettingsCache(): void {
  cacheTimestamp = 0;
  settingsCache = {};
}

// Get setting với fallback từ env
export async function getSettingOrEnv(key: string, envKey?: string): Promise<string | null> {
  const dbValue = await getSetting(key);
  if (dbValue) return dbValue;
  
  // Fallback to env
  const envName = envKey || key.toUpperCase().replace(/[.-]/g, '_');
  return process.env[envName] || null;
}

// Helper để lấy SMTP config (ưu tiên database, fallback .env)
export async function getSmtpConfig() {
  return {
    host: await getSettingOrEnv('smtp_host', 'SMTP_HOST'),
    port: parseInt(await getSettingOrEnv('smtp_port', 'SMTP_PORT') || '587'),
    secure: (await getSettingOrEnv('smtp_secure', 'SMTP_SECURE')) === 'true',
    user: await getSettingOrEnv('smtp_user', 'SMTP_USER'),
    pass: await getSettingOrEnv('smtp_pass', 'SMTP_PASS'),
    fromName: await getSettingOrEnv('smtp_from_name', 'SMTP_FROM_NAME'),
    fromEmail: await getSettingOrEnv('smtp_from_email', 'SMTP_FROM_EMAIL'),
  };
}

// Helper để lấy PayOS config
export async function getPayOSConfig() {
  return {
    clientId: await getSettingOrEnv('payos_client_id', 'PAYOS_CLIENT_ID'),
    apiKey: await getSettingOrEnv('payos_api_key', 'PAYOS_API_KEY'),
    checksumKey: await getSettingOrEnv('payos_checksum_key', 'PAYOS_CHECKSUM_KEY'),
  };
}

// Helper để lấy Discord config
export async function getDiscordConfig() {
  return {
    clientId: await getSettingOrEnv('discord_client_id', 'DISCORD_CLIENT_ID'),
    clientSecret: await getSettingOrEnv('discord_client_secret', 'DISCORD_CLIENT_SECRET'),
    webhookUrl: await getSettingOrEnv('discord_webhook_url', 'DISCORD_WEBHOOK_URL'),
  };
}

export default {
  loadSettings,
  getSetting,
  getSettingsByPrefix,
  clearSettingsCache,
  getSettingOrEnv,
  getSmtpConfig,
  getPayOSConfig,
  getDiscordConfig,
};
