import { useWishlist, useRemoveFromWishlist, useToggleWishlistNotification } from '@/hooks/useWishlist';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash2, Bell, BellOff, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

const WishlistPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: wishlist, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const toggleNotification = useToggleWishlistNotification();
  const { formatPrice } = useCurrency();

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(wishlist || [], { itemsPerPage: 12 });

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Đăng nhập để xem danh sách yêu thích</h1>
            <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold">Danh sách yêu thích</h1>
          {wishlist && wishlist.length > 0 && (
            <Badge variant="secondary">{wishlist.length} sản phẩm</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-lg" />
            ))}
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-medium">Danh sách yêu thích trống</h2>
            <p className="text-muted-foreground">
              Thêm sản phẩm yêu thích để theo dõi và nhận thông báo giảm giá
            </p>
            <Button onClick={() => navigate('/products')}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Khám phá sản phẩm
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <Link to={`/product/${item.product?.slug}`}>
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={item.product?.image_url || '/placeholder.svg'}
                        alt={item.product?.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  </Link>
                  <CardContent className="p-4 space-y-3">
                    <Link to={`/product/${item.product?.slug}`}>
                      <h3 className="font-medium hover:text-primary transition-colors line-clamp-2">
                        {item.product?.name}
                      </h3>
                    </Link>
                    
                    {item.product?.price && (
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(item.product.price)}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {item.notify_on_sale ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          Thông báo giảm giá
                        </span>
                        <Switch
                          checked={item.notify_on_sale}
                          onCheckedChange={(checked) => 
                            toggleNotification.mutate({ 
                              productId: item.product_id, 
                              notifyOnSale: checked 
                            })
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromWishlist.mutate(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              className="mt-6"
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default WishlistPage;
