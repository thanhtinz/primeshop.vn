import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  template_name?: string;
  recipient: string;
  variables?: Record<string, string>;
  language?: 'vi' | 'en';
  subject?: string;
  html?: string;
}

// Generate beautiful HTML email template
const generateEmailHTML = (content: string, siteName: string, preheader?: string): string => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${siteName}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background-color: #f8fafc;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .email-container {
      background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    
    .email-body {
      padding: 40px;
    }
    
    .email-content {
      font-size: 15px;
      color: #334155;
      line-height: 1.8;
    }
    
    .email-content p {
      margin: 0 0 16px 0;
    }
    
    .email-content p:last-child {
      margin-bottom: 0;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-left: 4px solid #0ea5e9;
      padding: 20px 24px;
      margin: 24px 0;
      border-radius: 0 12px 12px 0;
    }
    
    .highlight-box p {
      margin: 0;
      color: #0c4a6e;
      font-weight: 500;
    }
    
    .code-box {
      background: #1e293b;
      color: #f8fafc;
      padding: 16px 24px;
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 18px;
      letter-spacing: 4px;
      text-align: center;
      margin: 20px 0;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      transition: all 0.2s ease;
    }
    
    .button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 32px 0;
    }
    
    .email-footer {
      background: #f8fafc;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    
    .footer-text a {
      color: #667eea;
      text-decoration: none;
    }
    
    .social-links {
      margin: 16px 0;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #64748b;
      text-decoration: none;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 12px;
      }
      
      .email-header {
        padding: 24px 20px;
      }
      
      .email-body {
        padding: 24px 20px;
      }
      
      .email-footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <span class="logo">${siteName}</span>
      </div>
      <div class="email-body">
        <div class="email-content">
          ${content}
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">
          © ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
        <p class="footer-text" style="margin-top: 8px;">
          Email này được gửi tự động, vui lòng không trả lời trực tiếp.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Convert plain text body to HTML paragraphs with smart formatting
const formatBodyToHTML = (body: string): string => {
  // Split by lines and process each
  const lines = body.split('\n');
  let html = '';
  let inList = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }
    
    // Check if it's a list item (starts with - or •)
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (!inList) {
        html += '<ul style="margin: 16px 0; padding-left: 20px;">';
        inList = true;
      }
      html += `<li style="margin: 8px 0; color: #334155;">${trimmed.slice(1).trim()}</li>`;
    }
    // Check for special blocks (code/OTP format)
    else if (/^\d{4,8}$/.test(trimmed) || /^[A-Z0-9]{6,}$/.test(trimmed)) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<div class="code-box">${trimmed}</div>`;
    }
    // Check for key-value pairs (contains : in middle)
    else if (trimmed.includes(':') && !trimmed.startsWith('http')) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      if (value) {
        html += `<p style="margin: 8px 0;"><strong style="color: #1e293b;">${key}:</strong> ${value}</p>`;
      } else {
        html += `<p style="margin: 16px 0 8px 0;"><strong style="color: #1e293b; font-size: 16px;">${key}</strong></p>`;
      }
    }
    // Regular paragraph
    else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Check if it's a greeting or signature
      if (trimmed.startsWith('Xin chào') || trimmed.startsWith('Hello') || trimmed.startsWith('Hi ')) {
        html += `<p style="margin: 0 0 24px 0; font-size: 16px; color: #1e293b;">${trimmed}</p>`;
      } else if (trimmed.startsWith('Trân trọng') || trimmed.startsWith('Best regards') || trimmed.startsWith('Regards')) {
        html += `<p style="margin: 32px 0 0 0; color: #64748b;">${trimmed}</p>`;
      } else {
        html += `<p style="margin: 0 0 16px 0;">${trimmed}</p>`;
      }
    }
  }
  
  if (inList) {
    html += '</ul>';
  }
  
  return html;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SendEmailRequest = await req.json();
    const { template_name, recipient, variables, language = 'vi', subject: directSubject, html: directHtml } = body;

    console.log(`[send-email] Starting email to: ${recipient}, template: ${template_name || 'direct'}, language: ${language}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get site settings
    const { data: settings } = await supabaseClient
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "smtp_from", "site_url", "support_email"]);

    const siteName = settings?.find((s: { key: string; value: unknown }) => s.key === "site_name")?.value || "DigiShop";
    const smtpFrom = settings?.find((s: { key: string; value: unknown }) => s.key === "smtp_from")?.value || "onboarding@resend.dev";
    const siteUrl = settings?.find((s: { key: string; value: unknown }) => s.key === "site_url")?.value || "";
    const supportEmail = settings?.find((s: { key: string; value: unknown }) => s.key === "support_email")?.value || "";

    let subject: string;
    let htmlBody: string;
    let preheader: string | undefined;

    // Always add common variables
    const commonVariables = {
      site_name: String(siteName),
      site_url: String(siteUrl),
      support_email: String(supportEmail),
      current_year: new Date().getFullYear().toString(),
      date: new Date().toLocaleString(language === 'en' ? 'en-US' : 'vi-VN'),
    };

    if (directSubject && directHtml) {
      // Direct email
      subject = directSubject;
      const formattedContent = formatBodyToHTML(directHtml);
      htmlBody = generateEmailHTML(formattedContent, String(siteName));
      
      await supabaseClient.from("email_logs").insert({
        recipient,
        subject,
        template_name: template_name || 'direct_email',
        status: "pending",
      });
    } else if (template_name) {
      // Template-based email
      const { data: template, error: templateError } = await supabaseClient
        .from("email_templates")
        .select("*")
        .eq("name", template_name)
        .eq("is_active", true)
        .single();

      if (templateError || !template) {
        console.log(`[send-email] Template ${template_name} not found or inactive`);
        return new Response(
          JSON.stringify({ error: `Template ${template_name} not found` }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Choose content based on language preference
      const useEnglish = language === 'en';
      subject = (useEnglish && template.subject_en) ? template.subject_en : template.subject;
      let emailBody = (useEnglish && template.body_en) ? template.body_en : template.body;

      // Merge all variables
      const allVariables = { ...commonVariables, ...variables };

      // Replace variables in subject and body
      for (const [key, value] of Object.entries(allVariables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        subject = subject.replace(regex, String(value));
        emailBody = emailBody.replace(regex, String(value));
      }

      // Extract first line as preheader
      const firstLine = emailBody.split('\n').find((l: string) => l.trim());
      preheader = firstLine?.substring(0, 100);

      // Convert body to HTML and wrap in template
      const formattedContent = formatBodyToHTML(emailBody);
      htmlBody = generateEmailHTML(formattedContent, String(siteName), preheader);
      
      console.log(`[send-email] Template loaded: ${template_name}, subject: ${subject}`);
    } else {
      return new Response(
        JSON.stringify({ error: "Either template_name or subject/html is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${siteName} <${smtpFrom}>`,
        to: [recipient],
        subject: subject,
        html: htmlBody,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error(`[send-email] Resend API error:`, emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log(`[send-email] Email sent successfully to ${recipient}:`, emailData);

    // Log as sent
    await supabaseClient.from("email_logs").insert({
      recipient,
      subject,
      template_name: template_name || 'direct_email',
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-email] Error:", errorMessage);

    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const body = await req.clone().json().catch(() => ({}));
      await supabaseClient.from("email_logs").insert({
        recipient: body.recipient || "unknown",
        subject: body.subject || "Error sending email",
        template_name: body.template_name || "unknown",
        status: "failed",
        error_message: errorMessage,
      });
    } catch (logError) {
      console.error("[send-email] Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
