import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ChatWithSellerButtonProps {
  sellerId: string;
  sellerName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ChatWithSellerButton: React.FC<ChatWithSellerButtonProps> = ({ 
  sellerId, 
  sellerName,
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để nhắn tin với shop');
      navigate('/auth');
      return;
    }
    
    if (user.id === sellerId) {
      toast.info('Đây là shop của bạn');
      return;
    }
    
    // Navigate to chat page with seller id
    navigate(`/chat?user=${sellerId}`);
  };

  return (
    <Button 
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleClick}
    >
      <MessageCircle className="h-4 w-4" />
      Nhắn tin
    </Button>
  );
};

export default ChatWithSellerButton;
