import { useState, useEffect, useCallback } from 'react';
import { ProductWithRelations } from '@/hooks/useProducts';

const STORAGE_KEY = 'product_comparison';
const MAX_ITEMS = 4;

export interface ComparisonItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  accountInfo?: Record<string, any>;
  addedAt: number;
}

export const useProductComparison = () => {
  const [items, setItems] = useState<ComparisonItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
  }, []);

  const addItem = useCallback((product: ProductWithRelations | ComparisonItem) => {
    setItems(prev => {
      const productId = 'productId' in product ? product.productId : product.id;
      if (prev.some(i => i.productId === productId)) {
        return prev;
      }
      if (prev.length >= MAX_ITEMS) {
        return prev;
      }
      
      const newItem: ComparisonItem = 'productId' in product ? product : {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.image_url,
        price: product.price,
        accountInfo: product.account_info as Record<string, any>,
        addedAt: Date.now()
      };
      
      const updated = [...prev, newItem];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.productId !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return items.some(i => i.productId === productId);
  }, [items]);

  return { 
    items, 
    addItem, 
    removeItem, 
    clearAll, 
    isInComparison,
    canAdd: items.length < MAX_ITEMS,
    maxItems: MAX_ITEMS
  };
};
