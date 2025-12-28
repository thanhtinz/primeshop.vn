import { ReactNode, useMemo } from 'react';
import { ShopBranding } from '@/hooks/useShopBranding';

interface ThemedShopWrapperProps {
  branding: ShopBranding | null | undefined;
  children: ReactNode;
  className?: string;
}

// Convert HEX to HSL for CSS variables
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemedShopWrapper = ({ branding, children, className = '' }: ThemedShopWrapperProps) => {
  // Generate CSS custom properties from branding
  const customStyles = useMemo(() => {
    if (!branding) return {};
    
    return {
      '--shop-primary': branding.primary_color || '#3B82F6',
      '--shop-primary-hsl': hexToHsl(branding.primary_color || '#3B82F6'),
      '--shop-secondary': branding.secondary_color || '#10B981',
      '--shop-secondary-hsl': hexToHsl(branding.secondary_color || '#10B981'),
      '--shop-bg': branding.background_color || 'transparent',
      '--shop-text': branding.text_color || 'inherit',
      fontFamily: branding.font_family !== 'system-ui' ? branding.font_family : undefined,
    } as React.CSSProperties;
  }, [branding]);

  // Sanitize custom CSS to prevent XSS attacks
  const sanitizeCss = (css: string | null): string | null => {
    if (!css) return null;
    
    // Remove potentially dangerous patterns
    const dangerousPatterns = [
      /javascript:/gi,
      /expression\s*\(/gi,
      /url\s*\(\s*["']?\s*data:/gi,
      /@import/gi,
      /behavior\s*:/gi,
      /-moz-binding/gi,
      /<script/gi,
      /<\/script/gi,
      /on\w+\s*=/gi, // onclick, onload, etc.
    ];
    
    let sanitized = css;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  };

  // Custom CSS injection (sanitized)
  const customCss = sanitizeCss(branding?.custom_css);

  // Themed CSS for tabs, buttons, and all interactive elements
  const themedCss = branding ? `
    .themed-shop [data-state="active"] {
      border-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
      color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
    }
    .themed-shop .themed-btn-primary,
    .themed-shop button[data-variant="default"] {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
      color: white !important;
    }
    .themed-shop .themed-btn-primary:hover,
    .themed-shop button[data-variant="default"]:hover {
      opacity: 0.9;
    }
    .themed-shop .themed-btn-outline {
      border-color: ${branding.primary_color || 'hsl(var(--primary))'};
      color: ${branding.primary_color || 'hsl(var(--primary))'};
    }
    .themed-shop .themed-btn-outline:hover {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'}10;
    }
    .themed-shop .themed-badge,
    .themed-shop .bg-primary {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
      color: white !important;
    }
    .themed-shop .themed-text-primary,
    .themed-shop .text-primary {
      color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
    }
    .themed-shop .themed-border-primary,
    .themed-shop .border-primary {
      border-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
    }
    .themed-shop .themed-bg-primary {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'};
    }
    .themed-shop .fill-primary\\/20 {
      fill: ${branding.primary_color || 'hsl(var(--primary))'}33 !important;
    }
    .themed-shop svg.text-primary {
      color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
    }
    /* Tab triggers */
    .themed-shop [role="tablist"] [data-state="active"] {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
      color: white !important;
    }
    /* Category badges */
    .themed-shop .category-badge[data-active="true"] {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
      color: white !important;
    }
    /* Price text */
    .themed-shop .price-text {
      color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
    }
    /* Primary buttons in shop */
    .themed-shop button.bg-primary,
    .themed-shop a.bg-primary {
      background-color: ${branding.primary_color || 'hsl(var(--primary))'} !important;
    }
  ` : '';

  return (
    <div style={customStyles} className={`themed-shop ${className}`}>
      {themedCss && (
        <style dangerouslySetInnerHTML={{ __html: themedCss }} />
      )}
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
      {children}
    </div>
  );
};

// Themed button that uses shop colors
interface ThemedButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemedButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick, 
  disabled,
  size = 'md'
}: ThemedButtonProps) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-lg font-medium 
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--shop-primary, hsl(var(--primary)))',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'var(--shop-secondary, hsl(var(--secondary)))',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '2px solid var(--shop-primary, hsl(var(--primary)))',
      color: 'var(--shop-primary, hsl(var(--primary)))',
    }
  };

  return (
    <button
      className={`${baseClasses} ${className}`}
      style={variantStyles[variant]}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Themed card that uses shop colors
interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
}

export const ThemedCard = ({ children, className = '', highlighted }: ThemedCardProps) => {
  const style: React.CSSProperties = highlighted ? {
    borderColor: 'var(--shop-primary, hsl(var(--primary)))',
    boxShadow: '0 0 20px var(--shop-primary, hsl(var(--primary)))20'
  } : {};

  return (
    <div 
      className={`rounded-xl border bg-card p-4 transition-all ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

// Themed badge
interface ThemedBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const ThemedBadge = ({ children, variant = 'primary', className = '' }: ThemedBadgeProps) => {
  const style: React.CSSProperties = {
    backgroundColor: variant === 'primary' 
      ? 'var(--shop-primary, hsl(var(--primary)))' 
      : 'var(--shop-secondary, hsl(var(--secondary)))',
    color: 'white',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

// Get layout class based on branding
export const getLayoutClass = (layoutStyle: string | undefined) => {
  switch (layoutStyle) {
    case 'list':
      return 'flex flex-col gap-4';
    case 'masonry':
      return 'columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4';
    case 'grid':
    default:
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
  }
};
