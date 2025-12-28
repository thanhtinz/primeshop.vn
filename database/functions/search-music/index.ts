import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  source: 'youtube' | 'spotify';
  sourceId: string;
  embedUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, source = 'youtube' } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI to search for music
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a music search assistant. When given a search query, return a JSON array of 5 music results.
Each result should be a realistic music video/track that matches the query.

For YouTube results, use this format:
{
  "id": "unique-id",
  "title": "Song Title",
  "artist": "Artist Name",
  "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg",
  "source": "youtube",
  "sourceId": "VIDEO_ID",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID"
}

For Spotify results, use this format:
{
  "id": "unique-id", 
  "title": "Song Title",
  "artist": "Artist Name",
  "thumbnail": "https://via.placeholder.com/120x120?text=Spotify",
  "source": "spotify",
  "sourceId": "TRACK_ID",
  "embedUrl": "https://open.spotify.com/embed/track/TRACK_ID"
}

IMPORTANT: Return ONLY the JSON array, no other text. Use real, popular song data when possible.
For YouTube, use real video IDs of popular music videos.`;

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
          { role: "user", content: `Search for ${source === 'youtube' ? 'YouTube music videos' : 'Spotify tracks'} matching: "${query}"` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to search music");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON response
    let results: SearchResult[] = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      results = [];
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("search-music error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});