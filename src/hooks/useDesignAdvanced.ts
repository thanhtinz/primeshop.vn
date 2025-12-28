import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============= INTERFACES =============

export interface DesignLicenseType {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price_multiplier: number;
  includes_commercial_use: boolean;
  includes_exclusive_rights: boolean;
  includes_source_files: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DesignMilestone {
  id: string;
  order_id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  deadline: string | null;
  escrow_amount: number | null;
  escrow_status: string | null;
  status: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  buyer_feedback: string | null;
  seller_notes: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DesignNDA {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  requires_nda: boolean;
  no_portfolio_use: boolean;
  confidentiality_period_days: number;
  nda_fee: number;
  buyer_signed_at: string | null;
  seller_signed_at: string | null;
  violated_at: string | null;
  violation_penalty: number | null;
  violation_reason: string | null;
  created_at: string;
}

export interface DesignRevisionPackage {
  id: string;
  order_id: string;
  buyer_id: string | null;
  seller_id: string | null;
  quantity: number;
  price_per_revision: number;
  total_price: number;
  escrow_status: string | null;
  purchased_at: string | null;
  used_count: number | null;
  created_at: string | null;
}

export interface DesignTicketCollaborator {
  id: string;
  ticket_id: string;
  order_id: string;
  seller_id: string;
  collaborator_id: string;
  role: string | null;
  permissions: string[] | null;
  is_active: boolean | null;
  added_at: string | null;
  removed_at: string | null;
}

export interface DesignTicketInternalNote {
  id: string;
  ticket_id: string;
  order_id: string;
  author_id: string;
  content: string;
  mentioned_user_ids: string[] | null;
  attachments: any;
  is_task: boolean | null;
  task_status: string | null;
  task_assignee_id: string | null;
  task_deadline: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DesignServiceTemplate {
  id: string;
  service_id: string;
  seller_id: string;
  name: string;
  description: string | null;
  form_fields: FormField[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'file' | 'color';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface DesignTeamMember {
  id: string;
  seller_id: string;
  member_user_id: string;
  role: 'owner' | 'designer' | 'support' | 'viewer';
  can_view_orders: boolean;
  can_manage_orders: boolean;
  can_chat_buyers: boolean;
  can_manage_finances: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member?: {
    user_id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    email: string;
  };
}

export interface DesignSellerReward {
  id: string;
  seller_id: string;
  reward_type: string;
  amount: number;
  description: string | null;
  order_id: string | null;
  awarded_at: string;
  expires_at: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
}

export interface DesignSellerPenalty {
  id: string;
  seller_id: string;
  penalty_type: string;
  severity: 'warning' | 'minor' | 'major' | 'critical';
  amount: number;
  trust_score_deduction: number;
  description: string | null;
  order_id: string | null;
  is_appealed: boolean;
  appeal_reason: string | null;
  appeal_status: 'pending' | 'approved' | 'rejected' | null;
  issued_at: string;
  expires_at: string | null;
  resolved_at: string | null;
}

export interface DesignEmailLog {
  id: string;
  order_id: string | null;
  ticket_id: string | null;
  recipient_email: string;
  recipient_user_id: string | null;
  email_type: string;
  subject: string;
  content: string | null;
  template_used: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  status: string;
}

export interface DesignAbuseReport {
  id: string;
  reporter_id: string | null;
  reported_user_id: string;
  order_id: string | null;
  ticket_id: string | null;
  abuse_type: string;
  description: string | null;
  evidence: any;
  ai_confidence_score: number | null;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DesignPlatformFee {
  id: string;
  fee_type: string;
  name: string;
  description: string | null;
  fee_percent: number;
  fee_fixed: number;
  min_fee: number;
  max_fee: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignSellerMatchProfile {
  id: string;
  seller_id: string;
  categories: string[];
  specialties: string[];
  avg_response_time_hours: number;
  avg_completion_days: number;
  on_time_rate: number;
  acceptance_rate: number;
  current_workload: number;
  max_concurrent_orders: number;
  is_available: boolean;
  priority_score: number;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignSellerDailyStats {
  id: string;
  seller_id: string;
  stat_date: string;
  orders_received: number;
  orders_completed: number;
  orders_cancelled: number;
  orders_disputed: number;
  revenue: number;
  avg_completion_hours: number | null;
  on_time_count: number;
  late_count: number;
  messages_sent: number;
  profile_views: number;
  service_views: number;
  created_at: string;
}

// ============= LICENSE TYPES =============

export const useDesignLicenseTypes = () => {
  return useQuery({
    queryKey: ['design-license-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_license_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as DesignLicenseType[];
    },
  });
};

// ============= MILESTONES =============

export const useDesignMilestones = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-milestones', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_order_milestones')
        .select('*')
        .eq('order_id', orderId)
        .order('sort_order');
      
      if (error) throw error;
      return data as DesignMilestone[];
    },
    enabled: !!orderId,
  });
};

export const useCreateDesignMilestone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (milestone: Omit<DesignMilestone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('design_order_milestones')
        .insert(milestone)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-milestones', variables.order_id] });
      toast.success('Đã tạo milestone');
    },
  });
};

