import { Link } from 'react-router-dom';
import { useHeroBanners } from '@/hooks/useHeroBanners';
import { useCategories } from '@/hooks/useCategories';
import { useAnime } from '@/hooks/useAnime';
import { useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
export const SidePromoBanners = () => {
  const { data: banners } = useHeroBanners();
  const containerRef = useRef<HTMLDivElement>(null);
  const { staggerFadeIn } = useAnime();
  
  // Use banners after the first one for side promos
  const sideBanners = banners?.filter(b => b.is_active).slice(1, 3) || [];

  useEffect(() => {
    if (containerRef.current && sideBanners.length > 0) {
      const items = containerRef.current.querySelectorAll('.promo-item');
      staggerFadeIn(items, { duration: 600, staggerDelay: 150 });
    }
  }, [sideBanners.length, staggerFadeIn]);

  if (sideBanners.length === 0) {
    return (
      <div ref={containerRef} className="hidden xl:flex flex-col gap-3 w-[280px] shrink-0">
        <div className="promo-item flex-1 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-4 flex flex-col justify-center items-center text-center opacity-0">
          <span className="text-2xl font-bold text-primary">VIP</span>
          <span className="text-sm text-muted-foreground mt-1">Ưu đãi thành viên</span>
        </div>
        <div className="promo-item flex-1 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 p-4 flex flex-col justify-center items-center text-center opacity-0">
          <span className="text-2xl font-bold text-orange-500">HOT</span>
          <span className="text-sm text-muted-foreground mt-1">Deal sốc hôm nay</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="hidden xl:flex flex-col gap-3 w-[280px] shrink-0">
      {sideBanners.map((banner) => (
        <Link
          key={banner.id}
          to={banner.button_link || '#'}
          className="promo-item flex-1 rounded-xl overflow-hidden relative group opacity-0"
        >
          <img
            src={banner.image_url}
            alt={banner.title || 'Promo'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {banner.title && (
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-sm font-semibold line-clamp-2">{banner.title}</p>
            </div>
          )}
        </Link>
      ))}
      {sideBanners.length === 1 && (
        <div className="promo-item flex-1 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 p-4 flex flex-col justify-center items-center text-center opacity-0">
          <span className="text-2xl font-bold text-orange-500">HOT</span>
          <span className="text-sm text-muted-foreground mt-1">Deal sốc hôm nay</span>
        </div>
      )}
    </div>
  );
};

export const QuickActionBanners = () => {
  const { data: categories } = useCategories();
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { staggerFadeIn, custom } = useAnime();
  
  const premiumCategories = categories?.filter(c => (c.style || 'premium') === 'premium').slice(0, 4) || [];

  const getCategoryName = (category: any) => {
    if (language === 'en' && category.name_en) {
      return category.name_en;
    }
    return category.name;
  };

  const getCategoryDescription = (category: any) => {
    if (language === 'en' && category.description_en) {
      return category.description_en;
    }
    return category.description;
  };
  
  const colors = [
    'from-blue-600 to-blue-700',
    'from-purple-600 to-purple-700',
    'from-green-600 to-green-700',
    'from-orange-600 to-orange-700',
  ];

  useEffect(() => {
    if (containerRef.current && premiumCategories.length > 0) {
      const items = containerRef.current.querySelectorAll('.action-item');
      staggerFadeIn(items, { duration: 500, staggerDelay: 80 });
    }
  }, [premiumCategories.length, staggerFadeIn]);

  if (premiumCategories.length === 0) return null;

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {premiumCategories.map((category, index) => (
        <Link
          key={category.id}
          to={`/category/${category.slug}`}
          className={`action-item relative rounded-xl overflow-hidden bg-gradient-to-r ${colors[index % colors.length]} p-3 md:p-4 text-white hover:shadow-lg transition-shadow group active:scale-[0.98] opacity-0`}
        >
          <div className="relative z-10">
            <h4 className="font-bold text-xs md:text-base line-clamp-1">{getCategoryName(category)}</h4>
            {getCategoryDescription(category) && (
              <p className="text-[10px] md:text-sm text-white/80 mt-0.5 line-clamp-1">{getCategoryDescription(category)}</p>
            )}
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
        </Link>
      ))}
    </div>
  );
};
