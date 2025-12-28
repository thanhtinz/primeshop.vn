import { Scale, Crown, Briefcase, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LicenseBadgeProps {
  licenseType?: string;
  className?: string;
  showLabel?: boolean;
}

const LICENSE_CONFIG: Record<string, { 
  label: string; 
  icon: any; 
  color: string;
  description: string;
}> = {
  personal: {
    label: 'Cá nhân',
    icon: User,
    color: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    description: 'Sử dụng cho mục đích cá nhân, không thương mại'
  },
  commercial: {
    label: 'Thương mại',
    icon: Briefcase,
    color: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30',
    description: 'Sử dụng cho mục đích kinh doanh và thương mại'
  },
  exclusive: {
    label: 'Độc quyền',
    icon: Crown,
    color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    description: 'Bản quyền độc quyền, không bán cho người khác'
  },
};

export function LicenseBadge({ licenseType = 'personal', className, showLabel = true }: LicenseBadgeProps) {
  const config = LICENSE_CONFIG[licenseType] || LICENSE_CONFIG.personal;
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn('gap-1', config.color, className)}>
          <Icon className="h-3 w-3" />
          {showLabel && config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">License: {config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