export const useUpdateDesignMilestone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, orderId, ...updates }: { id: string; orderId: string; status?: string; buyer_feedback?: string; seller_notes?: string; submitted_at?: string; approved_at?: string }) => {
      const { data, error } = await supabase
        .from('design_order_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-milestones', variables.orderId] });
      toast.success('Đã cập nhật milestone');
    },
  });
};

// ============= SERVICE TEMPLATES =============

export const useDesignServiceTemplates = (serviceId: string | undefined) => {
  return useQuery({
    queryKey: ['design-service-templates', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_service_templates')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        form_fields: (item.form_fields as unknown as FormField[]) || []
      })) as DesignServiceTemplate[];
    },
    enabled: !!serviceId,
  });
};

export const useSellerDesignTemplates = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-design-templates', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_service_templates')
        .select('*, service:design_services!design_service_templates_service_id_fkey(id, name)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });
};

export const useCreateDesignTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: { service_id: string; seller_id: string; name: string; description?: string; form_fields: FormField[]; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from('design_service_templates')
        .insert({ ...template, form_fields: template.form_fields as any })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-service-templates'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-templates'] });
      toast.success('Đã tạo template');
    },
  });
};

export const useUpdateDesignTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, form_fields, ...updates }: { id: string; name?: string; description?: string; form_fields?: FormField[]; is_default?: boolean; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('design_service_templates')
        .update({ ...updates, ...(form_fields ? { form_fields: form_fields as any } : {}) })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-service-templates'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-templates'] });
      toast.success('Đã cập nhật template');
    },
  });
};

export const useDeleteDesignTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_service_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-service-templates'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-templates'] });
      toast.success('Đã xóa template');
    },
  });
};

// ============= TEAM MEMBERS =============

export const useDesignTeamMembers = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['design-team-members', sellerId],
    queryFn: async () => {
      // Fetch team members
      const { data: members, error } = await supabase
        .from('design_team_members')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('role');
      
      if (error) throw error;
      if (!members || members.length === 0) return [];
      
      // Fetch profiles for team members
      const memberIds = members.map(m => m.member_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, email')
        .in('user_id', memberIds);
      
      // Merge profiles into members
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return members.map(member => ({
        ...member,
        member: profileMap.get(member.member_user_id) || null,
      })) as DesignTeamMember[];
    },
    enabled: !!sellerId,
  });
};

export const useAddDesignTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: { seller_id: string; member_user_id: string; role: string; can_view_orders?: boolean; can_manage_orders?: boolean; can_chat_buyers?: boolean; can_manage_finances?: boolean }) => {
      const { data, error } = await supabase
        .from('design_team_members')
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-team-members', variables.seller_id] });
      toast.success('Đã thêm thành viên');
    },
  });
};

export const useUpdateDesignTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, sellerId, ...updates }: { id: string; sellerId: string; role?: string; can_view_orders?: boolean; can_manage_orders?: boolean; can_chat_buyers?: boolean; can_manage_finances?: boolean; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('design_team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-team-members', variables.sellerId] });
      toast.success('Đã cập nhật thành viên');
    },
  });
};

