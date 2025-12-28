import { useOutletContext } from 'react-router-dom';
import { SellerBlacklistManager } from '@/components/marketplace/SellerBlacklistManager';

export default function SellerBlacklistPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerBlacklistManager seller={seller} />;
}