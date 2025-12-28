import { useOutletContext } from 'react-router-dom';
import { SellerHandoverManager } from '@/components/marketplace/SellerHandoverManager';

export default function SellerHandoverPage() {
  const { seller, orders } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerHandoverManager seller={seller} orders={orders || []} />;
}