// ============= REVISION PACKAGES =============

export const useDesignRevisionPackages = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-revision-packages', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_revision_packages')
        .select('*')
        .eq('order_id', orderId)
        .order('purchased_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignRevisionPackage[];
    },
    enabled: !!orderId,
  });
};

export const usePurchaseRevisionPackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, quantity, pricePerRevision }: { orderId: string; quantity: number; pricePerRevision: number }) => {
      // Use atomic RPC function for safe transaction with escrow
      const { data, error } = await supabase.rpc('purchase_design_revision_package', {
        p_order_id: orderId,
        p_quantity: quantity,
        p_price_per_revision: pricePerRevision,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; package_id?: string; total_price?: number; new_balance?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể mua gói chỉnh sửa');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-revision-packages', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['design-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Đã mua thêm lượt chỉnh sửa');
    },
  });
};

// ============= REWARDS & PENALTIES =============

export const useDesignSellerRewards = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['design-seller-rewards', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_seller_rewards')
        .select('*')
        .eq('seller_id', sellerId)
        .order('awarded_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignSellerReward[];
    },
    enabled: !!sellerId,
  });
};

export const useDesignSellerPenalties = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['design-seller-penalties', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_seller_penalties')
        .select('*')
        .eq('seller_id', sellerId)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignSellerPenalty[];
    },
    enabled: !!sellerId,
  });
};

export const useClaimDesignReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, sellerId }: { id: string; sellerId: string }) => {
      const { data, error } = await supabase
        .from('design_seller_rewards')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-seller-rewards', variables.sellerId] });
      toast.success('Đã nhận thưởng');
    },
  });
};

export const useAppealDesignPenalty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, sellerId, appealReason }: { id: string; sellerId: string; appealReason: string }) => {
      const { data, error } = await supabase
        .from('design_seller_penalties')
        .update({ is_appealed: true, appeal_reason: appealReason, appeal_status: 'pending' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-seller-penalties', variables.sellerId] });
      toast.success('Đã gửi khiếu nại');
    },
  });
};

// ============= EMAIL LOGS =============

export const useDesignEmailLogs = (orderId?: string, ticketId?: string) => {
  return useQuery({
    queryKey: ['design-email-logs', orderId, ticketId],
    queryFn: async () => {
      let query = supabase.from('design_email_logs').select('*');
      
      if (orderId) query = query.eq('order_id', orderId);
      if (ticketId) query = query.eq('ticket_id', ticketId);
      
      const { data, error } = await query.order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignEmailLog[];
    },
    enabled: !!orderId || !!ticketId,
  });
};

// ============= ABUSE REPORTS =============

export const useCreateAbuseReport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: { reported_user_id: string; order_id?: string; ticket_id?: string; abuse_type: string; description?: string; evidence?: any }) => {
      const { data, error } = await supabase
        .from('design_abuse_reports')
        .insert({
          ...report,
          reporter_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-abuse-reports'] });
      toast.success('Đã gửi báo cáo vi phạm');
    },
  });
};

// ============= PLATFORM FEES =============

export const useDesignPlatformFees = () => {
  return useQuery({
    queryKey: ['design-platform-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_platform_fees')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as DesignPlatformFee[];
    },
  });
};

// ============= SELLER MATCH PROFILE =============

export const useDesignSellerMatchProfile = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['design-seller-match-profile', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_seller_match_profiles')
        .select('*')
        .eq('seller_id', sellerId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as DesignSellerMatchProfile | null;
    },
    enabled: !!sellerId,
  });
};

export const useUpdateDesignMatchProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sellerId, ...updates }: { sellerId: string; is_available?: boolean; max_concurrent_orders?: number; categories?: string[]; specialties?: string[] }) => {
      // Upsert the profile
      const { data, error } = await supabase
        .from('design_seller_match_profiles')
        .upsert({
          seller_id: sellerId,
          ...updates,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-seller-match-profile', variables.sellerId] });
      toast.success('Đã cập nhật hồ sơ auto-match');
    },
  });
};

// ============= SELLER DAILY STATS =============

