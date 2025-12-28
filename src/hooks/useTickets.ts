import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TicketAttachment {
  type: 'image' | 'sticker';
  url?: string;
  sticker?: {
    id: string;
    url: string;
    name: string;
  };
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string;
  message: string;
  created_at: string;
  attachments?: TicketAttachment[];
}

export function useTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async ({ subject, category, message }: { subject: string; category: string; message: string }) => {
      if (!user) throw new Error('Bạn cần đăng nhập');

      // Generate ticket number
      const ticketNumber = `TK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          ticket_number: ticketNumber,
          subject,
          category,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add first message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'user',
          sender_id: user.id,
          message,
        });

      if (messageError) throw messageError;

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Đã tạo ticket hỗ trợ thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    tickets,
    isLoading,
    createTicket,
  };
}

export function useTicketDetail(ticketId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) throw error;
      return data as Ticket;
    },
    enabled: !!ticketId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        attachments: (msg.attachments as unknown as TicketAttachment[]) || []
      })) as TicketMessage[];
    },
    enabled: !!ticketId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ message, attachments = [] }: { message: string; attachments?: TicketAttachment[] }) => {
      if (!user) throw new Error('Bạn cần đăng nhập');

      const insertData: any = {
        ticket_id: ticketId,
        sender_type: 'user',
        sender_id: user.id,
        message,
        attachments
      };

      const { error } = await supabase
        .from('ticket_messages')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      toast.success('Đã gửi tin nhắn');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    ticket,
    messages,
    isLoading: ticketLoading || messagesLoading,
    sendMessage,
  };
}

// Admin hook
export function useAdminTickets() {
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Ticket[];
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('Đã cập nhật trạng thái');
    },
  });

  const sendAdminMessage = useMutation({
    mutationFn: async ({ ticketId, message, adminId, attachments = [] }: { ticketId: string; message: string; adminId: string; attachments?: TicketAttachment[] }) => {
      const insertData: any = {
        ticket_id: ticketId,
        sender_type: 'admin',
        sender_id: adminId,
        message,
        attachments
      };

      const { error } = await supabase
        .from('ticket_messages')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', variables.ticketId] });
      toast.success('Đã gửi phản hồi');
    },
  });

  return {
    tickets,
    isLoading,
    updateTicketStatus,
    sendAdminMessage,
  };
}
