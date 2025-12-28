import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Check if email format is valid
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check MX records to verify if domain can receive emails
async function checkMxRecords(domain: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`
    );
    const data = await response.json();
    return data.Answer && data.Answer.length > 0;
  } catch {
    return false;
  }
}

// Common disposable email domains
const disposableDomains = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'trashmail.com', 'fakeinbox.com', 'temp-mail.org',
  'getnada.com', 'mohmal.com', 'emailondeck.com', 'yopmail.com',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      throw new Error('Emails array is required');
    }

    if (emails.length > 50) {
      throw new Error('Maximum 50 emails per request');
    }

    console.log(`Checking ${emails.length} emails`);

    const results = await Promise.all(
      emails.map(async (email: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        
        // Check format validity
        if (!isValidEmail(trimmedEmail)) {
          return {
            email: trimmedEmail,
            status: 'die' as const,
            message: 'Invalid format',
          };
        }

        const domain = trimmedEmail.split('@')[1];

        // Check if disposable
        if (disposableDomains.some(d => domain.includes(d))) {
          return {
            email: trimmedEmail,
            status: 'die' as const,
            message: 'Disposable email',
          };
        }

        // Check MX records
        const hasMx = await checkMxRecords(domain);
        
        if (!hasMx) {
          return {
            email: trimmedEmail,
            status: 'die' as const,
            message: 'No MX records',
          };
        }

        // If all checks pass, mark as potentially live
        // Note: True verification would require SMTP connection
        return {
          email: trimmedEmail,
          status: 'live' as const,
          message: 'Valid domain with MX records',
        };
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Mail checker error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to check emails' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
