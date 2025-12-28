import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Shield, Star } from 'lucide-react';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { cn } from '@/lib/utils';

interface PrimeEffect {
  effect_type: string;
  effect_config: {
    color?: string;
    blur?: string;
    gradient?: string;
  };
}

interface UserAvatarProps {
  user: {
    user_id?: string;
    username?: string;
    full_name?: string | null;
    email?: string;
    avatar_url?: string | null;
    avatar_frame_id?: string | null;
    is_verified?: boolean | null;
    vip_level_name?: string | null;
    is_admin?: boolean;
    total_spent?: number;
    nickname?: string | null;
    has_prime_boost?: boolean | null;
  };
  frame?: {
    id: string;
    image_url: string;
    avatar_border_radius?: string | null;
  } | null;
  primeEffect?: PrimeEffect | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadges?: boolean;
  showName?: boolean;
  showLink?: boolean;
  showOnlineStatus?: boolean;
  nameClassName?: string;
  className?: string;
}

const sizeClasses = {
  xs: { avatar: 'h-6 w-6', frame: 'h-8 w-8', text: 'text-xs', badgeSize: 'h-3 w-3' },
  sm: { avatar: 'h-8 w-8', frame: 'h-11 w-11', text: 'text-sm', badgeSize: 'h-3.5 w-3.5' },
  md: { avatar: 'h-10 w-10', frame: 'h-14 w-14', text: 'text-sm', badgeSize: 'h-4 w-4' },
  lg: { avatar: 'h-12 w-12', frame: 'h-16 w-16', text: 'text-base', badgeSize: 'h-4 w-4' },
  xl: { avatar: 'h-16 w-16', frame: 'h-22 w-22', text: 'text-lg', badgeSize: 'h-5 w-5' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  frame,
  primeEffect,
  size = 'md',
  showBadges = false,
  showName = false,
  showLink = true,
  showOnlineStatus = false,
  nameClassName,
  className,
}) => {
  const sizeClass = sizeClasses[size];
  const initials = user.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?';
  const profileLink = user.username ? `/user/${user.username}` : user.user_id ? `/user/${user.user_id}` : '#';
  
  const hasFrame = frame && user.avatar_frame_id;
  const effectType = primeEffect?.effect_type;
  const effectConfig = primeEffect?.effect_config || {};
  
  const onlineSizeMap = {
    xs: 'sm' as const,
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'md' as const,
    xl: 'lg' as const,
  };

  // Render particles effect
  const renderParticles = () => {
    if (effectType !== 'particles') return null;
    const particleCount = size === 'xs' || size === 'sm' ? 4 : 6;
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ 
              backgroundColor: effectConfig.color || '#ef4444',
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`
            }}
            animate={{
              y: [-5, -20],
              opacity: [1, 0],
              scale: [1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.25
            }}
          />
        ))}
      </div>
    );
  };

  // Get glow style
  const getGlowStyle = (): React.CSSProperties => {
    if (effectType !== 'glow') return {};
    return {
      boxShadow: `0 0 ${effectConfig.blur || '20px'} ${effectConfig.color || '#fbbf24'}`
    };
  };

  // Get border style for border effect
  const getBorderEffectStyle = (): React.CSSProperties => {
    if (effectType !== 'border') return {};
    return {
      border: '3px solid transparent',
      backgroundImage: `linear-gradient(white, white), ${effectConfig.gradient || 'linear-gradient(45deg, red, orange)'}`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box'
    };
  };

  const AvatarContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Avatar with frame */}
      <div className={cn("relative flex-shrink-0", hasFrame ? sizeClass.frame : sizeClass.avatar)}>
        {/* Glow effect from frame */}
        {hasFrame && !primeEffect && (
          <div 
            className="absolute rounded-full opacity-30 blur-lg"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))',
              width: '65%',
              height: '65%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {/* Prime effect glow */}
        {effectType === 'glow' && (
          <motion.div 
            className="absolute rounded-full"
            style={{ 
              backgroundColor: effectConfig.color || '#fbbf24',
              filter: `blur(${effectConfig.blur || '20px'})`,
              width: hasFrame ? '65%' : '100%',
              height: hasFrame ? '65%' : '100%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Particles effect */}
        {renderParticles()}
        
        {/* Avatar centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar 
            className={cn(
              hasFrame ? 'h-[65%] w-[65%]' : 'h-full w-full',
              "border-2 border-background shadow-md"
            )}
            style={{ 
              borderRadius: frame?.avatar_border_radius || '50%',
              ...getBorderEffectStyle()
            }}
          >
            <AvatarImage 
              src={user.avatar_url || ''} 
              className="object-cover" 
              style={{ borderRadius: frame?.avatar_border_radius || '50%' }}
            />
            <AvatarFallback 
              className="bg-primary/10 text-primary font-medium"
              style={{ borderRadius: frame?.avatar_border_radius || '50%' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Frame overlay */}
        {hasFrame && (
          <img 
            src={frame.image_url}
            alt="Avatar frame"
            className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-sm"
            style={{ objectFit: 'contain' }}
          />
        )}
        
        {/* Online indicator */}
        {showOnlineStatus && user.user_id && (
          <OnlineIndicator 
            userId={user.user_id} 
            size={onlineSizeMap[size]}
            className="absolute bottom-0 right-0 z-20"
          />
        )}
      </div>

      {/* Name and badges */}
      {showName && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={cn("font-semibold truncate", sizeClass.text, nameClassName)}>
              {user.full_name || user.email || 'Người dùng'}
              {user.nickname && (
                <span className="text-muted-foreground font-normal"> ({user.nickname})</span>
              )}
            </span>
            {user.is_verified && (
              <BadgeCheck className={cn(sizeClass.badgeSize, "text-blue-500 fill-blue-100 flex-shrink-0")} />
            )}
            {showBadges && (
              <>
                {user.is_admin && (
                  <Badge className="gap-0.5 text-[10px] h-4 px-1 bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white">
                    <Shield className="h-2.5 w-2.5" />
                    Admin
                  </Badge>
                )}
                {user.has_prime_boost && (
                  <PrimeBadge size="sm" />
                )}
                {user.vip_level_name && user.vip_level_name !== 'Member' && (
                  <VipBadge levelName={user.vip_level_name} size="sm" />
                )}
                {(user.total_spent || 0) >= 1000000 && (
                  <Badge variant="outline" className="gap-0.5 text-[10px] h-4 px-1 bg-purple-500/10 border-purple-500/30 text-purple-600">
                    <Star className="h-2.5 w-2.5" />
                    Top
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (showLink && profileLink !== '#') {
    return (
      <Link to={profileLink} className="hover:opacity-80 transition-opacity">
        {AvatarContent}
      </Link>
    );
  }

  return AvatarContent;
};

export default UserAvatar;
