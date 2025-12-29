import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  MailDomain,
  MailDomainAdmin,
  Mailbox,
  MailAlias,
  MailDistributionList,
  MailActivityLog,
  MailSecuritySettings,
  CreateDomainData,
  CreateMailboxData,
  DomainStats,
} from '@/types/mail';

// ========== DOMAIN HOOKS ==========

export const useMailDomains = () => {
  return useQuery({
    queryKey: ['mail-domains'],
    queryFn: async () => {
      const { data, error } = await db
        .from('mail_domains')
        .select('*')
        .order('is_default', { ascending: false })
        .order('domain');

      if (error) throw error;

      // Get mailbox counts for each domain
      const domains = data as MailDomain[];
      for (const domain of domains) {
        const { count } = await db
          .from('mailboxes')
          .select('*', { count: 'exact', head: true })
          .eq('domain_id', domain.id);
        domain.mailbox_count = count || 0;
      }

      return domains;
    },
  });
};

export const useMailDomain = (domainId?: string) => {
  return useQuery({
    queryKey: ['mail-domain', domainId],
    queryFn: async () => {
      if (!domainId) return null;

      const { data, error } = await db
        .from('mail_domains')
        .select('*')
        .eq('id', domainId)
        .single();

      if (error) throw error;
      return data as MailDomain;
    },
    enabled: !!domainId,
  });
};

export const usePublicDomains = () => {
  return useQuery({
    queryKey: ['mail-domains-public'],
    queryFn: async () => {
      const { data, error } = await db
        .from('mail_domains')
        .select('id, domain, display_name, max_storage_mb, max_message_size_mb')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as Pick<MailDomain, 'id' | 'domain' | 'display_name' | 'max_storage_mb' | 'max_message_size_mb'>[];
    },
  });
};

export const useCreateDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDomainData) => {
      const { data: domain, error } = await db
        .from('mail_domains')
        .insert({
          domain: data.domain.toLowerCase(),
          display_name: data.display_name || data.domain,
          description: data.description,
          is_public: data.is_public ?? false,
          max_mailboxes: data.max_mailboxes ?? 0,
          max_storage_mb: data.max_storage_mb ?? 1024,
        })
        .select()
        .single();

      if (error) throw error;
      return domain as MailDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      toast.success('Tạo tên miền thành công!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Tên miền đã tồn tại!');
      } else {
        toast.error(`Lỗi: ${error.message}`);
      }
    },
  });
};

export const useUpdateDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MailDomain> & { id: string }) => {
      const { data: domain, error } = await db
        .from('mail_domains')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return domain as MailDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      queryClient.invalidateQueries({ queryKey: ['mail-domain'] });
      toast.success('Cập nhật thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainId: string) => {
      // Check if domain has mailboxes
      const { count } = await db
        .from('mailboxes')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainId);

      if (count && count > 0) {
        throw new Error(`Không thể xóa! Còn ${count} mailbox trong domain này.`);
      }

      const { error } = await db
        .from('mail_domains')
        .delete()
        .eq('id', domainId)
        .eq('is_default', false); // Cannot delete default domain

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      toast.success('Xóa tên miền thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// ========== DOMAIN ADMIN HOOKS ==========

export const useDomainAdmins = (domainId?: string) => {
  return useQuery({
    queryKey: ['domain-admins', domainId],
    queryFn: async () => {
      if (!domainId) return [];

      const { data, error } = await db
        .from('mail_domain_admins')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('domain_id', domainId);

      if (error) throw error;
      return data as (MailDomainAdmin & { profiles: any })[];
    },
    enabled: !!domainId,
  });
};

export const useAddDomainAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { domain_id: string; user_id: string; role?: 'owner' | 'admin' | 'manager' }) => {
      const { data: admin, error } = await db
        .from('mail_domain_admins')
        .insert({
          domain_id: data.domain_id,
          user_id: data.user_id,
          role: data.role || 'admin',
        })
        .select()
        .single();

      if (error) throw error;
      return admin as MailDomainAdmin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-admins'] });
      toast.success('Thêm quản trị viên thành công!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Người dùng đã là quản trị viên!');
      } else {
        toast.error(`Lỗi: ${error.message}`);
      }
    },
  });
};

