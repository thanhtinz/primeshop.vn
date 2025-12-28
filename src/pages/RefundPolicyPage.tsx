import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { RotateCcw } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

export default function RefundPolicyPage() {
  const { data: siteName } = useSiteSetting('site_name');
  const { data: refundContentVi } = useSiteSetting('refund_content_vi');
  const { data: refundContentEn } = useSiteSetting('refund_content_en');
  const { data: refundLastUpdated } = useSiteSetting('refund_last_updated');
  const { language } = useLanguage();
  const displayName = String(siteName || 'DigiShop').replace(/"/g, '');

  const content = language === 'vi' ? refundContentVi : refundContentEn;

  const defaultContentVi = `
    <h2>1. Điều kiện hoàn tiền</h2>
    <p>Chúng tôi cam kết hoàn tiền trong các trường hợp sau:</p>
    <ul>
      <li>Sản phẩm không hoạt động hoặc lỗi kỹ thuật từ phía nhà cung cấp</li>
      <li>Thông tin sản phẩm không đúng với mô tả</li>
      <li>Giao dịch bị trùng lặp</li>
      <li>Sản phẩm đã được sử dụng trước khi giao cho khách hàng</li>
    </ul>
    
    <h2>2. Thời gian yêu cầu hoàn tiền</h2>
    <p>Khách hàng cần gửi yêu cầu hoàn tiền trong vòng 24 giờ kể từ khi nhận sản phẩm. Sau thời gian này, chúng tôi có quyền từ chối yêu cầu hoàn tiền.</p>
    
    <h2>3. Quy trình hoàn tiền</h2>
    <ol>
      <li>Liên hệ bộ phận hỗ trợ qua ticket hoặc live chat</li>
      <li>Cung cấp mã đơn hàng và lý do yêu cầu hoàn tiền</li>
      <li>Đợi xác nhận từ bộ phận hỗ trợ (trong vòng 24 giờ làm việc)</li>
      <li>Nhận tiền hoàn về tài khoản trong 1-3 ngày làm việc</li>
    </ol>
    
    <h2>4. Phương thức hoàn tiền</h2>
    <p>Tiền sẽ được hoàn về số dư tài khoản trên ${displayName}. Khách hàng có thể sử dụng số dư này để mua các sản phẩm khác hoặc yêu cầu rút tiền.</p>
    
    <h2>5. Trường hợp không được hoàn tiền</h2>
    <ul>
      <li>Sản phẩm đã được sử dụng hoặc kích hoạt thành công</li>
      <li>Khách hàng cung cấp thông tin sai lệch</li>
      <li>Yêu cầu hoàn tiền sau 24 giờ</li>
      <li>Vi phạm điều khoản sử dụng</li>
    </ul>
    
    <h2>6. Liên hệ</h2>
    <p>Nếu có bất kỳ thắc mắc nào về chính sách hoàn tiền, vui lòng liên hệ:</p>
    <ul>
      <li>Email: support@${displayName.toLowerCase()}.com</li>
      <li>Ticket hỗ trợ: Tạo ticket tại trang Hỗ trợ</li>
    </ul>
  `;

  const defaultContentEn = `
    <h2>1. Refund Conditions</h2>
    <p>We commit to refunds in the following cases:</p>
    <ul>
      <li>Product does not work or has technical issues from the provider</li>
      <li>Product information does not match the description</li>
      <li>Duplicate transactions</li>
      <li>Product was used before delivery to customer</li>
    </ul>
    
    <h2>2. Refund Request Timeline</h2>
    <p>Customers must submit a refund request within 24 hours of receiving the product. After this time, we reserve the right to reject refund requests.</p>
    
    <h2>3. Refund Process</h2>
    <ol>
      <li>Contact support via ticket or live chat</li>
      <li>Provide order number and reason for refund</li>
      <li>Wait for confirmation from support (within 24 business hours)</li>
      <li>Receive refund to your account within 1-3 business days</li>
    </ol>
    
    <h2>4. Refund Method</h2>
    <p>Funds will be refunded to your ${displayName} account balance. You can use this balance to purchase other products or request a withdrawal.</p>
    
    <h2>5. Non-refundable Cases</h2>
    <ul>
      <li>Product has been used or successfully activated</li>
      <li>Customer provides false information</li>
      <li>Refund request after 24 hours</li>
      <li>Violation of terms of service</li>
    </ul>
    
    <h2>6. Contact</h2>
    <p>If you have any questions about the refund policy, please contact:</p>
    <ul>
      <li>Email: support@${displayName.toLowerCase()}.com</li>
      <li>Support ticket: Create a ticket on the Support page</li>
    </ul>
  `;

  const rawContent = content ? String(content) : (language === 'vi' ? defaultContentVi : defaultContentEn);
  const displayContent = sanitizeHtml(rawContent);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {language === 'vi' ? 'Chính sách hoàn tiền' : 'Refund Policy'}
            </h1>
            {refundLastUpdated && (
              <p className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Cập nhật lần cuối: ' : 'Last updated: '}
                {new Date(String(refundLastUpdated)).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl border p-6 md:p-10">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:text-foreground
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                prose-li:my-1
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
