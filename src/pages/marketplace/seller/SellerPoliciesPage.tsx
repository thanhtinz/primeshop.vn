import { useOutletContext } from 'react-router-dom';
import { SellerPoliciesManager } from '@/components/marketplace/SellerPoliciesManager';

export default function SellerPoliciesPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerPoliciesManager sellerId={seller.id} />;
}