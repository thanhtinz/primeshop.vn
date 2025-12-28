import { useOutletContext } from 'react-router-dom';
import { SellerVoucherManager } from '@/components/marketplace/SellerVoucherManager';

export default function SellerVouchersPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerVoucherManager seller={seller} />;
}