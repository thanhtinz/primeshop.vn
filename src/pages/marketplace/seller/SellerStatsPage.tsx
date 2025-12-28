import { useOutletContext } from 'react-router-dom';
import { SellerDashboardStats } from '@/components/marketplace/SellerDashboardStats';

export default function SellerStatsPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerDashboardStats seller={seller} />;
}