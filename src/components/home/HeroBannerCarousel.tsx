import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useHeroBanners, HeroBanner } from '@/hooks/useHeroBanners';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnime } from '@/hooks/useAnime';

// Default hero when no banners exist
const DefaultHero = forwardRef<HTMLDivElement, {}>(function DefaultHero(_, ref) {
  return (
    <div ref={ref} className="relative h-full min-h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/10 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">Cửa hàng #1 Việt Nam</span>
        </div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Mua sắm <span className="text-primary">Thông Minh</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Tài khoản Premium, Account Game, Nạp Game - Giao hàng tức thì.
        </p>
        <Link to="/#products">
          <Button size="sm" className="px-6">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Khám phá ngay
          </Button>
        </Link>
      </div>
    </div>
  );
});

export const HeroBannerCarousel = () => {
  const { data: banners, isLoading } = useHeroBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { fadeIn, fadeOut, slideIn, custom } = useAnime();

  // Get all active banners for carousel
  const activeBanners = banners?.filter(b => b.is_active) || [];

  // Animate slide transitions
  useEffect(() => {
    if (activeBanners.length === 0) return;
    
    const currentSlide = slideRefs.current[currentIndex];
    const prevSlide = slideRefs.current[prevIndex];
    const currentContent = contentRefs.current[currentIndex];

    // Animate out previous slide
    if (prevSlide && prevIndex !== currentIndex) {
      custom(prevSlide, {
        opacity: [1, 0],
        scale: [1, 1.05],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }

    // Animate in current slide
    if (currentSlide) {
      custom(currentSlide, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 600,
        easing: 'easeOutQuad'
      });
    }

    // Animate content with stagger - only if children exist
    if (currentContent) {
      const children = currentContent.querySelectorAll('.animate-content');
      if (children.length > 0) {
        custom(children, {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 600,
          delay: (el: Element, i: number) => 200 + i * 100,
          easing: 'easeOutQuad'
        });
      }
    }
  }, [currentIndex, prevIndex, activeBanners.length, custom]);

  const nextSlide = useCallback(() => {
    if (activeBanners.length === 0) return;
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length, currentIndex]);

  const prevSlide = useCallback(() => {
    if (activeBanners.length === 0) return;
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length, currentIndex]);

  const goToSlide = (index: number) => {
    setPrevIndex(currentIndex);
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY * 0.3);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || activeBanners.length <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, activeBanners.length]);

  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  if (isLoading) {
    return (
      <div className="relative w-full h-[200px] sm:h-[280px] md:h-[320px] rounded-xl bg-secondary animate-pulse" />
    );
  }

  if (activeBanners.length === 0) {
    return <DefaultHero />;
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[21/9] sm:aspect-[21/9] md:aspect-[21/9] rounded-xl overflow-hidden bg-secondary group"
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {activeBanners.map((banner, index) => (
          <div
            key={banner.id}
            ref={el => slideRefs.current[index] = el}
            className={cn(
              "absolute inset-0",
              index === currentIndex ? "z-10" : "z-0 opacity-0"
            )}
          >
            <div 
              className="absolute inset-0 cursor-pointer flex items-center justify-center overflow-hidden"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

            <div 
              ref={el => contentRefs.current[index] = el}
              className="relative h-full flex items-center px-3 sm:px-6 md:px-8"
            >
              <div className="max-w-md text-white">
                {banner.subtitle && (
                  <span className="animate-content inline-block px-2 py-0.5 sm:px-3 sm:py-1 mb-1.5 sm:mb-2 text-[10px] sm:text-sm font-medium bg-primary/90 rounded-full">
                    {banner.subtitle}
                  </span>
                )}
                {banner.title && (
                  <h1 className="animate-content text-base sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 leading-tight line-clamp-2">
                    {banner.title}
                  </h1>
                )}
                {banner.description && (
                  <p className="animate-content text-[10px] sm:text-sm text-white/90 mb-2 sm:mb-4 max-w-sm line-clamp-2 hidden sm:block">
                    {banner.description}
                  </p>
                )}
                {banner.button_text && banner.button_link && (
                  <Link to={banner.button_link} className="animate-content inline-block">
                    <Button size="sm" className="px-3 sm:px-6 h-7 sm:h-9 text-[10px] sm:text-sm">
                      {banner.button_text}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows - hidden on mobile, show on hover for desktop */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all hidden md:block md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all hidden md:block md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                index === currentIndex 
                  ? "w-4 bg-white" 
                  : "bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {currentBanner && (
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title || 'Banner'}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
