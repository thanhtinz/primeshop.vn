import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting wishlist flash sale notification process...");

    // Get active flash sales with their items
    const { data: flashSaleItems, error: flashSaleError } = await supabase
      .from("flash_sale_items")
      .select(`
        id,
        product_id,
        sale_price,
        original_price,
        discount_percent,
        flash_sale:flash_sales!inner(id, name, is_active, start_date, end_date),
        product:products(id, name, slug, image_url)
      `)
      .eq("flash_sales.is_active", true);

    if (flashSaleError) {
      console.error("Error fetching flash sale items:", flashSaleError);
      throw flashSaleError;
    }

    console.log(`Found ${flashSaleItems?.length || 0} flash sale items`);

    if (!flashSaleItems || flashSaleItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active flash sales found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const productIds = flashSaleItems.map(item => item.product_id);

    // Get wishlist items with notify_on_sale enabled
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from("wishlist")
      .select("id, user_id, product_id, notify_on_sale")
      .in("product_id", productIds)
      .eq("notify_on_sale", true);

    if (wishlistError) {
      console.error("Error fetching wishlist items:", wishlistError);
      throw wishlistError;
    }

    console.log(`Found ${wishlistItems?.length || 0} wishlist items with notifications enabled`);

    if (!wishlistItems || wishlistItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No wishlist items with notifications enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userIds = [...new Set(wishlistItems.map(item => item.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_url"]);

    const siteName = siteSettings?.find(s => s.key === "site_name")?.value || "DigiShop";
    const siteUrl = siteSettings?.find(s => s.key === "site_url")?.value || "https://your-site.com";

    let sentCount = 0;
    const errors: string[] = [];

    for (const wishlistItem of wishlistItems) {
      const profile = profileMap.get(wishlistItem.user_id);
      if (!profile?.email) continue;

      const flashSaleItem = flashSaleItems.find(item => item.product_id === wishlistItem.product_id);
      if (!flashSaleItem) continue;

      const product = flashSaleItem.product as any;
      const flashSale = flashSaleItem.flash_sale as any;

      console.log(`Sending notification to ${profile.email} for product ${product?.name}`);

      try {
        // Send email via Resend API
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${siteName} <hotro@primeshop.vn>`,
            to: [profile.email],
            subject: `🔥 Flash Sale! ${product?.name} đang giảm ${flashSaleItem.discount_percent}%`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
                  <h1 style="color: #ef4444; margin: 0;">🔥 FLASH SALE 🔥</h1>
                  <p style="color: #666; margin-top: 10px;">Sản phẩm yêu thích của bạn đang giảm giá!</p>
                </div>
                <div style="padding: 30px 0;">
                  <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    ${product?.image_url ? `<img src="${product.image_url}" alt="${product?.name}" style="width: 100%; max-width: 200px; border-radius: 8px; margin-bottom: 15px;">` : ""}
                    <h2 style="margin: 0 0 10px 0; color: #1f2937;">${product?.name}</h2>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                      <span style="text-decoration: line-through; color: #9ca3af; font-size: 14px;">${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(flashSaleItem.original_price)}</span>
                      <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">-${flashSaleItem.discount_percent}%</span>
                    </div>
                    <p style="font-size: 24px; font-weight: bold; color: #ef4444; margin: 10px 0;">${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(flashSaleItem.sale_price)}</p>
                  </div>
                  <div style="text-align: center;">
                    <a href="${siteUrl}/product/${product?.slug}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Mua ngay</a>
                  </div>
                  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">⏰ Flash Sale: ${flashSale?.name}</p>
                </div>
                <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                  <p>Bạn nhận được email này vì đã bật thông báo giảm giá cho sản phẩm này trong danh sách yêu thích.</p>
                  <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errorText = await emailRes.text();
          throw new Error(errorText);
        }

        console.log(`Email sent to ${profile.email}`);
        sentCount++;

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: wishlistItem.user_id,
          type: "flash_sale",
          title: "Flash Sale - Sản phẩm yêu thích",
          message: `${product?.name} đang giảm ${flashSaleItem.discount_percent}%! Giá chỉ còn ${new Intl.NumberFormat("vi-VN").format(flashSaleItem.sale_price)}đ`,
          link: `/product/${product?.slug}`,
        });

      } catch (emailError: any) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        errors.push(`${profile.email}: ${emailError.message}`);
      }
    }

    console.log(`Sent ${sentCount} notifications successfully`);

    return new Response(
      JSON.stringify({ message: `Sent ${sentCount} flash sale notifications`, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in notify-wishlist-flash-sale:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
