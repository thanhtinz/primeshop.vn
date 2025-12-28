import { useOutletContext } from 'react-router-dom';
import { SellerBoostManager } from '@/components/marketplace/SellerBoostManager';

export default function SellerBoostPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerBoostManager seller={seller} />;
}