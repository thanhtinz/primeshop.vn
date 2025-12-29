import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  template_name?: string;
  recipient: string;
  recipient_user_id?: string;
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
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background-color: #f8fafc;
    }
    
    .email-wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    
    .email-container {
      background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 40px;
      text-align: center;
    }
    
    .logo { font-size: 28px; font-weight: 700; color: #ffffff; }
    .email-body { padding: 40px; }
    .email-content { font-size: 15px; color: #334155; line-height: 1.8; }
    .email-content p { margin: 0 0 16px 0; }
    
    .highlight-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #3b82f6;
    }
    
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    
    .email-footer {
      background: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text { font-size: 13px; color: #64748b; }
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
        <p class="footer-text">© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Convert plain text to HTML paragraphs
const formatBodyToHTML = (body: string): string => {
  return body
    .split('\n\n')
    .map(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';
      
      // Check for highlight boxes (lines starting with special chars)
      if (trimmed.startsWith('Mã') || trimmed.startsWith('Code') || trimmed.includes(':')) {
        const lines = trimmed.split('\n').filter(l => l.trim());
        if (lines.length > 1 || trimmed.includes(':')) {
          return `<div class="highlight-box">${lines.map(l => `<p>${l}</p>`).join('')}</div>`;
        }
      }
      
      // Check for links
      if (trimmed.includes('http://') || trimmed.includes('https://')) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const withLinks = trimmed.replace(urlRegex, '<a href="$1" class="btn">Xem chi tiết</a>');
        return `<p>${withLinks}</p>`;
      }
      
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p)
    .join('');
};

// Get or create system mailbox for sending automated emails
const getOrCreateSystemMailbox = async (supabaseClient: any, siteName: string) => {
  // Get default domain
  const { data: defaultDomain } = await supabaseClient
    .from('mail_domains')
    .select('id, domain')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (!defaultDomain) {
    console.log('[send-email] No default mail domain found');
    return null;
  }

  const systemEmail = `noreply@${defaultDomain.domain}`;
  
  // Check if system mailbox exists
  let { data: mailbox } = await supabaseClient
    .from('mailboxes')
    .select('id, email_address, display_name')
    .eq('email_address', systemEmail)
    .single();

  if (!mailbox) {
    // Create system mailbox
    const { data: newMailbox, error } = await supabaseClient
      .from('mailboxes')
      .insert({
        email_address: systemEmail,
        display_name: siteName,
        domain_id: defaultDomain.id,
        local_part: 'noreply',
        role: 'super_admin',
        is_active: true,
        can_send_external: true,
        can_receive_external: false,
        quota_mb: 10240, // 10GB
      })
      .select()
      .single();

    if (error) {
      console.error('[send-email] Failed to create system mailbox:', error);
      return null;
    }
    
    mailbox = newMailbox;
    console.log('[send-email] Created system mailbox:', systemEmail);
  }

  return mailbox;
};

// Deliver email to recipient's mailbox
const deliverToMailbox = async (
  supabaseClient: any,
  systemMailbox: any,
  recipientEmail: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  templateName?: string
) => {
  // Get system mailbox's sent folder
  let { data: sentFolder } = await supabaseClient
    .from('mail_folders')
    .select('id')
    .eq('mailbox_id', systemMailbox.id)
    .eq('slug', 'sent')
    .single();

  if (!sentFolder) {
    // Create sent folder if not exists
    const { data: newFolder } = await supabaseClient
      .from('mail_folders')
      .insert({
        mailbox_id: systemMailbox.id,
        name: 'Đã gửi',
        slug: 'sent',
        icon: 'send',
        position: 2,
        is_system: true,
      })
      .select()
      .single();
    sentFolder = newFolder;
  }

  // Generate message ID
  const messageId = `<${crypto.randomUUID()}@${systemMailbox.email_address.split('@')[1]}>`;
  const preview = textBody.substring(0, 200);

  // Create message in system's sent folder
  const { data: sentMessage, error: sentError } = await supabaseClient
    .from('mail_messages')
    .insert({
      mailbox_id: systemMailbox.id,
      folder_id: sentFolder?.id,
      message_id: messageId,
      from_address: systemMailbox.email_address,
      from_name: systemMailbox.display_name || 'System',
      to_addresses: [{ email: recipientEmail }],
      subject,
      body_text: textBody,
      body_html: htmlBody,
      preview,
      priority: 'normal',
      is_sent: true,
      is_read: true,
      sent_at: new Date().toISOString(),
      metadata: { template_name: templateName, type: 'system_notification' },
    })
    .select()
    .single();

  if (sentError) {
    console.error('[send-email] Failed to save sent message:', sentError);
  }

  // Find recipient's mailbox and deliver to their inbox
  const { data: recipientMailbox } = await supabaseClient
    .from('mailboxes')
    .select('id')
    .eq('email_address', recipientEmail)
    .eq('is_active', true)
    .single();

  if (recipientMailbox) {
    // Get recipient's inbox folder
    const { data: inboxFolder } = await supabaseClient
      .from('mail_folders')
      .select('id')
      .eq('mailbox_id', recipientMailbox.id)
      .eq('slug', 'inbox')
      .single();

    if (inboxFolder) {
      // Deliver to recipient's inbox
      await supabaseClient.from('mail_messages').insert({
        mailbox_id: recipientMailbox.id,
        folder_id: inboxFolder.id,
        message_id: messageId,
        from_address: systemMailbox.email_address,
        from_name: systemMailbox.display_name || 'System',
        to_addresses: [{ email: recipientEmail }],
        subject,
        body_text: textBody,
        body_html: htmlBody,
        preview,
        priority: 'normal',
        is_read: false,
        received_at: new Date().toISOString(),
        metadata: { template_name: templateName, type: 'system_notification' },
      });

      console.log(`[send-email] Delivered to mailbox: ${recipientEmail}`);
      return { delivered: true, method: 'internal_mailbox' };
    }
  }

  // Recipient doesn't have internal mailbox
  console.log(`[send-email] Recipient ${recipientEmail} has no internal mailbox`);
  return { delivered: false, method: 'external_pending' };
};

// Send email externally via SMTP
const sendViaSMTP = async (
  from: string,
  fromName: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; error?: string }> => {
  const SMTP_HOST = Deno.env.get("SMTP_HOST");
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const SMTP_USER = Deno.env.get("SMTP_USER");
  const SMTP_PASS = Deno.env.get("SMTP_PASS");
  const SMTP_SECURE = Deno.env.get("SMTP_SECURE") === "true";
  
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('[send-email] SMTP not configured, skipping external delivery');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    // Import SMTPClient from denomailer
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
    
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_SECURE,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
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

    console.log(`[send-email] Email sent via SMTP to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('[send-email] SMTP error:', error);
    return { success: false, error: String(error) };
  }
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
      .in("key", ["site_name", "site_url", "support_email"]);

    const siteName = settings?.find((s: { key: string }) => s.key === "site_name")?.value || "DigiShop";
    const siteUrl = settings?.find((s: { key: string }) => s.key === "site_url")?.value || "";
    const supportEmail = settings?.find((s: { key: string }) => s.key === "support_email")?.value || "";

    // Get or create system mailbox
    const systemMailbox = await getOrCreateSystemMailbox(supabaseClient, String(siteName));
    
    if (!systemMailbox) {
      throw new Error("Mail server not configured. Please set up mail domains first.");
    }

    let subject: string;
    let htmlBody: string;
    let textBody: string;
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
      textBody = directHtml.replace(/<[^>]*>/g, '');
      const formattedContent = formatBodyToHTML(directHtml);
      htmlBody = generateEmailHTML(formattedContent, String(siteName));
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
        
        // Log failed attempt
        await supabaseClient.from("email_logs").insert({
          recipient,
          subject: `Template: ${template_name}`,
          template_name,
          status: "failed",
          error_message: `Template ${template_name} not found`,
        });

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
      textBody = emailBody;

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

    // Save to internal mail server (for admin to view)
    const deliveryResult = await deliverToMailbox(
      supabaseClient,
      systemMailbox,
      recipient,
      subject,
      htmlBody,
      textBody,
      template_name
    );

    // Send externally via SMTP if recipient doesn't have internal mailbox
    let smtpResult = { success: false, error: '' };
    if (!deliveryResult.delivered) {
      smtpResult = await sendViaSMTP(
        systemMailbox.email_address,
        systemMailbox.display_name || String(siteName),
        recipient,
        subject,
        htmlBody,
        textBody
      );
    }

    // Determine final status
    const finalStatus = deliveryResult.delivered || smtpResult.success ? "sent" : "failed";
    const deliveryMethod = deliveryResult.delivered 
      ? 'internal_mailbox' 
      : (smtpResult.success ? 'smtp' : 'failed');

    // Log to email_logs
    await supabaseClient.from("email_logs").insert({
      recipient,
      subject,
      template_name: template_name || 'direct_email',
      status: finalStatus,
      error_message: smtpResult.error || null,
      metadata: {
        delivery_method: deliveryMethod,
        delivered_to_mailbox: deliveryResult.delivered,
        smtp_sent: smtpResult.success,
        system_mailbox: systemMailbox.email_address,
      },
    });

    if (finalStatus === "failed") {
      console.log(`[send-email] Failed to send email to ${recipient}: ${smtpResult.error}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: smtpResult.error || 'Failed to send email',
          saved_to_mailserver: true,
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[send-email] Email sent successfully to ${recipient} via ${deliveryMethod}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          id: crypto.randomUUID(),
          method: deliveryMethod,
          delivered_to_mailbox: deliveryResult.delivered,
          smtp_sent: smtpResult.success,
        } 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
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
