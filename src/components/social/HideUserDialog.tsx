import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useHideUser } from '@/hooks/usePostModeration';
import { Loader2, EyeOff } from 'lucide-react';
import { useState } from 'react';

type HideDuration = '1day' | '1week' | '1month' | 'permanent';

interface HideUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const HIDE_DURATIONS: { value: HideDuration; label: string }[] = [
  { value: '1day', label: '1 ngày' },
  { value: '1week', label: '1 tuần' },
  { value: '1month', label: '1 tháng' },
  { value: 'permanent', label: 'Vĩnh viễn' },
];

export function HideUserDialog({ open, onOpenChange, userId, userName }: HideUserDialogProps) {
  const [duration, setDuration] = useState<HideDuration>('1week');
  const hideUser = useHideUser();

  const handleSubmit = () => {
    hideUser.mutate(
      { hiddenUserId: userId, duration },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Ẩn bài viết từ người dùng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Bạn sẽ không thấy bài viết từ <strong>{userName}</strong> trong thời gian:
          </p>

          <RadioGroup value={duration} onValueChange={(v) => setDuration(v as HideDuration)}>
            {HIDE_DURATIONS.map((d) => (
              <div key={d.value} className="flex items-center space-x-2">
                <RadioGroupItem value={d.value} id={d.value} />
                <Label htmlFor={d.value} className="cursor-pointer">{d.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={hideUser.isPending}>
            {hideUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
