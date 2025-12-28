import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { QrGenerator } from '@/components/utilities/QrGenerator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, Zap, Palette, Shield, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QrGeneratorPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Zap, title: 'Tạo nhanh 5s', description: 'Tạo QR code chỉ trong vài giây' },
    { icon: Palette, title: 'Tuỳ biến mạnh', description: 'Màu sắc, logo, kiểu dáng đa dạng' },
    { icon: Shield, title: 'Đa mục đích', description: 'URL, WiFi, vCard, thanh toán...' },
    { icon: Share2, title: 'Dễ chia sẻ', description: 'Tải về PNG, SVG, JPG, WebP' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Tạo QR Code
              </h1>
              <p className="text-sm text-muted-foreground">
                Tạo mã QR đẹp, tuỳ biến cao cho mọi mục đích
              </p>
            </div>
          </div>
        </div>

        {/* Features Banner */}
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <QrGenerator />
        </div>
      </div>
    </Layout>
  );
};

export default QrGeneratorPage;
