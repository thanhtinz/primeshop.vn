import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateGroupPost, GroupPostType } from '@/hooks/useGroupPosts';
import { useStickerPacks } from '@/hooks/useStickers';
import { useGroupMembers } from '@/hooks/useGroups';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image, 
  Loader2, 
  X, 
  Smile, 
  Sticker,
  ChevronDown,
  User,
  EyeOff,
  Megaphone,
  HandCoins,
  ListTodo,
  PieChart,
  FileText,
  MessageSquare,
  Search,
  MapPin,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const backgroundColors = [
  { id: 'none', color: 'bg-transparent', preview: 'bg-white dark:bg-gray-800 border' },
  { id: 'gradient-1', color: 'bg-gradient-to-br from-pink-500 to-purple-600', preview: 'bg-gradient-to-br from-pink-500 to-purple-600' },
  { id: 'gradient-2', color: 'bg-gradient-to-br from-red-500 to-pink-500', preview: 'bg-gradient-to-br from-red-500 to-pink-500' },
  { id: 'solid-black', color: 'bg-black', preview: 'bg-black' },
  { id: 'gradient-3', color: 'bg-gradient-to-br from-purple-500 to-pink-400', preview: 'bg-gradient-to-br from-purple-500 to-pink-400' },
];

const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
  '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔',
  '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
  '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '🔥', '⭐', '✨'
];

const popularLocations = [
  'Hà Nội, Việt Nam',
  'TP. Hồ Chí Minh, Việt Nam',
  'Đà Nẵng, Việt Nam',
  'Nha Trang, Việt Nam',
  'Đà Lạt, Việt Nam',
  'Hội An, Việt Nam',
  'Huế, Việt Nam',
  'Phú Quốc, Việt Nam'
];

const postTypeOptions: { value: GroupPostType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'discussion', label: 'Thảo luận', icon: <MessageSquare className="h-4 w-4" />, color: 'text-muted-foreground' },
  { value: 'announcement', label: 'Thông báo', icon: <Megaphone className="h-4 w-4" />, color: 'text-blue-500' },
  { value: 'deal', label: 'Deal/Kèo', icon: <HandCoins className="h-4 w-4" />, color: 'text-green-500' },
  { value: 'task', label: 'Task', icon: <ListTodo className="h-4 w-4" />, color: 'text-yellow-500' },
  { value: 'profit_share', label: 'Chia lợi nhuận', icon: <PieChart className="h-4 w-4" />, color: 'text-purple-500' },
  { value: 'report', label: 'Kết quả', icon: <FileText className="h-4 w-4" />, color: 'text-orange-500' },
];

interface CreateGroupPostCardProps {
  groupId: string;
  onSuccess?: () => void;
}

