import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [] }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Bạn là công cụ gợi ý tìm kiếm cho cửa hàng game và dịch vụ số. 
Dựa vào từ khóa người dùng nhập, đưa ra 5 gợi ý tìm kiếm liên quan.
Chỉ trả về JSON array các string, không có giải thích.
Ví dụ: ["nạp game", "nạp uc pubg", "nạp kim cương", "nạp robux", "nạp gcoin"]`
          },
          {
            role: "user",
            content: `Từ khóa: "${query}"`
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(
        JSON.stringify({ suggestions: [] }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    try {
      const suggestions = JSON.parse(content);
      return new Response(
        JSON.stringify({ suggestions: Array.isArray(suggestions) ? suggestions : [] }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      return new Response(
        JSON.stringify({ suggestions: [] }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Search suggest error:", error);
    return new Response(
      JSON.stringify({ suggestions: [] }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
