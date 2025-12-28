import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, Lock, Globe, Eye, Settings, Bell, BellOff, 
  Share2, LogOut, UserPlus, Loader2,
  Crown, Shield, MoreHorizontal, Search, Camera, ImagePlus,
  MessageCircle, ListTodo, Handshake, Wallet, FileImage, BarChart3, ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useJoinGroup, useLeaveGroup, useUpdateGroup, useGroupMembers } from '@/hooks/useGroups';
import { toast } from 'sonner';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { GroupInfoSheet } from './GroupInfoSheet';
import { GroupMenuSheet } from './GroupMenuSheet';
import { GroupManageSheet } from './GroupManageSheet';
import { GroupMemberSheet } from './GroupMemberSheet';
import { InviteToGroupDialog } from './InviteToGroupDialog';
import { GroupPostSearchDialog } from './GroupPostSearchDialog';

interface GroupHeaderProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    visibility: 'public' | 'private' | 'hidden';
    member_count: number;
    post_count: number;
    category?: string | null;
    owner_id: string;
  };
  membership?: {
    role: string;
    is_muted?: boolean;
  } | null;
  isOwner: boolean;
  canManage: boolean;
  groupId: string;
}

const tabItems = [
  { label: 'Bài viết', path: '', icon: MessageCircle },
  { label: 'Thành viên', path: '/members', icon: Users },
  { label: 'Ảnh', path: '/proofs', icon: FileImage },
  { label: 'Deals', path: '/deals', icon: Handshake },
  { label: 'Tasks', path: '/tasks', icon: ListTodo },
];


const visibilityConfig = {
  public: { icon: Globe, label: 'Nhóm Công khai' },
  private: { icon: Lock, label: 'Nhóm Riêng tư' },
  hidden: { icon: Eye, label: 'Nhóm Ẩn' },
};

const roleConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  owner: { icon: Crown, label: 'Owner', color: 'text-yellow-500' },
  manager: { icon: Shield, label: 'Manager', color: 'text-blue-500' },
  seller: { icon: Users, label: 'Seller', color: 'text-purple-500' },
  member: { icon: Users, label: 'Member', color: 'text-muted-foreground' },
  viewer: { icon: Eye, label: 'Viewer', color: 'text-muted-foreground' },
};

