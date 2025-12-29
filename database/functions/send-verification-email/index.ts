import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  fullName?: string;
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
    console.error('[send-verification-email] SMTP error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'SMTP error' };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: VerificationEmailRequest = await req.json();

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code in database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Delete any existing codes for this email
    await supabaseAdmin
      .from("email_verification_codes")
      .delete()
      .eq("email", email);

    // Insert new verification code
    const { error: insertError } = await supabaseAdmin
      .from("email_verification_codes")
      .insert({
        email,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Get SMTP settings
    const { data: settings } = await supabaseAdmin
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${siteName}</h1>
          </div>
          
          <h2 style="color: #18181b; margin: 0 0 16px; font-size: 24px; text-align: center;">
            Xác minh email của bạn
          </h2>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
            ${fullName ? `Xin chào ${fullName},` : 'Xin chào,'}<br>
            Cảm ơn bạn đã đăng ký! Đây là mã xác minh của bạn:
          </p>
          
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
              ${verificationCode}
            </span>
          </div>
          
          <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0 0 24px;">
            Mã này sẽ hết hạn sau <strong>15 phút</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
          </p>
        </div>
      </body>
      </html>
    `;

    const textContent = `Xin chào${fullName ? ` ${fullName}` : ''},\n\nCảm ơn bạn đã đăng ký! Mã xác minh của bạn là: ${verificationCode}\n\nMã này sẽ hết hạn sau 15 phút.\n\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.`;

    const result = await sendViaSMTP(
      fromEmail,
      siteName,
      email,
      `Xác minh email của bạn - ${siteName}`,
      htmlContent,
      textContent,
      smtpConfig
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log("[send-verification-email] Email sent successfully via SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-verification-email] Error:", errorMessage);
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
