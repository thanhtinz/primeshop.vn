import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const DynamicFavicon = () => {
  const { data: settings, isLoading } = useSiteSettings();

  useEffect(() => {
    // Wait for settings to load - don't set any favicon until we have the real one
    if (isLoading || !settings?.site_favicon) return;
    
    const faviconUrl = settings.site_favicon;
    
    // Always add cache busting
    const cacheBuster = Date.now();
    const finalUrl = faviconUrl.includes('?') 
      ? `${faviconUrl}&v=${cacheBuster}`
      : `${faviconUrl}?v=${cacheBuster}`;
    
    // Remove all existing favicon links first
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(link => link.remove());
    
    // Create new favicon link with cache busting
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 
                faviconUrl.endsWith('.png') ? 'image/png' : 
                faviconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    link.href = finalUrl;
    document.head.appendChild(link);
    
    // Also add shortcut icon for older browsers
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = finalUrl;
    document.head.appendChild(shortcutLink);
    
    // Also add apple-touch-icon for iOS
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = finalUrl;
    document.head.appendChild(appleLink);
    
    console.log('Favicon updated to:', finalUrl);
  }, [settings?.site_favicon, isLoading]);

  return null;
};
