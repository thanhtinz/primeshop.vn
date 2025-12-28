import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSellerAnalytics, useSellerSuggestions, useApplySuggestion } from '@/hooks/useSellerInsights';
import { Eye, MousePointer, Heart, TrendingUp, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';

interface SellerInsightsDashboardProps {
  sellerId: string;
}

export const SellerInsightsDashboard = ({ sellerId }: SellerInsightsDashboardProps) => {
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useSellerAnalytics(sellerId);
  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useSellerSuggestions(sellerId);
  const applySuggestion = useApplySuggestion();

  // Transform analytics data for display
  const productStats = analyticsData?.map(a => ({
    product_id: a.id,
    total_views: a.total_views,
    total_clicks: a.total_clicks,
    unique_viewers: a.unique_viewers,
    wishlist_adds: a.wishlist_adds,
    conversion_rate: a.view_to_buy_rate * 100
  })) || [];

  const topViewedProducts = productStats
    .filter(a => a.total_views > 0)
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, 10);

  const highWishlistProducts = productStats
    .filter(a => a.wishlist_adds > 0)
    .sort((a, b) => b.wishlist_adds - a.wishlist_adds)
    .slice(0, 10);

  const lowConversionProducts = productStats
    .filter(a => a.total_views > 10 && a.conversion_rate < 5)
    .sort((a, b) => a.conversion_rate - b.conversion_rate)
    .slice(0, 10);

  // Map suggestions to expected format
  const mappedSuggestions = suggestionsData?.map(s => ({
    id: s.id,
    suggestion_type: s.suggestion_type,
    original_content: s.original_value,
    suggested_content: s.suggested_value,
    ai_reasoning: s.reason,
    confidence: s.confidence_score,
    is_applied: s.is_applied,
    applied_at: s.applied_at
  })) || [];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-full bg-blue-500/10 shrink-0">
                <Eye className="h-4 w-4 md:h-6 md:w-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Tổng lượt xem</p>
                <p className="text-lg md:text-2xl font-bold">
                  {productStats.reduce((sum, a) => sum + a.total_views, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-full bg-green-500/10 shrink-0">
                <MousePointer className="h-4 w-4 md:h-6 md:w-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Tổng lượt click</p>
                <p className="text-lg md:text-2xl font-bold">
                  {productStats.reduce((sum, a) => sum + a.total_clicks, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-full bg-pink-500/10 shrink-0">
                <Heart className="h-4 w-4 md:h-6 md:w-6 text-pink-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Wishlist</p>
                <p className="text-lg md:text-2xl font-bold">
                  {productStats.reduce((sum, a) => sum + a.wishlist_adds, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-full bg-purple-500/10 shrink-0">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Chuyển đổi TB</p>
                <p className="text-lg md:text-2xl font-bold">
                  {productStats.length > 0
                    ? (productStats.reduce((sum, a) => sum + a.conversion_rate, 0) / productStats.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="views" className="w-full">
        {/* Scrollable tabs on mobile */}
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap no-scrollbar">
          <TabsTrigger value="views" className="text-xs md:text-sm whitespace-nowrap">Xem nhiều</TabsTrigger>
          <TabsTrigger value="wishlist" className="text-xs md:text-sm whitespace-nowrap">Wishlist</TabsTrigger>
          <TabsTrigger value="low-conversion" className="text-xs md:text-sm whitespace-nowrap">Cần tối ưu</TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs md:text-sm whitespace-nowrap">Gợi ý AI</TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Eye className="h-4 w-4 md:h-5 md:w-5" />
                Sản phẩm được xem nhiều nhất
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {isLoadingAnalytics ? (
                <p className="text-muted-foreground text-sm">Đang tải...</p>
              ) : topViewedProducts.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {topViewedProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <span className="text-base md:text-lg font-bold text-muted-foreground shrink-0">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{product.product_id.slice(0, 8)}...</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {product.unique_viewers} người xem
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm md:text-base">{product.total_views.toLocaleString()}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {product.conversion_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">
                  Chưa có dữ liệu lượt xem
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
                Sản phẩm wishlist nhiều
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {isLoadingAnalytics ? (
                <p className="text-muted-foreground text-sm">Đang tải...</p>
              ) : highWishlistProducts.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {highWishlistProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <span className="text-base md:text-lg font-bold text-muted-foreground shrink-0">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{product.product_id.slice(0, 8)}...</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            {product.wishlist_adds}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm md:text-base">{product.total_views.toLocaleString()}</p>
                        <p className="text-xs md:text-sm text-green-600">
                          {product.total_views > 0 
                            ? ((product.wishlist_adds / product.total_views) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">
                  Chưa có dữ liệu wishlist
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-conversion" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                Cần tối ưu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {isLoadingAnalytics ? (
                <p className="text-muted-foreground text-sm">Đang tải...</p>
              ) : lowConversionProducts.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {lowConversionProducts.map((product) => (
                    <div key={product.product_id} className="p-2 md:p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base truncate">{product.product_id.slice(0, 8)}...</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {product.total_views} xem, {product.conversion_rate.toFixed(1)}% chuyển đổi
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pl-6 md:pl-7">
                        <Button size="sm" variant="outline" className="text-xs h-7 md:h-8">
                          Giảm giá
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 md:h-8">
                          Đổi tiêu đề
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">
                  Không có sản phẩm cần tối ưu
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                Gợi ý từ AI
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {isLoadingSuggestions ? (
                <p className="text-muted-foreground text-sm">Đang tải...</p>
              ) : mappedSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {mappedSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Badge variant={
                            suggestion.suggestion_type === 'price' ? 'default' :
                            suggestion.suggestion_type === 'title' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {suggestion.suggestion_type === 'price' ? 'Giá' :
                             suggestion.suggestion_type === 'title' ? 'Tiêu đề' :
                             suggestion.suggestion_type === 'description' ? 'Mô tả' : 'Khác'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Độ tin cậy: {((suggestion.confidence || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        {!suggestion.is_applied && (
                          <Button 
                            size="sm"
                            className="text-xs h-7 md:h-8 shrink-0"
                            onClick={() => applySuggestion.mutate(suggestion.id)}
                            disabled={applySuggestion.isPending}
                          >
                            Áp dụng
                          </Button>
                        )}
                        {suggestion.is_applied && (
                          <Badge variant="outline" className="text-green-600 text-xs shrink-0">
                            Đã áp dụng
                          </Badge>
                        )}
                      </div>
                      {/* Stack on mobile, side by side on desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Hiện tại:</p>
                          <p className="font-mono bg-muted p-2 rounded text-xs break-all">
                            {suggestion.original_content || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Gợi ý:</p>
                          <p className="font-mono bg-green-500/10 p-2 rounded text-xs break-all">
                            {suggestion.suggested_content || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {suggestion.ai_reasoning && (
                        <p className="text-xs text-muted-foreground italic">
                          💡 {suggestion.ai_reasoning}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">
                  Chưa có gợi ý từ AI
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
