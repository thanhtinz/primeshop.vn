// MySQL version - useSellerTickets
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useCurrentSeller } from './useMarketplace.mysql';
import { useAuth } from '@/contexts/AuthContext';

export interface SellerTicket {
  id: string;
  ticket_number: string;
  seller_id: string;
  buyer_id: string | null;
  order_id: string | null;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_joined: boolean;
  admin_joined_at: string | null;
  buyer_resolved: boolean;
  seller_resolved: boolean;
  buyer_resolved_at: string | null;
  seller_resolved_at: string | null;
  created_at: string;
  updated_at: string;
  buyer?: { email: string; full_name: string | null; avatar_url?: string };
  seller?: { shop_name: string; shop_avatar_url?: string };
  order?: { order_number: string };
}

export interface SellerTicketAttachment {
  type: 'image' | 'sticker';
  url?: string;
  sticker?: {
    id: string;
    url: string;
    name: string;
  };
}

export interface SellerTicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'buyer' | 'seller' | 'admin';
  sender_id: string;
  message: string;
  attachments?: SellerTicketAttachment[];
  created_at: string;
}

// Legacy snake_case mapping
function mapSellerTicket(data: any): SellerTicket {
  if (!data) return data;
  return {
    id: data.id,
    ticket_number: data.ticketNumber || data.ticket_number,
    seller_id: data.sellerId || data.seller_id,
    buyer_id: data.buyerId || data.buyer_id,
    order_id: data.orderId || data.order_id,
    subject: data.subject,
    status: data.status,
    priority: data.priority || 'normal',
    admin_joined: data.adminJoined ?? data.admin_joined ?? false,
    admin_joined_at: data.adminJoinedAt || data.admin_joined_at,
    buyer_resolved: data.buyerResolved ?? data.buyer_resolved ?? false,
    seller_resolved: data.sellerResolved ?? data.seller_resolved ?? false,
    buyer_resolved_at: data.buyerResolvedAt || data.buyer_resolved_at,
    seller_resolved_at: data.sellerResolvedAt || data.seller_resolved_at,
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at,
    buyer: data.buyer,
    seller: data.seller,
    order: data.order,
  };
}

function mapSellerTicketMessage(data: any): SellerTicketMessage {
  if (!data) return data;
  return {
    id: data.id,
    ticket_id: data.ticketId || data.ticket_id,
    sender_type: data.senderType || data.sender_type,
    sender_id: data.senderId || data.sender_id,
    message: data.message,
    attachments: data.attachments || [],
    created_at: data.createdAt || data.created_at,
  };
}

// Seller: Get tickets from buyers
export const useSellerTickets = () => {
  const { data: seller } = useCurrentSeller();
  
  return useQuery({
    queryKey: ['seller-tickets', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      
      const { data, error } = await apiClient.from('seller_tickets')
        .select('*')
        .eq('seller_id', seller.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch buyer info separately
      const ticketsWithBuyers = await Promise.all(
        (data || []).map(async (ticket: any) => {
          let enriched = { ...ticket };
          const buyerId = ticket.buyer_id || ticket.buyerId;
          const orderId = ticket.order_id || ticket.orderId;
          
          if (buyerId) {
            const { data: profile } = await apiClient.from('profiles')
              .select('email, full_name')
              .eq('user_id', buyerId)
              .single();
            enriched.buyer = profile;
          }
          if (orderId) {
            const { data: order } = await apiClient.from('seller_orders')
              .select('order_number')
              .eq('id', orderId)
              .single();
            enriched.order = order;
          }
          return mapSellerTicket(enriched);
        })
      );
      
      return ticketsWithBuyers;
    },
    enabled: !!seller
  });
};

// Buyer: Get my tickets to sellers
export const useMyTicketsToSellers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-seller-tickets', user?.id],
    queryFn: async (): Promise<SellerTicket[]> => {
      if (!user) return [];
      
      const { data, error } = await apiClient.from('seller_tickets')
        .select('*')
        .eq('buyer_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch seller info
      const ticketsWithSellers = await Promise.all(
        (data || []).map(async (ticket: any) => {
          const sellerId = ticket.seller_id || ticket.sellerId;
          const { data: sellerData } = await apiClient.from('sellers')
            .select('shop_name')
            .eq('id', sellerId)
            .single();
          return mapSellerTicket({ ...ticket, seller: sellerData });
        })
      );
      
      return ticketsWithSellers;
    },
    enabled: !!user
  });
};

