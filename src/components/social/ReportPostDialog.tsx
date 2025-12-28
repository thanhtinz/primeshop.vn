import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useReportPost, ReportReason, PostType } from '@/hooks/usePostModeration';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postType: PostType;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam hoặc quảng cáo' },
  { value: 'harassment', label: 'Quấy rối hoặc bắt nạt' },
  { value: 'hate_speech', label: 'Phát ngôn thù địch' },
  { value: 'violence', label: 'Bạo lực hoặc đe dọa' },
  { value: 'nudity', label: 'Nội dung khiêu dâm' },
  { value: 'false_info', label: 'Thông tin sai lệch' },
  { value: 'scam', label: 'Lừa đảo' },
  { value: 'other', label: 'Lý do khác' },
];

export function ReportPostDialog({ open, onOpenChange, postId, postType }: ReportPostDialogProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const reportPost = useReportPost();

  const handleSubmit = () => {
    if (!reason) return;
    
    reportPost.mutate(
      { postId, postType, reason, description: description.trim() || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
          setDescription('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Báo cáo bài viết
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Vui lòng chọn lý do bạn muốn báo cáo bài viết này:
          </p>

          <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">{r.label}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả thêm (không bắt buộc)</Label>
            <Textarea
              id="description"
              placeholder="Cung cấp thêm thông tin chi tiết..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || reportPost.isPending}
            variant="destructive"
          >
            {reportPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi báo cáo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
