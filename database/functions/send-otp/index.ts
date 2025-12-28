import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  otp: string;
  type: "enable_2fa" | "login_verify";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type }: SendOTPRequest = await req.json();

    console.log(`Sending OTP to ${email} for ${type}`);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const subject = type === "enable_2fa" 
      ? "Xác minh bật 2FA - Mã OTP của bạn"
      : "Xác minh đăng nhập - Mã OTP của bạn";

    const title = type === "enable_2fa"
      ? "Xác minh bật xác thực 2 bước"
      : "Xác minh đăng nhập";

    const description = type === "enable_2fa"
      ? "Bạn đang bật tính năng xác thực 2 bước cho tài khoản của mình."
      : "Có yêu cầu đăng nhập vào tài khoản của bạn từ thiết bị mới.";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 480px; margin: 40px auto; padding: 20px;">
          <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 16px; margin: 0 auto 16px;">
              </div>
              <h1 style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0;">
                ${title}
              </h1>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              ${description}
            </p>
            
            <div style="background: linear-gradient(135deg, #eff6ff, #f5f3ff); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #71717a; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
                Mã xác minh của bạn
              </p>
              <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #3b82f6;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #f59e0b; font-size: 12px; text-align: center; margin-bottom: 24px; padding: 12px; background: #fef3c7; border-radius: 8px;">
              ⚠️ Mã này sẽ hết hạn sau 10 phút. Không chia sẻ mã này với bất kỳ ai.
            </p>
            
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PrimeShop <hotro@primeshop.vn>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
