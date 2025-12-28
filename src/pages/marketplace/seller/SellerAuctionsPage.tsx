import { useOutletContext } from 'react-router-dom';
import { SellerAuctionManager } from '@/components/marketplace/SellerAuctionManager';

export default function SellerAuctionsPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerAuctionManager sellerId={seller.id} />;
}