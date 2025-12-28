import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useRef, useEffect, useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface Partner {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
}

export function PartnersSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data: siteSettings } = useSiteSettings();

  const { data: partners = [] } = useQuery({
    queryKey: ['partners-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, description, image_url, link')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Partner[];
    },
  });

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollRef.current || partners.length === 0 || isPaused || isDragging) return;

    const container = scrollRef.current;
    let animationId: number;
    const scrollSpeed = 0.5;

    const scroll = () => {
      if (!container) return;
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += scrollSpeed;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [partners.length, isPaused, isDragging]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (partners.length === 0) return null;

  // Only duplicate for seamless loop if there are enough partners
  const displayPartners = partners.length >= 3 ? [...partners, ...partners] : partners;

  const shopName = siteSettings?.site_name || 'Shop';

  return (
    <section className="pt-2 -mb-12">
      <div className="container mb-3 text-center">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Đối tác của {shopName}</h2>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing px-4 md:px-8"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); setIsDragging(false); }}
      >
        {displayPartners.map((partner, index) => (
          <a
            key={`${partner.id}-${index}`}
            href={partner.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-[240px] md:w-[280px]"
            onClick={(e) => {
              if (!partner.link) e.preventDefault();
              if (isDragging) e.preventDefault();
            }}
          >
            <div className="h-full rounded-lg bg-card border border-border overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-md">
              {/* Image area - centered */}
              <div className="aspect-[4/3] flex items-center justify-center p-6">
                {partner.image_url ? (
                  <img
                    src={partner.image_url}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="text-muted-foreground text-xs">No Image</div>
                )}
              </div>
              {/* Text content */}
              <div className="p-3">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide mb-1 line-clamp-1">
                  {partner.name}
                </h3>
                {partner.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                    {partner.description}
                  </p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
