// MySQL version - useSiteTheme
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface SiteTheme {
  id: string;
  is_active: boolean;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  link_color: string;
  header_bg_color: string;
  footer_bg_color: string;
  footer_text_color: string;
  
  // Typography
  font_family: string;
  heading_font: string;
  font_size: string;
  
  // Layout
  layout_style: string;
  header_style: string;
  navbar_position: string;
  sidebar_style: string;
  border_radius: string;
  
  // Custom CSS
  custom_css: string | null;
  custom_head_code: string | null;
  custom_footer_code: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface SiteSection {
  id: string;
  section_key: string;
  section_name: string;
  is_enabled: boolean;
  sort_order: number;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Map camelCase to snake_case
function mapTheme(data: any): SiteTheme {
  if (!data) return data;
  return {
    id: data.id,
    is_active: data.isActive ?? data.is_active ?? true,
    primary_color: data.primaryColor || data.primary_color || '#3B82F6',
    secondary_color: data.secondaryColor || data.secondary_color || '#10B981',
    accent_color: data.accentColor || data.accent_color || '#8B5CF6',
    background_color: data.backgroundColor || data.background_color || '#FFFFFF',
    text_color: data.textColor || data.text_color || '#111827',
    link_color: data.linkColor || data.link_color || '#2563EB',
    header_bg_color: data.headerBgColor || data.header_bg_color || '#FFFFFF',
    footer_bg_color: data.footerBgColor || data.footer_bg_color || '#1F2937',
    footer_text_color: data.footerTextColor || data.footer_text_color || '#F9FAFB',
    font_family: data.fontFamily || data.font_family || 'Inter',
    heading_font: data.headingFont || data.heading_font || 'Inter',
    font_size: data.fontSize || data.font_size || '16px',
    layout_style: data.layoutStyle || data.layout_style || 'default',
    header_style: data.headerStyle || data.header_style || 'default',
    navbar_position: data.navbarPosition || data.navbar_position || 'top',
    sidebar_style: data.sidebarStyle || data.sidebar_style || 'default',
    border_radius: data.borderRadius || data.border_radius || '8px',
    custom_css: data.customCss || data.custom_css,
    custom_head_code: data.customHeadCode || data.custom_head_code,
    custom_footer_code: data.customFooterCode || data.custom_footer_code,
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at,
  };
}

function mapSection(data: any): SiteSection {
  if (!data) return data;
  return {
    id: data.id,
    section_key: data.sectionKey || data.section_key,
    section_name: data.sectionName || data.section_name,
    is_enabled: data.isEnabled ?? data.is_enabled ?? true,
    sort_order: data.sortOrder ?? data.sort_order ?? 0,
    settings: data.settings,
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at,
  };
}

// ============ THEME HOOKS ============

export const useSiteTheme = () => {
  return useQuery({
    queryKey: ['site-theme'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('site_themes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && !error.message?.includes('not found')) throw error;
      return data ? mapTheme(data) : getDefaultTheme();
    }
  });
};

export const useUpdateSiteTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: Partial<SiteTheme> & { id?: string }) => {
      if (theme.id) {
        // Update existing theme
        const { data, error } = await apiClient.from('site_themes')
          .update({
            ...theme,
            updated_at: new Date().toISOString()
          })
          .eq('id', theme.id)
          .select()
          .single();

        if (error) throw error;
        return mapTheme(data);
      } else {
        // Create new theme
        const { data, error } = await apiClient.from('site_themes')
          .insert({
            ...theme,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        return mapTheme(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-theme'] });
      toast.success('Đã lưu cài đặt theme');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi lưu theme');
    }
  });
};

// ============ SECTIONS HOOKS ============

export const useSiteSections = () => {
  return useQuery({
    queryKey: ['site-sections'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('site_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapSection) as SiteSection[];
    }
  });
};

export const useEnabledSections = () => {
  return useQuery({
    queryKey: ['site-sections-enabled'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('site_sections')
        .select('*')
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapSection) as SiteSection[];
    }
  });
};

export const useUpdateSiteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteSection> & { id: string }) => {
      const { data, error } = await apiClient.from('site_sections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapSection(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections'] });
      queryClient.invalidateQueries({ queryKey: ['site-sections-enabled'] });
      toast.success('Đã cập nhật section');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật section');
    }
  });
};

