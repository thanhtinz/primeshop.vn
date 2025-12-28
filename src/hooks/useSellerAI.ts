import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIProductSuggestion {
  id: string;
  product_id: string;
  suggestion_type: string;
  original_content: string | null;
  suggested_content: string | null;
  ai_reasoning: string | null;
  confidence: number;
  is_applied: boolean;
  applied_at: string | null;
  created_at: string;
  product?: {
    title: string;
    images: string[];
  };
}

export interface AIContentAnalysis {
  id: string;
  product_id: string;
  analysis_type: string;
  status: string;
  findings: any[];
  score: number;
  analyzed_at: string;
}

export interface AIPricePrediction {
  id: string;
  product_id: string;
  current_price: number;
  predicted_optimal_price: number;
  predicted_min_price: number;
  predicted_max_price: number;
  confidence: number;
  factors: any[];
  predicted_sale_probability: number;
  created_at: string;
}

// Get AI suggestions for seller
export const useAISuggestions = (sellerId: string) => {
  return useQuery({
    queryKey: ['ai-suggestions', sellerId],
    queryFn: async () => {
      // Get products for this seller
      const { data: products, error: productsError } = await supabase
        .from('seller_products')
        .select('id')
        .eq('seller_id', sellerId);

      if (productsError) throw productsError;

      const productIds = products?.map(p => p.id) || [];
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('ai_product_suggestions')
        .select(`
          *,
          product:seller_products(title, images)
        `)
        .in('product_id', productIds)
        .eq('is_applied', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIProductSuggestion[];
    },
    enabled: !!sellerId
  });
};

// Get AI analysis for a product
export const useAIProductAnalysis = (productId: string) => {
  return useQuery({
    queryKey: ['ai-product-analysis', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_content_analysis')
        .select('*')
        .eq('product_id', productId)
        .order('analyzed_at', { ascending: false });

      if (error) throw error;
      return data as AIContentAnalysis[];
    },
    enabled: !!productId
  });
};

// Get AI price prediction for a product
export const useAIPricePrediction = (productId: string) => {
  return useQuery({
    queryKey: ['ai-price-prediction', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_price_predictions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AIPricePrediction | null;
    },
    enabled: !!productId
  });
};

// Apply AI suggestion
export const useApplyAISuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ suggestionId, productId }: { suggestionId: string; productId: string }) => {
      // Get the suggestion
      const { data: suggestion, error: suggestionError } = await supabase
        .from('ai_product_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (suggestionError) throw suggestionError;

      // Apply the suggestion to the product
      const updateData: any = {};
      switch (suggestion.suggestion_type) {
        case 'title':
          updateData.title = suggestion.suggested_content;
          break;
        case 'description':
          updateData.description = suggestion.suggested_content;
          break;
        case 'price':
          updateData.price = parseInt(suggestion.suggested_content || '0');
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('seller_products')
          .update(updateData)
          .eq('id', productId);

        if (updateError) throw updateError;
      }

      // Mark suggestion as applied
      const { error } = await supabase
        .from('ai_product_suggestions')
        .update({ 
          is_applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
      toast.success('Đã áp dụng gợi ý AI');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Generate AI suggestions for a product
export const useGenerateAISuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('seller_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-seller-suggestions', {
        body: { product }
      });

      if (error) throw error;

      // Save suggestions to database
      if (data?.suggestions) {
        for (const suggestion of data.suggestions) {
          await supabase
            .from('ai_product_suggestions')
            .insert({
              product_id: productId,
              suggestion_type: suggestion.type,
              original_content: suggestion.original,
              suggested_content: suggestion.suggested,
              ai_reasoning: suggestion.reasoning,
              confidence: suggestion.confidence
            });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Đã tạo gợi ý AI');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo gợi ý AI');
    }
  });
};

// Analyze product content with AI
export const useAnalyzeProductContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data: product, error: productError } = await supabase
        .from('seller_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-content-analysis', {
        body: { product }
      });

      if (error) throw error;

      // Save analysis to database
      if (data?.analysis) {
        await supabase
          .from('ai_content_analysis')
          .insert({
            product_id: productId,
            analysis_type: 'full',
            status: data.analysis.status,
            findings: data.analysis.findings,
            score: data.analysis.score
          });
      }

      return data;
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-product-analysis', productId] });
      toast.success('Đã phân tích nội dung');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể phân tích nội dung');
    }
  });
};

// Predict optimal price with AI
export const usePredictPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data: product, error: productError } = await supabase
        .from('seller_products')
        .select('*, seller:sellers(rating_average, total_sales)')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Get similar products for comparison
      const { data: similarProducts } = await supabase
        .from('seller_products')
        .select('price, status, sold_at, created_at')
        .eq('category', product.category)
        .neq('id', productId)
        .limit(50);

      // Calculate prediction based on market data
      const soldProducts = similarProducts?.filter(p => p.status === 'sold') || [];
      const avgSoldPrice = soldProducts.length > 0 
        ? soldProducts.reduce((sum, p) => sum + p.price, 0) / soldProducts.length 
        : product.price;

      const availableProducts = similarProducts?.filter(p => p.status === 'available') || [];
      const avgListedPrice = availableProducts.length > 0
        ? availableProducts.reduce((sum, p) => sum + p.price, 0) / availableProducts.length
        : product.price;

      // Simple prediction logic (can be enhanced with actual AI)
      const predictedOptimal = Math.round((avgSoldPrice + avgListedPrice) / 2);
      const predictedMin = Math.round(predictedOptimal * 0.8);
      const predictedMax = Math.round(predictedOptimal * 1.2);

      // Calculate sale probability
      const priceRatio = product.price / predictedOptimal;
      let saleProbability = 0.5;
      if (priceRatio < 0.9) saleProbability = 0.8;
      else if (priceRatio < 1.0) saleProbability = 0.65;
      else if (priceRatio > 1.2) saleProbability = 0.2;
      else if (priceRatio > 1.1) saleProbability = 0.35;

      const factors = [
        { factor: 'Giá trung bình đã bán', value: avgSoldPrice },
        { factor: 'Giá trung bình đang bán', value: avgListedPrice },
        { factor: 'Số sản phẩm tương tự', value: similarProducts?.length || 0 }
      ];

      // Save prediction
      const { data, error } = await supabase
        .from('ai_price_predictions')
        .insert({
          product_id: productId,
          current_price: product.price,
          predicted_optimal_price: predictedOptimal,
          predicted_min_price: predictedMin,
          predicted_max_price: predictedMax,
          confidence: 0.7,
          factors,
          predicted_sale_probability: saleProbability
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-price-prediction', productId] });
      toast.success('Đã dự đoán giá tối ưu');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};
