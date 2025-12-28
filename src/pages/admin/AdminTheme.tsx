import React, { useState, useEffect } from 'react';
import { 
  useSiteTheme, 
  useUpdateSiteTheme, 
  useSiteSections, 
  useUpdateMultipleSections,
  themePresets, 
  fontOptions, 
  layoutOptions,
  SiteTheme,
  SiteSection 
} from '@/hooks/useSiteTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Palette, 
  Type, 
  Layout, 
  Code, 
  Eye, 
  LayoutGrid, 
  Save,
  RotateCcw,
  GripVertical,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';

const AdminTheme = () => {
  const { data: theme, isLoading: themeLoading } = useSiteTheme();
  const { data: sections = [], isLoading: sectionsLoading } = useSiteSections();
  const updateTheme = useUpdateSiteTheme();
  const updateSections = useUpdateMultipleSections();

  const [formData, setFormData] = useState<Partial<SiteTheme>>({});
  const [sectionData, setSectionData] = useState<SiteSection[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (theme) {
      setFormData(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (sections.length > 0) {
      setSectionData(sections);
    }
  }, [sections]);

  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTheme.mutateAsync({ ...formData, id: theme?.id });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSectionsSubmit = async () => {
    try {
      await updateSections.mutateAsync(
        sectionData.map(s => ({ 
          id: s.id, 
          is_enabled: s.is_enabled, 
          sort_order: s.sort_order 
        }))
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const applyPreset = (presetKey: keyof typeof themePresets) => {
    const preset = themePresets[presetKey];
    setFormData({
      ...formData,
      primary_color: preset.primary_color,
      secondary_color: preset.secondary_color,
      accent_color: preset.accent_color,
      background_color: preset.background_color,
      text_color: preset.text_color,
    });
    toast.info(`Đã áp dụng theme "${preset.name}"`);
  };

  const resetTheme = () => {
    if (theme) {
      setFormData(theme);
      toast.info('Đã reset về theme hiện tại');
    }
  };

  const toggleSection = (id: string) => {
    setSectionData(prev => 
      prev.map(s => s.id === id ? { ...s, is_enabled: !s.is_enabled } : s)
    );
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sectionData.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sectionData.length) return;

    const newData = [...sectionData];
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    
    // Update sort_order
    newData.forEach((s, i) => {
      s.sort_order = i + 1;
    });
    
    setSectionData(newData);
  };

  if (themeLoading || sectionsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Tùy chỉnh giao diện</h1>
          <p className="text-muted-foreground text-sm">
            Cài đặt màu sắc, font chữ, bố cục và các section hiển thị trên website
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Tắt preview' : 'Xem trước'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="colors" className="gap-1 text-xs sm:text-sm py-2">
            <Palette className="h-4 w-4 hidden sm:block" />
            Màu sắc
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-1 text-xs sm:text-sm py-2">
            <Type className="h-4 w-4 hidden sm:block" />
            Font chữ
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-1 text-xs sm:text-sm py-2">
            <Layout className="h-4 w-4 hidden sm:block" />
            Bố cục
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-1 text-xs sm:text-sm py-2">
            <LayoutGrid className="h-4 w-4 hidden sm:block" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1 text-xs sm:text-sm py-2">
            <Code className="h-4 w-4 hidden sm:block" />
            Custom CSS
          </TabsTrigger>
        </TabsList>

        {/* COLORS TAB */}
        <TabsContent value="colors" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Theme Presets
              </CardTitle>
              <CardDescription>Chọn một theme có sẵn để áp dụng nhanh</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key as keyof typeof themePresets)}
                    className="p-3 border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <div className="flex gap-1 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full border" 
                        style={{ backgroundColor: preset.primary_color }} 
                      />
                      <div 
                        className="w-6 h-6 rounded-full border" 
                        style={{ backgroundColor: preset.secondary_color }} 
                      />
                      <div 
                        className="w-6 h-6 rounded-full border" 
                        style={{ backgroundColor: preset.accent_color }} 
                      />
                    </div>
                    <p className="font-medium text-sm">{preset.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleThemeSubmit}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Màu chính</CardTitle>
                <CardDescription>Tùy chỉnh màu sắc chính của website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Màu chính (Primary)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.primary_color || '#3B82F6'}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.primary_color || '#3B82F6'}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Màu phụ (Secondary)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.secondary_color || '#10B981'}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.secondary_color || '#10B981'}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Màu nhấn (Accent)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.accent_color || '#8B5CF6'}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.accent_color || '#8B5CF6'}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Màu nền</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_color || '#FFFFFF'}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.background_color || '#FFFFFF'}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Màu chữ</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.text_color || '#111827'}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.text_color || '#111827'}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        placeholder="#111827"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Màu link</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.link_color || '#2563EB'}
                        onChange={(e) => setFormData({ ...formData, link_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.link_color || '#2563EB'}
                        onChange={(e) => setFormData({ ...formData, link_color: e.target.value })}
                        placeholder="#2563EB"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Header & Footer</CardTitle>
                <CardDescription>Màu sắc cho header và footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Màu nền Header</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.header_bg_color || '#FFFFFF'}
                        onChange={(e) => setFormData({ ...formData, header_bg_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.header_bg_color || '#FFFFFF'}
                        onChange={(e) => setFormData({ ...formData, header_bg_color: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Màu nền Footer</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.footer_bg_color || '#1F2937'}
                        onChange={(e) => setFormData({ ...formData, footer_bg_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.footer_bg_color || '#1F2937'}
                        onChange={(e) => setFormData({ ...formData, footer_bg_color: e.target.value })}
                        placeholder="#1F2937"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Màu chữ Footer</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.footer_text_color || '#F9FAFB'}
                        onChange={(e) => setFormData({ ...formData, footer_text_color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={formData.footer_text_color || '#F9FAFB'}
                        onChange={(e) => setFormData({ ...formData, footer_text_color: e.target.value })}
                        placeholder="#F9FAFB"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={updateTheme.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateTheme.isPending ? 'Đang lưu...' : 'Lưu màu sắc'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TYPOGRAPHY TAB */}
        <TabsContent value="typography" className="space-y-4 mt-4">
          <form onSubmit={handleThemeSubmit}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Font chữ</CardTitle>
                <CardDescription>Tùy chỉnh font chữ hiển thị trên website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font chính</Label>
                    <Select 
                      value={formData.font_family || 'Inter'} 
                      onValueChange={(v) => setFormData({ ...formData, font_family: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Font tiêu đề</Label>
                    <Select 
                      value={formData.heading_font || 'Inter'} 
                      onValueChange={(v) => setFormData({ ...formData, heading_font: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cỡ chữ cơ bản</Label>
                  <Select 
                    value={formData.font_size || '16px'} 
                    onValueChange={(v) => setFormData({ ...formData, font_size: v })}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {layoutOptions.fontSize.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                <div 
                  className="p-4 border rounded-lg" 
                  style={{ 
                    fontFamily: formData.font_family || 'Inter',
                    fontSize: formData.font_size || '16px'
                  }}
                >
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: formData.heading_font || 'Inter' }}
                  >
                    Tiêu đề mẫu - Heading Example
                  </h3>
                  <p className="text-muted-foreground">
                    Đây là đoạn văn bản mẫu để xem trước font chữ. This is sample text to preview the font.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={updateTheme.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateTheme.isPending ? 'Đang lưu...' : 'Lưu font chữ'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* LAYOUT TAB */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          <form onSubmit={handleThemeSubmit}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Bố cục tổng thể</CardTitle>
                <CardDescription>Cài đặt cách hiển thị các thành phần trên website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kiểu bố cục</Label>
                    <Select 
                      value={formData.layout_style || 'default'} 
                      onValueChange={(v) => setFormData({ ...formData, layout_style: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutOptions.layoutStyle.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kiểu Header</Label>
                    <Select 
                      value={formData.header_style || 'default'} 
                      onValueChange={(v) => setFormData({ ...formData, header_style: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutOptions.headerStyle.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bo góc (Border Radius)</Label>
                    <Select 
                      value={formData.border_radius || '8px'} 
                      onValueChange={(v) => setFormData({ ...formData, border_radius: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutOptions.borderRadius.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vị trí Navbar</Label>
                    <Select 
                      value={formData.navbar_position || 'top'} 
                      onValueChange={(v) => setFormData({ ...formData, navbar_position: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutOptions.navbarPosition.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={updateTheme.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateTheme.isPending ? 'Đang lưu...' : 'Lưu bố cục'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* SECTIONS TAB */}
        <TabsContent value="sections" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Quản lý Sections</CardTitle>
              <CardDescription>
                Bật/tắt và sắp xếp thứ tự các section hiển thị trên trang chủ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sectionData.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex flex-col">
                        <span className="font-medium">{section.section_name}</span>
                        <span className="text-xs text-muted-foreground">{section.section_key}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(section.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(section.id, 'down')}
                          disabled={index === sectionData.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <Badge variant={section.is_enabled ? 'default' : 'secondary'}>
                        {section.is_enabled ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Bật</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Tắt</>
                        )}
                      </Badge>
                      <Switch
                        checked={section.is_enabled}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={handleSectionsSubmit} disabled={updateSections.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateSections.isPending ? 'Đang lưu...' : 'Lưu cài đặt sections'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOM CSS TAB */}
        <TabsContent value="custom" className="space-y-4 mt-4">
          <form onSubmit={handleThemeSubmit}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Custom CSS</CardTitle>
                <CardDescription>
                  Thêm CSS tùy chỉnh để ghi đè các style mặc định
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>CSS tùy chỉnh</Label>
                  <Textarea
                    value={formData.custom_css || ''}
                    onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                    placeholder={`/* Ví dụ: */
.header {
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.btn-primary {
  border-radius: 20px;
}`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Custom Code</CardTitle>
                <CardDescription>
                  Chèn code vào head hoặc footer (analytics, chat widget, ...)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Code trong &lt;head&gt;</Label>
                  <Textarea
                    value={formData.custom_head_code || ''}
                    onChange={(e) => setFormData({ ...formData, custom_head_code: e.target.value })}
                    placeholder={`<!-- Google Analytics, Meta tags, etc. -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>`}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code cuối &lt;body&gt;</Label>
                  <Textarea
                    value={formData.custom_footer_code || ''}
                    onChange={(e) => setFormData({ ...formData, custom_footer_code: e.target.value })}
                    placeholder={`<!-- Chat widget, tracking scripts, etc. -->
<script>
  // Your custom script here
</script>`}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={updateTheme.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateTheme.isPending ? 'Đang lưu...' : 'Lưu custom code'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Preview Panel */}
      {previewMode && (
        <Card className="fixed bottom-4 right-4 w-80 shadow-xl z-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Xem trước</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-4 rounded-lg" 
              style={{ 
                backgroundColor: formData.background_color,
                color: formData.text_color,
                fontFamily: formData.font_family,
                borderRadius: formData.border_radius
              }}
            >
              <div 
                className="p-2 mb-2 rounded" 
                style={{ backgroundColor: formData.header_bg_color }}
              >
                <span style={{ color: formData.primary_color, fontWeight: 'bold' }}>
                  Header
                </span>
              </div>
              <h4 
                style={{ 
                  fontFamily: formData.heading_font, 
                  color: formData.primary_color,
                  fontWeight: 'bold'
                }}
              >
                Tiêu đề
              </h4>
              <p style={{ fontSize: formData.font_size }}>
                Nội dung văn bản mẫu
              </p>
              <a href="#" style={{ color: formData.link_color }}>
                Link mẫu
              </a>
              <div 
                className="p-2 mt-2 rounded" 
                style={{ 
                  backgroundColor: formData.footer_bg_color,
                  color: formData.footer_text_color
                }}
              >
                Footer
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTheme;
