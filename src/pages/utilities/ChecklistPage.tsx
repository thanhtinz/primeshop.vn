import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Users, Calendar, BarChart3, FileText, Copy } from 'lucide-react';
import { ChecklistManager } from '@/components/utilities/ChecklistManager';

export default function ChecklistPage() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Checklist Công Việc | Tiện ích</title>
        <meta name="description" content="Quản lý task, theo dõi tiến độ, deadline cho cá nhân và team" />
      </Helmet>
      <Layout>
        <div className="container max-w-6xl mx-auto py-6 px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-blue-600" />
              Checklist Công Việc
            </h1>
            <p className="text-muted-foreground">
              Theo dõi việc cần làm, không quên task - Áp dụng cho cá nhân, Group, Dự án
            </p>
          </div>

          {/* Features overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xs font-medium">Gán người</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-3 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-xs font-medium">Deadline</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-3 text-center">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-xs font-medium">Tiến độ</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-3 text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xs font-medium">Ghi chú</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
              <CardContent className="p-3 text-center">
                <Copy className="h-5 w-5 mx-auto mb-1 text-pink-600" />
                <p className="text-xs font-medium">Clone</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
              <CardContent className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-cyan-600" />
                <p className="text-xs font-medium">Team/Group</p>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Checklist</CardTitle>
              <CardDescription>
                Tạo checklist, thêm task, gán người phụ trách, theo dõi tiến độ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChecklistManager />
            </CardContent>
          </Card>
        </div>
      </Layout>
    </HelmetProvider>
  );
}
