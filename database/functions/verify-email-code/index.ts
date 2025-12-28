import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the verification code
    const { data: verificationData, error: fetchError } = await supabaseAdmin
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .is("verified_at", null)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !verificationData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Mã xác minh không hợp lệ hoặc đã hết hạn" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark code as verified
    await supabaseAdmin
      .from("email_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verificationData.id);

    // Update user's email_confirmed_at using admin API
    // Use getUserByEmail to efficiently find the user without listing all users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();
    
    if (userError) {
      console.error("Error finding user profile:", userError);
    }
    
    if (userData?.user_id) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.user_id, {
        email_confirm: true
      });
      
      if (updateError) {
        console.error("Error confirming email:", updateError);
      }
    } else {
      console.error("User profile not found for email:", email);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-email-code function:", error);
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
