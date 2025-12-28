// Hooks for Support Tickets - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  ticket_number?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
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
  ticketId: string;
  senderType: string;
  senderId: string;
  message: string;
  createdAt: string;
  attachments?: TicketAttachment[];
  // Legacy mappings
  ticket_id?: string;
  sender_type?: string;
  sender_id?: string;
  created_at?: string;
}

const mapTicketToLegacy = (t: any): Ticket => ({
  ...t,
  ticket_number: t.ticketNumber,
  user_id: t.userId,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
});

const mapMessageToLegacy = (m: any): TicketMessage => ({
  ...m,
  ticket_id: m.ticketId,
  sender_type: m.senderType,
  sender_id: m.senderId,
  created_at: m.createdAt,
});

export function useTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('support_tickets')
        .select('*')
        .eq('userId', user?.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapTicketToLegacy) as Ticket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async ({ subject, category, message }: { subject: string; category: string; message: string }) => {
      if (!user) throw new Error('Bạn cần đăng nhập');

      // Generate ticket number
      const ticketNumber = `TK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Create ticket
      const { data: ticket, error: ticketError } = await db
        .from<any>('support_tickets')
        .insert({
          userId: user.id,
          ticketNumber,
          subject,
          category,
          status: 'open',
          priority: 'normal',
        })
        .select('*')
        .single();

      if (ticketError) throw ticketError;

      // Add first message
      const { error: messageError } = await db
        .from('ticket_messages')
        .insert({
          ticketId: ticket.id,
          senderType: 'user',
          senderId: user.id,
          message,
        });

      if (messageError) throw messageError;

      return mapTicketToLegacy(ticket);
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
      const { data, error } = await db
        .from<any>('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) throw error;
      return mapTicketToLegacy(data);
    },
    enabled: !!ticketId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('ticket_messages')
        .select('*')
        .eq('ticketId', ticketId)
        .order('createdAt', { ascending: true });
      
      if (error) throw error;
      return (data || []).map((msg: any) => ({
        ...mapMessageToLegacy(msg),
        attachments: msg.attachments || [],
      })) as TicketMessage[];
    },
    enabled: !!ticketId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ message, attachments = [] }: { message: string; attachments?: TicketAttachment[] }) => {
      if (!user) throw new Error('Bạn cần đăng nhập');

      const insertData: any = {
        ticketId,
        senderType: 'user',
        senderId: user.id,
        message,
      };

      if (attachments.length > 0) {
        insertData.attachments = attachments;
      }

      const { data, error } = await db
        .from<any>('ticket_messages')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;

      // Update ticket timestamp
      await db
        .from('support_tickets')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', ticketId);

      return mapMessageToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closeTicket = useMutation({
    mutationFn: async () => {
      const { error } = await db
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Đã đóng ticket');
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
    closeTicket,
  };
}

// Admin hooks
export function useAdminTickets() {
  return useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('support_tickets')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(data?.map((t: any) => t.userId) || [])];
      const { data: profiles } = userIds.length > 0 ? await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl')
        .in('userId', userIds) : { data: [] };

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
      }]) || []);

      return (data || []).map((t: any) => ({
        ...mapTicketToLegacy(t),
        user_profile: profileMap.get(t.userId),
      }));
    },
  });
}

export function useAdminSendTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, message, senderId, attachments = [] }: {
      ticketId: string;
      message: string;
      senderId: string;
      attachments?: TicketAttachment[];
    }) => {
      const insertData: any = {
        ticketId,
        senderType: 'admin',
        senderId,
        message,
      };

      if (attachments.length > 0) {
        insertData.attachments = attachments;
      }

      const { data, error } = await db
        .from<any>('ticket_messages')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;

      // Update ticket
      await db
        .from('support_tickets')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', ticketId);

      return mapMessageToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', variables.ticketId] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status, priority }: {
      ticketId: string;
      status?: string;
      priority?: string;
    }) => {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;

      const { error } = await db
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Đã cập nhật ticket');
    },
  });
}
