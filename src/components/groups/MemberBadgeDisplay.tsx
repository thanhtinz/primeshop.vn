import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GroupBadge } from '@/hooks/useGroupBadges';
import { Award, Star, Shield, Heart, Flame, Trophy, Crown, Zap } from 'lucide-react';

interface MemberBadgeDisplayProps {
  badges: { badge: GroupBadge }[];
  maxDisplay?: number;
}

const iconMap: Record<string, React.ElementType> = {
  award: Award,
  star: Star,
  shield: Shield,
  heart: Heart,
  flame: Flame,
  trophy: Trophy,
  crown: Crown,
  zap: Zap,
};

export function MemberBadgeDisplay({ badges, maxDisplay = 3 }: MemberBadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {displayBadges.map(({ badge }) => {
          const IconComponent = iconMap[badge.icon] || Award;
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger>
                <Badge 
                  variant="outline"
                  className="gap-0.5 text-[10px] h-4 px-1 cursor-default"
                  style={{ 
                    backgroundColor: `${badge.color}15`,
                    color: badge.color,
                    borderColor: `${badge.color}30`,
                  }}
                >
                  <IconComponent className="h-2.5 w-2.5" />
                  {badge.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">{badge.name}</p>
                  {badge.description && (
                    <p className="text-muted-foreground">{badge.description}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-[10px] h-4 px-1 cursor-default">
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {badges.slice(maxDisplay).map(({ badge }) => (
                  <p key={badge.id} className="text-sm">{badge.name}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
