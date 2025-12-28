import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveFlashSale } from '@/hooks/useFlashSales';
import { useEffect, useState } from 'react';

export function FlashSaleBanner() {
  const { data: flashSale } = useActiveFlashSale();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!flashSale) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(flashSale.end_date).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  if (!flashSale) return null;

  return (
    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white">
      <div className="container py-2 md:py-3">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2 animate-pulse">
              <Zap className="h-4 w-4 md:h-5 md:w-5 fill-current" />
              <span className="font-bold text-sm md:text-base whitespace-nowrap">FLASH SALE</span>
            </div>
            <span className="text-white/80 text-xs md:text-sm hidden sm:inline truncate">
              {flashSale.name}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Countdown */}
            <div className="flex items-center gap-1">
              <div className="bg-white/20 rounded px-1.5 py-0.5 md:px-2 md:py-1">
                <span className="font-mono font-bold text-xs md:text-sm">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/80">:</span>
              <div className="bg-white/20 rounded px-1.5 py-0.5 md:px-2 md:py-1">
                <span className="font-mono font-bold text-xs md:text-sm">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/80">:</span>
              <div className="bg-white/20 rounded px-1.5 py-0.5 md:px-2 md:py-1">
                <span className="font-mono font-bold text-xs md:text-sm">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <Link to="/flash-sale">
              <Button 
                size="sm" 
                className="bg-white text-red-500 hover:bg-white/90 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm font-semibold"
              >
                Xem ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
