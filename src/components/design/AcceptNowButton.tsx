import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcceptNowButtonProps {
  onAccept: () => Promise<void>;
  disabled?: boolean;
  className?: string;
  remainingRevisions?: number;
}

export function AcceptNowButton({ 
  onAccept, 
  disabled = false,
  className,
  remainingRevisions = 0,
}: AcceptNowButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
      setOpen(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={cn(
          'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg',
          className
        )}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Hài lòng ngay!
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">
              Xác nhận hài lòng với thiết kế?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2">
              <p>
                Bạn sẽ <strong>bỏ qua</strong> quyền yêu cầu chỉnh sửa còn lại 
                {remainingRevisions > 0 && (
                  <span className="text-orange-600"> ({remainingRevisions} lượt)</span>
                )} 
                và chấp nhận sản phẩm ngay.
              </p>
              <p className="text-sm text-muted-foreground">
                Tiền sẽ được giữ 3 ngày trước khi chuyển cho seller. 
                Bạn vẫn có thể mở tranh chấp trong thời gian này nếu có vấn đề.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel disabled={loading}>
              Để tôi xem lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Xác nhận hài lòng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
