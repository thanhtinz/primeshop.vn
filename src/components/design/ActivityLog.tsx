import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  History, Upload, CheckCircle, XCircle, 
  MessageSquare, RefreshCw, AlertTriangle, Eye
} from 'lucide-react';
import { useDesignActivityLogs } from '@/hooks/useDesignAdvanced';
import { cn } from '@/lib/utils';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useLanguage } from '@/contexts/LanguageContext';

interface ActivityLogProps {
  orderId?: string;
  ticketId?: string;
  className?: string;
}

const actionConfig: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  order_created: { icon: CheckCircle, color: 'text-green-500' },
  order_accepted: { icon: CheckCircle, color: 'text-blue-500' },
  message_sent: { icon: MessageSquare, color: 'text-gray-500' },
  file_uploaded: { icon: Upload, color: 'text-purple-500' },
  version_created: { icon: Upload, color: 'text-purple-500' },
  version_approved: { icon: CheckCircle, color: 'text-green-500' },
  revision_requested: { icon: RefreshCw, color: 'text-orange-500' },
  order_delivered: { icon: CheckCircle, color: 'text-green-500' },
  order_completed: { icon: CheckCircle, color: 'text-green-600' },
  order_disputed: { icon: AlertTriangle, color: 'text-red-500' },
  order_cancelled: { icon: XCircle, color: 'text-red-500' },
  ticket_viewed: { icon: Eye, color: 'text-gray-400' },
};

export function ActivityLog({ orderId, ticketId, className }: ActivityLogProps) {
  const { data: logs, isLoading } = useDesignActivityLogs(orderId || ticketId || '');
  const { formatDateTime } = useDateFormat();
  const { language } = useLanguage();

  const getActionLabel = (action: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      order_created: { vi: 'Tạo đơn hàng', en: 'Order created' },
      order_accepted: { vi: 'Nhận đơn hàng', en: 'Order accepted' },
      message_sent: { vi: 'Gửi tin nhắn', en: 'Message sent' },
      file_uploaded: { vi: 'Tải lên file', en: 'File uploaded' },
      version_created: { vi: 'Tạo phiên bản mới', en: 'Version created' },
      version_approved: { vi: 'Duyệt phiên bản', en: 'Version approved' },
      revision_requested: { vi: 'Yêu cầu chỉnh sửa', en: 'Revision requested' },
      order_delivered: { vi: 'Giao sản phẩm', en: 'Order delivered' },
      order_completed: { vi: 'Hoàn tất đơn', en: 'Order completed' },
      order_disputed: { vi: 'Mở tranh chấp', en: 'Dispute opened' },
      order_cancelled: { vi: 'Hủy đơn hàng', en: 'Order cancelled' },
      ticket_viewed: { vi: 'Xem ticket', en: 'Ticket viewed' },
    };
    return labels[action]?.[language] || action;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            {language === 'vi' ? 'Lịch sử hoạt động' : 'Activity Log'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4" />
          {language === 'vi' ? 'Lịch sử hoạt động' : 'Activity Log'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="p-4 space-y-3">
            {!logs?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === 'vi' ? 'Chưa có hoạt động nào' : 'No activity yet'}
              </p>
            ) : (
              logs.map((log) => {
                const config = actionConfig[log.action] || {
                  icon: History,
                  color: 'text-gray-500',
                };
                const Icon = config.icon;

                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className={cn('mt-0.5', config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{getActionLabel(log.action)}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.user_type === 'buyer' ? 'Buyer' : log.user_type === 'seller' ? 'Designer' : 'Admin'}
                        </Badge>
                      </div>
                      {log.action_data && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {JSON.stringify(log.action_data)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(log.created_at, 'HH:mm dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
