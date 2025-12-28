import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  orderNumber: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
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

const generateInvoiceHTML = (order: any, siteSettings: Record<string, any>) => {
  const snapshot = order.product_snapshot;
  const siteName = siteSettings.site_name || 'Shop';
  const siteLogo = siteSettings.site_logo || '';
  const siteEmail = siteSettings.support_email || '';
  const sitePhone = siteSettings.company_phone || '';
  const siteAddress = siteSettings.company_address || '';

  const originalPrice = snapshot?.selectedPackage?.price || snapshot?.product?.price || order.subtotal;
  const quantity = snapshot?.quantity || 1;
  const subtotalAmount = originalPrice * quantity;
  const vipDiscountPercent = snapshot?.vipDiscount?.percent || 0;
  const vipDiscountAmount = snapshot?.vipDiscount?.amount || 0;
  const taxRate = Number(snapshot?.taxRate) || 0;
  const taxAmount = Number(snapshot?.taxAmount) || 0;
  const voucherDiscount = order.discount_amount || 0;

  const logoSection = siteLogo 
    ? `<img src="${siteLogo}" alt="${siteName}" style="height: 50px; width: auto; object-fit: contain;" />`
    : `<div style="width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📄</div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hóa đơn ${order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; color: white;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${logoSection}
              <h1 style="margin: 8px 0 0; font-size: 24px; font-weight: bold;">HÓA ĐƠN</h1>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${siteName}</p>
            </td>
            <td style="text-align: right;">
              <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold;">#${order.order_number}</p>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${formatDate(order.created_at)}</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px;">
        
        <!-- Info Sections -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                <h3 style="margin: 0 0 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">NGƯỜI BÁN</h3>
                <p style="margin: 0 0 4px; font-weight: bold; font-size: 16px; color: #111827;">${siteName}</p>
                ${siteEmail ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">📧 ${siteEmail}</p>` : ''}
                ${sitePhone ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">📞 ${sitePhone}</p>` : ''}
                ${siteAddress ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">📍 ${siteAddress}</p>` : ''}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                <h3 style="margin: 0 0 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">KHÁCH HÀNG</h3>
                <p style="margin: 0 0 4px; font-weight: bold; font-size: 16px; color: #111827;">${order.customer_name || order.customer_email.split('@')[0]}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">📧 ${order.customer_email}</p>
                ${order.customer_phone ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">📞 ${order.customer_phone}</p>` : ''}
                <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">💳 ${snapshot?.paymentMethod === 'balance' ? 'Số dư tài khoản' : 'PayOS'}</p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Product -->
        <h3 style="margin: 0 0 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">CHI TIẾT SẢN PHẨM</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="text-align: left; padding: 12px 16px; font-weight: 600; color: #374151;">Sản phẩm</th>
                <th style="text-align: center; padding: 12px 16px; font-weight: 600; color: #374151; width: 60px;">SL</th>
                <th style="text-align: right; padding: 12px 16px; font-weight: 600; color: #374151; width: 100px;">Đơn giá</th>
                <th style="text-align: right; padding: 12px 16px; font-weight: 600; color: #374151; width: 100px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 16px;">
                  <p style="margin: 0; font-weight: 600; color: #111827;">${snapshot?.product?.name || 'Sản phẩm'}</p>
                  ${snapshot?.selectedPackage?.name ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Gói: ${snapshot.selectedPackage.name}</p>` : ''}
                </td>
                <td style="padding: 16px; text-align: center; color: #374151;">${quantity}</td>
                <td style="padding: 16px; text-align: right; color: #374151;">${formatPrice(originalPrice)}</td>
                <td style="padding: 16px; text-align: right; font-weight: 600; color: #111827;">${formatPrice(subtotalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Price Summary -->
        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 280px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #f9fafb; padding: 12px 16px;">
                <h3 style="margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">TỔNG HỢP THANH TOÁN</h3>
              </div>
              <div style="padding: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Tạm tính</td>
                    <td style="padding: 4px 0; text-align: right; color: #111827;">${formatPrice(subtotalAmount)}</td>
                  </tr>
                  ${vipDiscountAmount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #10b981;">Giảm VIP (${vipDiscountPercent}%)</td>
                    <td style="padding: 4px 0; text-align: right; color: #10b981;">-${formatPrice(vipDiscountAmount)}</td>
                  </tr>
                  ` : ''}
                  ${voucherDiscount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #10b981;">Voucher ${order.voucher_code ? `(${order.voucher_code})` : ''}</td>
                    <td style="padding: 4px 0; text-align: right; color: #10b981;">-${formatPrice(voucherDiscount)}</td>
                  </tr>
                  ` : ''}
                  ${taxAmount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Thuế (${taxRate}%)</td>
                    <td style="padding: 4px 0; text-align: right; color: #111827;">+${formatPrice(taxAmount)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding-top: 12px; border-top: 1px solid #e5e7eb;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold; color: #111827;">Tổng thanh toán</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: bold; font-size: 18px; color: #2563eb;">${formatPrice(order.total_amount)}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>

        ${order.delivery_content ? `
        <!-- Delivery Content -->
        <div style="margin-top: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">NỘI DUNG GIAO HÀNG</h3>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px;">
            <pre style="margin: 0; font-family: monospace; font-size: 13px; color: #166534; white-space: pre-wrap; word-break: break-all;">${order.delivery_content}</pre>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">Cảm ơn bạn đã mua hàng!</p>
          ${siteEmail ? `<p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Nếu có thắc mắc, vui lòng liên hệ: <span style="font-weight: 500;">${siteEmail}</span></p>` : ''}
          <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">Hóa đơn được tạo tự động bởi ${siteName}</p>
        </div>

      </div>
    </div>
  </div>
</body>
</html>
`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumber }: InvoiceRequest = await req.json();

    if (!orderNumber) {
      throw new Error("orderNumber is required");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Fetch site settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("key, value");

    const siteSettings: Record<string, any> = {};
    settingsData?.forEach((item: any) => {
      siteSettings[item.key] = item.value;
    });

    // Generate HTML
    const html = generateInvoiceHTML(order, siteSettings);

    // Get sender email
    const fromEmail = siteSettings.smtp_from || "onboarding@resend.dev";
    const siteName = siteSettings.site_name || "Shop";

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${siteName} <${fromEmail}>`,
        to: [order.customer_email],
        subject: `Hóa đơn đơn hàng #${order.order_number}`,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Invoice email sent:", emailResult);

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
