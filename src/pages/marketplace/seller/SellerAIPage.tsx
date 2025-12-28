import { useOutletContext } from 'react-router-dom';
import { SellerAIAssistant } from '@/components/marketplace/SellerAIAssistant';

export default function SellerAIPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerAIAssistant sellerId={seller.id} />;
}