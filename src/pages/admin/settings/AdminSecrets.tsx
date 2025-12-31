import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Shield,
  CreditCard,
  Mail,
  MessageSquare,
  Globe,
  Database,
  Server,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecretField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required?: boolean;
  testUrl?: string;
}

interface SecretGroup {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  fields: SecretField[];
  docsUrl?: string;
}

const secretGroups: SecretGroup[] = [
  {
    id: 'database',
    icon: Database,
    title: 'Database (MySQL)',
    description: 'Cấu hình kết nối MySQL database',
    docsUrl: 'https://www.prisma.io/docs/concepts/database-connectors/mysql',
    fields: [
      { key: 'DATABASE_URL', label: 'Database URL', type: 'password', placeholder: 'mysql://user:pass@host:3306/db', required: true },
    ],
  },
  {
    id: 'auth',
    icon: Shield,
    title: 'Authentication',
    description: 'JWT và cấu hình bảo mật',
    fields: [
      { key: 'JWT_SECRET', label: 'JWT Secret', type: 'password', placeholder: 'your-secret-key', required: true },
      { key: 'JWT_REFRESH_SECRET', label: 'JWT Refresh Secret', type: 'password', placeholder: 'your-refresh-secret', required: true },
      { key: 'JWT_EXPIRES_IN', label: 'JWT Expiry', type: 'text', placeholder: '15m' },
      { key: 'JWT_REFRESH_EXPIRES_IN', label: 'Refresh Token Expiry', type: 'text', placeholder: '7d' },
    ],
  },
  {
    id: 'google',
    icon: Globe,
    title: 'Google OAuth',
    description: 'Đăng nhập bằng Google',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    fields: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'xxxxx.apps.googleusercontent.com', required: true },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-xxxxx', required: true },
      { key: 'GOOGLE_REDIRECT_URI', label: 'Redirect URI', type: 'url', placeholder: 'https://yoursite.com/auth/callback/google' },
    ],
  },
  {
    id: 'discord',
    icon: MessageSquare,
    title: 'Discord OAuth',
    description: 'Đăng nhập và thông báo Discord',
    docsUrl: 'https://discord.com/developers/applications',
    fields: [
      { key: 'DISCORD_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: '123456789', required: true },
      { key: 'DISCORD_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'xxxxx', required: true },
      { key: 'DISCORD_REDIRECT_URI', label: 'Redirect URI', type: 'url', placeholder: 'https://yoursite.com/auth/callback/discord' },
      { key: 'DISCORD_WEBHOOK_URL', label: 'Webhook URL (Notifications)', type: 'url', placeholder: 'https://discord.com/api/webhooks/...' },
    ],
  },
  {
    id: 'payos',
    icon: CreditCard,
    title: 'PayOS (VND)',
    description: 'Cổng thanh toán VND trong nước',
    docsUrl: 'https://payos.vn/docs',
    fields: [
      { key: 'PAYOS_CLIENT_ID', label: 'Client ID', type: 'text', required: true },
      { key: 'PAYOS_API_KEY', label: 'API Key', type: 'password', required: true },
      { key: 'PAYOS_CHECKSUM_KEY', label: 'Checksum Key', type: 'password', required: true },
    ],
  },
  {
    id: 'paypal',
    icon: CreditCard,
    title: 'PayPal (USD)',
    description: 'Thanh toán quốc tế bằng USD',
    docsUrl: 'https://developer.paypal.com/docs',
    fields: [
      { key: 'PAYPAL_CLIENT_ID', label: 'Client ID', type: 'text' },
      { key: 'PAYPAL_CLIENT_SECRET', label: 'Client Secret', type: 'password' },
      { key: 'PAYPAL_MODE', label: 'Mode (sandbox/live)', type: 'text', placeholder: 'sandbox' },
    ],
  },
  {
    id: 'usdt',
    icon: CreditCard,
    title: 'USDT (Crypto)',
    description: 'Thanh toán bằng tiền điện tử USDT',
    docsUrl: 'https://fpayment.net/',
    fields: [
      { key: 'FPAYMENT_ENABLED', label: 'Bật USDT (true/false)', type: 'text', placeholder: 'false' },
      { key: 'FPAYMENT_API_KEY', label: 'API Key', type: 'password' },
      { key: 'FPAYMENT_MERCHANT_ID', label: 'Merchant ID', type: 'text' },
    ],
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email (SMTP)',
    description: 'Cấu hình email server theo domain riêng',
    docsUrl: 'https://support.google.com/a/answer/176600',
    fields: [
      { key: 'SMTP_HOST', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
      { key: 'SMTP_PORT', label: 'SMTP Port', type: 'text', placeholder: '587' },
      { key: 'SMTP_SECURE', label: 'SMTP Secure (true/false)', type: 'text', placeholder: 'true' },
      { key: 'SMTP_USER', label: 'SMTP Username', type: 'text', placeholder: 'noreply@yourdomain.com', required: true },
      { key: 'SMTP_PASS', label: 'SMTP Password', type: 'password', required: true },
      { key: 'SMTP_FROM_NAME', label: 'From Name', type: 'text', placeholder: 'Your Shop Name' },
      { key: 'SMTP_FROM_EMAIL', label: 'From Email', type: 'text', placeholder: 'noreply@yourdomain.com' },
      { key: 'IMAP_HOST', label: 'IMAP Host (Receive)', type: 'text', placeholder: 'imap.gmail.com' },
      { key: 'IMAP_PORT', label: 'IMAP Port', type: 'text', placeholder: '993' },
      { key: 'IMAP_USER', label: 'IMAP Username', type: 'text' },
      { key: 'IMAP_PASS', label: 'IMAP Password', type: 'password' },
    ],
  },
  {
    id: 'naperis',
    icon: Server,
    title: 'Naperis Topup API',
    description: 'API nạp game tự động',
    docsUrl: 'https://naperis.vn/docs',
    fields: [
      { key: 'NAPERIS_API_URL', label: 'API URL', type: 'url', placeholder: 'https://api.naperis.vn' },
      { key: 'NAPERIS_API_KEY', label: 'API Key', type: 'password', required: true },
      { key: 'NAPERIS_PARTNER_ID', label: 'Partner ID', type: 'text' },
    ],
  },
  {
    id: 'storage',
    icon: Database,
    title: 'Cloud Storage',
    description: 'Lưu trữ file (S3, Cloudflare R2, etc.)',
    fields: [
      { key: 'S3_ENDPOINT', label: 'S3 Endpoint', type: 'url', placeholder: 'https://xxx.r2.cloudflarestorage.com' },
      { key: 'S3_BUCKET', label: 'Bucket Name', type: 'text' },
      { key: 'S3_ACCESS_KEY', label: 'Access Key', type: 'text' },
      { key: 'S3_SECRET_KEY', label: 'Secret Key', type: 'password' },
      { key: 'S3_REGION', label: 'Region', type: 'text', placeholder: 'auto' },
      { key: 'S3_PUBLIC_URL', label: 'Public URL', type: 'url', placeholder: 'https://cdn.yourdomain.com' },
    ],
  },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AdminSecrets = () => {
  const { t } = useLanguage();
  
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('database');

  // Fetch secrets from server .env file
  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_URL}/admin/secrets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSecrets(data.secrets || {});
        }
      } catch (error) {
        console.error('Failed to load secrets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSecrets();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSecrets(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleVisibility = (key: string) => {
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t('admin.copied') || 'Đã sao chép!');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ secrets }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save secrets');
      }
      
      const data = await response.json();
      toast.success(data.message || t('admin.secretsSaved') || 'Đã lưu và áp dụng cấu hình!');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const getGroupStatus = (group: SecretGroup) => {
    const requiredFields = group.fields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => secrets[f.key]?.trim());
    
    if (filledRequired.length === 0 && requiredFields.length > 0) {
      return { status: 'unconfigured', label: 'Chưa cấu hình', color: 'bg-muted text-muted-foreground' };
    }
    if (filledRequired.length < requiredFields.length) {
      return { status: 'partial', label: 'Chưa đầy đủ', color: 'bg-yellow-500/10 text-yellow-600' };
    }
    return { status: 'configured', label: 'Đã cấu hình', color: 'bg-green-500/10 text-green-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            {t('admin.secretsTitle') || 'API Keys & Secrets'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.secretsDesc') || 'Cấu hình các API keys và thông tin nhạy cảm'}
          </p>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t('save') || 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Warning */}
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('admin.secretsWarning') || 'Cảnh báo: Không chia sẻ các thông tin này với bất kỳ ai. Các secrets được mã hóa khi lưu trữ.'}
        </AlertDescription>
      </Alert>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {secretGroups.map(group => {
            const status = getGroupStatus(group);
            return (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className={cn(
                  'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                  'gap-2 px-3 py-2'
                )}
              >
                <group.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{group.title}</span>
                {status.status === 'configured' && (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {secretGroups.map(group => (
          <TabsContent key={group.id} value={group.id} className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <group.icon className="w-5 h-5 text-primary" />
                      {group.title}
                    </CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                  {group.docsUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={group.docsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Docs
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        type={field.type === 'password' && !visibleFields[field.key] ? 'password' : 'text'}
                        value={secrets[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="pr-20"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                        {field.type === 'password' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleVisibility(field.key)}
                          >
                            {visibleFields[field.key] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        {secrets[field.key] && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(secrets[field.key])}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Save Button Mobile */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full gap-2"
            size="lg"
          >
            {updateSettings.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t('save') || 'Lưu thay đổi'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSecrets;
