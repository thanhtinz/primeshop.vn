import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    code: string;
    name: string;
    name_en: string | null;
    description: string | null;
    description_en: string | null;
    icon: string | null;
    badge_color: string;
    points_reward: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  earned?: boolean;
  earnedAt?: string;
}

export const AchievementBadge = ({
  achievement,
  size = 'md',
  showTooltip = true,
  earned = true,
  earnedAt,
}: AchievementBadgeProps) => {
  const { language } = useLanguage();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  // Get icon component from lucide-react
  const IconComponent = achievement.icon 
    ? (LucideIcons as any)[achievement.icon] || LucideIcons.Award
    : LucideIcons.Award;

  const name = language === 'en' ? achievement.name_en || achievement.name : achievement.name;
  const description = language === 'en' 
    ? achievement.description_en || achievement.description 
    : achievement.description;

  const badge = (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      className={cn(
        "relative rounded-full flex items-center justify-center",
        sizeClasses[size],
        earned ? "cursor-pointer" : "cursor-default opacity-50 grayscale"
      )}
      style={{
        background: earned 
          ? `linear-gradient(135deg, ${achievement.badge_color}40, ${achievement.badge_color}80)`
          : 'hsl(var(--muted))',
        boxShadow: earned 
          ? `0 0 20px ${achievement.badge_color}40`
          : 'none',
      }}
    >
      <div
        className={cn(
          "absolute inset-1 rounded-full flex items-center justify-center",
          earned ? "bg-background/80" : "bg-muted"
        )}
      >
        <IconComponent
          size={iconSizes[size]}
          style={{ color: earned ? achievement.badge_color : 'hsl(var(--muted-foreground))' }}
        />
      </div>
      
      {/* Glow effect for earned badges */}
      {earned && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 10px ${achievement.badge_color}20`,
              `0 0 20px ${achievement.badge_color}40`,
              `0 0 10px ${achievement.badge_color}20`,
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: achievement.badge_color }}>
              {name}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {earned && earnedAt && (
              <p className="text-xs text-muted-foreground">
                Đạt được: {new Date(earnedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
            {!earned && (
              <p className="text-xs text-amber-500">Chưa đạt được</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
