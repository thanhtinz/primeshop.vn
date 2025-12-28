import { useOutletContext } from 'react-router-dom';
import { SellerPostsManager } from '@/components/marketplace/SellerPostsManager';

export default function SellerPostsPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerPostsManager sellerId={seller.id} shopName={seller.shop_name} />;
}