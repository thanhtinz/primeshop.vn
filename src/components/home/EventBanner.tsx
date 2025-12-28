import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveEvent } from '@/hooks/useEvents';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';

export const EventBanner = () => {
  const { data: activeEvent, isLoading } = useActiveEvent();

  if (isLoading || !activeEvent) return null;

  const endDate = new Date(activeEvent.end_date);
  const now = new Date();
  const daysLeft = differenceInDays(endDate, now);
  const hoursLeft = differenceInHours(endDate, now) % 24;

  const isSpinWheel = activeEvent.event_type === 'spin_wheel';

  return (
    <div className="container mb-6">
      <Link to="/event" className="block group">
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/10 hover:border-primary/40 transition-all duration-300">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          {/* Banner image background */}
          {activeEvent.banner_url && (
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none">
              <img 
                src={activeEvent.banner_url} 
                alt="" 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent" />
            </div>
          )}

          <div className="relative p-4 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left content */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {isSpinWheel ? (
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  ) : (
                    <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  )}
                </div>

                {/* Text content */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-xs font-medium border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      Đang diễn ra
                    </span>
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {daysLeft > 0 ? `Còn ${daysLeft} ngày ${hoursLeft}h` : `Còn ${hoursLeft}h`}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mt-1 truncate">
                    {activeEvent.name}
                  </h3>
                  
                  {activeEvent.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {activeEvent.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right content */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isSpinWheel && (
                  <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-lg font-bold text-primary">{activeEvent.spin_cost}</span>
                    <span className="text-[10px] text-muted-foreground">điểm/lượt</span>
                  </div>
                )}
                <Button 
                  size="sm"
                  className="w-full sm:w-auto group-hover:shadow-md transition-all"
                >
                  Tham gia
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
