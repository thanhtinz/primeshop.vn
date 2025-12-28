import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeadlineCountdownProps {
  deadline: string | null;
  className?: string;
  showFullDate?: boolean;
}

export function DeadlineCountdown({ deadline, className, showFullDate = false }: DeadlineCountdownProps) {
  const { formatDateTime } = useDateFormat();
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isOverdue: boolean;
    status: 'normal' | 'warning' | 'urgent' | 'overdue';
  } | null>(null);

  useEffect(() => {
    if (!deadline) return;

    const calculateTime = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate.getTime() - now.getTime();
      
      const isOverdue = diff < 0;
      const absDiff = Math.abs(diff);
      
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

      let status: 'normal' | 'warning' | 'urgent' | 'overdue' = 'normal';
      if (isOverdue) {
        status = 'overdue';
      } else if (diff < 24 * 60 * 60 * 1000) {
        status = 'urgent';
      } else if (diff < 48 * 60 * 60 * 1000) {
        status = 'warning';
      }

      setTimeLeft({ days, hours, minutes, isOverdue, status });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || !timeLeft) {
    return null;
  }

  const statusConfig = {
    normal: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: Clock },
    warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: Clock },
    urgent: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: AlertTriangle },
    overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: XCircle },
  };

  const config = statusConfig[timeLeft.status];
  const Icon = config.icon;

  const formatTimeLeft = () => {
    const dayLabel = language === 'vi' ? 'ngày' : 'days';
    const minuteLabel = language === 'vi' ? 'phút' : 'min';
    const overdueLabel = language === 'vi' ? 'Quá hạn' : 'Overdue';
    
    if (timeLeft.isOverdue) {
      if (timeLeft.days > 0) return `${overdueLabel} ${timeLeft.days} ${dayLabel} ${timeLeft.hours}h`;
      if (timeLeft.hours > 0) return `${overdueLabel} ${timeLeft.hours}h ${timeLeft.minutes}m`;
      return `${overdueLabel} ${timeLeft.minutes} ${minuteLabel}`;
    }
    
    if (timeLeft.days > 0) return `${timeLeft.days} ${dayLabel} ${timeLeft.hours}h`;
    if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    return `${timeLeft.minutes} ${minuteLabel}`;
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', config.bg)}>
        <Icon className={cn('h-4 w-4', config.text)} />
        <span className={cn('font-medium text-sm', config.text)}>
          {timeLeft.isOverdue 
            ? (language === 'vi' ? 'Đã quá hạn' : 'Overdue') 
            : (language === 'vi' ? 'Còn lại' : 'Remaining')}: {formatTimeLeft()}
        </span>
      </div>
      {showFullDate && (
        <span className="text-xs text-muted-foreground pl-2">
          Deadline: {formatDateTime(deadline, 'HH:mm dd/MM/yyyy')}
        </span>
      )}
    </div>
  );
}
