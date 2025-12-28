// Hooks for Email Templates - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  templateName: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  // Legacy mappings
  template_name?: string | null;
  error_message?: string | null;
  created_at?: string;
}

const mapTemplateToLegacy = (t: any): EmailTemplate => ({
  ...t,
  is_active: t.isActive,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
});

const mapLogToLegacy = (l: any): EmailLog => ({
  ...l,
  template_name: l.templateName,
  error_message: l.errorMessage,
  created_at: l.createdAt,
});

export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('email_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapTemplateToLegacy) as EmailTemplate[];
    },
  });
};

export const useCreateEmailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      subject: string;
      body: string;
      variables?: string[];
      is_active?: boolean;
    }) => {
      const { data, error } = await db
        .from('email_templates')
        .insert({
          name: template.name,
          subject: template.subject,
          body: template.body,
          variables: template.variables || null,
          isActive: template.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapTemplateToLegacy(data) as EmailTemplate;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });
};

export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EmailTemplate>) => {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.subject) updateData.subject = updates.subject;
      if (updates.body) updateData.body = updates.body;
      if (updates.variables !== undefined) updateData.variables = updates.variables;
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }

      const { data, error } = await db
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapTemplateToLegacy(data) as EmailTemplate;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });
};

export const useDeleteEmailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('email_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });
};

export const useEmailLogs = () => {
  return useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('email_logs')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map(mapLogToLegacy) as EmailLog[];
    },
  });
};

// Send email using template
export const useSendEmail = () => {
  return useMutation({
    mutationFn: async ({
      template_name,
      recipient,
      variables,
    }: {
      template_name: string;
      recipient: string;
      variables: Record<string, string>;
    }) => {
      const { data, error } = await rpc('send-email', {
        template_name,
        recipient,
        variables,
      });

      if (error) throw error;
      return data;
    },
  });
};
