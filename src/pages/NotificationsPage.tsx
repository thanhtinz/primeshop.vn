import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, ShoppingBag, Shield, Megaphone, Gift, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';

const getTypeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return <ShoppingBag className="h-5 w-5 text-blue-500" />;
    case 'security':
      return <Shield className="h-5 w-5 text-red-500" />;
    case 'system':
      return <Megaphone className="h-5 w-5 text-orange-500" />;
    case 'promo':
      return <Gift className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getTypeBg = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return 'bg-blue-500/10';
    case 'security':
      return 'bg-red-500/10';
    case 'system':
      return 'bg-orange-500/10';
    case 'promo':
      return 'bg-green-500/10';
    default:
      return 'bg-muted';
  }
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { formatRelative } = useDateFormat();
  
  const { 
    notifications, 
    isLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotifications();

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredNotifications, { itemsPerPage: 15 });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [filter, typeFilter]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Bell className="h-5 w-5" />
                  Thông báo
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">{unreadCount}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm mt-1">Xem tất cả thông báo của bạn</CardDescription>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={() => markAllAsRead()} className="text-xs sm:text-sm">
                    <CheckCheck className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Đọc tất cả</span>
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => clearAll()} className="text-xs sm:text-sm">
                    <Trash2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Xóa tất cả</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">Tất cả</TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs sm:text-sm px-2 sm:px-3">Chưa đọc</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                  <TabsList className="h-9 w-max">
                    <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">Tất cả</TabsTrigger>
                    <TabsTrigger value="order" className="text-xs sm:text-sm px-2 sm:px-3">Đơn hàng</TabsTrigger>
                    <TabsTrigger value="security" className="text-xs sm:text-sm px-2 sm:px-3">Bảo mật</TabsTrigger>
                    <TabsTrigger value="system" className="text-xs sm:text-sm px-2 sm:px-3">Hệ thống</TabsTrigger>
                    <TabsTrigger value="promo" className="text-xs sm:text-sm px-2 sm:px-3">Khuyến mãi</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Notifications List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : paginatedItems.length > 0 ? (
              <>
                <div className="divide-y">
                  {paginatedItems.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors relative group",
                        !notification.is_read && "bg-primary/5"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0 flex items-center justify-center", getTypeBg(notification.type))}>
                          <span className="flex items-center justify-center">
                            {getTypeIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm sm:text-base line-clamp-2",
                              !notification.is_read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
                            {formatRelative(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-2 sm:top-4 sm:right-4 h-7 w-7 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                  className="mt-4 pt-4 border-t"
                />
              </>
            ) : (
              <div className="py-16 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không có thông báo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
