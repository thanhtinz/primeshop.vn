import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string from untrusted source
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Configure DOMPurify to allow safe HTML tags and attributes
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'div', 'span',
      'iframe', // For embedded videos - we'll sanitize src separately
      'audio', 'video', 'source',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style',
      'colspan', 'rowspan',
      'controls', 'autoplay', 'loop', 'muted',
      'frameborder', 'allowfullscreen',
    ],
    // Allow safe URL protocols only
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Don't allow data: URIs to prevent XSS
    FORBID_TAGS: ['script', 'style', 'link', 'meta', 'base', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  };
  
  // For iframes, only allow trusted sources (YouTube, Vimeo, etc.)
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src') || '';
      const allowedDomains = [
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
        'player.vimeo.com',
        'vimeo.com',
        'www.dailymotion.com',
      ];
      
      const isTrusted = allowedDomains.some(domain => {
        try {
          const url = new URL(src);
          return url.hostname === domain || url.hostname.endsWith('.' + domain);
        } catch {
          return false;
        }
      });
      
      if (!isTrusted) {
        node.remove();
      }
    }
    
    // Add rel="noopener noreferrer" to external links
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
      }
    }
  });

  return DOMPurify.sanitize(html, config);
}

/**
 * Strip all HTML tags from content
 * @param html - HTML string
 * @returns Plain text without any HTML
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