export const useRemoveDomainAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await db
        .from('mail_domain_admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-admins'] });
      toast.success('Xóa quản trị viên thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== MAILBOX ADMIN HOOKS ==========

export const useAdminMailboxes = (domainId?: string) => {
  return useQuery({
    queryKey: ['admin-mailboxes', domainId],
    queryFn: async () => {
      let query = db
        .from('mailboxes')
        .select(`
          *,
          mail_domains:domain_id (
            id,
            domain,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Mailbox & { mail_domains: any })[];
    },
  });
};

export const useAdminCreateMailbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMailboxData) => {
      // Get domain info
      const { data: domain } = await db
        .from('mail_domains')
        .select('domain, max_storage_mb')
        .eq('id', data.domain_id)
        .single();

      if (!domain) throw new Error('Domain not found');

      const email_address = `${data.local_part.toLowerCase()}@${domain.domain}`;

      // Check if email exists
      const { count } = await db
        .from('mailboxes')
        .select('*', { count: 'exact', head: true })
        .eq('email_address', email_address);

      if (count && count > 0) {
        throw new Error('Email này đã tồn tại!');
      }

      const { data: mailbox, error } = await db
        .from('mailboxes')
        .insert({
          domain_id: data.domain_id,
          user_id: data.user_id || null,
          local_part: data.local_part.toLowerCase(),
          email_address,
          display_name: data.display_name || data.local_part,
          role: data.role || 'user',
          quota_mb: data.quota_mb || domain.max_storage_mb,
          can_send_external: data.can_send_external ?? false,
          can_receive_external: data.can_receive_external ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return mailbox as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mailboxes'] });
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      toast.success('Tạo mailbox thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useAdminUpdateMailbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Mailbox> & { id: string }) => {
      const { data: mailbox, error } = await db
        .from('mailboxes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mailbox as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mailboxes'] });
      toast.success('Cập nhật thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useAdminDeleteMailbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mailboxId: string) => {
      const { error } = await db
        .from('mailboxes')
        .delete()
        .eq('id', mailboxId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mailboxes'] });
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      toast.success('Xóa mailbox thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== ALIAS HOOKS ==========

export const useMailAliases = (domainId?: string) => {
  return useQuery({
    queryKey: ['mail-aliases', domainId],
    queryFn: async () => {
      let query = db
        .from('mail_aliases')
        .select(`
          *,
          mailboxes:mailbox_id (
            id,
            email_address,
            display_name
          ),
          mail_domains:domain_id (
            domain
          )
        `)
        .order('local_part');

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (MailAlias & { mailboxes: any; mail_domains: any })[];
    },
  });
};

export const useCreateAlias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { domain_id: string; local_part: string; mailbox_id: string }) => {
      const { data: alias, error } = await db
        .from('mail_aliases')
        .insert({
          domain_id: data.domain_id,
          local_part: data.local_part.toLowerCase(),
          mailbox_id: data.mailbox_id,
        })
        .select()
        .single();

      if (error) throw error;
      return alias as MailAlias;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-aliases'] });
      toast.success('Tạo alias thành công!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Alias này đã tồn tại!');
      } else {
        toast.error(`Lỗi: ${error.message}`);
      }
    },
  });
};

export const useDeleteAlias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aliasId: string) => {
      const { error } = await db
        .from('mail_aliases')
        .delete()
        .eq('id', aliasId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-aliases'] });
      toast.success('Xóa alias thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== DISTRIBUTION LIST HOOKS ==========

export const useDistributionLists = (domainId?: string) => {
  return useQuery({
    queryKey: ['distribution-lists', domainId],
    queryFn: async () => {
      let query = db
        .from('mail_distribution_lists')
        .select('*')
        .order('local_part');

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get member counts
      const lists = data as MailDistributionList[];
      for (const list of lists) {
        const { count } = await db
          .from('mail_distribution_list_members')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)
          .eq('is_active', true);
        list.member_count = count || 0;
      }

      return lists;
    },
  });
};

export const useCreateDistributionList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      domain_id: string;
      local_part: string;
      display_name?: string;
      description?: string;
      allow_external_senders?: boolean;
    }) => {
      const { data: list, error } = await db
        .from('mail_distribution_lists')
        .insert({
          domain_id: data.domain_id,
          local_part: data.local_part.toLowerCase(),
          display_name: data.display_name,
          description: data.description,
          allow_external_senders: data.allow_external_senders ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return list as MailDistributionList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-lists'] });
      toast.success('Tạo danh sách phân phối thành công!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Danh sách này đã tồn tại!');
      } else {
        toast.error(`Lỗi: ${error.message}`);
      }
    },
  });
};

// ========== ACTIVITY LOG HOOKS ==========

export const useMailActivityLogs = (filters?: {
  domain_id?: string;
  mailbox_id?: string;
  action?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['mail-activity-logs', filters],
    queryFn: async () => {
      let query = db
        .from('mail_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.domain_id) {
        query = query.eq('domain_id', filters.domain_id);
      }

      if (filters?.mailbox_id) {
        query = query.eq('mailbox_id', filters.mailbox_id);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MailActivityLog[];
    },
  });
};

// ========== SECURITY SETTINGS HOOKS ==========

export const useMailSecuritySettings = (domainId?: string) => {
  return useQuery({
    queryKey: ['mail-security', domainId],
    queryFn: async () => {
      if (!domainId) return null;

      const { data, error } = await db
        .from('mail_security_settings')
        .select('*')
        .eq('domain_id', domainId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MailSecuritySettings | null;
    },
    enabled: !!domainId,
  });
};

export const useUpdateSecuritySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ domain_id, ...data }: Partial<MailSecuritySettings> & { domain_id: string }) => {
      // Upsert security settings
      const { data: settings, error } = await db
        .from('mail_security_settings')
        .upsert({
          domain_id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return settings as MailSecuritySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-security'] });
      toast.success('Cập nhật cài đặt bảo mật thành công!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ========== DOMAIN STATS HOOKS ==========

export const useDomainStats = (domainId?: string) => {
  return useQuery({
    queryKey: ['domain-stats', domainId],
    queryFn: async () => {
      if (!domainId) return null;

      const stats: DomainStats = {
        domain_id: domainId,
        total_mailboxes: 0,
        active_mailboxes: 0,
        total_messages: 0,
        total_storage_mb: 0,
        messages_today: 0,
        messages_week: 0,
      };

      // Get mailbox counts
      const { count: total } = await db
        .from('mailboxes')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainId);
      stats.total_mailboxes = total || 0;

      const { count: active } = await db
        .from('mailboxes')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .eq('is_active', true);
      stats.active_mailboxes = active || 0;

      // Get storage used
      const { data: mailboxes } = await db
        .from('mailboxes')
        .select('used_storage_mb')
        .eq('domain_id', domainId);

      if (mailboxes) {
        stats.total_storage_mb = mailboxes.reduce((sum, m) => sum + (m.used_storage_mb || 0), 0);
      }

      return stats;
    },
    enabled: !!domainId,
  });
};

// ========== PERMISSION CHECK HOOKS ==========

export const useCanManageDomain = (domainId?: string) => {
  return useQuery({
    queryKey: ['can-manage-domain', domainId],
    queryFn: async () => {
      if (!domainId) return false;

      const { data: { user } } = await auth.getUser();
      if (!user) return false;

      // Check if user is domain admin
      const { count } = await db
        .from('mail_domain_admins')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .eq('user_id', user.id);

      return (count || 0) > 0;
    },
    enabled: !!domainId,
  });
};

// ========== SYSTEM MAILBOX HOOKS ==========

// Get system mailbox (noreply@...)
export const useSystemMailbox = () => {
  return useQuery({
    queryKey: ['system-mailbox'],
    queryFn: async () => {
      // Get default domain first
      const { data: defaultDomain } = await db
        .from('mail_domains')
        .select('domain')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (!defaultDomain) return null;

      const systemEmail = `noreply@${defaultDomain.domain}`;

      const { data, error } = await db
        .from('mailboxes')
        .select('*')
        .eq('email_address', systemEmail)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Mailbox | null;
    },
  });
};

// Get sent emails from system mailbox
export const useSystemSentEmails = (page = 1, limit = 50) => {
  const { data: systemMailbox } = useSystemMailbox();

  return useQuery({
    queryKey: ['system-sent-emails', systemMailbox?.id, page, limit],
    queryFn: async () => {
      if (!systemMailbox) return { messages: [], total: 0 };

      // Get sent folder
      const { data: sentFolder } = await db
        .from('mail_folders')
        .select('id')
        .eq('mailbox_id', systemMailbox.id)
        .eq('slug', 'sent')
        .single();

      if (!sentFolder) return { messages: [], total: 0 };

      const { data, error, count } = await db
        .from('mail_messages')
        .select('*', { count: 'exact' })
        .eq('folder_id', sentFolder.id)
        .order('sent_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        messages: data || [],
        total: count || 0,
      };
    },
    enabled: !!systemMailbox,
  });
};

