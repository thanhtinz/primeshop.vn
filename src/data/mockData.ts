import { Category, Product, Voucher, ReferralCode, Order, Payment } from '@/types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Phần mềm',
    slug: 'phan-mem',
    description: 'Các phần mềm hữu ích cho công việc và cuộc sống',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
  },
  {
    id: '2',
    name: 'Khóa học',
    slug: 'khoa-hoc',
    description: 'Khóa học trực tuyến chất lượng cao',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
  },
  {
    id: '3',
    name: 'Template',
    slug: 'template',
    description: 'Mẫu thiết kế chuyên nghiệp',
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400',
  },
  {
    id: '4',
    name: 'Tài liệu',
    slug: 'tai-lieu',
    description: 'Ebook và tài liệu chuyên ngành',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium VPN Lifetime',
    slug: 'premium-vpn-lifetime',
    description: 'Truy cập internet an toàn với VPN cao cấp. Bảo vệ dữ liệu cá nhân, truy cập nội dung bị giới hạn địa lý.',
    shortDescription: 'VPN cao cấp trọn đời',
    images: [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600',
      'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600',
    ],
    categoryId: '1',
    officialPrice: 999000,
    packages: [
      {
        id: 'p1-1',
        name: 'Cơ bản',
        price: 299000,
        description: '1 thiết bị',
        features: ['1 thiết bị', 'Băng thông không giới hạn', 'Hỗ trợ 24/7'],
      },
      {
        id: 'p1-2',
        name: 'Gia đình',
        price: 599000,
        description: '5 thiết bị',
        features: ['5 thiết bị', 'Băng thông không giới hạn', 'Hỗ trợ ưu tiên', 'Server riêng'],
      },
    ],
    customFields: [
      {
        id: 'cf1',
        name: 'Email nhận license',
        type: 'text',
        required: true,
        placeholder: 'email@example.com',
      },
    ],
    instructions: 'Sau khi thanh toán, bạn sẽ nhận được license key qua email trong vòng 5 phút.',
    warranty: 'Bảo hành trọn đời. Hoàn tiền trong 30 ngày nếu không hài lòng.',
    featured: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Khóa học React Pro',
    slug: 'khoa-hoc-react-pro',
    description: 'Khóa học React từ cơ bản đến nâng cao. Bao gồm hooks, redux, typescript và nhiều dự án thực tế.',
    shortDescription: 'Thành thạo React trong 30 ngày',
    images: [
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
      'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600',
    ],
    categoryId: '2',
    officialPrice: 3999000,
    packages: [
      {
        id: 'p2-1',
        name: 'Self-study',
        price: 799000,
        description: 'Tự học',
        features: ['50+ video bài giảng', 'Source code đầy đủ', 'Cập nhật miễn phí'],
      },
      {
        id: 'p2-2',
        name: 'Mentor 1-1',
        price: 2499000,
        description: 'Có mentor hỗ trợ',
        features: ['50+ video bài giảng', 'Source code đầy đủ', 'Mentor 1-1 (8 buổi)', 'Code review', 'Chứng chỉ'],
      },
    ],
    customFields: [],
    instructions: 'Link truy cập khóa học sẽ được gửi qua email sau khi thanh toán.',
    warranty: 'Truy cập trọn đời. Hoàn tiền 100% trong 7 ngày đầu.',
    featured: true,
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    name: 'Notion Template Business',
    slug: 'notion-template-business',
    description: 'Bộ template Notion chuyên nghiệp cho doanh nghiệp. Quản lý dự án, CRM, tài chính.',
    shortDescription: 'Template Notion all-in-one',
    images: [
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600',
    ],
    categoryId: '3',
    officialPrice: 799000,
    packages: [
      {
        id: 'p3-1',
        name: 'Starter',
        price: 199000,
        description: '5 templates',
        features: ['5 templates cơ bản', 'Hướng dẫn sử dụng', 'Cập nhật 6 tháng'],
      },
      {
        id: 'p3-2',
        name: 'Business',
        price: 499000,
        description: '20+ templates',
        features: ['20+ templates', 'Dashboard đầy đủ', 'Cập nhật trọn đời', 'Hỗ trợ setup'],
      },
    ],
    customFields: [
      {
        id: 'cf3',
        name: 'Email Notion của bạn',
        type: 'text',
        required: true,
        placeholder: 'email@example.com',
      },
    ],
    featured: true,
    createdAt: '2024-02-15',
  },
  {
    id: '4',
    name: 'Ebook Marketing Digital',
    slug: 'ebook-marketing-digital',
    description: 'Tổng hợp 500 trang kiến thức marketing digital từ cơ bản đến nâng cao.',
    shortDescription: '500 trang kiến thức marketing',
    images: [
      'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600',
    ],
    categoryId: '4',
    packages: [
      {
        id: 'p4-1',
        name: 'Ebook',
        price: 149000,
        description: 'File PDF',
        features: ['500 trang PDF', 'Checklist thực hành', 'Bonus templates'],
      },
    ],
    customFields: [],
    featured: false,
    createdAt: '2024-03-01',
  },
];

export const vouchers: Voucher[] = [
  {
    id: 'v1',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    maxUses: 100,
    usedCount: 45,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    active: true,
  },
  {
    id: 'v2',
    code: 'SAVE50K',
    type: 'fixed',
    value: 50000,
    maxUses: 50,
    usedCount: 20,
    minOrderAmount: 200000,
    validFrom: '2024-01-01',
    validTo: '2024-06-30',
    active: true,
  },
];

export const referralCodes: ReferralCode[] = [
  {
    id: 'r1',
    email: 'john@example.com',
    code: 'JOHN2024',
    totalOrders: 15,
    totalRevenue: 12500000,
    createdAt: '2024-01-01',
  },
];

export const sampleOrders: Order[] = [];
export const samplePayments: Payment[] = [];
