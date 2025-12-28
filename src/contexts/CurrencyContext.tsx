import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

type Currency = 'VND' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  formatPrice: (priceInVND: number) => string;
  convertToUSD: (priceInVND: number) => number;
  convertToVND: (priceInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('VND');
  const { data: exchangeRateSetting } = useSiteSetting('usd_exchange_rate');
  
  // Default exchange rate: 1 USD = 24,500 VND
  const exchangeRate = exchangeRateSetting ? Number(exchangeRateSetting) : 24500;

  const convertToUSD = useCallback((priceInVND: number) => {
    return priceInVND / exchangeRate;
  }, [exchangeRate]);

  const convertToVND = useCallback((priceInUSD: number) => {
    return priceInUSD * exchangeRate;
  }, [exchangeRate]);

  const formatPrice = useCallback((priceInVND: number) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN').format(priceInVND) + 'đ';
    } else {
      const usdPrice = convertToUSD(priceInVND);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(usdPrice);
    }
  }, [currency, convertToUSD]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      exchangeRate,
      formatPrice,
      convertToUSD,
      convertToVND,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
