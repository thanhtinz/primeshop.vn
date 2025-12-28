import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Quấy rối',
  hate_speech: 'Phát ngôn thù địch',
  violence: 'Bạo lực',
  nudity: 'Khiêu dâm',
  false_info: 'Thông tin sai',
  scam: 'Lừa đảo',
  other: 'Khác',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ xử lý', variant: 'default' },
  reviewed: { label: 'Đã xem', variant: 'secondary' },
  resolved: { label: 'Đã xử lý', variant: 'outline' },
  dismissed: { label: 'Bỏ qua', variant: 'destructive' },
};

export default function AdminPostReports() {
  const queryClient = useQueryClient();
  const { formatRelative } = useDateFormat();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-post-reports', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('post_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as ReportStatus);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;

      if (data && data.length > 0) {
        const reporterIds = [...new Set(data.map(r => r.reporter_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', reporterIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return data.map(r => ({
          ...r,
          reporter: profileMap.get(r.reporter_id),
        }));
      }
      
      return data || [];
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ reportId, status, notes, deletePost }: { 
      reportId: string; 
      status: ReportStatus; 
      notes?: string;
      deletePost?: boolean;
    }) => {
      const report = reports?.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');

      const { error: updateError } = await supabase
        .from('post_reports')
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);
      
      if (updateError) throw updateError;

      if (deletePost) {
        if (report.post_type === 'user_post') {
          await supabase.from('user_posts').delete().eq('id', report.post_id);
        } else if (report.post_type === 'group_post') {
          await supabase.from('group_posts').delete().eq('id', report.post_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-post-reports'] });
      toast.success('Đã cập nhật báo cáo');
      setActionDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật');
    },
  });

  const handleAction = (action: 'dismiss' | 'resolve' | 'delete') => {
    if (!selectedReport) return;
    
    updateReport.mutate({
      reportId: selectedReport.id,
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      notes: adminNotes,
      deletePost: action === 'delete',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Báo cáo bài viết</h1>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="reviewed">Đã xem</SelectItem>
            <SelectItem value="resolved">Đã xử lý</SelectItem>
            <SelectItem value="dismissed">Bỏ qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danh sách báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports && reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người báo cáo</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <p className="font-medium">{report.reporter?.full_name || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.post_type === 'user_post' ? 'Cá nhân' : 
                         report.post_type === 'group_post' ? 'Nhóm' : 'Shop'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {REASON_LABELS[report.reason] || report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[report.status]?.variant || 'default'}>
                        {STATUS_CONFIG[report.status]?.label || report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelative(report.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReport(report);
                          setActionDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không có báo cáo nào
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xử lý báo cáo</DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Loại bài viết</p>
                  <p className="font-medium">
                    {selectedReport.post_type === 'user_post' ? 'Cá nhân' : 
                     selectedReport.post_type === 'group_post' ? 'Nhóm' : 'Shop'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lý do</p>
                  <p className="font-medium">{REASON_LABELS[selectedReport.reason]}</p>
                </div>
              </div>
              
              {selectedReport.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Ghi chú admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ghi chú..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleAction('dismiss')} disabled={updateReport.isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              Bỏ qua
            </Button>
            <Button variant="secondary" onClick={() => handleAction('resolve')} disabled={updateReport.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Đã xử lý
            </Button>
            <Button variant="destructive" onClick={() => handleAction('delete')} disabled={updateReport.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
