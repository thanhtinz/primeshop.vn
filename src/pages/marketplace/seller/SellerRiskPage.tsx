import { useOutletContext } from 'react-router-dom';
import { SellerRiskSettings } from '@/components/marketplace/SellerRiskSettings';

export default function SellerRiskPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerRiskSettings sellerId={seller.id} />;
}