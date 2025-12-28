import { useOutletContext } from 'react-router-dom';
import { SellerChatManager } from '@/components/marketplace/SellerChatManager';

export default function SellerChatPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerChatManager sellerId={seller.id} shopName={seller.shop_name} />;
}