export const useDesignSellerDailyStats = (sellerId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ['design-seller-daily-stats', sellerId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('design_seller_daily_stats')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: true });
      
      if (error) throw error;
      return data as DesignSellerDailyStats[];
    },
    enabled: !!sellerId,
  });
};

// ============= NDA =============

export const useDesignNDA = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-nda', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_nda_agreements')
        .select('*')
        .eq('order_id', orderId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as DesignNDA | null;
    },
    enabled: !!orderId,
  });
};

export const useSignNDA = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, isSeller }: { orderId: string; isSeller: boolean }) => {
      const updateField = isSeller ? 'seller_signed_at' : 'buyer_signed_at';
      
      const { data, error } = await supabase
        .from('design_nda_agreements')
        .update({ [updateField]: new Date().toISOString() })
        .eq('order_id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-nda', variables.orderId] });
      toast.success('Đã ký NDA');
    },
  });
};

// ============= AUTO MATCH =============

export const useAutoMatchSellers = (categoryId: string | undefined, budget: number) => {
  return useQuery({
    queryKey: ['auto-match-sellers', categoryId, budget],
    queryFn: async () => {
      // Auto match function - will be available after migration
      return [] as { seller_id: string; match_score: number; seller_name: string }[];
    },
    enabled: !!categoryId && budget > 0,
  });
};

// ============= AUDIT LOGS (Admin) =============

export const useDesignAuditLogs = (orderId?: string, ticketId?: string) => {
  return useQuery({
    queryKey: ['design-audit-logs', orderId, ticketId],
    queryFn: async () => {
      let query = supabase.from('design_audit_logs').select('*');
      
      if (orderId) query = query.eq('order_id', orderId);
      if (ticketId) query = query.eq('ticket_id', ticketId);
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!orderId || !!ticketId,
  });
};

// =====================================================
// FILE VERSIONING
// =====================================================
export interface DesignFileVersion {
  id: string;
  ticket_id: string;
  order_id: string;
  version_number: number;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  thumbnail_url: string | null;
  notes: string | null;
  uploaded_by: string;
  is_final: boolean;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export const useDesignFileVersions = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-file-versions', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_file_versions')
        .select('*')
        .eq('order_id', orderId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as DesignFileVersion[];
    },
    enabled: !!orderId,
  });
};

export const useCreateFileVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: Omit<DesignFileVersion, 'id' | 'created_at' | 'version_number'>) => {
      const { data: existingVersions } = await supabase
        .from('design_file_versions')
        .select('version_number')
        .eq('order_id', version.order_id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1;

      const { data, error } = await supabase
        .from('design_file_versions')
        .insert({ ...version, version_number: nextVersion })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-file-versions', variables.order_id] });
      toast.success('Đã tải lên phiên bản mới');
    },
  });
};

export const useApproveFileVersion = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ versionId, orderId }: { versionId: string; orderId: string }) => {
      const { data, error } = await supabase
        .from('design_file_versions')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user!.id,
        })
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-file-versions', variables.orderId] });
      toast.success('Đã duyệt phiên bản');
    },
  });
};

// =====================================================
// MULTI-CRITERIA REVIEWS
// =====================================================
export interface DesignReviewCriteria {
  id: string;
  order_id: string;
  service_id: string;
  seller_id: string;
  buyer_id: string;
  overall_rating: number;
  communication_rating: number | null;
  deadline_rating: number | null;
  quality_rating: number | null;
  comment: string | null;
  is_on_time: boolean;
  created_at: string;
  updated_at: string;
}

export const useDesignReviewCriteria = (serviceId: string | undefined) => {
  return useQuery({
    queryKey: ['design-review-criteria', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_review_criteria')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DesignReviewCriteria[];
    },
    enabled: !!serviceId,
  });
};

export const useCreateReviewCriteria = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: Omit<DesignReviewCriteria, 'id' | 'created_at' | 'updated_at' | 'buyer_id'>) => {
      const { data, error } = await supabase
        .from('design_review_criteria')
        .insert({ ...review, buyer_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-review-criteria', variables.service_id] });
      toast.success('Đã gửi đánh giá');
    },
  });
};

