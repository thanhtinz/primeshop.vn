import { useProductComparison } from '@/hooks/useProductComparison';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, X, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ComparePage = () => {
  const { items, removeItem, clearAll } = useProductComparison();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Get all unique attribute keys from all items
  const allAttributes = new Set<string>();
  items.forEach(item => {
    if (item.accountInfo) {
      Object.keys(item.accountInfo).forEach(key => allAttributes.add(key));
    }
  });

  const attributeLabels: Record<string, string> = {
    rank: 'Rank',
    level: 'Level',
    champions: 'Tướng',
    skins: 'Trang phục',
    blue_essence: 'Tinh hoa xanh',
    orange_essence: 'Tinh hoa cam',
    rp: 'RP',
    server: 'Server',
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <Scale className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">{t('noProductsToCompare')}</h1>
            <p className="text-muted-foreground">
              {t('addProductsToCompare')}
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('goBack')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('compareProducts')}</h1>
            <Badge variant="secondary">{items.length} {t('productLabel')}</Badge>
          </div>
          <Button variant="outline" onClick={clearAll}>
            {t('clearAllProducts')}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left font-medium bg-muted/50 border min-w-[150px]">
                  {t('attribute')}
                </th>
                {items.map((item) => (
                  <th key={item.productId} className="p-4 border min-w-[200px]">
                    <Card className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeItem(item.productId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Link to={`/product/${item.slug}`}>
                        <div className="aspect-square overflow-hidden rounded-t-lg">
                          <img
                            src={item.imageUrl || '/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        </div>
                      </Link>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 font-medium bg-muted/50 border">{t('price')}</td>
                {items.map((item) => (
                  <td key={item.productId} className="p-4 border text-center">
                    <span className="text-lg font-bold text-primary">
                      {item.price ? formatPrice(item.price) : t('contactForPrice')}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Dynamic attribute rows */}
              {Array.from(allAttributes).map((attr) => (
                <tr key={attr}>
                  <td className="p-4 font-medium bg-muted/50 border">
                    {attributeLabels[attr] || attr}
                  </td>
                  {items.map((item) => {
                    const value = item.accountInfo?.[attr];
                    return (
                      <td key={item.productId} className="p-4 border text-center">
                        {value !== undefined ? (
                          <span className="font-medium">{String(value)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToShopping')}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ComparePage;
