import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling, { 
  DotType, 
  CornerSquareType, 
  CornerDotType,
  FileExtension 
} from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Link, 
  Type, 
  Wifi, 
  Contact, 
  Wallet, 
  Download as DownloadIcon, 
  Share2,
  Palette,
  Image as ImageIcon,
  Square,
  Circle,
  Sparkles,
  Copy,
  CheckCircle2,
  Smartphone,
  Facebook,
  MessageCircle,
  Crown
} from 'lucide-react';

// QR Types
type QrType = 'url' | 'text' | 'wifi' | 'vcard' | 'payment' | 'app' | 'social';

// QR Style Types
type QrDotStyle = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
type QrCornerStyle = 'square' | 'dot' | 'extra-rounded';

interface QrData {
  // URL
  url?: string;
  openNewTab?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  // Text
  text?: string;
  
  // WiFi
  wifiName?: string;
  wifiPassword?: string;
  wifiSecurity?: 'WPA' | 'WEP' | 'nopass';
  wifiHidden?: boolean;
  
  // vCard
  vcardName?: string;
  vcardPhone?: string;
  vcardEmail?: string;
  vcardAddress?: string;
  vcardCompany?: string;
  vcardTitle?: string;
  vcardWebsite?: string;
  
  // Payment
  paymentType?: 'bank' | 'momo' | 'zalopay' | 'vnpay';
  paymentAccount?: string;
  paymentName?: string;
  paymentAmount?: string;
  paymentMessage?: string;
  paymentBank?: string;
  
  // App
  appStoreUrl?: string;
  playStoreUrl?: string;
  
  // Social
  socialFacebook?: string;
  socialTelegram?: string;
  socialDiscord?: string;
  socialZalo?: string;
  socialTiktok?: string;
  socialInstagram?: string;
}

interface QrStyle {
  dotColor: string;
  backgroundColor: string;
  dotStyle: QrDotStyle;
  cornerSquareStyle: QrCornerStyle;
  cornerDotStyle: QrCornerStyle;
  size: number;
  margin: number;
  logoUrl?: string;
  logoSize: number;
  logoMargin: number;
  useGradient: boolean;
  gradientColor1: string;
  gradientColor2: string;
  gradientType: 'linear' | 'radial';
}

const defaultStyle: QrStyle = {
  dotColor: '#000000',
  backgroundColor: '#ffffff',
  dotStyle: 'square',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'square',
  size: 300,
  margin: 10,
  logoSize: 50,
  logoMargin: 5,
  useGradient: false,
  gradientColor1: '#6366f1',
  gradientColor2: '#8b5cf6',
  gradientType: 'linear',
};

const qrTypes = [
  { id: 'url' as QrType, label: 'Link/URL', icon: Link, description: 'Website, Landing page' },
  { id: 'text' as QrType, label: 'Văn bản', icon: Type, description: 'Ghi chú, mã KM' },
  { id: 'wifi' as QrType, label: 'WiFi', icon: Wifi, description: 'Kết nối nhanh' },
  { id: 'vcard' as QrType, label: 'Liên hệ', icon: Contact, description: 'vCard danh bạ' },
  { id: 'payment' as QrType, label: 'Thanh toán', icon: Wallet, description: 'Chuyển khoản' },
  { id: 'app' as QrType, label: 'App', icon: Smartphone, description: 'Link tải app' },
  { id: 'social' as QrType, label: 'MXH', icon: Share2, description: 'Mạng xã hội' },
];

const dotStyles: { value: QrDotStyle; label: string }[] = [
  { value: 'square', label: 'Vuông' },
  { value: 'rounded', label: 'Bo góc' },
  { value: 'dots', label: 'Chấm tròn' },
  { value: 'classy', label: 'Classic' },
  { value: 'classy-rounded', label: 'Classic Bo' },
  { value: 'extra-rounded', label: 'Siêu tròn' },
];

const cornerStyles: { value: QrCornerStyle; label: string }[] = [
  { value: 'square', label: 'Vuông' },
  { value: 'dot', label: 'Tròn' },
  { value: 'extra-rounded', label: 'Siêu tròn' },
];

const banks = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'CTG', name: 'VietinBank' },
  { code: 'SHB', name: 'SHB' },
];

