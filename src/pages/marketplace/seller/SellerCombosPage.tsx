import { useOutletContext } from 'react-router-dom';
import { SellerComboManager } from '@/components/marketplace/SellerComboManager';

export default function SellerCombosPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerComboManager seller={seller} />;
}