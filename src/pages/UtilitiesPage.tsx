import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Download, Mail, Calculator, CheckSquare, QrCode } from 'lucide-react';
import { DomainChecker } from '@/components/utilities/DomainChecker';
import { VideoDownloader } from '@/components/utilities/VideoDownloader';
import { MailChecker } from '@/components/utilities/MailChecker';
import { MoneySplitter } from '@/components/utilities/MoneySplitter';
import { ChecklistManager } from '@/components/utilities/ChecklistManager';
import { Link } from 'react-router-dom';

export default function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState('money');

  const utilities = [
    { id: 'money', label: 'Chia Tiền', icon: Calculator, description: 'Chia lợi nhuận, chi phí' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, description: 'Quản lý công việc' },
    { id: 'domain', label: 'Domain', icon: Globe, description: 'Check NS, DS, WHOIS' },
    { id: 'download', label: 'Download', icon: Download, description: 'Tải video TikTok' },
    { id: 'mail', label: 'Mail', icon: Mail, description: 'Check mail live/die' },
  ];

  const standaloneUtilities = [
    { id: 'qr', label: 'Tạo QR', icon: QrCode, description: 'Tạo QR code đẹp', path: '/utilities/qr' },
  ];

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Tiện ích
          </h1>
          <p className="text-muted-foreground">Các công cụ hữu ích cho bạn</p>
        </div>

        {/* Standalone Utilities */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {standaloneUtilities.map(util => (
            <Link
              key={util.id}
              to={util.path}
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <util.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{util.label}</p>
                <p className="text-xs text-muted-foreground">{util.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            {utilities.map(util => (
              <TabsTrigger
                key={util.id}
                value={util.id}
                className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <util.icon className="h-4 w-4" />
                <span className="text-[10px] leading-tight text-center">{util.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="money">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Chia Tiền & Tính Toán
                </CardTitle>
                <CardDescription>
                  Chia lợi nhuận, chi phí, phí trung gian - Tính lãi lỗ cho team & group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MoneySplitter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  Checklist Công Việc
                </CardTitle>
                <CardDescription>
                  Quản lý task, theo dõi tiến độ, deadline - Cho cá nhân & team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChecklistManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  Domain Checker
                </CardTitle>
                <CardDescription>
                  Kiểm tra NS, DS, WHOIS của domain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainChecker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-pink-600" />
                  Video Downloader
                </CardTitle>
                <CardDescription>
                  Tải video từ TikTok - Hỗ trợ MP3 và MP4
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoDownloader />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mail">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  Mail Checker
                </CardTitle>
                <CardDescription>
                  Kiểm tra trạng thái mail live hay die
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MailChecker />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}