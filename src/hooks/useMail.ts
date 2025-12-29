import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Mailbox,
  MailFolder,
  MailMessage,
  MailAttachment,
  MailLabel,
  MailContact,
  MailSettings,
  MailFilter,
  ComposeMailData,
  MailboxStats,
  MailAddress,
} from '@/types/mail';

// ========== MAILBOX HOOKS ==========

export const useMailbox = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mailbox', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mailboxes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Mailbox | null;
    },
    enabled: !!user?.id,
  });
};

export const useCreateMailbox = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      email_address: string; 
      display_name?: string; 
      domain_id?: string;
      local_part?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: mailbox, error } = await supabase
        .from('mailboxes')
        .insert({
          user_id: user.id,
          email_address: data.email_address,
          display_name: data.display_name || user.email?.split('@')[0] || 'User',
          domain_id: data.domain_id,
          local_part: data.local_part || data.email_address.split('@')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return mailbox as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailbox'] });
      toast.success('Tạo hộp thư thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdateMailbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Mailbox> & { id: string }) => {
      const { data: mailbox, error } = await supabase
        .from('mailboxes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mailbox as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailbox'] });
      toast.success('Cập nhật thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== FOLDER HOOKS ==========

export const useMailFolders = (mailboxId?: string) => {
  return useQuery({
    queryKey: ['mail-folders', mailboxId],
    queryFn: async () => {
      if (!mailboxId) return [];

      const { data, error } = await supabase
        .from('mail_folders')
        .select('*')
        .eq('mailbox_id', mailboxId)
        .order('sort_order');

      if (error) throw error;

      // Get unread counts for each folder
      const folders = data as MailFolder[];
      for (const folder of folders) {
        const { count } = await supabase
          .from('mail_messages')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id)
          .eq('is_read', false)
          .is('deleted_at', null);

        folder.unread_count = count || 0;
      }

      return folders;
    },
    enabled: !!mailboxId,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mailbox_id: string; name: string; color?: string; icon?: string }) => {
      const slug = data.name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      const { data: folder, error } = await supabase
        .from('mail_folders')
        .insert({
          ...data,
          slug,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return folder as MailFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      toast.success('Tạo thư mục thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from('mail_folders')
        .delete()
        .eq('id', folderId)
        .eq('is_system', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      toast.success('Xóa thư mục thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== MESSAGE HOOKS ==========

export const useMailMessages = (
  mailboxId?: string,
  folderId?: string,
  options?: {
    search?: string;
    isStarred?: boolean;
    isImportant?: boolean;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['mail-messages', mailboxId, folderId, options],
    queryFn: async () => {
      if (!mailboxId) return { messages: [], total: 0 };

      let query = supabase
        .from('mail_messages')
        .select('*, mail_attachments(*)', { count: 'exact' })
        .eq('mailbox_id', mailboxId)
        .is('deleted_at', null)
        .order('received_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      if (options?.isStarred) {
        query = query.eq('is_starred', true);
      }

      if (options?.isImportant) {
        query = query.eq('is_important', true);
      }

      if (options?.search) {
        query = query.or(`subject.ilike.%${options.search}%,body_text.ilike.%${options.search}%,from_address.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 25) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { 
        messages: data as MailMessage[], 
        total: count || 0 
      };
    },
    enabled: !!mailboxId,
  });
};

export const useMailMessage = (messageId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['mail-message', messageId],
    queryFn: async () => {
      if (!messageId) return null;

      const { data, error } = await supabase
        .from('mail_messages')
        .select('*, mail_attachments(*)')
        .eq('id', messageId)
        .single();

      if (error) throw error;

      // Mark as read when opened
      if (data && !data.is_read) {
        await supabase
          .from('mail_messages')
          .update({ is_read: true })
          .eq('id', messageId);

        queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
        queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      }

      return data as MailMessage;
    },
    enabled: !!messageId,
  });
};

export const useSendMail = () => {
  const queryClient = useQueryClient();
  const { data: mailbox } = useMailbox();

  return useMutation({
    mutationFn: async (data: ComposeMailData) => {
      if (!mailbox) throw new Error('Mailbox not found');

      // Parse email addresses
      const parseAddresses = (str?: string): MailAddress[] => {
        if (!str) return [];
        return str.split(',').map(e => {
          const trimmed = e.trim();
          const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
          if (match) {
            return { name: match[1].trim(), email: match[2].trim() };
          }
          return { email: trimmed };
        }).filter(a => a.email);
      };

      // Get sent folder
      const { data: sentFolder } = await supabase
        .from('mail_folders')
        .select('id')
        .eq('mailbox_id', mailbox.id)
        .eq('slug', 'sent')
        .single();

      if (!sentFolder) throw new Error('Sent folder not found');

      // Generate message ID
      const messageId = `<${crypto.randomUUID()}@${mailbox.email_address.split('@')[1]}>`;

      // Create preview from body
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.body;
      const preview = tempDiv.textContent?.substring(0, 200) || '';

      // Create the message
      const { data: message, error } = await supabase
        .from('mail_messages')
        .insert({
          mailbox_id: mailbox.id,
          folder_id: data.isDraft ? await getDraftFolderId(mailbox.id) : sentFolder.id,
          message_id: messageId,
          from_address: mailbox.email_address,
          from_name: mailbox.display_name,
          to_addresses: parseAddresses(data.to),
          cc_addresses: parseAddresses(data.cc),
          bcc_addresses: parseAddresses(data.bcc),
          subject: data.subject,
          body_text: tempDiv.textContent,
          body_html: data.isHtml ? data.body : `<p>${data.body.replace(/\n/g, '<br>')}</p>`,
          preview,
          priority: data.priority || 'normal',
          is_draft: data.isDraft || false,
          is_sent: !data.isDraft,
          scheduled_at: data.scheduledAt?.toISOString(),
          sent_at: data.isDraft ? null : new Date().toISOString(),
          in_reply_to: data.replyTo,
          thread_id: data.threadId,
          is_read: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Deliver to recipients (simulated - in real app would use SMTP)
      if (!data.isDraft) {
        await deliverMailToRecipients(message as MailMessage);
      }

      return message as MailMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      toast.success(variables.isDraft ? 'Đã lưu nháp!' : 'Gửi mail thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// Helper function to get draft folder id
const getDraftFolderId = async (mailboxId: string): Promise<string> => {
  const { data } = await supabase
    .from('mail_folders')
    .select('id')
    .eq('mailbox_id', mailboxId)
    .eq('slug', 'drafts')
    .single();

  if (!data) throw new Error('Draft folder not found');
  return data.id;
};

// Simulated mail delivery - creates a copy in recipient's inbox if they have a mailbox
const deliverMailToRecipients = async (message: MailMessage) => {
  const allRecipients = [
    ...message.to_addresses,
    ...(message.cc_addresses || []),
  ];

  for (const recipient of allRecipients) {
    // Find recipient's mailbox
    const { data: recipientMailbox } = await supabase
      .from('mailboxes')
      .select('id')
      .eq('email_address', recipient.email)
      .eq('is_active', true)
      .single();

    if (recipientMailbox) {
      // Get their inbox folder
      const { data: inboxFolder } = await supabase
        .from('mail_folders')
        .select('id')
        .eq('mailbox_id', recipientMailbox.id)
        .eq('slug', 'inbox')
        .single();

      if (inboxFolder) {
        // Create a copy in their inbox
        await supabase.from('mail_messages').insert({
          mailbox_id: recipientMailbox.id,
          folder_id: inboxFolder.id,
          message_id: message.message_id,
          in_reply_to: message.in_reply_to,
          thread_id: message.thread_id,
          from_address: message.from_address,
          from_name: message.from_name,
          to_addresses: message.to_addresses,
          cc_addresses: message.cc_addresses,
          subject: message.subject,
          body_text: message.body_text,
          body_html: message.body_html,
          preview: message.preview,
          priority: message.priority,
          is_read: false,
          is_sent: false,
          has_attachments: message.has_attachments,
        });
      }
    }
  }
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MailMessage> & { id: string }) => {
      const { data: message, error } = await supabase
        .from('mail_messages')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return message as MailMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-message'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
    },
  });
};

export const useMoveToFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, folderId }: { messageIds: string[]; folderId: string }) => {
      const { error } = await supabase
        .from('mail_messages')
        .update({ folder_id: folderId })
        .in('id', messageIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      toast.success('Di chuyển thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, permanent = false }: { messageIds: string[]; permanent?: boolean }) => {
      if (permanent) {
        const { error } = await supabase
          .from('mail_messages')
          .delete()
          .in('id', messageIds);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mail_messages')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', messageIds);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      toast.success(variables.permanent ? 'Đã xóa vĩnh viễn!' : 'Đã chuyển vào thùng rác!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, isRead }: { messageIds: string[]; isRead: boolean }) => {
      const { error } = await supabase
        .from('mail_messages')
        .update({ is_read: isRead })
        .in('id', messageIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
    },
  });
};

export const useToggleStar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, isStarred }: { messageId: string; isStarred: boolean }) => {
      const { error } = await supabase
        .from('mail_messages')
        .update({ is_starred: isStarred })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-message'] });
    },
  });
};

// ========== LABEL HOOKS ==========

export const useMailLabels = (mailboxId?: string) => {
  return useQuery({
    queryKey: ['mail-labels', mailboxId],
    queryFn: async () => {
      if (!mailboxId) return [];

      const { data, error } = await supabase
        .from('mail_labels')
        .select('*')
        .eq('mailbox_id', mailboxId)
        .order('name');

      if (error) throw error;
      return data as MailLabel[];
    },
    enabled: !!mailboxId,
  });
};

export const useCreateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mailbox_id: string; name: string; color?: string }) => {
      const { data: label, error } = await supabase
        .from('mail_labels')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return label as MailLabel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-labels'] });
      toast.success('Tạo nhãn thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== CONTACT HOOKS ==========

export const useMailContacts = (mailboxId?: string) => {
  return useQuery({
    queryKey: ['mail-contacts', mailboxId],
    queryFn: async () => {
      if (!mailboxId) return [];

      const { data, error } = await supabase
        .from('mail_contacts')
        .select('*')
        .eq('mailbox_id', mailboxId)
        .order('name');

      if (error) throw error;
      return data as MailContact[];
    },
    enabled: !!mailboxId,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mailbox_id: string; email: string; name?: string }) => {
      const { data: contact, error } = await supabase
        .from('mail_contacts')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return contact as MailContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-contacts'] });
      toast.success('Thêm liên hệ thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== STATS HOOKS ==========

export const useMailboxStats = (mailboxId?: string) => {
  return useQuery({
    queryKey: ['mailbox-stats', mailboxId],
    queryFn: async () => {
      if (!mailboxId) return null;

      const stats: MailboxStats = {
        total_messages: 0,
        unread_count: 0,
        starred_count: 0,
        draft_count: 0,
        sent_count: 0,
        spam_count: 0,
        trash_count: 0,
        storage_used: 0,
      };

      // Get counts
      const { count: total } = await supabase
        .from('mail_messages')
        .select('*', { count: 'exact', head: true })
        .eq('mailbox_id', mailboxId)
        .is('deleted_at', null);
      stats.total_messages = total || 0;

      const { count: unread } = await supabase
        .from('mail_messages')
        .select('*', { count: 'exact', head: true })
        .eq('mailbox_id', mailboxId)
        .eq('is_read', false)
        .is('deleted_at', null);
      stats.unread_count = unread || 0;

      const { count: starred } = await supabase
        .from('mail_messages')
        .select('*', { count: 'exact', head: true })
        .eq('mailbox_id', mailboxId)
        .eq('is_starred', true)
        .is('deleted_at', null);
      stats.starred_count = starred || 0;

      const { count: drafts } = await supabase
        .from('mail_messages')
        .select('*', { count: 'exact', head: true })
        .eq('mailbox_id', mailboxId)
        .eq('is_draft', true)
        .is('deleted_at', null);
      stats.draft_count = drafts || 0;

      const { count: sent } = await supabase
        .from('mail_messages')
        .select('*', { count: 'exact', head: true })
        .eq('mailbox_id', mailboxId)
        .eq('is_sent', true)
        .is('deleted_at', null);
      stats.sent_count = sent || 0;

      return stats;
    },
    enabled: !!mailboxId,
  });
};

// ========== SETTINGS HOOKS ==========

export const useMailSettings = (mailboxId?: string) => {
  return useQuery({
    queryKey: ['mail-settings', mailboxId],
    queryFn: async () => {
      if (!mailboxId) return null;

      const { data, error } = await supabase
        .from('mail_settings')
        .select('*')
        .eq('mailbox_id', mailboxId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MailSettings | null;
    },
    enabled: !!mailboxId,
  });
};

export const useUpdateMailSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mailbox_id, ...data }: Partial<MailSettings> & { mailbox_id: string }) => {
      const { data: settings, error } = await supabase
        .from('mail_settings')
        .update(data)
        .eq('mailbox_id', mailbox_id)
        .select()
        .single();

      if (error) throw error;
      return settings as MailSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-settings'] });
      toast.success('Cập nhật cài đặt thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};