export const useUpdateMultipleSections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sections: Array<{ id: string; is_enabled?: boolean; sort_order?: number }>) => {
      const promises = sections.map(({ id, ...updates }) =>
        apiClient.from('site_sections')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );

      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections'] });
      queryClient.invalidateQueries({ queryKey: ['site-sections-enabled'] });
      toast.success('Đã lưu cài đặt sections');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi lưu sections');
    }
  });
};

// ============ DEFAULT THEME ============

export const getDefaultTheme = (): SiteTheme => ({
  id: '',
  is_active: true,
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  accent_color: '#8B5CF6',
  background_color: '#FFFFFF',
  text_color: '#111827',
  link_color: '#2563EB',
  header_bg_color: '#FFFFFF',
  footer_bg_color: '#1F2937',
  footer_text_color: '#F9FAFB',
  font_family: 'Inter',
  heading_font: 'Inter',
  font_size: '16px',
  layout_style: 'default',
  header_style: 'default',
  navbar_position: 'top',
  sidebar_style: 'default',
  border_radius: '8px',
  custom_css: null,
  custom_head_code: null,
  custom_footer_code: null,
  created_at: '',
  updated_at: ''
});

// ============ THEME PRESETS ============

export const themePresets = {
  default: {
    name: 'Mặc định',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#8B5CF6',
    background_color: '#FFFFFF',
    text_color: '#111827',
  },
  dark: {
    name: 'Tối',
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    accent_color: '#F59E0B',
    background_color: '#111827',
    text_color: '#F9FAFB',
  },
  gaming: {
    name: 'Gaming',
    primary_color: '#EF4444',
    secondary_color: '#F59E0B',
    accent_color: '#10B981',
    background_color: '#0F172A',
    text_color: '#E2E8F0',
  },
  minimal: {
    name: 'Tối giản',
    primary_color: '#1F2937',
    secondary_color: '#6B7280',
    accent_color: '#3B82F6',
    background_color: '#FFFFFF',
    text_color: '#111827',
  },
  nature: {
    name: 'Thiên nhiên',
    primary_color: '#059669',
    secondary_color: '#84CC16',
    accent_color: '#0D9488',
    background_color: '#ECFDF5',
    text_color: '#064E3B',
  },
  ocean: {
    name: 'Đại dương',
    primary_color: '#0891B2',
    secondary_color: '#06B6D4',
    accent_color: '#0EA5E9',
    background_color: '#ECFEFF',
    text_color: '#164E63',
  },
  sunset: {
    name: 'Hoàng hôn',
    primary_color: '#F97316',
    secondary_color: '#EC4899',
    accent_color: '#EAB308',
    background_color: '#FFF7ED',
    text_color: '#7C2D12',
  },
  purple: {
    name: 'Tím',
    primary_color: '#7C3AED',
    secondary_color: '#A855F7',
    accent_color: '#C084FC',
    background_color: '#FAF5FF',
    text_color: '#581C87',
  }
};

// ============ FONT OPTIONS ============

export const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro' },
  { value: 'Quicksand', label: 'Quicksand' },
];

// ============ LAYOUT OPTIONS ============

export const layoutOptions = {
  layoutStyle: [
    { value: 'default', label: 'Mặc định' },
    { value: 'boxed', label: 'Boxed (giới hạn chiều rộng)' },
    { value: 'wide', label: 'Wide (toàn màn hình)' },
  ],
  headerStyle: [
    { value: 'default', label: 'Mặc định' },
    { value: 'sticky', label: 'Sticky (cố định)' },
    { value: 'transparent', label: 'Trong suốt' },
  ],
  navbarPosition: [
    { value: 'top', label: 'Trên cùng' },
    { value: 'side', label: 'Bên trái' },
  ],
  sidebarStyle: [
    { value: 'default', label: 'Mặc định' },
    { value: 'compact', label: 'Thu gọn' },
    { value: 'hidden', label: 'Ẩn' },
  ],
  borderRadius: [
    { value: '0px', label: 'Không bo góc' },
    { value: '4px', label: 'Nhỏ (4px)' },
    { value: '8px', label: 'Vừa (8px)' },
    { value: '12px', label: 'Lớn (12px)' },
    { value: '16px', label: 'Rất lớn (16px)' },
  ],
  fontSize: [
    { value: '14px', label: 'Nhỏ (14px)' },
    { value: '16px', label: 'Vừa (16px)' },
    { value: '18px', label: 'Lớn (18px)' },
  ],
};
