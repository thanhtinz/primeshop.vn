import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Newspaper } from 'lucide-react';
import { useNews } from '@/hooks/useNews';
import { useLanguage } from '@/contexts/LanguageContext';
import { animate, stagger } from 'animejs';
import { useScrollStagger } from '@/hooks/usePageEnterAnimation';

function NewsCard({ item, language, index }: { item: any; language: string; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const getTitle = (item: any) => {
    if (language === 'en' && item.title_en) return item.title_en;
    return item.title;
  };

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        translateY: -6,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }
    if (imageRef.current) {
      animate(imageRef.current, {
        scale: 1.08,
        duration: 400,
        easing: 'easeOutExpo',
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        translateY: 0,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }
    if (imageRef.current) {
      animate(imageRef.current, {
        scale: 1,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }
  }, []);

  return (
    <Link
      ref={cardRef}
      key={item.id}
      to={`/news/${item.slug}`}
      className="group stagger-item will-change-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          {item.image_url ? (
            <img
              ref={imageRef}
              src={item.image_url}
              alt={getTitle(item)}
              className="w-full h-full object-cover will-change-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {getTitle(item)}
          </h4>
        </div>
      </div>
    </Link>
  );
}

export function NewsSection() {
  const { data: news, isLoading } = useNews(4);
  const { t, language } = useLanguage();
  const containerRef = useScrollStagger({ selector: '.stagger-item', staggerDelay: 80 });

  return (
    <section className="py-8 md:py-10">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            {t('latestNews')}
          </h2>
          <Link 
            to="/news" 
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t('viewAll')} <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* News Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : news && news.length > 0 ? (
          <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {news.map((item, index) => (
              <NewsCard key={item.id} item={item} language={language} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-border">
            <Newspaper className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t('noData')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
