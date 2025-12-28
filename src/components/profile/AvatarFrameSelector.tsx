import { Frame, Check, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAvatarFrames, useSetActiveFrame, useAvatarFrames } from '@/hooks/useAvatarFrames';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export const AvatarFrameSelector = () => {
  const { profile } = useAuth();
  const { data: allFrames, isLoading: allFramesLoading } = useAvatarFrames();
  const { data: userFrames, isLoading } = useUserAvatarFrames();
  const setActiveFrame = useSetActiveFrame();

  const activeFrameId = profile?.avatar_frame_id;

  // Get the full frame data for user's owned frames
  const ownedFrames = userFrames?.map(uf => {
    const fullFrame = allFrames?.find(f => f.id === uf.frame_id);
    return fullFrame ? { ...fullFrame, purchased_at: uf.purchased_at } : null;
  }).filter(Boolean) || [];

  const handleFrameClick = (frameId: string | null) => {
    setActiveFrame.mutate(frameId);
  };

  if (isLoading || allFramesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Frame className="h-5 w-5" />
            Khung Avatar của bạn
          </CardTitle>
          <CardDescription>
            Chọn khung avatar để trang trí hồ sơ
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/shop">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Mua thêm
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {ownedFrames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* No frame option */}
            <button
              type="button"
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all active:scale-95 touch-manipulation text-left",
                !activeFrameId ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onClick={() => handleFrameClick(null)}
              disabled={setActiveFrame.isPending}
            >
              <div className="aspect-square relative mb-3 flex items-center justify-center bg-muted rounded-lg">
                <Frame className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Không có khung</p>
                {!activeFrameId && (
                  <Badge variant="default" className="mt-1">
                    <Check className="h-3 w-3 mr-1" />
                    Đang dùng
                  </Badge>
                )}
              </div>
            </button>

            {ownedFrames.map((frame: any) => {
              const isActive = activeFrameId === frame.id;

              return (
                <button
                  type="button"
                  key={frame.id}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all active:scale-95 touch-manipulation text-left",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleFrameClick(isActive ? null : frame.id)}
                  disabled={setActiveFrame.isPending}
                >
                  <div className="aspect-square relative mb-3 flex items-center justify-center">
                    <img
                      src={frame.image_url}
                      alt={frame.name}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm truncate">{frame.name}</p>
                    {isActive && (
                      <Badge variant="default" className="mt-1">
                        <Check className="h-3 w-3 mr-1" />
                        Đang dùng
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Frame className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Bạn chưa có khung avatar nào</p>
            <Button asChild>
              <Link to="/shop">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Mua khung avatar
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};