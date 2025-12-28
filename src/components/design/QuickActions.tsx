import { Button } from '@/components/ui/button';
import { 
  RefreshCw, CheckCircle, XCircle, Sparkles, 
  Package, HelpCircle, Loader 
} from 'lucide-react';
import { useDesignQuickActions } from '@/hooks/useDesignAdvanced';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  userType: 'buyer' | 'seller';
  onAction: (actionType: string, messageTemplate: string) => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  RefreshCw,
  CheckCircle,
  XCircle,
  Sparkles,
  Package,
  HelpCircle,
  Loader,
};

const colorMap: Record<string, string> = {
  orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  green: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  yellow: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export function QuickActions({ userType, onAction, disabled }: QuickActionsProps) {
  const { data: actions, isLoading } = useDesignQuickActions(userType);

  if (isLoading || !actions?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-t bg-muted/30">
      <span className="text-xs text-muted-foreground w-full mb-1">Trả lời nhanh:</span>
      {actions.map((action) => {
        const Icon = action.icon ? iconMap[action.icon] : null;
        const colorClass = action.color ? colorMap[action.color] : 'bg-secondary';

        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn('h-8 text-xs', colorClass)}
            onClick={() => onAction(action.action_type, action.message_template || '')}
          >
            {Icon && <Icon className="h-3 w-3 mr-1" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
