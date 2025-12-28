import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
}

interface NotificationPayload {
  type: 'new_order' | 'payment_success' | 'payment_failed' | 'new_referral_registration' | 'reward_request' | 'order_status_change' | 'topup_success' | 'topup_failed';
  data: Record<string, any>;
}

const COLORS = {
  new_order: 0x3498db,        // Blue
  payment_success: 0x2ecc71,   // Green
  payment_failed: 0xe74c3c,    // Red
  new_referral_registration: 0x9b59b6, // Purple
  reward_request: 0xf1c40f,    // Yellow
  order_status_change: 0xe67e22, // Orange
  topup_success: 0x1abc9c,     // Teal
  topup_failed: 0xc0392b       // Dark Red
};

const EMOJIS = {
  new_order: '🛒',
  payment_success: '✅',
  payment_failed: '❌',
  new_referral_registration: '👤',
  reward_request: '🎁',
  order_status_change: '📦',
  topup_success: '🎮',
  topup_failed: '⚠️'
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function buildEmbed(payload: NotificationPayload): DiscordEmbed {
  const { type, data } = payload;
  
  switch (type) {
    case 'new_order':
      return {
        title: `${EMOJIS.new_order} Đơn hàng mới`,
        color: COLORS.new_order,
        fields: [
          { name: 'Mã đơn', value: data.order_number || 'N/A', inline: true },
          { name: 'Khách hàng', value: data.customer_email || 'N/A', inline: true },
          { name: 'Sản phẩm', value: data.product_name || 'N/A', inline: false },
          { name: 'Gói', value: data.package_name || 'N/A', inline: true },
          { name: 'Tổng tiền', value: formatCurrency(data.total_amount || 0), inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };
      
    case 'payment_success':
      return {
        title: `${EMOJIS.payment_success} Thanh toán thành công`,
        color: COLORS.payment_success,
        fields: [
          { name: 'Mã đơn', value: data.order_number || 'N/A', inline: true },
          { name: 'Số tiền', value: formatCurrency(data.amount || 0), inline: true },
          { name: 'Khách hàng', value: data.customer_email || 'N/A', inline: false },
          { name: 'Mã thanh toán', value: data.payment_id || 'N/A', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };
      
    case 'payment_failed':
      return {
        title: `${EMOJIS.payment_failed} Thanh toán thất bại`,
        color: COLORS.payment_failed,
        fields: [
          { name: 'Mã đơn', value: data.order_number || 'N/A', inline: true },
          { name: 'Số tiền', value: formatCurrency(data.amount || 0), inline: true },
          { name: 'Khách hàng', value: data.customer_email || 'N/A', inline: false },
          { name: 'Lý do', value: data.reason || 'Không rõ', inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };
      
    case 'new_referral_registration':
      return {
        title: `${EMOJIS.new_referral_registration} Đăng ký CTV mới`,
        color: COLORS.new_referral_registration,
        fields: [
          { name: 'Họ tên', value: data.full_name || 'N/A', inline: true },
          { name: 'Email', value: data.email || 'N/A', inline: true },
          { name: 'SĐT', value: data.phone || 'N/A', inline: true },
          { name: 'Ghi chú', value: data.note || 'Không có', inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };
      
    case 'reward_request':
      return {
        title: `${EMOJIS.reward_request} Yêu cầu đổi thưởng`,
        color: COLORS.reward_request,
        fields: [
          { name: 'Email CTV', value: data.email || 'N/A', inline: true },
          { name: 'Mã giới thiệu', value: data.referral_code || 'N/A', inline: true },
          { name: 'Số tiền yêu cầu', value: formatCurrency(data.amount || 0), inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };
      
    case 'order_status_change':
      return {
        title: `${EMOJIS.order_status_change} Cập nhật trạng thái đơn`,
        color: COLORS.order_status_change,
        fields: [
          { name: 'Mã đơn', value: data.order_number || 'N/A', inline: true },
          { name: 'Trạng thái mới', value: data.new_status || 'N/A', inline: true },
          { name: 'Khách hàng', value: data.customer_email || 'N/A', inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };

    case 'topup_success':
      return {
        title: `${EMOJIS.topup_success} Nạp game thành công`,
        color: COLORS.topup_success,
        fields: [
          { name: 'Mã đơn', value: data.order_number || 'N/A', inline: true },
          { name: 'Mã Naperis', value: data.naperis_order_id || 'N/A', inline: true },
          { name: 'Sản phẩm', value: data.product_name || 'N/A', inline: false },
          { name: 'Gói', value: data.package_name || 'N/A', inline: true },
          { name: 'Khách hàng', value: data.customer_email || 'N/A', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo' }
      };

    case 'topup_failed':
      return {
        title: `${EMOJIS.topup_failed} Nạp game thất bại`,
        color: COLORS.topup_failed,
        fields: [
          { name: 'Mã đơn', value: data.order_number || 'N/A', inline: true },
          { name: 'Sản phẩm', value: data.product_name || 'N/A', inline: true },
          { name: 'Khách hàng', value: data.customer_email || 'N/A', inline: false },
          { name: 'Lỗi', value: data.error || 'Không rõ', inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hệ thống thông báo - Cần xử lý thủ công' }
      };
      
    default:
      return {
        title: '📢 Thông báo',
        description: JSON.stringify(data),
        color: 0x95a5a6,
        timestamp: new Date().toISOString()
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Discord webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: NotificationPayload = await req.json();
    console.log('Received notification payload:', payload);

    const embed = buildEmbed(payload);

    const discordPayload = {
      embeds: [embed]
    };

    console.log('Sending to Discord:', discordPayload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', errorText);
      throw new Error(`Discord API error: ${response.status}`);
    }

    console.log('Discord notification sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
