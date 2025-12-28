import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { useDesignCategories } from '@/hooks/useDesignServices';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { TiltCard } from '@/components/ui/tilt-card';
import { CategoryCardSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';

const DESIGN_PER_PAGE = 6;

export const DesignCategoriesSection = () => {
  const { t, language } = useLanguage();
  const { data: designCategories, isLoading } = useDesignCategories();
  const [page, setPage] = useState(1);

  const allCategories = designCategories || [];
  const totalPages = Math.ceil(allCategories.length / DESIGN_PER_PAGE);
  const displayCategories = allCategories.slice(
    (page - 1) * DESIGN_PER_PAGE,
    page * DESIGN_PER_PAGE
  );

  // Hide section if no design categories
  if (!isLoading && allCategories.length === 0) {
    return null;
  }

  return (
    <ScrollReveal animation="fade-up" delay={150}>
      <section className="py-6 md:py-10 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
        <div className="container">
          <div className="mb-4 md:mb-5">
            <h2 className="text-lg md:text-2xl font-bold">Design</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
              {t('designServicesDesc')}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                {displayCategories.map((category) => {
                  const displayName = language === 'en' && category.name_en ? category.name_en : category.name;
                  
                  return (
                    <StaggerItem key={category.id}>
                      <TiltCard maxTilt={3} scale={1.005}>
                        <Link
                          to={`/design?category=${category.slug}`}
                          className="group block rounded-xl overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
                        >
                          {/* Category Banner Image */}
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={displayName}
                              className="w-full h-20 md:h-28 object-cover"
                            />
                          ) : (
                            <div className="w-full h-20 md:h-28 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
                            </div>
                          )}
                        </Link>
                      </TiltCard>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>

              {/* Design Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
};