export function GroupHeader({ group, membership, isOwner, canManage, groupId }: GroupHeaderProps) {
  const [isMuted, setIsMuted] = useState(membership?.is_muted || false);
  const [isUploading, setIsUploading] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showManageSheet, setShowManageSheet] = useState(false);
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const updateGroup = useUpdateGroup();
  const { data: members = [] } = useGroupMembers(groupId);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const visibilityInfo = visibilityConfig[group.visibility];
  const VisibilityIcon = visibilityInfo.icon;
  const basePath = `/groups/${groupId}`;
  
  const isActive = (path: string) => {
    const fullPath = basePath + path;
    if (path === '') {
      return location.pathname === basePath || location.pathname === basePath + '/';
    }
    return location.pathname.startsWith(fullPath);
  };
  
  const handleJoin = async () => {
    try {
      await joinGroup.mutateAsync({ groupId: group.id });
    } catch (error) {
      // Error handled in hook
    }
  };
  
  const handleLeave = async () => {
    if (isOwner) {
      toast.error('Owner không thể rời group');
      return;
    }
    try {
      await leaveGroup.mutateAsync(group.id);
    } catch (error) {
      // Error handled in hook
    }
  };
  
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Đã copy link group!');
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Đã bật thông báo' : 'Đã tắt thông báo');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${group.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('group-covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-covers')
        .getPublicUrl(fileName);

      await updateGroup.mutateAsync({
        groupId: group.id,
        data: { cover_url: publicUrl },
      });

      toast.success('Đã cập nhật ảnh bìa!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  
  return (
    <div className="bg-card border-b">
      {/* Hidden file input for cover upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />

      {/* Cover Image */}
      <div className="h-40 md:h-56 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 relative group/cover">
        {group.cover_url ? (
          <img
            src={group.cover_url}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImagePlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              {canManage && <p className="text-sm">Thêm ảnh bìa</p>}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Edit Cover Button */}
        {canManage && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 gap-2 opacity-0 group-hover/cover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Đổi ảnh bìa
          </Button>
        )}
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full bg-background/80 backdrop-blur-sm h-9 w-9"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <GroupPostSearchDialog 
            groupId={groupId}
            trigger={
              <Button variant="secondary" size="icon" className="rounded-full bg-background/80 backdrop-blur-sm h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            }
          />
          {/* Only show ••• menu if user is a member */}
          {membership && (
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full bg-background/80 backdrop-blur-sm h-9 w-9"
              onClick={() => canManage ? setShowManageSheet(true) : setShowMenuSheet(true)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Group Info Section */}
      <div className="container max-w-4xl mx-auto px-4">
        {/* Group Name & Info */}
        <div className="py-4">
          <button 
            onClick={() => setShowInfoSheet(true)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl md:text-2xl font-bold">
              {group.name}
            </h1>
            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </button>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <VisibilityIcon className="h-3.5 w-3.5" />
            <span>{visibilityInfo.label}</span>
            <span className="mx-1">·</span>
            <span className="font-medium">{group.member_count.toLocaleString()}</span>
            <span>thành viên</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {canManage ? (
              /* Owner/Manager: Show Quản lý button */
              <>
                <Button 
                  className="gap-2 flex-1 md:flex-none"
                  onClick={() => setShowManageSheet(true)}
                >
                  <Settings className="h-4 w-4" />
                  Quản lý
                </Button>
                <InviteToGroupDialog 
                  groupId={groupId} 
                  groupName={group.name}
                  trigger={
                    <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                      <UserPlus className="h-4 w-4" />
                      Mời
                    </Button>
                  }
                />
              </>
            ) : membership ? (
              /* Regular member: Show Đã tham gia button that opens sheet */
              <>
                <Button 
                  variant="outline" 
                  className="gap-2 flex-1 md:flex-none"
                  onClick={() => setShowMemberSheet(true)}
                >
                  <Users className="h-4 w-4" />
                  Đã tham gia
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <InviteToGroupDialog 
                  groupId={groupId} 
                  groupName={group.name}
                  trigger={
                    <Button className="gap-2 flex-1 md:flex-none">
                      <UserPlus className="h-4 w-4" />
                      Mời
                    </Button>
                  }
                />
              </>
            ) : (
              /* Not a member: Show join button */
              <Button onClick={handleJoin} disabled={joinGroup.isPending} className="gap-2">
                {joinGroup.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Tham gia
              </Button>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-t -mx-4 px-4">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1 py-1">
              {tabItems.map((item) => (
                <Link
                  key={item.path}
                  to={basePath + item.path}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    isActive(item.path) 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      
      {/* Group Info Sheet */}
      <GroupInfoSheet 
        open={showInfoSheet} 
        onOpenChange={setShowInfoSheet}
        group={group}
        members={members}
      />
      
      {/* Group Menu Sheet for regular users */}
      <GroupMenuSheet
        open={showMenuSheet}
        onOpenChange={setShowMenuSheet}
        isMuted={isMuted}
        isOwner={isOwner}
        onToggleMute={toggleMute}
        onLeave={handleLeave}
        onShare={handleShare}
      />
      
      {/* Group Manage Sheet for owners/managers */}
      <GroupManageSheet
        open={showManageSheet}
        onOpenChange={setShowManageSheet}
        group={group}
        isOwner={isOwner}
        canManage={canManage}
      />
      
      {/* Group Member Sheet for regular members */}
      <GroupMemberSheet
        open={showMemberSheet}
        onOpenChange={setShowMemberSheet}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onLeave={handleLeave}
      />
    </div>
  );
}
