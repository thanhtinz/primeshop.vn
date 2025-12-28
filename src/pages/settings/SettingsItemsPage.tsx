import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  useMyItems, 
  getItemTypeLabel, 
  getItemTypeColor, 
  MyItem,
  useSetActiveNameColor,
  useSetActiveEffect
} from '@/hooks/useMyItems';
import { useSetActiveFrame } from '@/hooks/useAvatarFrames';
import { useAuth } from '@/contexts/AuthContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Package, Loader2, CheckCircle, Image, Sparkles, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface SettingsContext {
  t: (key: string) => string;
}

interface GroupedItems {
  avatar_frame: MyItem[];
  name_color: MyItem[];
  prime_effect: MyItem[];
  prime_boost: MyItem[];
}

interface ActiveItems {
  avatar_frame: string | null;
  name_color: string | null;
  prime_effect: string | null;
  prime_boost: string | null;
}

const ITEMS_PER_PAGE = 6;

const ItemCard = ({ 
  item, 
  isActive, 
  onToggle
}: { 
  item: MyItem; 
  isActive: boolean;
  onToggle: () => void;
}) => {
  const { formatDateTime } = useDateFormat();
  const renderPreview = () => {
    if (item.item_type === 'avatar_frame' && item.image_url) {
      return (
        <img
          src={item.image_url}
          alt={item.item_name}
          className="w-full h-full object-cover"
        />
      );
    }
    
    if (item.item_type === 'name_color') {
      if (item.is_gradient && item.gradient_value) {
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: item.gradient_value }}
          >
            <Palette className="w-6 h-6 text-white drop-shadow-md" />
          </div>
        );
      }
      return (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: item.color_value }}
        >
          <Palette className="w-6 h-6 text-white drop-shadow-md" />
        </div>
      );
    }
    
    if (item.item_type === 'prime_effect') {
      const config = item.effect_config || {};
      let bgStyle: React.CSSProperties = {};
      
      if (item.effect_type === 'glow') {
        bgStyle = { 
          background: `radial-gradient(circle, ${config.color || '#fbbf24'}40, transparent)`,
          boxShadow: `0 0 20px ${config.color || '#fbbf24'}`
        };
      } else if (item.effect_type === 'border' && config.gradient) {
        bgStyle = { background: config.gradient };
      } else if (item.effect_type === 'particles') {
        bgStyle = { 
          background: `linear-gradient(135deg, ${config.color || '#ef4444'}20, ${config.color || '#ef4444'}60)` 
        };
      }
      
      return (
        <div className="w-full h-full flex items-center justify-center" style={bgStyle}>
          <Sparkles className="w-6 h-6 text-white drop-shadow-md" />
        </div>
      );
    }
    
    return <Image className="w-6 h-6 text-muted-foreground" />;
  };

  return (
    <div 
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        isActive 
          ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
          : "bg-card hover:bg-accent/30 hover:border-accent"
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 relative">
        {renderPreview()}
        {isActive && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate text-sm">{item.item_name}</p>
          {isActive && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              Đang dùng
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(item.purchased_at, 'dd/MM/yyyy HH:mm')}
        </p>
      </div>
    </div>
  );
};

const CategorySection = ({ 
  title, 
  items, 
  activeItemId,
  onToggle,
  itemType
}: { 
  title: string; 
  items: MyItem[];
  activeItemId: string | null;
  onToggle: (itemId: string | null, itemType: string) => void;
  itemType: string;
}) => {
  const [page, setPage] = useState(1);
  
  if (items.length === 0) return null;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={getItemTypeColor(itemType)}>
            {title}
          </Badge>
          <span className="text-xs text-muted-foreground">({items.length} vật phẩm)</span>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid gap-2">
        {paginatedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isActive={activeItemId === item.item_id}
            onToggle={() => {
              if (activeItemId === item.item_id) {
                onToggle(null, itemType);
              } else {
                onToggle(item.item_id, itemType);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function SettingsItemsPage() {
  const { t } = useOutletContext<SettingsContext>();
  const { profile } = useAuth();
  const { data: items, isLoading } = useMyItems();
  const setActiveFrame = useSetActiveFrame();
  const setActiveNameColor = useSetActiveNameColor();
  const setActiveEffect = useSetActiveEffect();

  // Local state for optimistic updates
  const [localActiveItems, setLocalActiveItems] = useState<ActiveItems | null>(null);

  // Sync with profile when it changes
  const activeItems: ActiveItems = localActiveItems ?? {
    avatar_frame: profile?.avatar_frame_id || null,
    name_color: profile?.active_name_color_id || null,
    prime_effect: profile?.active_effect_id || null,
    prime_boost: null,
  };

  const groupedItems = useMemo<GroupedItems>(() => {
    if (!items) return {
      avatar_frame: [],
      name_color: [],
      prime_effect: [],
      prime_boost: []
    };

    return {
      avatar_frame: items.filter(p => p.item_type === 'avatar_frame'),
      name_color: items.filter(p => p.item_type === 'name_color'),
      prime_effect: items.filter(p => p.item_type === 'prime_effect'),
      prime_boost: items.filter(p => p.item_type === 'prime_boost'),
    };
  }, [items]);

  const totalItems = items?.length || 0;

  const handleToggle = (itemId: string | null, itemType: string) => {
    // Optimistic update - update UI immediately
    setLocalActiveItems(prev => ({
      ...(prev ?? activeItems),
      [itemType]: itemId,
    }));

    // Then call API
    if (itemType === 'avatar_frame') {
      setActiveFrame.mutate(itemId);
    } else if (itemType === 'name_color') {
      setActiveNameColor.mutate(itemId);
    } else if (itemType === 'prime_effect') {
      setActiveEffect.mutate(itemId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('myItems')}
        </CardTitle>
        <CardDescription>
          Quản lý {totalItems} vật phẩm bạn đã mua từ Item Shop
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : totalItems > 0 ? (
          <div className="space-y-6">
            <CategorySection
              title={getItemTypeLabel('avatar_frame')}
              items={groupedItems.avatar_frame}
              activeItemId={activeItems.avatar_frame}
              onToggle={handleToggle}
              itemType="avatar_frame"
            />
            
            <CategorySection
              title={getItemTypeLabel('name_color')}
              items={groupedItems.name_color}
              activeItemId={activeItems.name_color}
              onToggle={handleToggle}
              itemType="name_color"
            />
            
            <CategorySection
              title={getItemTypeLabel('prime_effect')}
              items={groupedItems.prime_effect}
              activeItemId={activeItems.prime_effect}
              onToggle={handleToggle}
              itemType="prime_effect"
            />
            
            <CategorySection
              title={getItemTypeLabel('prime_boost')}
              items={groupedItems.prime_boost}
              activeItemId={activeItems.prime_boost}
              onToggle={handleToggle}
              itemType="prime_boost"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Chưa có vật phẩm nào</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
