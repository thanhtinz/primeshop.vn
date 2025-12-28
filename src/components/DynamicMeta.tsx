import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const DynamicMeta = () => {
  const { data: settings, isLoading } = useSiteSettings();

  // Set document title directly for faster update
  useEffect(() => {
    if (!isLoading && settings?.site_name) {
      document.title = settings.site_name;
    }
  }, [settings?.site_name, isLoading]);

  if (isLoading || !settings) return null;

  const siteName = settings.site_name || 'Store';
  const siteDescription = settings.site_description || '';
  const siteFavicon = settings.site_favicon;

  return (
    <Helmet>
      <title>{siteName}</title>
      {siteDescription && <meta name="description" content={siteDescription} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={siteName} />
      {siteDescription && <meta property="og:description" content={siteDescription} />}
      {siteFavicon && <meta property="og:image" content={siteFavicon} />}
      
      {/* Twitter */}
      <meta name="twitter:title" content={siteName} />
      {siteDescription && <meta name="twitter:description" content={siteDescription} />}
      {siteFavicon && <meta name="twitter:image" content={siteFavicon} />}
      
      {/* Apple */}
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Helmet>
  );
};
