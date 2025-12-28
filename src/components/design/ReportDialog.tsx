import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, Loader2 } from 'lucide-react';
import { useCreateReport } from '@/hooks/useDesignAdvanced';
import { toast } from 'sonner';

interface ReportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ticketId?: string;
  orderId?: string;
  reportedUserId: string;
  reportedUserType?: 'buyer' | 'seller';
  reporterType?: 'buyer' | 'seller';
}

const REPORT_REASONS = [
  { value: 'scam', label: 'Lừa đảo / Scam' },
  { value: 'harassment', label: 'Quấy rối / Xúc phạm' },
  { value: 'spam', label: 'Spam / Tin rác' },
  { value: 'external_contact', label: 'Trao đổi ngoài hệ thống' },
  { value: 'fake_delivery', label: 'Giao hàng giả / Không đúng' },
  { value: 'unresponsive', label: 'Không phản hồi' },
  { value: 'quality_issue', label: 'Chất lượng kém' },
  { value: 'other', label: 'Lý do khác' },
];

export function ReportDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  ticketId,
  orderId,
  reportedUserId,
  reportedUserType = 'seller',
  reporterType = 'buyer',
}: ReportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const createReport = useCreateReport();

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Vui lòng chọn lý do báo cáo');
      return;
    }

    createReport.mutate(
      {
        ticket_id: ticketId || null,
        order_id: orderId || null,
        reported_user_id: reportedUserId,
        reported_user_type: reportedUserType,
        reporter_type: reporterType,
        reason,
        description: description || null,
        evidence_urls: null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setReason('');
          setDescription('');
        },
      }
    );
  };

  // If controlled, render just the dialog content without trigger
  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo vi phạm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Lý do báo cáo *</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                {REPORT_REASONS.map((r) => (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="font-normal cursor-pointer">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Mô tả chi tiết (tùy chọn)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả thêm về vi phạm..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createReport.isPending || !reason}
                className="bg-red-500 hover:bg-red-600"
              >
                {createReport.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Gửi báo cáo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
          <Flag className="h-4 w-4 mr-1" />
          Báo cáo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Lý do báo cáo *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Mô tả chi tiết (tùy chọn)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả thêm về vi phạm..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReport.isPending || !reason}
              className="bg-red-500 hover:bg-red-600"
            >
              {createReport.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gửi báo cáo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