export const useSellerTicketMessages = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      
      const { data, error } = await apiClient.from('seller_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapSellerTicketMessage);
    },
    enabled: !!ticketId
  });
};

// Buyer creates ticket to seller
export const useCreateTicketToSeller = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      sellerId, 
      orderId,
      subject, 
      message 
    }: { 
      sellerId: string; 
      orderId?: string;
      subject: string; 
      message: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if user is the seller
      const { data: seller } = await apiClient.from('sellers')
        .select('user_id')
        .eq('id', sellerId)
        .single();
      
      if (seller?.user_id === user.id) {
        throw new Error('Bạn không thể tạo ticket cho shop của chính mình');
      }
      
      // Create ticket
      const { data: ticket, error: ticketError } = await apiClient.from('seller_tickets')
        .insert({
          seller_id: sellerId,
          buyer_id: user.id,
          order_id: orderId || null,
          subject,
          status: 'open'
        })
        .select()
        .single();
      
      if (ticketError) throw ticketError;
      
      // Create first message
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'buyer',
          sender_id: user.id,
          message
        });
      
      return mapSellerTicket(ticket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
    }
  });
};

// Send message (buyer or seller)
export const useSendSellerTicketMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: seller } = useCurrentSeller();
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      message,
      senderType,
      attachments = []
    }: { 
      ticketId: string; 
      message: string;
      senderType: 'buyer' | 'seller';
      attachments?: SellerTicketAttachment[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: senderType,
          sender_id: senderType === 'seller' ? seller?.user_id : user.id,
          message,
          attachments: attachments
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update ticket status
      const newStatus = senderType === 'seller' ? 'pending' : 'open';
      await apiClient.from('seller_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      return mapSellerTicketMessage(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
    }
  });
};

// Seller invites admin to ticket
export const useInviteAdminToTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ 
          admin_joined: true, 
          admin_joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add notification message
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'seller',
          sender_id: user.id,
          message: '🛡️ Đã yêu cầu Admin tham gia hỗ trợ giải quyết.'
        });
      
      return mapSellerTicket(data);
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', ticketId] });
    }
  });
};

// Update ticket status
export const useUpdateSellerTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SellerTicket['status'] }) => {
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSellerTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
    }
  });
};

// Buyer invites admin to ticket
export const useBuyerInviteAdminToTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ 
          admin_joined: true, 
          admin_joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add notification message
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'buyer',
          sender_id: user.id,
          message: '🛡️ Người mua đã yêu cầu Admin tham gia hỗ trợ giải quyết.'
        });
      
      return mapSellerTicket(data);
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', ticketId] });
    }
  });
};

// Mark ticket as resolved (buyer or seller)
export const useMarkTicketResolved = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ ticketId, party }: { ticketId: string; party: 'buyer' | 'seller' }) => {
      if (!user) throw new Error('Not authenticated');
      
      // First get current ticket state
      const { data: ticket, error: fetchError } = await apiClient.from('seller_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (party === 'buyer') {
        updateData.buyer_resolved = true;
        updateData.buyer_resolved_at = new Date().toISOString();
      } else {
        updateData.seller_resolved = true;
        updateData.seller_resolved_at = new Date().toISOString();
      }
      
      // Check if both parties have resolved - auto close
      const otherResolved = party === 'buyer' 
        ? (ticket.seller_resolved || ticket.sellerResolved)
        : (ticket.buyer_resolved || ticket.buyerResolved);
      if (otherResolved) {
        updateData.status = 'closed';
      }
      
      const { data, error } = await apiClient.from('seller_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add message
      const partyName = party === 'buyer' ? 'Người mua' : 'Người bán';
      const message = otherResolved 
        ? `✅ ${partyName} đã xác nhận giải quyết. Cả hai bên đã đồng ý - ticket được đóng tự động.`
        : `✅ ${partyName} đã đánh dấu ticket là đã giải quyết. Chờ bên còn lại xác nhận.`;
      
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: party,
          sender_id: user.id,
          message
        });
      
      return mapSellerTicket(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', variables.ticketId] });
    }
  });
};

