import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, ProductPackage } from '@/types';

interface FlashSalePriceInfo {
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
}

// Marketplace item in cart
export interface MarketplaceCartItem {
  id: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  accountInfo?: Record<string, any>;
}

// Applied voucher info
export interface AppliedVoucherInfo {
  id: string;
  code: string;
  type: 'system' | 'seller';
  sellerId?: string; // Only for seller vouchers
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  calculatedDiscount: number;
}

interface CartContextType {
  // System product items
  items: CartItem[];
  addToCart: (product: Product, packageItem: ProductPackage, customFieldValues: Record<string, string>, flashSalePrice?: FlashSalePriceInfo) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  
  // Marketplace items
  marketplaceItems: MarketplaceCartItem[];
  addMarketplaceItem: (item: Omit<MarketplaceCartItem, 'id'>) => void;
  removeMarketplaceItem: (itemId: string) => void;
  
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  systemItemsTotal: number;
  marketplaceItemsTotal: number;
  
  // Multiple vouchers support
  appliedVouchers: AppliedVoucherInfo[];
  addVoucher: (voucher: AppliedVoucherInfo) => void;
  removeVoucher: (voucherId: string) => void;
  getSystemVoucher: () => AppliedVoucherInfo | undefined;
  getSellerVoucher: (sellerId: string) => AppliedVoucherInfo | undefined;
  
  // Legacy support - single voucher code
  appliedVoucher: string;
  setAppliedVoucher: (code: string) => void;
  appliedReferralCode: string;
  setAppliedReferralCode: (code: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceCartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('marketplaceCart');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [appliedVouchers, setAppliedVouchers] = useState<AppliedVoucherInfo[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('appliedVouchers');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [appliedVoucher, setAppliedVoucher] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appliedVoucher') || '';
    }
    return '';
  });

  const [appliedReferralCode, setAppliedReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appliedReferralCode') || '';
    }
    return '';
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('marketplaceCart', JSON.stringify(marketplaceItems));
  }, [marketplaceItems]);

  useEffect(() => {
    localStorage.setItem('appliedVouchers', JSON.stringify(appliedVouchers));
  }, [appliedVouchers]);

  useEffect(() => {
    localStorage.setItem('appliedVoucher', appliedVoucher);
  }, [appliedVoucher]);

  useEffect(() => {
    localStorage.setItem('appliedReferralCode', appliedReferralCode);
  }, [appliedReferralCode]);

  const addToCart = (product: Product, packageItem: ProductPackage, customFieldValues: Record<string, string>, flashSalePrice?: FlashSalePriceInfo) => {
    const effectivePrice = flashSalePrice ? flashSalePrice.salePrice : packageItem.price;
    const packageWithFlashSale = flashSalePrice 
      ? { ...packageItem, price: effectivePrice, original_price: flashSalePrice.originalPrice }
      : packageItem;
    
    const newItem: CartItem = {
      id: `${product.id}-${packageItem.id}-${Date.now()}`,
      productId: product.id,
      product,
      packageId: packageItem.id,
      selectedPackage: packageWithFlashSale,
      customFieldValues,
      quantity: 1,
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Marketplace items
  const addMarketplaceItem = (item: Omit<MarketplaceCartItem, 'id'>) => {
    // Check if already in cart (marketplace items are unique)
    if (marketplaceItems.some(i => i.productId === item.productId)) {
      return;
    }
    const newItem: MarketplaceCartItem = {
      ...item,
      id: `mp-${item.productId}-${Date.now()}`,
    };
    setMarketplaceItems(prev => [...prev, newItem]);
  };

  const removeMarketplaceItem = (itemId: string) => {
    setMarketplaceItems(prev => prev.filter(item => item.id !== itemId));
    // Also remove any seller voucher for this seller if no more items from that seller
    const removedItem = marketplaceItems.find(i => i.id === itemId);
    if (removedItem) {
      const remainingFromSeller = marketplaceItems.filter(
        i => i.id !== itemId && i.sellerId === removedItem.sellerId
      );
      if (remainingFromSeller.length === 0) {
        setAppliedVouchers(prev => prev.filter(v => v.sellerId !== removedItem.sellerId));
      }
    }
  };

  const clearCart = () => {
    setItems([]);
    setMarketplaceItems([]);
    setAppliedVouchers([]);
    setAppliedVoucher('');
    setAppliedReferralCode('');
  };

  // Voucher management
  const addVoucher = (voucher: AppliedVoucherInfo) => {
    setAppliedVouchers(prev => {
      // Remove existing voucher of same type (system) or same seller
      const filtered = prev.filter(v => {
        if (voucher.type === 'system') return v.type !== 'system';
        return v.sellerId !== voucher.sellerId;
      });
      return [...filtered, voucher];
    });
  };

  const removeVoucher = (voucherId: string) => {
    setAppliedVouchers(prev => prev.filter(v => v.id !== voucherId));
  };

  const getSystemVoucher = () => appliedVouchers.find(v => v.type === 'system');
  const getSellerVoucher = (sellerId: string) => appliedVouchers.find(v => v.type === 'seller' && v.sellerId === sellerId);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0) + marketplaceItems.length;
  const systemItemsTotal = items.reduce(
    (sum, item) => sum + item.selectedPackage.price * item.quantity,
    0
  );
  const marketplaceItemsTotal = marketplaceItems.reduce(
    (sum, item) => sum + item.price,
    0
  );
  const totalAmount = systemItemsTotal + marketplaceItemsTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        marketplaceItems,
        addMarketplaceItem,
        removeMarketplaceItem,
        clearCart,
        totalItems,
        totalAmount,
        systemItemsTotal,
        marketplaceItemsTotal,
        appliedVouchers,
        addVoucher,
        removeVoucher,
        getSystemVoucher,
        getSellerVoucher,
        appliedVoucher,
        setAppliedVoucher,
        appliedReferralCode,
        setAppliedReferralCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
