import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AbuseReport {
  id: string;
  reporter_id: string | null;
  reported_user_id: string;
  order_id: string | null;
  ticket_id: string | null;
  abuse_type: string;
  description: string | null;
  evidence: any;
  ai_confidence_score: number | null;
  status: string;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

const abuseTypeLabels: Record<string, string> = {
  fraud: 'Gian lận',
  harassment: 'Quấy rối',
  spam: 'Spam',
  fake_review: 'Đánh giá giả',
  copyright: 'Vi phạm bản quyền',
  other: 'Khác',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ xử lý', variant: 'secondary' },
  investigating: { label: 'Đang điều tra', variant: 'outline' },
  resolved: { label: 'Đã giải quyết', variant: 'default' },
  dismissed: { label: 'Bác bỏ', variant: 'destructive' },
};

export default function AdminDesignAbuse() {
  const queryClient = useQueryClient();
  const { user } = useAdminAuth();
  const { formatDateTime } = useDateFormat();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-design-abuse-reports', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('design_abuse_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AbuseReport[];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('design_abuse_reports')
        .update({
          status,
          admin_notes: adminNotes,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-abuse-reports'] });
      toast.success('Đã cập nhật báo cáo');
      setSelectedReport(null);
      setAdminNotes('');
    },
    onError: () => toast.error('Lỗi khi cập nhật'),
  });

  const handleResolve = (status: string) => {
    if (selectedReport) {
      resolveMutation.mutate({ id: selectedReport.id, status });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Báo cáo vi phạm</h1>
            <p className="text-muted-foreground">Quản lý các báo cáo lạm dụng/vi phạm</p>
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(statusLabels).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại vi phạm</TableHead>
                <TableHead>Người bị báo cáo</TableHead>
                <TableHead>Order/Ticket</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : reports?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Không có báo cáo nào</TableCell></TableRow>
              ) : (
                reports?.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(report.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {abuseTypeLabels[report.abuse_type] || report.abuse_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {report.reported_user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {report.order_id?.substring(0, 8) || report.ticket_id?.substring(0, 8) || '-'}
                    </TableCell>
                    <TableCell>
                      {report.ai_confidence_score !== null ? (
                        <Badge variant={report.ai_confidence_score > 0.7 ? 'destructive' : 'secondary'}>
                          {(report.ai_confidence_score * 100).toFixed(0)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[report.status]?.variant || 'secondary'}>
                        {statusLabels[report.status]?.label || report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedReport(report);
                        setAdminNotes(report.admin_notes || '');
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo vi phạm</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Loại vi phạm</p>
                  <Badge variant="destructive" className="mt-1">
                    {abuseTypeLabels[selectedReport.abuse_type] || selectedReport.abuse_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Confidence</p>
                  <p className="font-bold">
                    {selectedReport.ai_confidence_score !== null
                      ? `${(selectedReport.ai_confidence_score * 100).toFixed(0)}%`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Người báo cáo</p>
                  <p className="font-mono text-sm">{selectedReport.reporter_id || 'Hệ thống'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Người bị báo cáo</p>
                  <p className="font-mono text-sm">{selectedReport.reported_user_id}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedReport.description || 'Không có mô tả'}</p>
              </div>

              {selectedReport.evidence && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Bằng chứng</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedReport.evidence, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Ghi chú Admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Nhập ghi chú xử lý..."
                  rows={3}
                />
              </div>

              {selectedReport.status === 'pending' || selectedReport.status === 'investigating' ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleResolve('dismissed')}
                    disabled={resolveMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Bác bỏ
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleResolve('resolved')}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xác nhận vi phạm
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Đã xử lý bởi {selectedReport.resolved_by?.substring(0, 8)} vào{' '}
                    {selectedReport.resolved_at && formatDateTime(selectedReport.resolved_at)}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
