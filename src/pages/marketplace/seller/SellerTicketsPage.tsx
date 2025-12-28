import { useOutletContext } from 'react-router-dom';
import { SellerSupportTickets } from '@/components/marketplace/SellerSupportTickets';

export default function SellerTicketsPage() {
  const { seller } = useOutletContext<any>();
  
  if (!seller) return null;
  
  return <SellerSupportTickets seller={seller} />;
}