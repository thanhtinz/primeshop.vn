import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { MoneySplitter } from '@/components/utilities/MoneySplitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Users, History, Share2, TrendingUp, Lock } from 'lucide-react';

export default function MoneySplitPage() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Chia Tiền - Tính Toán & Chia Lợi Nhuận | Prime Shop</title>
        <meta name="description" content="Công cụ chia tiền thông minh - Chia lợi nhuận, chi phí, phí trung gian. Tính lãi lỗ nhanh cho team, group, deal." />
      </Helmet>
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              Chia Tiền & Tính Toán
            </h1>
            <p className="text-muted-foreground mt-1">
              Chia lợi nhuận, chi phí, tính phí trung gian - Tiện ích cho team & group
            </p>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">3 kiểu chia</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Nhiều người</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Tính lãi/lỗ</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Lưu lịch sử</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Chia sẻ link</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Khóa & Clone</span>
              </CardContent>
            </Card>
          </div>

          {/* Main Calculator */}
          <MoneySplitter />
        </div>
      </Layout>
    </HelmetProvider>
  );
}