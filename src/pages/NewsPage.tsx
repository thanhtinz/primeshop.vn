import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useNews } from '@/hooks/useNews';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDateFormat } from '@/hooks/useDateFormat';

const NewsPage = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: news, isLoading } = useNews();
  const { t, language } = useLanguage();
  const { formatRelative } = useDateFormat();

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(news || [], { itemsPerPage: 12 });

  return (
    <Layout>
      <div ref={ref} className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{t('newsAndPromos')}</h1>
          {news && news.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {startIndex}-{endIndex} / {totalItems}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((item) => {
                const displayTitle = language === 'en' && item.title_en ? item.title_en : item.title;
                const displayExcerpt = language === 'en' && item.excerpt_en ? item.excerpt_en : item.excerpt;
                
                return (
                  <Link
                    key={item.id}
                    to={`/news/${item.slug}`}
                    className="group rounded-xl bg-card border border-border hover:border-primary/50 overflow-hidden transition-all hover:shadow-lg"
                  >
                    <div className="aspect-video bg-secondary overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20" />
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {displayTitle}
                      </h2>
                      {displayExcerpt && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {displayExcerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        {item.author && <span>{t('by')} {item.author}</span>}
                        <span>•</span>
                        <span>
                          {formatRelative(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              showInfo={false}
              className="mt-8"
            />
          </>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">{t('noArticlesYet')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
});

NewsPage.displayName = 'NewsPage';

export default NewsPage;