export const CreateGroupPostCard: React.FC<CreateGroupPostCardProps> = ({ groupId, onSuccess }) => {
  const { user, profile } = useAuth();
  const createPost = useCreateGroupPost();
  const { data: stickerPacks = [] } = useStickerPacks();
  const { data: members = [] } = useGroupMembers(groupId);
  
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBg, setSelectedBg] = useState('none');
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  const [emojiTab, setEmojiTab] = useState<'emoji' | 'sticker'>('emoji');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<GroupPostType>('discussion');
  
  // Location state
  const [location, setLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  
  // Tag members state
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [taggedMembers, setTaggedMembers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = members.filter(m => {
    const memberName = m.profile?.full_name || '';
    return memberName.toLowerCase().includes(tagSearch.toLowerCase()) && m.user_id !== user?.id;
  });

  const filteredLocations = popularLocations.filter(loc => 
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const toggleTagMember = (member: any) => {
    const memberId = member.user_id;
    const memberName = member.profile?.full_name || 'Thành viên';
    const memberAvatar = member.profile?.avatar_url;
    
    setTaggedMembers(prev => {
      const exists = prev.some(m => m.id === memberId);
      if (exists) {
        return prev.filter(m => m.id !== memberId);
      }
      return [...prev, { id: memberId, name: memberName, avatar: memberAvatar }];
    });
  };

  const removeTaggedMember = (memberId: string) => {
    setTaggedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const addLocation = (loc: string) => {
    setLocation(loc);
    setLocationPopoverOpen(false);
    toast.success(`Đã thêm vị trí: ${loc}`);
  };

  const removeLocation = () => {
    setLocation('');
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 50 * 1024 * 1024) {
          toast.error('Ảnh không được quá 50MB');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('group-post-images')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('group-post-images')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc thêm ảnh');
      return;
    }

    // Build final content with location and tags
    let finalContent = content;
    if (taggedMembers.length > 0) {
      const tagNames = taggedMembers.map(m => `@${m.name}`).join(' ');
      finalContent = `${finalContent}\n\n👥 cùng với ${tagNames}`;
    }
    if (location) {
      finalContent = `${finalContent}\n📍 ${location}`;
    }

    await createPost.mutateAsync({ 
      group_id: groupId,
      content: finalContent,
      post_type: postType,
      media_urls: images.length > 0 ? images : undefined,
      is_anonymous: isAnonymous,
    });
    
    setContent('');
    setImages([]);
    setSelectedBg('none');
    setIsAnonymous(false);
    setPostType('discussion');
    setLocation('');
    setTaggedMembers([]);
    setIsOpen(false);
    onSuccess?.();
  };

  const currentBg = backgroundColors.find(bg => bg.id === selectedBg);
  const hasBackground = selectedBg !== 'none';
  const currentPostType = postTypeOptions.find(p => p.value === postType);

  if (!user) return null;

  return (
    <>
      {/* Trigger Card */}
      <div 
        className="bg-card rounded-xl border shadow-sm p-4 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex gap-3 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="relative">
                {isAnonymous ? (
                  <Avatar className="h-10 w-10 bg-muted ring-2 ring-primary/20">
                    <AvatarFallback>
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {profile?.full_name?.[0] || user.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <ChevronDown className="h-3 w-3 absolute -bottom-0.5 -right-0.5 bg-muted rounded-full" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border">
              <DropdownMenuItem onClick={() => setIsAnonymous(false)} className="gap-2">
                <User className="h-4 w-4" />
                Đăng với tư cách cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAnonymous(true)} className="gap-2">
                <EyeOff className="h-4 w-4" />
                Đăng ẩn danh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex-1 px-4 py-2.5 rounded-full bg-muted/60 text-muted-foreground text-sm">
            Bạn viết gì đi...
          </div>
        </div>
        <div className="flex items-center justify-around mt-3 pt-3 border-t">
          <button 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors py-1 px-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
          >
            <Image className="h-5 w-5 text-green-500" />
            <span className="hidden sm:inline">Ảnh/Video</span>
          </button>
          <button 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-yellow-500 transition-colors py-1 px-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <Smile className="h-5 w-5 text-yellow-500" />
            <span className="hidden sm:inline">Cảm xúc</span>
          </button>
          <button 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-500 transition-colors py-1 px-2"
            onClick={(e) => {
              e.stopPropagation();
              setPostType('announcement');
              setIsOpen(true);
            }}
          >
            <Megaphone className="h-5 w-5 text-blue-500" />
            <span className="hidden sm:inline">Thông báo</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Full Create Post Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="w-8" />
              <DialogTitle className="text-lg font-semibold">Tạo bài viết</DialogTitle>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={createPost.isPending || (!content.trim() && images.length === 0)}
              >
                {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng'}
              </Button>
            </div>
          </DialogHeader>

          {/* User Info & Options */}
          <div className="p-4 flex-shrink-0">
            <div className="flex items-start gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative">
                    {isAnonymous ? (
                      <Avatar className="h-12 w-12 bg-muted ring-2 ring-primary/20">
                        <AvatarFallback>
                          <EyeOff className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {profile?.full_name?.[0] || user.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 absolute -bottom-0.5 -right-0.5 bg-muted rounded-full p-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border">
                  <DropdownMenuItem onClick={() => setIsAnonymous(false)} className="gap-2">
                    <User className="h-4 w-4" />
                    Đăng với tư cách cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAnonymous(true)} className="gap-2">
                    <EyeOff className="h-4 w-4" />
                    Đăng ẩn danh
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex-1">
                <p className="font-semibold">
                  {isAnonymous ? 'Thành viên ẩn danh' : (profile?.full_name || user.email)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Post Type Selector */}
                  <Select value={postType} onValueChange={(v) => setPostType(v as GroupPostType)}>
                    <SelectTrigger className="w-auto h-7 text-xs gap-1 px-2">
                      <span className={currentPostType?.color}>{currentPostType?.icon}</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border">
                      {postTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span className={option.color}>{option.icon}</span>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {isAnonymous && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <EyeOff className="h-3 w-3" />
                      Ẩn danh
                    </Badge>
                  )}
                  
                  {/* Location Badge */}
                  {location && (
                    <Badge variant="outline" className="gap-1 px-2 py-1 text-xs">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {location}
                      <button onClick={removeLocation} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Tagged Members Badges */}
                  {taggedMembers.map(member => (
                    <Badge key={member.id} variant="outline" className="gap-1 px-2 py-1 text-xs">
                      <UserPlus className="h-3 w-3 text-blue-500" />
                      {member.name}
                      <button onClick={() => removeTaggedMember(member.id)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className={cn(
            "flex-1 min-h-[200px] px-4 overflow-y-auto",
            hasBackground && currentBg?.color,
            hasBackground && "flex items-center justify-center"
          )}>
            <textarea
              ref={textareaRef}
              placeholder="Bạn viết gì đi..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn(
                "w-full bg-transparent border-0 outline-none resize-none",
                hasBackground 
                  ? "text-white text-2xl font-semibold text-center min-h-[150px] placeholder:text-white/70" 
                  : "text-foreground text-lg min-h-[200px] placeholder:text-muted-foreground"
              )}
            />

            {/* Image Previews */}
            {images.length > 0 && !hasBackground && (
              <div className="grid grid-cols-3 gap-2 mt-4 pb-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Background Color Selector */}
          <div className="px-4 py-3 border-t flex-shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {backgroundColors.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBg(bg.id);
                    if (bg.id !== 'none') setImages([]);
                  }}
                  className={cn(
                    "h-8 w-8 rounded-lg flex-shrink-0 transition-all",
                    bg.preview,
                    selectedBg === bg.id && "ring-2 ring-primary ring-offset-2"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-3 border-t flex items-center justify-around flex-shrink-0 bg-muted/30">
            <button 
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || hasBackground}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
              ) : (
                <Image className="h-6 w-6 text-green-500" />
              )}
              <span className="text-[10px] text-muted-foreground">Ảnh</span>
            </button>

            {/* Tag Members Popover */}
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors",
                  taggedMembers.length > 0 && "bg-blue-500/10"
                )}>
                  <UserPlus className="h-6 w-6 text-blue-500" />
                  <span className="text-[10px] text-muted-foreground">
                    Tag {taggedMembers.length > 0 && `(${taggedMembers.length})`}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-popover border" align="center" side="top">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm thành viên..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {members.length <= 1 ? 'Không có thành viên khác' : 'Không tìm thấy thành viên'}
                      </p>
                    ) : (
                      filteredMembers.map((member) => {
                        const isTagged = taggedMembers.some(m => m.id === member.user_id);
                        return (
                          <button
                            key={member.user_id}
                            onClick={() => toggleTagMember(member)}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <Checkbox checked={isTagged} className="pointer-events-none" />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.profile?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {(member.profile?.full_name)?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate">
                              {member.profile?.full_name || 'Thành viên'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {taggedMembers.length > 0 && (
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => setTagPopoverOpen(false)}
                    >
                      Xong ({taggedMembers.length} người)
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Emoji & Sticker Popover */}
            <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors">
                  <Smile className="h-6 w-6 text-yellow-500" />
                  <span className="text-[10px] text-muted-foreground">Emoji</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-popover border" align="center" side="top">
                <Tabs value={emojiTab} onValueChange={(v) => setEmojiTab(v as 'emoji' | 'sticker')}>
                  <TabsList className="w-full grid grid-cols-2 h-9 rounded-none border-b">
                    <TabsTrigger value="emoji" className="gap-1 text-xs">
                      <Smile className="h-3.5 w-3.5" />
                      Emoji
                    </TabsTrigger>
                    <TabsTrigger value="sticker" className="gap-1 text-xs">
                      <Sticker className="h-3.5 w-3.5" />
                      Sticker
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="emoji" className="p-2 m-0">
                    <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                      {emojiList.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            insertEmoji(emoji);
                            setEmojiPopoverOpen(false);
                          }}
                          className="h-8 w-8 flex items-center justify-center text-lg hover:bg-accent rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sticker" className="p-2 m-0">
                    {stickerPacks.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Sticker className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có sticker nào</p>
                      </div>
                    ) : (
                      <Tabs defaultValue={stickerPacks[0]?.id} className="w-full">
                        <TabsList className="w-full h-8 rounded-none border-b bg-muted/50 overflow-x-auto flex justify-start">
                          {stickerPacks.map((pack) => (
                            <TabsTrigger key={pack.id} value={pack.id} className="text-[10px] px-2 py-1">
                              {pack.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {stickerPacks.map((pack) => (
                          <TabsContent key={pack.id} value={pack.id} className="p-1 m-0">
                            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                              {(pack.stickers || [])
                                .filter(s => s.is_active)
                                .sort((a, b) => a.sort_order - b.sort_order)
                                .map((sticker) => (
                                  <button
                                    key={sticker.id}
                                    onClick={() => {
                                      if (!hasBackground && images.length < 10) {
                                        setImages(prev => [...prev, sticker.image_url]);
                                      }
                                      setEmojiPopoverOpen(false);
                                    }}
                                    className="aspect-square p-1 hover:bg-muted rounded transition-colors"
                                  >
                                    <img 
                                      src={sticker.image_url} 
                                      alt={sticker.name} 
                                      className="w-full h-full object-contain"
                                    />
                                  </button>
                                ))}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>

            {/* Location Popover */}
            <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors",
                  location && "bg-red-500/10"
                )}>
                  <MapPin className="h-6 w-6 text-red-500" />
                  <span className="text-[10px] text-muted-foreground">Vị trí</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-popover border" align="center" side="top">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm vị trí..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredLocations.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => addLocation(loc)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                        {loc}
                      </button>
                    ))}
                    {locationSearch && !filteredLocations.some(l => l.toLowerCase() === locationSearch.toLowerCase()) && (
                      <button
                        onClick={() => addLocation(locationSearch)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2 text-primary"
                      >
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        Thêm "{locationSearch}"
                      </button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Anonymous Toggle */}
            <button 
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors",
                isAnonymous && "bg-primary/10"
              )}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <EyeOff className={cn("h-6 w-6", isAnonymous ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[10px] text-muted-foreground">Ẩn danh</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateGroupPostCard;
