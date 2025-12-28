import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFlashSale } from '@/hooks/useFlashSales';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { ShoppingCart, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PurchaseNotification {
  id: string;
  productName: string;
  packageName?: string;
  timestamp: number;
}

// Random Vietnamese names for display
const randomNames = [
  'Nguyễn V.A', 'Trần T.B', 'Lê H.C', 'Phạm M.D', 'Hoàng T.E',
  'Võ Q.F', 'Đặng N.G', 'Bùi K.H', 'Đỗ L.I', 'Hồ T.J',
  'Ngô V.K', 'Dương T.L', 'Lý H.M', 'Vũ P.N', 'Phan Q.O',
  'Trương T.P', 'Đinh M.Q', 'Huỳnh N.R', 'Tạ K.S', 'Mai L.T'
];

const getRandomName = () => randomNames[Math.floor(Math.random() * randomNames.length)];

// Hide notification after duration (ms)
const NOTIFICATION_DURATION = 5000;

export function FlashSalePurchaseNotification() {
  const { data: flashSale } = useActiveFlashSale();
  const [notifications, setNotifications] = useState<PurchaseNotification[]>([]);
  const [productCache, setProductCache] = useState<Record<string, { productName: string; packageName?: string }>>({});
  const { playNotificationSound } = useNotificationSound();
  
  // Store timeout IDs for cleanup
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Fetch product/package names for flash sale items
  const fetchProductInfo = useCallback(async (productId: string, packageId?: string) => {
    const cacheKey = `${productId}-${packageId || ''}`;
    if (productCache[cacheKey]) return productCache[cacheKey];

    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    let packageName: string | undefined;
    if (packageId) {
      const { data: pkg } = await supabase
        .from('product_packages')
        .select('name')
        .eq('id', packageId)
        .single();
      packageName = pkg?.name;
    }

    const info = { productName: product?.name || 'Sản phẩm', packageName };
    setProductCache(prev => ({ ...prev, [cacheKey]: info }));
    return info;
  }, [productCache]);

  // Remove notification after timeout
  const removeNotification = useCallback((id: string) => {
    // Clear the timeout for this notification
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Add new notification
  const addNotification = useCallback(async (productId: string, packageId?: string) => {
    const info = await fetchProductInfo(productId, packageId);
    const notification: PurchaseNotification = {
      id: `${Date.now()}-${Math.random()}`,
      productName: info.productName,
      packageName: info.packageName,
      timestamp: Date.now(),
    };

    // Play notification sound
    playNotificationSound();

    setNotifications(prev => {
      // Keep only last 3 notifications
      const updated = [...prev, notification].slice(-3);
      return updated;
    });

    // Auto remove after duration with cleanup tracking
    const timeout = setTimeout(() => {
      timeoutRefs.current.delete(notification.id);
      removeNotification(notification.id);
    }, NOTIFICATION_DURATION);
    timeoutRefs.current.set(notification.id, timeout);
  }, [fetchProductInfo, removeNotification, playNotificationSound]);

  useEffect(() => {
    if (!flashSale?.id) return;

    // Subscribe to realtime updates on flash_sale_items
    const channel = supabase
      .channel('flash-sale-purchases')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flash_sale_items',
          filter: `flash_sale_id=eq.${flashSale.id}`,
        },
        async (payload) => {
          // Check if quantity_sold increased
          const oldData = payload.old as { quantity_sold?: number };
          const newData = payload.new as { quantity_sold?: number; product_id?: string; package_id?: string };
          
          if (newData.quantity_sold && oldData.quantity_sold !== undefined && 
              newData.quantity_sold > oldData.quantity_sold && newData.product_id) {
            await addNotification(newData.product_id, newData.package_id || undefined);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flashSale?.id, addNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-[280px] md:max-w-xs">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            "bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg shadow-lg p-3 animate-slide-in-left",
            "flex items-start gap-2"
          )}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs font-medium mb-0.5">
              <Zap className="w-3 h-3" />
              <span>Flash Sale</span>
            </div>
            <p className="text-sm font-semibold leading-tight">
              {getRandomName()} vừa mua
            </p>
            <p className="text-xs opacity-90 truncate">
              {notification.productName}
              {notification.packageName && ` - ${notification.packageName}`}
            </p>
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 p-0.5 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