export const QrGenerator: React.FC = () => {
  const [qrType, setQrType] = useState<QrType>('url');
  const [qrData, setQrData] = useState<QrData>({});
  const [style, setStyle] = useState<QrStyle>(defaultStyle);
  const [activeStyleTab, setActiveStyleTab] = useState('colors');
  const [copied, setCopied] = useState(false);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate QR content based on type
  const generateQrContent = (): string => {
    switch (qrType) {
      case 'url': {
        let url = qrData.url || 'https://example.com';
        if (qrData.utmSource || qrData.utmMedium || qrData.utmCampaign) {
          const params = new URLSearchParams();
          if (qrData.utmSource) params.set('utm_source', qrData.utmSource);
          if (qrData.utmMedium) params.set('utm_medium', qrData.utmMedium);
          if (qrData.utmCampaign) params.set('utm_campaign', qrData.utmCampaign);
          url += (url.includes('?') ? '&' : '?') + params.toString();
        }
        return url;
      }
      
      case 'text':
        return qrData.text || 'Hello World';
      
      case 'wifi':
        return `WIFI:T:${qrData.wifiSecurity || 'WPA'};S:${qrData.wifiName || ''};P:${qrData.wifiPassword || ''};H:${qrData.wifiHidden ? 'true' : 'false'};;`;
      
      case 'vcard':
        return `BEGIN:VCARD
VERSION:3.0
N:${qrData.vcardName || ''}
FN:${qrData.vcardName || ''}
ORG:${qrData.vcardCompany || ''}
TITLE:${qrData.vcardTitle || ''}
TEL:${qrData.vcardPhone || ''}
EMAIL:${qrData.vcardEmail || ''}
ADR:;;${qrData.vcardAddress || ''};;;;
URL:${qrData.vcardWebsite || ''}
END:VCARD`;
      
      case 'payment': {
        if (qrData.paymentType === 'bank') {
          // VietQR format
          const bank = qrData.paymentBank || 'VCB';
          const account = qrData.paymentAccount || '';
          const amount = qrData.paymentAmount || '';
          const message = qrData.paymentMessage || '';
          return `https://img.vietqr.io/image/${bank}-${account}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(message)}&accountName=${encodeURIComponent(qrData.paymentName || '')}`;
        }
        return qrData.paymentAccount || '';
      }
      
      case 'app': {
        // Simple approach - just use one URL or create a landing page
        return qrData.appStoreUrl || qrData.playStoreUrl || 'https://example.com/app';
      }
      
      case 'social': {
        // Create a simple linktree-style page or return first available link
        const links = [
          qrData.socialFacebook,
          qrData.socialTelegram,
          qrData.socialDiscord,
          qrData.socialZalo,
          qrData.socialTiktok,
          qrData.socialInstagram,
        ].filter(Boolean);
        return links[0] || 'https://example.com';
      }
      
      default:
        return 'https://example.com';
    }
  };

  // Initialize and update QR code
  useEffect(() => {
    const content = generateQrContent();
    
    const options = {
      width: style.size,
      height: style.size,
      data: content,
      margin: style.margin,
      dotsOptions: {
        color: style.useGradient ? undefined : style.dotColor,
        type: style.dotStyle as DotType,
        gradient: style.useGradient ? {
          type: style.gradientType,
          colorStops: [
            { offset: 0, color: style.gradientColor1 },
            { offset: 1, color: style.gradientColor2 },
          ],
        } : undefined,
      },
      backgroundOptions: {
        color: style.backgroundColor,
      },
      cornersSquareOptions: {
        color: style.useGradient ? style.gradientColor1 : style.dotColor,
        type: style.cornerSquareStyle as CornerSquareType,
      },
      cornersDotOptions: {
        color: style.useGradient ? style.gradientColor2 : style.dotColor,
        type: style.cornerDotStyle as CornerDotType,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: style.logoMargin,
      },
      image: style.logoUrl,
    };

    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling(options);
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qrCode.current.append(qrRef.current);
      }
    } else {
      qrCode.current.update(options);
    }
  }, [qrType, qrData, style]);

  const handleDownload = (format: FileExtension) => {
    if (qrCode.current) {
      qrCode.current.download({
        name: `qr-${qrType}-${Date.now()}`,
        extension: format,
      });
      toast.success(`Đã tải xuống QR dạng ${format.toUpperCase()}`);
    }
  };

  const handleCopyLink = () => {
    const content = generateQrContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Đã copy nội dung QR');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyle(prev => ({ ...prev, logoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setStyle(prev => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render form based on QR type
  const renderQrForm = () => {
    switch (qrType) {
      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL / Link</Label>
              <Input
                placeholder="https://example.com"
                value={qrData.url || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={qrData.openNewTab || false}
                onCheckedChange={(checked) => setQrData(prev => ({ ...prev, openNewTab: checked }))}
              />
              <Label>Mở tab mới</Label>
            </div>
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs mb-2 block">UTM Tracking (tuỳ chọn)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Source"
                  value={qrData.utmSource || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, utmSource: e.target.value }))}
                />
                <Input
                  placeholder="Medium"
                  value={qrData.utmMedium || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, utmMedium: e.target.value }))}
                />
                <Input
                  placeholder="Campaign"
                  value={qrData.utmCampaign || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, utmCampaign: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Nội dung văn bản</Label>
              <Textarea
                placeholder="Nhập văn bản, ghi chú, mã khuyến mãi..."
                value={qrData.text || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, text: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tên WiFi (SSID)</Label>
              <Input
                placeholder="Tên mạng WiFi"
                value={qrData.wifiName || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, wifiName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                placeholder="Mật khẩu WiFi"
                value={qrData.wifiPassword || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, wifiPassword: e.target.value }))}
              />
            </div>
            <div>
              <Label>Loại bảo mật</Label>
              <Select
                value={qrData.wifiSecurity || 'WPA'}
                onValueChange={(v) => setQrData(prev => ({ ...prev, wifiSecurity: v as 'WPA' | 'WEP' | 'nopass' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">Không mật khẩu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={qrData.wifiHidden || false}
                onCheckedChange={(checked) => setQrData(prev => ({ ...prev, wifiHidden: checked }))}
              />
              <Label>Mạng ẩn</Label>
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ tên</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={qrData.vcardName || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, vcardName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  placeholder="0123456789"
                  value={qrData.vcardPhone || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, vcardPhone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={qrData.vcardEmail || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, vcardEmail: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Công ty</Label>
                <Input
                  placeholder="Tên công ty"
                  value={qrData.vcardCompany || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, vcardCompany: e.target.value }))}
                />
              </div>
              <div>
                <Label>Chức vụ</Label>
                <Input
                  placeholder="Chức vụ"
                  value={qrData.vcardTitle || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, vcardTitle: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input
                placeholder="Số nhà, đường, quận..."
                value={qrData.vcardAddress || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, vcardAddress: e.target.value }))}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                placeholder="https://example.com"
                value={qrData.vcardWebsite || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, vcardWebsite: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div>
              <Label>Loại thanh toán</Label>
              <Select
                value={qrData.paymentType || 'bank'}
                onValueChange={(v) => setQrData(prev => ({ ...prev, paymentType: v as 'bank' | 'momo' | 'zalopay' | 'vnpay' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Chuyển khoản ngân hàng</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                  <SelectItem value="zalopay">ZaloPay</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {qrData.paymentType === 'bank' && (
              <div>
                <Label>Ngân hàng</Label>
                <Select
                  value={qrData.paymentBank || ''}
                  onValueChange={(v) => setQrData(prev => ({ ...prev, paymentBank: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngân hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(bank => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Số tài khoản / Số điện thoại</Label>
              <Input
                placeholder="0123456789"
                value={qrData.paymentAccount || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, paymentAccount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tên chủ tài khoản</Label>
              <Input
                placeholder="NGUYEN VAN A"
                value={qrData.paymentName || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, paymentName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số tiền (tuỳ chọn)</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={qrData.paymentAmount || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nội dung CK</Label>
                <Input
                  placeholder="Thanh toan don hang..."
                  value={qrData.paymentMessage || ''}
                  onChange={(e) => setQrData(prev => ({ ...prev, paymentMessage: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 'app':
        return (
          <div className="space-y-4">
            <div>
              <Label>Link App Store (iOS)</Label>
              <Input
                placeholder="https://apps.apple.com/..."
                value={qrData.appStoreUrl || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, appStoreUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label>Link Play Store (Android)</Label>
              <Input
                placeholder="https://play.google.com/..."
                value={qrData.playStoreUrl || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, playStoreUrl: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 QR sẽ dẫn đến link đầu tiên được nhập. Để có landing chọn nền tảng, dùng link website riêng.
            </p>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <Input
                placeholder="Link Facebook"
                value={qrData.socialFacebook || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, socialFacebook: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <Input
                placeholder="Link Telegram"
                value={qrData.socialTelegram || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, socialTelegram: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-indigo-600" />
              <Input
                placeholder="Link Discord"
                value={qrData.socialDiscord || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, socialDiscord: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <Input
                placeholder="Link Zalo"
                value={qrData.socialZalo || ''}
                onChange={(e) => setQrData(prev => ({ ...prev, socialZalo: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Hiện tại QR sẽ dẫn đến link đầu tiên. Phiên bản PRO sẽ có trang gộp nhiều link.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Type Selection */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {qrTypes.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setQrType(type.id);
              setQrData({});
            }}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              qrType === type.id 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <type.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{type.label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form & Style */}
        <div className="space-y-6">
          {/* Data Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {React.createElement(qrTypes.find(t => t.id === qrType)?.icon || Link, { className: 'h-4 w-4' })}
                {qrTypes.find(t => t.id === qrType)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderQrForm()}
            </CardContent>
          </Card>

          {/* Style Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Tuỳ chỉnh giao diện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeStyleTab} onValueChange={setActiveStyleTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="colors" className="text-xs">Màu sắc</TabsTrigger>
                  <TabsTrigger value="style" className="text-xs">Kiểu dáng</TabsTrigger>
                  <TabsTrigger value="logo" className="text-xs">Logo</TabsTrigger>
                  <TabsTrigger value="size" className="text-xs">Kích thước</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={style.useGradient}
                      onCheckedChange={(checked) => setStyle(prev => ({ ...prev, useGradient: checked }))}
                    />
                    <Label>Sử dụng Gradient</Label>
                  </div>
                  
                  {style.useGradient ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Màu 1</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={style.gradientColor1}
                            onChange={(e) => setStyle(prev => ({ ...prev, gradientColor1: e.target.value }))}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={style.gradientColor1}
                            onChange={(e) => setStyle(prev => ({ ...prev, gradientColor1: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Màu 2</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={style.gradientColor2}
                            onChange={(e) => setStyle(prev => ({ ...prev, gradientColor2: e.target.value }))}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={style.gradientColor2}
                            onChange={(e) => setStyle(prev => ({ ...prev, gradientColor2: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Màu QR</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={style.dotColor}
                          onChange={(e) => setStyle(prev => ({ ...prev, dotColor: e.target.value }))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={style.dotColor}
                          onChange={(e) => setStyle(prev => ({ ...prev, dotColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Màu nền</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={style.backgroundColor}
                        onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={style.backgroundColor}
                        onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-4 mt-4">
                  <div>
                    <Label>Kiểu chấm</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {dotStyles.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setStyle(prev => ({ ...prev, dotStyle: s.value }))}
                          className={`p-2 text-xs rounded border transition-all ${
                            style.dotStyle === s.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Kiểu góc vuông</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {cornerStyles.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setStyle(prev => ({ ...prev, cornerSquareStyle: s.value }))}
                          className={`p-2 text-xs rounded border transition-all ${
                            style.cornerSquareStyle === s.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Kiểu góc tròn</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {cornerStyles.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setStyle(prev => ({ ...prev, cornerDotStyle: s.value }))}
                          className={`p-2 text-xs rounded border transition-all ${
                            style.cornerDotStyle === s.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logo" className="space-y-4 mt-4">
                  <div>
                    <Label>Upload Logo</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mt-2"
                    />
                  </div>
                  
                  {style.logoUrl && (
                    <>
                      <div className="flex items-center gap-2">
                        <img src={style.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded" />
                        <Button variant="outline" size="sm" onClick={removeLogo}>
                          Xoá logo
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Kích thước logo: {style.logoSize}px</Label>
                        <Slider
                          value={[style.logoSize]}
                          onValueChange={([v]) => setStyle(prev => ({ ...prev, logoSize: v }))}
                          min={20}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Margin logo: {style.logoMargin}px</Label>
                        <Slider
                          value={[style.logoMargin]}
                          onValueChange={([v]) => setStyle(prev => ({ ...prev, logoMargin: v }))}
                          min={0}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="size" className="space-y-4 mt-4">
                  <div>
                    <Label>Kích thước QR: {style.size}px</Label>
                    <Slider
                      value={[style.size]}
                      onValueChange={([v]) => setStyle(prev => ({ ...prev, size: v }))}
                      min={150}
                      max={500}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Margin: {style.margin}px</Label>
                    <Slider
                      value={[style.margin]}
                      onValueChange={([v]) => setStyle(prev => ({ ...prev, margin: v }))}
                      min={0}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview & Download */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Preview
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div 
                ref={qrRef} 
                className="bg-white p-4 rounded-lg shadow-sm"
                style={{ maxWidth: '100%', overflow: 'hidden' }}
              />
              
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Quét thử QR code này</p>
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DownloadIcon className="h-4 w-4" />
                Tải xuống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleDownload('png')} variant="outline" className="w-full">
                  PNG
                </Button>
                <Button onClick={() => handleDownload('svg')} variant="outline" className="w-full">
                  SVG
                </Button>
                <Button onClick={() => handleDownload('jpeg')} variant="outline" className="w-full">
                  JPG
                </Button>
                <Button onClick={() => handleDownload('webp')} variant="outline" className="w-full">
                  WebP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
