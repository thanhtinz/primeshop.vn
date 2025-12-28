import { useOutletContext } from 'react-router-dom';
import { SellerInsightsDashboard } from '@/components/marketplace/SellerInsightsDashboard';

export default function SellerInsightsPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerInsightsDashboard sellerId={seller.id} />;
}