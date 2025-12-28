import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Package, CheckCircle, Clock, XCircle, Truck, Loader2, FileText, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

type OrderStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_FAILED' | 'CANCELLED' | 'PROCESSING' | 'WAITING_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'REFUNDED' | 'EXPIRED';

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  product_snapshot: any;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  voucher_code: string | null;
  referral_code: string | null;
  delivery_content: string | null;
  notes: string | null;
  created_at: string;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Nháp', color: '#6b7280', icon: Clock },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#f59e0b', icon: Clock },
  PAID: { label: 'Đã thanh toán', color: '#10b981', icon: CheckCircle },
  PAYMENT_FAILED: { label: 'Thanh toán thất bại', color: '#ef4444', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', icon: XCircle },
  PROCESSING: { label: 'Đang xử lý', color: '#f59e0b', icon: Clock },
  WAITING_DELIVERY: { label: 'Chờ giao hàng', color: '#3b82f6', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: '#10b981', icon: CheckCircle },
  COMPLETED: { label: 'Hoàn tất', color: '#10b981', icon: CheckCircle },
  REFUNDED: { label: 'Hoàn tiền', color: '#6b7280', icon: XCircle },
  EXPIRED: { label: 'Hết hạn', color: '#ef4444', icon: XCircle },
};

const InvoicePage = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { data: siteSettings } = useSiteSettings();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderNumber) {
      loadOrder(orderNumber);
    }
  }, [orderNumber]);

  const loadOrder = async (orderNum: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNum)
        .single();

      if (error) throw error;
      setOrder(data as Order);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current || !order) return;
    
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `hoa-don-${order.order_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: 'avoid-all' }
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success('Đã tải xuống hóa đơn PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Không thể xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!order) return;
    
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-invoice', {
        body: { orderNumber: order.order_number }
      });

      if (error) throw error;
      toast.success('Đã gửi hóa đơn đến email ' + order.customer_email);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Không tìm thấy đơn hàng</h1>
            <p className="text-muted-foreground mb-6">
              Đơn hàng với mã "{orderNumber}" không tồn tại.
            </p>
            <Button onClick={() => navigate('/order-lookup')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại tra cứu
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const snapshot = order.product_snapshot;
  const status = statusConfig[order.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;

  // Calculate price breakdown from snapshot
  const originalPrice = snapshot?.selectedPackage?.price || snapshot?.product?.price || order.subtotal;
  const quantity = snapshot?.quantity || 1;
  const subtotalAmount = originalPrice * quantity;
  
  // VIP discount
  const vipDiscountPercent = snapshot?.vipDiscount?.percent || 0;
  const vipDiscountAmount = snapshot?.vipDiscount?.amount || 0;
  
  // Voucher discount
  const voucherDiscount = order.discount_amount || 0;
  
  // Tax - calculate from order data if not in snapshot
  const siteTaxRate = Number(siteSettings?.tax_rate) || 0;
  const taxRate = Number(snapshot?.taxRate) || siteTaxRate;
  const afterDiscountAmount = subtotalAmount - vipDiscountAmount - voucherDiscount;
  const taxAmount = Number(snapshot?.taxAmount) || (taxRate > 0 ? Math.round(afterDiscountAmount * taxRate / 100) : 0);
  
  // Calculate actual total with tax
  const calculatedTotal = afterDiscountAmount + taxAmount;

  // Site info
  const siteName = siteSettings?.site_name || 'Shop';
  const siteLogo = siteSettings?.site_logo;
  const siteEmail = siteSettings?.support_email || '';
  const sitePhone = siteSettings?.company_phone || '';
  const siteAddress = siteSettings?.company_address || '';

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        <div className="mx-auto max-w-4xl">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
            <Button variant="ghost" onClick={() => navigate('/order-lookup')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Gửi Email
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                In
              </Button>
              <Button size="sm" onClick={handleExportPDF} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Tải PDF
              </Button>
            </div>
          </div>

          {/* Invoice Content */}
          <div 
            ref={invoiceRef}
            className="bg-white text-black rounded-xl shadow-lg overflow-hidden print:shadow-none"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 md:px-8 py-6" style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {siteLogo ? (
                    <img 
                      src={siteLogo} 
                      alt={siteName} 
                      className="h-14 w-auto object-contain bg-white rounded-lg p-2"
                      style={{ maxWidth: '120px' }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
                      <FileText className="h-7 w-7" style={{ color: '#2563eb' }} />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">HÓA ĐƠN</h1>
                    <p className="text-white/80 text-sm">{siteName}</p>
                  </div>
                </div>
                <div className="text-white md:text-right">
                  <p className="font-mono font-bold text-xl">#{order.order_number}</p>
                  <p className="text-white/80 text-sm mt-1">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Status Badge */}
              <div className="flex justify-end mb-6">
                <span 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: status.color + '15', 
                    color: status.color,
                    border: `1px solid ${status.color}30`
                  }}
                >
                  <StatusIcon className="h-4 w-4" />
                  {status.label}
                </span>
              </div>

              {/* Two Column Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Seller Info */}
                <div className="border border-gray-200 rounded-xl p-5" style={{ borderColor: '#e5e7eb' }}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">THÔNG TIN NGƯỜI BÁN</h3>
                  <div className="space-y-2.5">
                    <p className="font-bold text-gray-900 text-lg">{siteName}</p>
                    {siteEmail && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {siteEmail}
                      </p>
                    )}
                    {sitePhone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {sitePhone}
                      </p>
                    )}
                    {siteAddress && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {siteAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border border-gray-200 rounded-xl p-5" style={{ borderColor: '#e5e7eb' }}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">THÔNG TIN KHÁCH HÀNG</h3>
                  <div className="space-y-2.5">
                    <p className="font-bold text-gray-900 text-lg">{order.customer_name || order.customer_email.split('@')[0]}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {order.customer_email}
                    </p>
                    {order.customer_phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {order.customer_phone}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      {snapshot?.paymentMethod === 'balance' ? 'Số dư tài khoản' : 'PayOS'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">CHI TIẾT SẢN PHẨM</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th className="text-left px-4 py-3 font-bold text-gray-700">Sản phẩm</th>
                        <th className="text-center px-4 py-3 font-bold text-gray-700 w-20">SL</th>
                        <th className="text-right px-4 py-3 font-bold text-gray-700 w-32">Đơn giá</th>
                        <th className="text-right px-4 py-3 font-bold text-gray-700 w-32">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-200" style={{ borderColor: '#e5e7eb' }}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {snapshot?.product?.image_url && (
                              <img 
                                src={snapshot.product.image_url} 
                                alt={snapshot.product.name}
                                className="w-14 h-14 object-cover rounded-lg shrink-0 border"
                                style={{ borderColor: '#e5e7eb' }}
                              />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{snapshot?.product?.name || 'Sản phẩm'}</p>
                              {snapshot?.selectedPackage?.name && (
                                <p className="text-xs text-gray-500 mt-0.5">Gói: {snapshot.selectedPackage.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-gray-700 font-medium">{quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-700">{formatPrice(originalPrice)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatPrice(subtotalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Custom Fields */}
                {snapshot?.customFieldValues && Object.keys(snapshot.customFieldValues).length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-xl p-4" style={{ borderColor: '#e5e7eb' }}>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">THÔNG TIN BỔ SUNG</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(snapshot.customFieldValues).map(([key, value]) => (
                        <div key={key} className="text-sm flex">
                          <span className="text-gray-500 min-w-[100px]">{key}:</span>
                          <span className="text-gray-900 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="flex justify-end mb-8">
                <div className="w-full md:w-96">
                  <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                    <div style={{ backgroundColor: '#f9fafb' }} className="px-5 py-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">TỔNG HỢP THANH TOÁN</h3>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tạm tính</span>
                        <span className="text-gray-900 font-medium">{formatPrice(subtotalAmount)}</span>
                      </div>
                      
                      {vipDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm" style={{ color: '#10b981' }}>
                          <span>Giảm VIP ({vipDiscountPercent}%)</span>
                          <span>-{formatPrice(vipDiscountAmount)}</span>
                        </div>
                      )}

                      {voucherDiscount > 0 && (
                        <div className="flex justify-between text-sm" style={{ color: '#10b981' }}>
                          <span>Voucher {order.voucher_code && `(${order.voucher_code})`}</span>
                          <span>-{formatPrice(voucherDiscount)}</span>
                        </div>
                      )}

                      {taxRate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Thuế ({taxRate}%)</span>
                          <span className="text-gray-900">+{formatPrice(taxAmount)}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-3 mt-3" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900 text-base">Tổng thanh toán</span>
                          <span className="font-bold text-xl" style={{ color: '#2563eb' }}>{formatPrice(calculatedTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Codes */}
                  {(order.voucher_code || order.referral_code) && (
                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                      {order.voucher_code && <p>Mã giảm giá: <span className="font-mono font-medium">{order.voucher_code}</span></p>}
                      {order.referral_code && <p>Mã giới thiệu: <span className="font-mono font-medium">{order.referral_code}</span></p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Content */}
              {order.delivery_content && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">NỘI DUNG GIAO HÀNG</h3>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="font-mono text-sm whitespace-pre-wrap break-all" style={{ color: '#166534' }}>{order.delivery_content}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">GHI CHÚ</h3>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-6 mt-8" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-700">Cảm ơn bạn đã mua hàng!</p>
                  {siteEmail && (
                    <p className="text-sm text-gray-500 mt-2">
                      Nếu có thắc mắc, vui lòng liên hệ: <span className="font-medium">{siteEmail}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-4">
                    Hóa đơn được tạo tự động bởi {siteName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .container, .container * {
            visibility: visible;
          }
          .container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default InvoicePage;
