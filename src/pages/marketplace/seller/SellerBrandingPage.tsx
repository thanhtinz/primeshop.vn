import { useOutletContext } from 'react-router-dom';
import { SellerBrandingSettings } from '@/components/marketplace/SellerBrandingSettings';

export default function SellerBrandingPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerBrandingSettings sellerId={seller.id} shopSlug={seller.shop_slug} seller={seller} />;
}