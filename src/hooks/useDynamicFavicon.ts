import { useEffect } from 'react';
import { useSiteSettings } from './useSiteSettings';

export const useDynamicFavicon = () => {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const favicon = settings?.site_favicon;
    
    if (favicon) {
      // Update favicon link element
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      
      link.href = favicon;
      link.type = favicon.endsWith('.svg') 
        ? 'image/svg+xml' 
        : favicon.endsWith('.ico') 
          ? 'image/x-icon' 
          : 'image/png';
    }
  }, [settings?.site_favicon]);

  useEffect(() => {
    const siteName = settings?.site_name;
    
    if (siteName) {
      document.title = siteName;
    }
  }, [settings?.site_name]);
};
