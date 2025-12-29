import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

// Send email via SMTP
async function sendViaSMTP(
  from: string,
  fromName: string,
  to: string,
  subject: string,
  html: string,
  text: string,
  smtpConfig: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.smtp_host,
        port: Number(smtpConfig.smtp_port) || 587,
        tls: smtpConfig.smtp_secure === 'true',
        auth: {
          username: smtpConfig.smtp_user,
          password: smtpConfig.smtp_pass,
        },
      },
    });

    await client.send({
      from: { address: from, name: fromName },
      to: [{ address: to }],
      subject,
      content: text,
      html,
    });

    await client.close();
    return { success: true };
  } catch (error) {
    console.error('[send-otp] SMTP error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'SMTP error' };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type }: SendOTPRequest = await req.json();

    console.log(`[send-otp] Sending OTP to ${email} for ${type}`);

    // Create Supabase client to get SMTP settings
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get site settings including SMTP config
    const { data: settings } = await supabaseClient
      .from("site_settings")
      .select("key, value")
      .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure", "site_name"]);

    const smtpConfig: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      smtpConfig[s.key] = s.value;
    });

    if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_pass) {
      throw new Error("SMTP configuration is not complete");
    }

    const siteName = smtpConfig.site_name || "Shop";
    const fromEmail = smtpConfig.smtp_from || smtpConfig.smtp_user;

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

    const textContent = `${title}\n\n${description}\n\nMã xác minh của bạn: ${otp}\n\nMã này sẽ hết hạn sau 10 phút. Không chia sẻ mã này với bất kỳ ai.`;

    const result = await sendViaSMTP(
      fromEmail,
      siteName,
      email,
      subject,
      htmlContent,
      textContent,
      smtpConfig
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log("[send-otp] Email sent successfully via SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-otp] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
