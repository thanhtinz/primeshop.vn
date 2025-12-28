import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, History, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFormat } from '@/hooks/useDateFormat';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  action_category: string | null;
  actor_type: string | null;
  order_id: string | null;
  ticket_id: string | null;
  old_data: any;
  new_data: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  order_created: 'Tạo đơn hàng',
  order_updated: 'Cập nhật đơn',
  order_completed: 'Hoàn thành đơn',
  order_cancelled: 'Hủy đơn',
  dispute_opened: 'Mở tranh chấp',
  dispute_resolved: 'Giải quyết tranh chấp',
  milestone_submitted: 'Nộp milestone',
  milestone_approved: 'Duyệt milestone',
  escrow_released: 'Thanh toán escrow',
  escrow_refunded: 'Hoàn tiền escrow',
  service_created: 'Tạo dịch vụ',
  service_updated: 'Cập nhật dịch vụ',
  review_submitted: 'Đánh giá',
};

const categoryColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  order: 'default',
  dispute: 'destructive',
  escrow: 'secondary',
  service: 'outline',
  review: 'default',
};

export default function AdminDesignAudit() {
  const { formatDateTime } = useDateFormat();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-design-audit-logs', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('design_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (categoryFilter !== 'all') {
        query = query.eq('action_category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    if (!search) return true;
    return (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.order_id?.includes(search) ||
      log.user_id?.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Lịch sử hoạt động trong hệ thống thiết kế</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo action, order ID, user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="order">Đơn hàng</SelectItem>
            <SelectItem value="dispute">Tranh chấp</SelectItem>
            <SelectItem value="escrow">Escrow</SelectItem>
            <SelectItem value="service">Dịch vụ</SelectItem>
            <SelectItem value="review">Đánh giá</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Order/Ticket</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : filteredLogs?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Không có dữ liệu</TableCell></TableRow>
              ) : (
                filteredLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell>
                      {actionLabels[log.action] || log.action}
                    </TableCell>
                    <TableCell>
                      {log.action_category && (
                        <Badge variant={categoryColors[log.action_category] || 'secondary'}>
                          {log.action_category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.order_id?.substring(0, 8) || log.ticket_id?.substring(0, 8) || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.actor_type || 'user'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
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

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Audit Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thời gian</p>
                  <p>{formatDateTime(selectedLog.created_at, 'dd/MM/yyyy HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{selectedLog.user_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actor Type</p>
                  <p>{selectedLog.actor_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{selectedLog.order_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket ID</p>
                  <p className="font-mono text-sm">{selectedLog.ticket_id || '-'}</p>
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Dữ liệu cũ</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Dữ liệu mới</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                <p className="text-sm text-muted-foreground break-all">{selectedLog.user_agent || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
