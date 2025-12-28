import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAISuggestions,
  useApplyAISuggestion,
  type AIProductSuggestion,
  type AIContentAnalysis,
  type AIPricePrediction
} from '@/hooks/useSellerAI';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, Check, Loader2, DollarSign, FileText, Image } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerAIAssistantProps {
  sellerId: string;
}

// Additional hooks for content analysis and predictions
const useContentAnalysis = (sellerId: string) => {
  return useQuery({
    queryKey: ['ai-content-analysis', sellerId],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('seller_products')
        .select('id')
        .eq('seller_id', sellerId);

      if (!products?.length) return [];

      const { data, error } = await supabase
        .from('ai_content_analysis')
        .select('*')
        .in('product_id', products.map(p => p.id))
        .order('analyzed_at', { ascending: false });

      if (error) throw error;
      return data as AIContentAnalysis[];
    },
    enabled: !!sellerId
  });
};

const usePricePredictions = (sellerId: string) => {
  return useQuery({
    queryKey: ['ai-price-predictions', sellerId],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('seller_products')
        .select('id')
        .eq('seller_id', sellerId);

      if (!products?.length) return [];

      const { data, error } = await supabase
        .from('ai_price_predictions')
        .select('*')
        .in('product_id', products.map(p => p.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIPricePrediction[];
    },
    enabled: !!sellerId
  });
};

export const SellerAIAssistant = ({ sellerId }: SellerAIAssistantProps) => {
  const { data: suggestions, isLoading: isLoadingSuggestions } = useAISuggestions(sellerId);
  const { data: contentAnalysis, isLoading: isLoadingAnalysis } = useContentAnalysis(sellerId);
  const { data: pricePredictions, isLoading: isLoadingPredictions } = usePricePredictions(sellerId);
  const applySuggestion = useApplyAISuggestion();
  const { formatDate, formatDateTime } = useDateFormat();

  

  const pendingSuggestions = suggestions?.filter(s => !s.is_applied) || [];
  const appliedSuggestions = suggestions?.filter(s => s.is_applied) || [];

  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return <FileText className="h-4 w-4" />;
      case 'description': return <FileText className="h-4 w-4" />;
      case 'price': return <DollarSign className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'title': return 'Tiêu đề';
      case 'description': return 'Mô tả';
      case 'price': return 'Giá';
      case 'image': return 'Hình ảnh';
      case 'tags': return 'Tags';
      default: return type;
    }
  };

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-500/10';
      case 'warning': return 'text-yellow-600 bg-yellow-500/10';
      case 'failed': return 'text-red-600 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Hỗ trợ Seller
          </h3>
          <p className="text-sm text-muted-foreground">
            AI giúp tối ưu sản phẩm và dự đoán giá bán tốt nhất
          </p>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList>
          <TabsTrigger value="suggestions" className="relative">
            Gợi ý AI
            {pendingSuggestions.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {pendingSuggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analysis">Phân tích nội dung</TabsTrigger>
          <TabsTrigger value="pricing">Dự đoán giá</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Gợi ý chờ áp dụng ({pendingSuggestions.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {pendingSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getSuggestionTypeIcon(suggestion.suggestion_type)}
                          <Badge variant="secondary">
                            {getSuggestionTypeLabel(suggestion.suggestion_type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Độ tin cậy: {((suggestion.confidence || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => applySuggestion.mutate({ 
                            suggestionId: suggestion.id, 
                            productId: suggestion.product_id 
                          })}
                          disabled={applySuggestion.isPending}
                        >
                          {applySuggestion.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Áp dụng
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Hiện tại</p>
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            {suggestion.original_content || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Gợi ý</p>
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                            {suggestion.suggested_content || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {suggestion.ai_reasoning && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          💡 <span className="italic">{suggestion.ai_reasoning}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có gợi ý mới</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI sẽ tự động phân tích và đề xuất cải thiện
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {appliedSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Đã áp dụng ({appliedSuggestions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appliedSuggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <Badge variant="outline">{getSuggestionTypeLabel(suggestion.suggestion_type)}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {suggestion.applied_at && formatDate(suggestion.applied_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Phân tích nội dung sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : contentAnalysis && contentAnalysis.length > 0 ? (
                <div className="space-y-4">
                  {contentAnalysis.map((analysis) => (
                    <div key={analysis.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{analysis.analysis_type}</Badge>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAnalysisStatusColor(analysis.status)}`}>
                            {analysis.status === 'passed' ? 'Đạt' :
                             analysis.status === 'warning' ? 'Cảnh báo' :
                             analysis.status === 'failed' ? 'Không đạt' : analysis.status}
                          </span>
                        </div>
                        {analysis.score !== null && (
                          <div className="text-right">
                            <span className="text-2xl font-bold">{analysis.score}</span>
                            <span className="text-sm text-muted-foreground">/100</span>
                          </div>
                        )}
                      </div>

                      {analysis.findings && typeof analysis.findings === 'object' && !Array.isArray(analysis.findings) && (
                        <div className="space-y-2">
                          {Object.entries(analysis.findings as Record<string, unknown>).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 text-sm">
                              <span className="font-medium capitalize">{key}:</span>
                              <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-3">
                        Phân tích lúc: {formatDateTime(analysis.analyzed_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có phân tích nội dung</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI sẽ tự động kiểm tra nội dung sản phẩm
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Dự đoán giá tối ưu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPredictions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pricePredictions && pricePredictions.length > 0 ? (
                <div className="space-y-4">
                  {pricePredictions.map((prediction) => (
                    <div key={prediction.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium">{prediction.product_id.slice(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            Độ tin cậy: {((prediction.confidence || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <Badge variant="outline">
                          Xác suất bán: {((prediction.predicted_sale_probability || 0) * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Giá hiện tại</p>
                          <p className="font-bold">{(prediction.current_price || 0).toLocaleString()}đ</p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-xs text-muted-foreground">Giá tối ưu</p>
                          <p className="font-bold text-green-600">
                            {(prediction.predicted_optimal_price || 0).toLocaleString()}đ
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Giá thấp nhất</p>
                          <p className="font-bold">{(prediction.predicted_min_price || 0).toLocaleString()}đ</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Giá cao nhất</p>
                          <p className="font-bold">{(prediction.predicted_max_price || 0).toLocaleString()}đ</p>
                        </div>
                      </div>

                      {prediction.factors && typeof prediction.factors === 'object' && !Array.isArray(prediction.factors) && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Yếu tố ảnh hưởng:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(prediction.factors as Record<string, unknown>).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-3">
                        Dự đoán lúc: {formatDateTime(prediction.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có dự đoán giá</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI sẽ phân tích thị trường và đề xuất giá tối ưu
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
