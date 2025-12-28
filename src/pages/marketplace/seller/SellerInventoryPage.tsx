import { useOutletContext } from 'react-router-dom';
import { SellerInventoryManager } from '@/components/marketplace/SellerInventoryManager';

export default function SellerInventoryPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerInventoryManager sellerId={seller.id} />;
}