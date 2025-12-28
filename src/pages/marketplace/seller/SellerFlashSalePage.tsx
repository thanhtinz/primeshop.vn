import { useOutletContext } from 'react-router-dom';
import { SellerFlashSaleManager } from '@/components/marketplace/SellerFlashSaleManager';

export default function SellerFlashSalePage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerFlashSaleManager seller={seller} />;
}