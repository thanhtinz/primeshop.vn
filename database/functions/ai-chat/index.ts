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
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt for the chatbot
    const systemPrompt = `Bạn là trợ lý AI thông minh của cửa hàng trực tuyến. Nhiệm vụ của bạn:

1. Trả lời câu hỏi về sản phẩm, dịch vụ, và chính sách
2. Hỗ trợ khách hàng giải quyết vấn đề đơn hàng
3. Gợi ý sản phẩm phù hợp với nhu cầu
4. Hướng dẫn sử dụng website

Nguyên tắc:
- Trả lời ngắn gọn, thân thiện, chuyên nghiệp
- Sử dụng tiếng Việt
- Nếu không biết, đề nghị chuyển sang nhân viên hỗ trợ
- Không đưa ra thông tin sai lệch về giá cả, khuyến mãi

FAQ thường gặp:
- Thanh toán: Hỗ trợ chuyển khoản, ví điện tử, PayOS
- Giao hàng: Tự động qua email sau khi thanh toán
- Hoàn tiền: Liên hệ hỗ trợ trong vòng 24h
- Bảo hành: Tùy theo từng sản phẩm`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
