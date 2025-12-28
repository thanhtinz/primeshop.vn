export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  style?: 'premium' | 'game_topup' | 'game_account' | 'design';
}

export interface ProductPackage {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  features: string[];
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select type
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  images: string[];
  image_url?: string;
  categoryId: string;
  category_id?: string;
  officialPrice?: number; // Giá chính hãng - để tính % giảm
  packages: ProductPackage[];
  customFields: CustomField[];
  custom_fields?: CustomField[];
  instructions?: string;
  warranty?: string;
  featured?: boolean;
  style?: 'premium' | 'game_topup' | 'game_account' | 'design' | 'default';
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  packageId: string;
  selectedPackage: ProductPackage;
  customFieldValues: Record<string, string>;
  quantity: number;
}

export type OrderStatus = 
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'PROCESSING'
  | 'WAITING_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'EXPIRED';

export interface Order {
  id: string;
  paymentId: string;
  email: string;
  productSnapshot: Product;
  packageSnapshot: ProductPackage;
  customFieldValues: Record<string, string>;
  status: OrderStatus;
  deliveryContent?: string;
  voucherCode?: string;
  referralCode?: string;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  email: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode?: string;
  referralCode?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  payosOrderId?: string;
  orders: Order[];
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  usedCount: number;
  minOrderAmount?: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface ReferralCode {
  id: string;
  email: string;
  code: string;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface RewardRequest {
  id: string;
  referralCodeId: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  voucherGenerated?: string;
  createdAt: string;
}
