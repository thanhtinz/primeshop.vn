// Types for Mailbox System

// ========== DOMAIN TYPES ==========

export interface MailDomain {
  id: string;
  domain: string;
  display_name: string | null;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  is_public: boolean;
  max_mailboxes: number;
  max_storage_mb: number;
  max_message_size_mb: number;
  allowed_features: string[] | null;
  smtp_settings: SmtpSettings | null;
  dkim_selector: string | null;
  spf_record: string | null;
  mx_verified: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  mailbox_count?: number;
  admins?: MailDomainAdmin[];
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface MailDomainAdmin {
  id: string;
  domain_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager';
  permissions: DomainAdminPermissions | null;
  created_at: string;
  // Joined fields
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface DomainAdminPermissions {
  can_create_mailboxes: boolean;
  can_delete_mailboxes: boolean;
  can_manage_aliases: boolean;
  can_manage_lists: boolean;
  can_view_logs: boolean;
  can_manage_security: boolean;
}

// ========== MAILBOX TYPES ==========

export interface Mailbox {
  id: string;
  user_id: string;
  domain_id: string | null;
  local_part: string | null;
  email_address: string;
  display_name: string | null;
  signature: string | null;
  is_active: boolean;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  quota_mb: number;
  used_storage_mb: number;
  role: 'user' | 'admin' | 'super_admin';
  can_send_external: boolean;
  can_receive_external: boolean;
  forwarding_address: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  domain?: MailDomain;
}

export interface MailFolder {
  id: string;
  mailbox_id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  unread_count?: number;
}

export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailMessage {
  id: string;
  mailbox_id: string;
  folder_id: string;
  thread_id: string | null;
  message_id: string | null;
  in_reply_to: string | null;
  references: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: MailAddress[];
  cc_addresses: MailAddress[] | null;
  bcc_addresses: MailAddress[] | null;
  reply_to: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  preview: string | null;
  priority: 'low' | 'normal' | 'high';
  is_read: boolean;
  is_starred: boolean;
  is_important: boolean;
  is_draft: boolean;
  is_sent: boolean;
  has_attachments: boolean;
  labels: string[] | null;
  scheduled_at: string | null;
  sent_at: string | null;
  received_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Computed/joined fields
  attachments?: MailAttachment[];
  folder?: MailFolder;
}

export interface MailAttachment {
  id: string;
  message_id: string;
  filename: string;
  original_filename: string;
  mime_type: string | null;
  size: number;
  storage_path: string | null;
  content_id: string | null;
  is_inline: boolean;
  created_at: string;
}

export interface MailLabel {
  id: string;
  mailbox_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface MailContact {
  id: string;
  mailbox_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MailSettings {
  id: string;
  mailbox_id: string;
  notifications_enabled: boolean;
  desktop_notifications: boolean;
  email_notifications: boolean;
  conversation_view: boolean;
  preview_pane: 'right' | 'bottom' | 'none';
  messages_per_page: number;
  default_signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface MailFilter {
  id: string;
  mailbox_id: string;
  name: string;
  is_active: boolean;
  conditions: MailFilterCondition[];
  actions: MailFilterAction[];
  stop_processing: boolean;
  sort_order: number;
  created_at: string;
}

export interface MailFilterCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'has_attachment';
  operator: 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
  value: string;
}

export interface MailFilterAction {
  action: 'move_to_folder' | 'add_label' | 'mark_as_read' | 'mark_as_starred' | 'mark_as_important' | 'delete' | 'mark_as_spam';
  value?: string;
}

// Create/Update types
export interface CreateMailMessage {
  to_addresses: MailAddress[];
  cc_addresses?: MailAddress[];
  bcc_addresses?: MailAddress[];
  subject: string;
  body_text?: string;
  body_html?: string;
  priority?: 'low' | 'normal' | 'high';
  is_draft?: boolean;
  scheduled_at?: string;
  in_reply_to?: string;
  thread_id?: string;
}

export interface ComposeMailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  priority?: 'low' | 'normal' | 'high';
  attachments?: File[];
  scheduledAt?: Date;
  isDraft?: boolean;
  replyTo?: string;
  threadId?: string;
}

export interface MailThread {
  id: string;
  subject: string;
  participants: MailAddress[];
  message_count: number;
  unread_count: number;
  last_message_at: string;
  messages: MailMessage[];
}

// Stats
export interface MailboxStats {
  total_messages: number;
  unread_count: number;
  starred_count: number;
  draft_count: number;
  sent_count: number;
  spam_count: number;
  trash_count: number;
  storage_used: number;
}

// ========== ALIAS & DISTRIBUTION LIST TYPES ==========

export interface MailAlias {
  id: string;
  domain_id: string;
  local_part: string;
  mailbox_id: string;
  is_active: boolean;
  created_at: string;
  // Computed
  email_address?: string;
  mailbox?: Mailbox;
}

export interface MailDistributionList {
  id: string;
  domain_id: string;
  local_part: string;
  display_name: string | null;
  description: string | null;
  is_active: boolean;
  allow_external_senders: boolean;
  moderated: boolean;
  moderator_mailbox_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  email_address?: string;
  member_count?: number;
  members?: MailDistributionListMember[];
}

export interface MailDistributionListMember {
  id: string;
  list_id: string;
  mailbox_id: string | null;
  external_email: string | null;
  is_active: boolean;
  created_at: string;
  // Joined
  mailbox?: Mailbox;
}

// ========== ACTIVITY & SECURITY TYPES ==========

export interface MailActivityLog {
  id: string;
  domain_id: string | null;
  mailbox_id: string | null;
  message_id: string | null;
  action: 'send' | 'receive' | 'read' | 'delete' | 'move' | 'forward' | 'reply' | 'login' | 'settings_change' | 'quota_exceeded';
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface MailSecuritySettings {
  id: string;
  domain_id: string;
  spam_filter_enabled: boolean;
  spam_threshold: number;
  virus_scan_enabled: boolean;
  dkim_enabled: boolean;
  spf_enabled: boolean;
  dmarc_enabled: boolean;
  greylist_enabled: boolean;
  rate_limit_per_hour: number;
  blocked_senders: string[] | null;
  blocked_domains: string[] | null;
  allowed_senders: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MailSenderRule {
  id: string;
  domain_id: string | null;
  mailbox_id: string | null;
  rule_type: 'whitelist' | 'blacklist';
  sender_email: string | null;
  sender_domain: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

// ========== ADMIN TYPES ==========

export interface CreateDomainData {
  domain: string;
  display_name?: string;
  description?: string;
  is_public?: boolean;
  max_mailboxes?: number;
  max_storage_mb?: number;
}

export interface CreateMailboxData {
  domain_id: string;
  local_part: string;
  user_id?: string;
  display_name?: string;
  role?: 'user' | 'admin' | 'super_admin';
  quota_mb?: number;
  can_send_external?: boolean;
  can_receive_external?: boolean;
}

export interface DomainStats {
  domain_id: string;
  total_mailboxes: number;
  active_mailboxes: number;
  total_messages: number;
  total_storage_mb: number;
  messages_today: number;
  messages_week: number;
}
