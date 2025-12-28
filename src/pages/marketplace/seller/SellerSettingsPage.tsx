import { useOutletContext } from 'react-router-dom';
import { SellerShopSettings } from '@/components/marketplace/SellerShopSettings';

export default function SellerSettingsPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerShopSettings seller={seller} />;
}