// =====================================================
// SELLER NOTES (Private)
// =====================================================
export interface DesignSellerNote {
  id: string;
  ticket_id: string;
  seller_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export const useDesignSellerNotes = (ticketId: string | undefined, sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['design-seller-notes', ticketId, sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_seller_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DesignSellerNote[];
    },
    enabled: !!ticketId && !!sellerId,
  });
};

export const useSaveSellerNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, sellerId, note }: { ticketId: string; sellerId: string; note: string }) => {
      const { data: existing } = await supabase
        .from('design_seller_notes')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('design_seller_notes')
          .update({ note, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('design_seller_notes')
          .insert({ ticket_id: ticketId, seller_id: sellerId, note })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-seller-notes', variables.ticketId, variables.sellerId] });
      toast.success('Đã lưu ghi chú');
    },
  });
};

// =====================================================
// ACTIVITY LOGS
// =====================================================
export interface DesignActivityLog {
  id: string;
  ticket_id: string | null;
  order_id: string | null;
  user_id: string;
  user_type: string;
  action: string;
  action_data: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export const useDesignActivityLogs = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-activity-logs', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_activity_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DesignActivityLog[];
    },
    enabled: !!orderId,
  });
};

export const useLogActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: Omit<DesignActivityLog, 'id' | 'created_at' | 'user_id' | 'ip_address'>) => {
      const { data, error } = await supabase
        .from('design_activity_logs')
        .insert({ ...log, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.order_id) {
        queryClient.invalidateQueries({ queryKey: ['design-activity-logs', variables.order_id] });
      }
    },
  });
};

// =====================================================
// REPORTS
// =====================================================
export interface DesignReport {
  id: string;
  ticket_id: string | null;
  order_id: string | null;
  reporter_id: string;
  reporter_type: string;
  reported_user_id: string;
  reported_user_type: string;
  reason: string;
  description: string | null;
  evidence_urls: string[] | null;
  status: string;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (report: Omit<DesignReport, 'id' | 'created_at' | 'updated_at' | 'reporter_id' | 'status' | 'admin_notes' | 'resolved_at' | 'resolved_by'>) => {
      const { data, error } = await supabase
        .from('design_reports')
        .insert({ ...report, reporter_id: user!.id, status: 'pending' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-reports'] });
      toast.success('Đã gửi báo cáo vi phạm');
    },
  });
};

// =====================================================
// QUICK ACTIONS
// =====================================================
export interface DesignQuickAction {
  id: string;
  action_type: string;
  label: string;
  label_en: string | null;
  message_template: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_for_buyer: boolean;
  is_for_seller: boolean;
  is_active: boolean;
  created_at: string;
}

export const useDesignQuickActions = (userType: 'buyer' | 'seller') => {
  return useQuery({
    queryKey: ['design-quick-actions', userType],
    queryFn: async () => {
      const column = userType === 'buyer' ? 'is_for_buyer' : 'is_for_seller';
      const { data, error } = await supabase
        .from('design_quick_actions')
        .select('*')
        .eq(column, true)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as DesignQuickAction[];
    },
  });
};

// =====================================================
// BLOCKED KEYWORDS
// =====================================================
export interface BlockedKeyword {
  id: string;
  keyword_pattern: string;
  keyword_type: string;
  replacement_text: string;
  is_active: boolean;
  created_at: string;
}

export const useBlockedKeywords = () => {
  return useQuery({
    queryKey: ['design-blocked-keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_blocked_keywords')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data as BlockedKeyword[];
    },
  });
};

export const filterBlockedContent = (message: string, keywords: BlockedKeyword[]): string => {
  let filtered = message;
  for (const keyword of keywords) {
    try {
      const regex = new RegExp(keyword.keyword_pattern, 'gi');
      filtered = filtered.replace(regex, keyword.replacement_text);
    } catch {
      // Invalid regex, skip
    }
  }
  return filtered;
};

