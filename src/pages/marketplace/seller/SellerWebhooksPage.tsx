import { useOutletContext } from 'react-router-dom';
import { SellerWebhooksManager } from '@/components/marketplace/SellerWebhooksManager';

export default function SellerWebhooksPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerWebhooksManager sellerId={seller.id} />;
}