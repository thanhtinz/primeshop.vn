import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

/**
 * Hook tiện ích cho việc sử dụng translations trong toàn app
 * Bao gồm cả các helper functions cho toast messages
 */
export const useAppTranslation = () => {
  const { t, language, translateText, translateBatch, isTranslating } = useLanguage();

  // Toast helpers với auto-translation
  const showSuccess = useCallback((key: string, fallback?: string) => {
    const message = t(key) || fallback || key;
    toast.success(message);
  }, [t]);

  const showError = useCallback((key: string, fallback?: string) => {
    const message = t(key) || fallback || key;
    toast.error(message);
  }, [t]);

  const showInfo = useCallback((key: string, fallback?: string) => {
    const message = t(key) || fallback || key;
    toast.info(message);
  }, [t]);

  const showLoading = useCallback((key: string, fallback?: string) => {
    const message = t(key) || fallback || key;
    return toast.loading(message);
  }, [t]);

  // Format template strings với variables
  const formatText = useCallback((key: string, variables?: Record<string, string | number>): string => {
    let text = t(key);
    if (variables) {
      Object.entries(variables).forEach(([varKey, value]) => {
        text = text.replace(new RegExp(`{${varKey}}`, 'g'), String(value));
      });
    }
    return text;
  }, [t]);

  return {
    t,
    formatText,
    language,
    translateText,
    translateBatch,
    isTranslating,
    // Toast helpers
    showSuccess,
    showError,
    showInfo,
    showLoading,
    // Convenience
    isEnglish: language === 'en',
    isVietnamese: language === 'vi',
  };
};

// Translation keys cho toast messages thường dùng
export const TOAST_KEYS = {
  // Success messages
  SUCCESS: 'success',
  SAVED: 'updateSuccess',
  CREATED: 'actionSuccess',
  DELETED: 'actionSuccess',
  COPIED: 'copied',
  SENT: 'messageSent',
  UPDATED: 'updateSuccess',
  
  // Error messages  
  ERROR: 'error',
  FAILED: 'actionFailed',
  NOT_FOUND: 'noResults',
  UNAUTHORIZED: 'pleaseLogin',
  NETWORK_ERROR: 'tryAgainLater',
  
  // Loading messages
  LOADING: 'loading',
  PROCESSING: 'processing',
  SAVING: 'saving',
  SUBMITTING: 'submitting',
  CREATING: 'creating',
  
  // Common actions
  LOGIN_REQUIRED: 'pleaseLogin',
  CONFIRM_DELETE: 'confirmDelete',
  PAYMENT_SUCCESS: 'paymentSuccess',
  PAYMENT_ERROR: 'paymentError',
  ORDER_SUCCESS: 'orderSuccess',
  ORDER_ERROR: 'orderError',
  
  // Validation
  REQUIRED_FIELD: 'required',
  INVALID_EMAIL: 'emailInvalid',
  PASSWORD_MIN_LENGTH: 'passwordMinLength',
} as const;

export default useAppTranslation;
