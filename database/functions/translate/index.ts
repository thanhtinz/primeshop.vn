import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLang, sourceLang = 'vi' } = await req.json();
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ error: 'texts array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!targetLang) {
      return new Response(JSON.stringify({ error: 'targetLang is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If target language is same as source, return original texts
    if (targetLang === sourceLang) {
      const result: Record<string, string> = {};
      texts.forEach((text: string) => {
        result[text] = text;
      });
      return new Response(JSON.stringify({ translations: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cachedTranslations } = await supabase
      .from('translations')
      .select('source_text, translated_text')
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .in('source_text', texts);

    const cachedMap: Record<string, string> = {};
    if (cachedTranslations) {
      cachedTranslations.forEach((item: any) => {
        cachedMap[item.source_text] = item.translated_text;
      });
    }

    // Find texts that need translation
    const textsToTranslate = texts.filter((text: string) => !cachedMap[text]);

    console.log(`Cache hit: ${texts.length - textsToTranslate.length}/${texts.length}`);

    // If all cached, return immediately
    if (textsToTranslate.length === 0) {
      const result: Record<string, string> = {};
      texts.forEach((text: string) => {
        result[text] = cachedMap[text];
      });
      return new Response(JSON.stringify({ translations: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Translate using Lovable AI
    const langNames: Record<string, string> = {
      'vi': 'Vietnamese',
      'en': 'English',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
    };

    const sourceLangName = langNames[sourceLang] || sourceLang;
    const targetLangName = langNames[targetLang] || targetLang;

    // Batch translate - create JSON array of texts
    const prompt = `Translate the following texts from ${sourceLangName} to ${targetLangName}. 
Return ONLY a JSON array with the translations in the same order. No explanations.

Texts to translate:
${JSON.stringify(textsToTranslate)}

Return format: ["translation1", "translation2", ...]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional translator. Translate accurately and naturally. Return ONLY the JSON array of translations, nothing else.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Translation service error');
    }

    const aiData = await response.json();
    const translatedContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse translations
    let translatedArray: string[] = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = translatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        translatedArray = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found');
      }
    } catch (e) {
      console.error('Failed to parse translations:', translatedContent);
      // Fallback: split by newlines
      translatedArray = translatedContent.split('\n').filter((s: string) => s.trim());
    }

    // Map translations
    const newTranslations: Record<string, string> = {};
    textsToTranslate.forEach((text: string, index: number) => {
      newTranslations[text] = translatedArray[index] || text;
    });

    // Save to cache
    const cacheInserts = Object.entries(newTranslations).map(([source, translated]) => ({
      source_text: source,
      source_lang: sourceLang,
      target_lang: targetLang,
      translated_text: translated,
    }));

    if (cacheInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('translations')
        .upsert(cacheInserts, { 
          onConflict: 'source_text,source_lang,target_lang',
          ignoreDuplicates: false 
        });
      
      if (insertError) {
        console.error('Cache insert error:', insertError);
      } else {
        console.log(`Cached ${cacheInserts.length} new translations`);
      }
    }

    // Combine cached and new translations
    const result: Record<string, string> = { ...cachedMap, ...newTranslations };

    return new Response(JSON.stringify({ translations: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
