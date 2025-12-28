// MySQL version - useSellerAI
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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

// Legacy snake_case mapping
function mapAISuggestion(data: any): AIProductSuggestion {
  if (!data) return data;
  return {
    id: data.id,
    product_id: data.productId || data.product_id,
    suggestion_type: data.suggestionType || data.suggestion_type,
    original_content: data.originalContent || data.original_content,
    suggested_content: data.suggestedContent || data.suggested_content,
    ai_reasoning: data.aiReasoning || data.ai_reasoning,
    confidence: data.confidence || 0,
    is_applied: data.isApplied ?? data.is_applied ?? false,
    applied_at: data.appliedAt || data.applied_at,
    created_at: data.createdAt || data.created_at,
    product: data.product,
  };
}

function mapAIAnalysis(data: any): AIContentAnalysis {
  if (!data) return data;
  return {
    id: data.id,
    product_id: data.productId || data.product_id,
    analysis_type: data.analysisType || data.analysis_type,
    status: data.status,
    findings: data.findings || [],
    score: data.score || 0,
    analyzed_at: data.analyzedAt || data.analyzed_at,
  };
}

function mapAIPricePrediction(data: any): AIPricePrediction {
  if (!data) return data;
  return {
    id: data.id,
    product_id: data.productId || data.product_id,
    current_price: data.currentPrice || data.current_price,
    predicted_optimal_price: data.predictedOptimalPrice || data.predicted_optimal_price,
    predicted_min_price: data.predictedMinPrice || data.predicted_min_price,
    predicted_max_price: data.predictedMaxPrice || data.predicted_max_price,
    confidence: data.confidence || 0,
    factors: data.factors || [],
    predicted_sale_probability: data.predictedSaleProbability || data.predicted_sale_probability,
    created_at: data.createdAt || data.created_at,
  };
}

// Get AI suggestions for seller
export const useAISuggestions = (sellerId: string) => {
  return useQuery({
    queryKey: ['ai-suggestions', sellerId],
    queryFn: async () => {
      // Get products for this seller
      const { data: products, error: productsError } = await apiClient.from('seller_products')
        .select('id')
        .eq('seller_id', sellerId);

      if (productsError) throw productsError;

      const productIds = products?.map((p: any) => p.id) || [];
      if (productIds.length === 0) return [];

      const { data, error } = await apiClient.from('ai_product_suggestions')
        .select('*')
        .in('product_id', productIds)
        .eq('is_applied', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get product info
      const suggestions = (data || []).map(mapAISuggestion);
      const suggestionProductIds = suggestions.map(s => s.product_id);
      
      if (suggestionProductIds.length > 0) {
        const { data: productData } = await apiClient.from('seller_products')
          .select('id, title, images')
          .in('id', suggestionProductIds);

        return suggestions.map(s => ({
          ...s,
          product: productData?.find((p: any) => p.id === s.product_id),
        }));
      }

      return suggestions;
    },
    enabled: !!sellerId
  });
};

// Get AI analysis for a product
export const useAIProductAnalysis = (productId: string) => {
  return useQuery({
    queryKey: ['ai-product-analysis', productId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('ai_content_analysis')
        .select('*')
        .eq('product_id', productId)
        .order('analyzed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapAIAnalysis);
    },
    enabled: !!productId
  });
};

// Get AI price prediction for a product
export const useAIPricePrediction = (productId: string) => {
  return useQuery({
    queryKey: ['ai-price-prediction', productId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('ai_price_predictions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && !error.message?.includes('not found')) throw error;
      return data ? mapAIPricePrediction(data) : null;
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
      const { data: suggestion, error: suggestionError } = await apiClient.from('ai_product_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (suggestionError) throw suggestionError;

      const mappedSuggestion = mapAISuggestion(suggestion);

      // Apply the suggestion to the product
      const updateData: any = {};
      switch (mappedSuggestion.suggestion_type) {
        case 'title':
          updateData.title = mappedSuggestion.suggested_content;
          break;
        case 'description':
          updateData.description = mappedSuggestion.suggested_content;
          break;
        case 'price':
          updateData.price = parseInt(mappedSuggestion.suggested_content || '0');
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await apiClient.from('seller_products')
          .update(updateData)
          .eq('id', productId);

        if (updateError) throw updateError;
      }

      // Mark suggestion as applied
      const { error } = await apiClient.from('ai_product_suggestions')
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
      const { data: product, error: productError } = await apiClient.from('seller_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Call AI endpoint
      const { data, error } = await apiClient.post('/ai/seller-suggestions', { product });

      if (error) throw error;

      // Save suggestions to database
      if (data?.suggestions) {
        for (const suggestion of data.suggestions) {
          await apiClient.from('ai_product_suggestions')
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
      const { data: product, error: productError } = await apiClient.from('seller_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Call AI endpoint
      const { data, error } = await apiClient.post('/ai/content-analysis', { product });

      if (error) throw error;

      // Save analysis to database
      if (data?.analysis) {
        await apiClient.from('ai_content_analysis')
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
      const { data: product, error: productError } = await apiClient.from('seller_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Get similar products for comparison
      const { data: similarProducts } = await apiClient.from('seller_products')
        .select('price, status, sold_at, created_at')
        .eq('category', product.category)
        .neq('id', productId)
        .limit(50);

      // Calculate prediction based on market data
      const soldProducts = similarProducts?.filter((p: any) => p.status === 'sold') || [];
      const avgSoldPrice = soldProducts.length > 0 
        ? soldProducts.reduce((sum: number, p: any) => sum + p.price, 0) / soldProducts.length 
        : product.price;

      const availableProducts = similarProducts?.filter((p: any) => p.status === 'available') || [];
      const avgListedPrice = availableProducts.length > 0
        ? availableProducts.reduce((sum: number, p: any) => sum + p.price, 0) / availableProducts.length
        : product.price;

      // Simple prediction logic
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
      const { data, error } = await apiClient.from('ai_price_predictions')
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
      return mapAIPricePrediction(data);
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

// Dismiss AI suggestion
export const useDismissAISuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await apiClient.from('ai_product_suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
    }
  });
};
