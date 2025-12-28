import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Clock, Coffee, 
  Loader2, Calendar
} from 'lucide-react';
import { useUpdateSellerAvailability } from '@/hooks/useDesignAdvanced';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface SellerAvailabilityToggleProps {
  sellerId: string;
  currentStatus?: string;
  currentReason?: string;
  currentUntil?: string;
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Sẵn sàng nhận đơn', icon: CheckCircle, color: 'text-green-500' },
  { value: 'busy', label: 'Đang bận', icon: Clock, color: 'text-orange-500' },
  { value: 'vacation', label: 'Nghỉ phép', icon: Coffee, color: 'text-gray-500' },
];

export function SellerAvailabilityToggle({
  sellerId,
  currentStatus = 'available',
  currentReason,
  currentUntil,
}: SellerAvailabilityToggleProps) {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState(currentReason || '');
  const [until, setUntil] = useState(currentUntil ? format(new Date(currentUntil), 'yyyy-MM-dd') : '');
  const updateAvailability = useUpdateSellerAvailability();

  const handleSave = () => {
    updateAvailability.mutate({
      sellerId,
      status: status as 'available' | 'busy' | 'vacation',
      reason: status !== 'available' ? reason : undefined,
      until: status !== 'available' && until ? new Date(until).toISOString() : undefined,
    });
  };

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentStatus);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Trạng thái nhận đơn</span>
          {currentStatusOption && (
            <Badge 
              variant="secondary"
              className={cn(
                currentStatus === 'available' && 'bg-green-100 text-green-700',
                currentStatus === 'busy' && 'bg-orange-100 text-orange-700',
                currentStatus === 'vacation' && 'bg-gray-100 text-gray-700'
              )}
            >
              <currentStatusOption.icon className="h-3 w-3 mr-1" />
              {currentStatusOption.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={status} onValueChange={setStatus}>
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label 
                htmlFor={option.value} 
                className={cn('font-normal cursor-pointer flex items-center gap-2', option.color)}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {status !== 'available' && (
          <>
            <div className="space-y-2">
              <Label>Lý do (hiển thị cho khách)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Đang xử lý đơn hàng lớn..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Đến ngày
              </Label>
              <Input
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUntil(format(addDays(new Date(), 3), 'yyyy-MM-dd'))}
                >
                  3 ngày
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUntil(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
                >
                  1 tuần
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUntil(format(addDays(new Date(), 30), 'yyyy-MM-dd'))}
                >
                  1 tháng
                </Button>
              </div>
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={updateAvailability.isPending}
          className="w-full"
        >
          {updateAvailability.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Lưu trạng thái
        </Button>

        {status !== 'available' && (
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Khi không sẵn sàng, hệ thống sẽ không tự động match đơn cho bạn
          </p>
        )}
      </CardContent>
    </Card>
  );
}