// Reopen ticket
export const useReopenTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ ticketId, party }: { ticketId: string; party: 'buyer' | 'seller' }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ 
          status: 'open',
          buyer_resolved: false,
          seller_resolved: false,
          buyer_resolved_at: null,
          seller_resolved_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      
      const partyName = party === 'buyer' ? 'Người mua' : 'Người bán';
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: party,
          sender_id: user.id,
          message: `🔄 ${partyName} đã mở lại ticket.`
        });
      
      return mapSellerTicket(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', variables.ticketId] });
    }
  });
};

// Admin: Get all seller tickets where admin has been invited
export const useAdminSellerTickets = () => {
  return useQuery({
    queryKey: ['admin-seller-tickets'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('seller_tickets')
        .select('*')
        .eq('admin_joined', true)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch seller and buyer info
      const ticketsWithDetails = await Promise.all(
        (data || []).map(async (ticket: any) => {
          let enriched = { ...ticket };
          const sellerId = ticket.seller_id || ticket.sellerId;
          const buyerId = ticket.buyer_id || ticket.buyerId;
          const orderId = ticket.order_id || ticket.orderId;
          
          // Get seller info
          const { data: seller } = await apiClient.from('sellers')
            .select('shop_name, shop_avatar_url')
            .eq('id', sellerId)
            .single();
          enriched.seller = seller;
          
          // Get buyer info
          if (buyerId) {
            const { data: profile } = await apiClient.from('profiles')
              .select('email, full_name, avatar_url')
              .eq('user_id', buyerId)
              .single();
            enriched.buyer = profile;
          }
          
          // Get order info
          if (orderId) {
            const { data: order } = await apiClient.from('seller_orders')
              .select('order_number')
              .eq('id', orderId)
              .single();
            enriched.order = order;
          }
          
          return mapSellerTicket(enriched);
        })
      );
      
      return ticketsWithDetails;
    }
  });
};

// Admin sends message to seller ticket
export const useAdminSendSellerTicketMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      message,
      adminId,
      attachments = []
    }: { 
      ticketId: string; 
      message: string;
      adminId: string;
      attachments?: SellerTicketAttachment[];
    }) => {
      const { data, error } = await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: adminId,
          message,
          attachments: attachments
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update ticket timestamp
      await apiClient.from('seller_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      return mapSellerTicketMessage(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-seller-tickets'] });
    }
  });
};

// Admin updates seller ticket status
export const useAdminUpdateSellerTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SellerTicket['status'] }) => {
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSellerTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-tickets'] });
    }
  });
};

// Admin resolves/closes ticket
export const useAdminMarkTicketResolved = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, adminId }: { ticketId: string; adminId: string }) => {
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add system message
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: adminId,
          message: '🔒 Admin đã đóng ticket.'
        });
      
      return mapSellerTicket(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', variables.ticketId] });
    }
  });
};

// Admin reopens ticket
export const useAdminReopenTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, adminId }: { ticketId: string; adminId: string }) => {
      const { data, error } = await apiClient.from('seller_tickets')
        .update({ 
          status: 'open',
          buyer_resolved: false,
          seller_resolved: false,
          buyer_resolved_at: null,
          seller_resolved_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add system message
      await apiClient.from('seller_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: adminId,
          message: '🔓 Admin đã mở lại ticket.'
        });
      
      return mapSellerTicket(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['seller-ticket-messages', variables.ticketId] });
    }
  });
};
