import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useNewsDetail } from '@/hooks/useNews';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { sanitizeHtml } from '@/lib/sanitize';

const NewsDetailPage = () => {
  const { slug } = useParams();
  const { data: news, isLoading, error } = useNewsDetail(slug || '');
  const { t, language } = useLanguage();
  const { formatRelative } = useDateFormat();

  // Get localized content
  const title = language === 'en' && news?.title_en ? news.title_en : news?.title;
  const rawContent = language === 'en' && news?.content_en ? news.content_en : news?.content;
  const content = sanitizeHtml(rawContent);
  const excerpt = language === 'en' && news?.excerpt_en ? news.excerpt_en : news?.excerpt;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-4xl">
          <div className="h-8 bg-muted rounded animate-pulse mb-4 w-32" />
          <div className="aspect-video bg-muted rounded-xl animate-pulse mb-6" />
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !news) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground mb-4">{t('articleNotFound')}</p>
          <Link to="/news">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('goBack')}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Link to="/news">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('goBack')}
          </Button>
        </Link>

        <div className="rounded-xl border border-border bg-card p-4 md:p-8">
          {news.image_url && (
            <div className="aspect-video rounded-xl overflow-hidden mb-6">
              <img
                src={news.image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
            {news.author && <span>{t('byAuthor')} {news.author}</span>}
            <span>•</span>
            <span>
              {formatRelative(news.created_at)}
            </span>
          </div>

          {content ? (
            <div 
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : excerpt ? (
            <p className="text-muted-foreground">{excerpt}</p>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default NewsDetailPage;