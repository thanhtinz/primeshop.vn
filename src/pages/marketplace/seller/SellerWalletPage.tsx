import { useOutletContext } from 'react-router-dom';
import { SellerWalletSection } from '@/components/marketplace/SellerWalletSection';

export default function SellerWalletPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerWalletSection seller={seller} />;
}