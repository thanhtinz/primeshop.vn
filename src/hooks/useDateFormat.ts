import { useLanguage } from '@/contexts/LanguageContext';
import { format, formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useCallback, useMemo } from 'react';

// Timezone constants based on language
const TIMEZONE_CONFIG = {
  vi: {
    timezone: 'Asia/Ho_Chi_Minh',
    offset: 7 * 60, // GMT+7 in minutes
    locale: vi,
  },
  en: {
    timezone: 'UTC',
    offset: 0,
    locale: enUS,
  },
} as const;

export const useDateFormat = () => {
  const { language } = useLanguage();
  
  const config = useMemo(() => TIMEZONE_CONFIG[language], [language]);
  
  // Convert UTC date to timezone-adjusted date
  const toTimezone = useCallback((date: Date | string): Date => {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Get UTC time and add timezone offset
    const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utcTime + config.offset * 60000);
  }, [config.offset]);

  // Format date with pattern
  const formatDate = useCallback((
    date: Date | string | null | undefined,
    pattern: string = 'dd/MM/yyyy'
  ): string => {
    if (!date) return '';
    try {
      const adjustedDate = toTimezone(date);
      return format(adjustedDate, pattern, { locale: config.locale });
    } catch {
      return '';
    }
  }, [toTimezone, config.locale]);

  // Format datetime with time
  const formatDateTime = useCallback((
    date: Date | string | null | undefined,
    pattern: string = 'dd/MM/yyyy HH:mm'
  ): string => {
    if (!date) return '';
    try {
      const adjustedDate = toTimezone(date);
      return format(adjustedDate, pattern, { locale: config.locale });
    } catch {
      return '';
    }
  }, [toTimezone, config.locale]);

  // Format relative time (e.g., "2 hours ago")
  const formatRelative = useCallback((
    date: Date | string | null | undefined,
    options?: { addSuffix?: boolean }
  ): string => {
    if (!date) return '';
    try {
      const adjustedDate = toTimezone(date);
      return formatDistanceToNow(adjustedDate, { 
        addSuffix: options?.addSuffix ?? true,
        locale: config.locale 
      });
    } catch {
      return '';
    }
  }, [toTimezone, config.locale]);

  // Format for display with timezone indicator
  const formatWithTimezone = useCallback((
    date: Date | string | null | undefined,
    pattern: string = 'dd/MM/yyyy HH:mm'
  ): string => {
    if (!date) return '';
    try {
      const adjustedDate = toTimezone(date);
      const formatted = format(adjustedDate, pattern, { locale: config.locale });
      const tzLabel = language === 'vi' ? 'GMT+7' : 'UTC';
      return `${formatted} (${tzLabel})`;
    } catch {
      return '';
    }
  }, [toTimezone, config.locale, language]);

  // Format for toLocaleString equivalent
  const formatLocale = useCallback((
    date: Date | string | null | undefined
  ): string => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const localeStr = language === 'vi' ? 'vi-VN' : 'en-US';
      return d.toLocaleString(localeStr, { 
        timeZone: config.timezone 
      });
    } catch {
      return '';
    }
  }, [config.timezone, language]);

  // Format for toLocaleDateString equivalent
  const formatLocalDate = useCallback((
    date: Date | string | null | undefined
  ): string => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const localeStr = language === 'vi' ? 'vi-VN' : 'en-US';
      return d.toLocaleDateString(localeStr, { 
        timeZone: config.timezone 
      });
    } catch {
      return '';
    }
  }, [config.timezone, language]);

  return {
    formatDate,
    formatDateTime,
    formatRelative,
    formatWithTimezone,
    formatLocale,
    formatLocalDate,
    toTimezone,
    timezone: config.timezone,
    locale: config.locale,
    language,
  };
};

// Standalone helper for non-hook contexts
export const getTimezoneConfig = (language: 'vi' | 'en') => TIMEZONE_CONFIG[language];
