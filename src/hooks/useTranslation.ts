import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TranslationCache {
  [key: string]: string;
}

// Global cache shared across all hook instances
const globalCache: Record<string, TranslationCache> = {};
const pendingRequests: Record<string, Promise<Record<string, string>>> = {};

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const batchQueue = useRef<Set<string>>(new Set());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

  const translateTexts = useCallback(async (
    texts: string[],
    targetLang: string,
    sourceLang: string = 'vi'
  ): Promise<Record<string, string>> => {
    if (targetLang === sourceLang) {
      const result: Record<string, string> = {};
      texts.forEach(text => { result[text] = text; });
      return result;
    }

    const cacheKey = `${sourceLang}-${targetLang}`;
    if (!globalCache[cacheKey]) {
      globalCache[cacheKey] = {};
    }

    // Check what's already cached
    const uncachedTexts = texts.filter(text => !globalCache[cacheKey][text]);
    
    // Return cached if all available
    if (uncachedTexts.length === 0) {
      const result: Record<string, string> = {};
      texts.forEach(text => { result[text] = globalCache[cacheKey][text]; });
      return result;
    }

    // Create request key for deduplication
    const requestKey = `${cacheKey}:${uncachedTexts.sort().join('|')}`;
    
    // Check if same request is pending
    if (pendingRequests[requestKey]) {
      const pendingResult = await pendingRequests[requestKey];
      const result: Record<string, string> = {};
      texts.forEach(text => {
        result[text] = globalCache[cacheKey][text] || pendingResult[text] || text;
      });
      return result;
    }

    // Make API call
    setIsTranslating(true);
    
    const promise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('translate', {
          body: { texts: uncachedTexts, targetLang, sourceLang }
        });

        if (error) {
          console.error('Translation error:', error);
          // Return original texts on error
          const fallback: Record<string, string> = {};
          uncachedTexts.forEach(text => { fallback[text] = text; });
          return fallback;
        }

        const translations = data?.translations || {};
        
        // Update global cache
        Object.entries(translations).forEach(([key, value]) => {
          globalCache[cacheKey][key] = value as string;
        });

        return translations;
      } finally {
        delete pendingRequests[requestKey];
        setIsTranslating(false);
      }
    })();

    pendingRequests[requestKey] = promise;
    await promise;

    // Return combined result
    const result: Record<string, string> = {};
    texts.forEach(text => {
      result[text] = globalCache[cacheKey][text] || text;
    });
    return result;
  }, []);

  const translateSingle = useCallback(async (
    text: string,
    targetLang: string,
    sourceLang: string = 'vi'
  ): Promise<string> => {
    const result = await translateTexts([text], targetLang, sourceLang);
    return result[text] || text;
  }, [translateTexts]);

  const getCached = useCallback((
    text: string,
    targetLang: string,
    sourceLang: string = 'vi'
  ): string | null => {
    const cacheKey = `${sourceLang}-${targetLang}`;
    return globalCache[cacheKey]?.[text] || null;
  }, []);

  return {
    translateTexts,
    translateSingle,
    getCached,
    isTranslating,
  };
}