// =====================================================
// SELLER AVAILABILITY
// =====================================================
export const useUpdateSellerAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sellerId,
      status,
      reason,
      until,
    }: {
      sellerId: string;
      status: 'available' | 'busy' | 'vacation';
      reason?: string;
      until?: string;
    }) => {
      const { data, error } = await supabase
        .from('sellers')
        .update({
          availability_status: status,
          availability_reason: reason || null,
          availability_until: until || null,
        })
        .eq('id', sellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      toast.success('Đã cập nhật trạng thái');
    },
  });
};

// =====================================================
// DEADLINE HELPERS
// =====================================================
export const calculateDeadlineStatus = (deadline: string | null) => {
  if (!deadline) return { status: 'no_deadline', hoursLeft: null, isOverdue: false };

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) {
    return { status: 'overdue', hoursLeft, isOverdue: true };
  } else if (hoursLeft < 24) {
    return { status: 'urgent', hoursLeft, isOverdue: false };
  } else if (hoursLeft < 48) {
    return { status: 'warning', hoursLeft, isOverdue: false };
  }
  return { status: 'normal', hoursLeft, isOverdue: false };
};

// =====================================================
// FILE VALIDATION
// =====================================================
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateDesignFile = (
  file: File,
  settings: {
    maxFileSizeMb?: number;
    allowedFormats?: string[];
    minWidth?: number;
    minHeight?: number;
  }
): FileValidationResult => {
  const errors: string[] = [];

  const maxSize = (settings.maxFileSizeMb || 50) * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File quá lớn. Tối đa ${settings.maxFileSizeMb || 50}MB`);
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedFormats = settings.allowedFormats || ['jpg', 'jpeg', 'png', 'pdf', 'ai', 'psd'];
  if (extension && !allowedFormats.includes(extension)) {
    errors.push(`Định dạng không hợp lệ. Cho phép: ${allowedFormats.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// =====================================================
// TICKET PRIORITY
// =====================================================
export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, priority, isVip }: { ticketId: string; priority: number; isVip?: boolean }) => {
      const { data, error } = await supabase
        .from('design_tickets')
        .update({ priority, is_vip: isVip ?? false })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket'] });
    },
  });
};

// =====================================================
// TICKET COLLABORATORS
// =====================================================
export const useDesignTicketCollaborators = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['design-ticket-collaborators', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_ticket_collaborators')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('is_active', true)
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignTicketCollaborator[];
    },
    enabled: !!ticketId,
  });
};

export const useAddTicketCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (collaborator: { 
      ticket_id: string; 
      order_id: string; 
      seller_id: string; 
      collaborator_id: string; 
      role?: string; 
      permissions?: string[] 
    }) => {
      const { data, error } = await supabase
        .from('design_ticket_collaborators')
        .insert({
          ...collaborator,
          is_active: true,
          added_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket-collaborators', variables.ticket_id] });
      toast.success('Đã thêm cộng tác viên');
    },
  });
};

export const useRemoveTicketCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ticketId }: { id: string; ticketId: string }) => {
      const { data, error } = await supabase
        .from('design_ticket_collaborators')
        .update({ is_active: false, removed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket-collaborators', variables.ticketId] });
      toast.success('Đã xóa cộng tác viên');
    },
  });
};

// =====================================================
// TICKET INTERNAL NOTES
// =====================================================
export const useDesignTicketInternalNotes = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['design-ticket-internal-notes', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_ticket_internal_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as DesignTicketInternalNote[];
    },
    enabled: !!ticketId,
  });
};

export const useCreateTicketInternalNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (note: { 
      ticket_id: string; 
      order_id: string; 
      content: string;
      is_task?: boolean;
      task_deadline?: string;
      task_assignee_id?: string;
      mentioned_user_ids?: string[];
      attachments?: any;
    }) => {
      const { data, error } = await supabase
        .from('design_ticket_internal_notes')
        .insert({
          ...note,
          author_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket-internal-notes', variables.ticket_id] });
      toast.success('Đã thêm ghi chú');
    },
  });
};

export const useUpdateTicketInternalNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ticketId, ...updates }: { 
      id: string; 
      ticketId: string;
      content?: string;
      is_task?: boolean;
      task_status?: string;
      task_deadline?: string;
      task_assignee_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('design_ticket_internal_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket-internal-notes', variables.ticketId] });
    },
  });
};
