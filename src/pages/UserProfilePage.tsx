import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BadgeCheck, Star, Shield } from 'lucide-react';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useFriendshipStatus, useSendFriendRequest, useAcceptFriendRequest, useCancelFriendRequest, useUnfriend, useFriendsCount, useFriends } from '@/hooks/useFriends';
import { useFollowStatus, useFollow, useUnfollow, useFollowersCount, useFollowingCount } from '@/hooks/useFollow';
import { useAvatarFrames, useUserAvatarFrames } from '@/hooks/useAvatarFrames';
import { useUserPosts, usePostsCount } from '@/hooks/usePosts';
import { useUploadBanner } from '@/hooks/useUserProfile';
import PostCard from '@/components/social/PostCard';
import CreatePostCard from '@/components/social/CreatePostCard';
import { AvatarViewDialog } from '@/components/profile/AvatarViewDialog';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  MessageCircle, 
  Loader2, 
  Users, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Heart,
  Link as LinkIcon,
  Calendar,
  Camera,
  Settings,
  MoreHorizontal,
  Info,
  Share2,
  Flag,
  Copy,
  Eye,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserProfilePage() {
  const { formatDate } = useDateFormat();
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState<'normal' | 'public'>('normal');
  const [avatarViewOpen, setAvatarViewOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);

  // Fetch user profile by username with VIP level name, name color and prime effect
  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, vip_levels(name), name_colors(color_value, gradient_value, is_gradient), prime_effects(effect_type, effect_config)')
        .eq('username', username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username
  });

  // Fetch avatar frames
  const { data: frames } = useAvatarFrames();
  const { data: userFrames } = useUserAvatarFrames();
  const activeFrame = frames?.find(f => f.id === profile?.avatar_frame_id);
  const userOwnedFrameIds = userFrames?.map(uf => uf.frame_id) || [];

  // Banner upload
  const uploadBanner = useUploadBanner();
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File quá lớn. Tối đa 50MB');
        return;
      }
      uploadBanner.mutate(file);
    }
  };

  // Get userId from profile for other hooks
  const userId = profile?.user_id;

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!userId
  });

  // Social hooks
  const { data: friendshipStatus } = useFriendshipStatus(userId || '');
  const { data: isFollowing } = useFollowStatus(userId || '');
  const { data: friendsCount } = useFriendsCount(userId);
  const { data: followersCount } = useFollowersCount(userId);
  const { data: followingCount } = useFollowingCount(userId);
  const { data: postsCount } = usePostsCount(userId);
  const { data: posts, refetch: refetchPosts } = useUserPosts(userId);
  const { data: friends } = useFriends(userId);

  // Mutations
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const unfriend = useUnfriend();
  const follow = useFollow();
  const unfollow = useUnfollow();

  const isOwnProfile = user?.id === userId;
  // When viewing as public, show UI as if we're NOT the owner
  const showAsOwner = isOwnProfile && viewMode === 'normal';

  const getFriendButtonContent = () => {
    if (!friendshipStatus) {
      return { text: 'Thêm bạn', icon: UserPlus, action: () => sendRequest.mutate(userId!), variant: 'default' as const };
    }
    if (friendshipStatus.status === 'accepted') {
      return { text: 'Bạn bè', icon: UserCheck, action: () => unfriend.mutate(userId!), variant: 'secondary' as const };
    }
    if (friendshipStatus.status === 'pending') {
      if (friendshipStatus.requester_id === user?.id) {
        return { text: 'Đã gửi', icon: UserMinus, action: () => cancelRequest.mutate(userId!), variant: 'outline' as const };
      }
      return { text: 'Xác nhận', icon: UserCheck, action: () => acceptRequest.mutate(friendshipStatus.id), variant: 'default' as const };
    }
    return { text: 'Thêm bạn', icon: UserPlus, action: () => sendRequest.mutate(userId!), variant: 'default' as const };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Không tìm thấy người dùng</h1>
            <p className="text-muted-foreground">Người dùng này có thể đã bị xóa hoặc không tồn tại.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const friendBtn = getFriendButtonContent();
  const allImages = posts?.flatMap(p => p.images || []) || [];

  // About Info Component for reuse - Facebook style
  const AboutInfo = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Chi tiết</h3>
      <div className="space-y-3 text-sm">
        {profile.bio && (
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="font-semibold">Trang cá nhân</span>
              <span className="text-muted-foreground"> · {profile.bio}</span>
            </div>
          </div>
        )}
        {profile.website && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {profile.workplace && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <span>Làm việc tại <strong>{profile.workplace}</strong></span>
          </div>
        )}
        {profile.school && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <span>Học tại <strong>{profile.school}</strong></span>
          </div>
        )}
        {profile.location && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <span>Sống tại <strong>{profile.location}</strong></span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <span>Tham gia vào {formatDate(profile.created_at, "'Tháng' M 'năm' yyyy")}</span>
        </div>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2" onClick={() => setActiveTab('about')}>
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="font-medium">Xem thông tin giới thiệu của {isOwnProfile ? 'bạn' : profile.full_name}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* View Mode Banner */}
      {viewMode === 'public' && isOwnProfile && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-primary/10 border-primary/20">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Đang xem trang cá nhân với tư cách người khác</span>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('normal')}>
              Thoát
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* File input for banner - MUST be outside any overflow container */}
      <input
        id="profile-banner-upload"
        type="file"
        accept="image/*"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        onChange={handleBannerChange}
        disabled={uploadBanner.isPending}
      />

      {/* Cover Photo - Responsive height with Prime Effect background */}
      <div className="relative h-[140px] sm:h-[200px] md:h-[280px] lg:h-[320px] bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden">
        {/* Prime Effect Background - takes priority */}
        {(profile as any).prime_effects?.effect_config?.background_url ? (
          <img 
            src={(profile as any).prime_effects.effect_config.background_url} 
            alt="Profile effect" 
            className="w-full h-full object-cover"
          />
        ) : profile.banner_url ? (
          <img 
            src={profile.banner_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20" />
        )}
        
        {showAsOwner && (
          <label 
            htmlFor="profile-banner-upload"
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 inline-flex items-center justify-center gap-1 sm:gap-2 shadow-lg text-xs sm:text-sm h-8 sm:h-9 px-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors"
          >
            {uploadBanner.isPending ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">
              {uploadBanner.isPending ? 'Đang tải...' : 'Chỉnh sửa ảnh bìa'}
            </span>
          </label>
        )}
      </div>

      <div className="container max-w-5xl px-3 sm:px-4">
        {/* Profile Header - Mobile Optimized */}
        <div className="relative -mt-16 sm:-mt-24 md:-mt-28 mb-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-4">
            {/* Avatar with frame - Discord style */}
            <div 
              className="relative cursor-pointer group"
              onClick={() => showAsOwner ? setAvatarUploadOpen(true) : setAvatarViewOpen(true)}
            >
              {/* Frame container - larger than avatar */}
              <div className={`relative ${activeFrame ? 'h-40 w-40 sm:h-52 sm:w-52 md:h-60 md:w-60' : 'h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44'}`}>
                {/* Glow effect behind avatar */}
                <div 
                  className="absolute inset-0 rounded-full opacity-50 blur-xl transition-opacity group-hover:opacity-70"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))',
                    transform: activeFrame ? 'scale(0.65)' : 'scale(0.9)',
                    top: '50%',
                    left: '50%',
                    translate: '-50% -50%'
                  }}
                />
                
                {/* Avatar centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar 
                    className={`${activeFrame ? 'h-[65%] w-[65%]' : 'h-full w-full'} border-4 border-background shadow-2xl ring-2 ring-background/50 transition-transform duration-300 group-hover:scale-105`}
                    style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
                  >
                    <AvatarImage 
                      src={profile.avatar_url || ''} 
                      className="object-cover" 
                      style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }} 
                    />
                    <AvatarFallback 
                      className="text-2xl sm:text-3xl md:text-4xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground" 
                      style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
                    >
                      {profile.full_name?.[0] || profile.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Frame overlay on top */}
                {activeFrame && (
                  <img 
                    key={activeFrame.id}
                    src={activeFrame.image_url}
                    alt="Avatar frame"
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                    style={{ objectFit: 'contain' }}
                  />
                )}
              </div>
              
              {showAsOwner && (
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute bottom-1 right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setAvatarUploadOpen(true); }}
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>

            {/* Name and Stats */}
            <div className="flex-1 text-center sm:text-left pb-2 sm:pb-4 w-full">
              {/* Name with verified badge and nickname */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <h1 
                  className="text-xl sm:text-2xl md:text-3xl font-bold"
                  style={{
                    color: (profile as any).name_colors?.is_gradient 
                      ? undefined 
                      : (profile as any).name_colors?.color_value || undefined,
                    background: (profile as any).name_colors?.is_gradient 
                      ? (profile as any).name_colors?.gradient_value 
                      : undefined,
                    WebkitBackgroundClip: (profile as any).name_colors?.is_gradient ? 'text' : undefined,
                    WebkitTextFillColor: (profile as any).name_colors?.is_gradient ? 'transparent' : undefined,
                  }}
                >
                  {profile.full_name || 'Người dùng'}
                  {profile.nickname && (
                    <span className="text-muted-foreground font-normal"> ({profile.nickname})</span>
                  )}
                </h1>
                {profile.is_verified && (
                  <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 fill-blue-100" />
                )}
              </div>
              
              {/* Badges/Huy hiệu */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1.5 flex-wrap">
                {isAdmin && (
                  <Badge className="gap-1 text-xs bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white hover:from-red-600 hover:to-red-700">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
                {profile.has_prime_boost && (
                  <PrimeBadge size="sm" />
                )}
                <VipBadge levelName={(profile.vip_levels as any)?.name || 'Member'} size="sm" />
                {(profile.total_spent || 0) >= 1000000 && (
                  <Badge variant="outline" className="gap-1 text-xs bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-600">
                    <Star className="h-3 w-3" />
                    Top Buyer
                  </Badge>
                )}
                {profile.two_factor_enabled && (
                  <Badge variant="outline" className="gap-1 text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-600">
                    <Shield className="h-3 w-3" />
                    Bảo mật
                  </Badge>
                )}
              </div>
              
              {/* Stats Row - Clickable for own profile */}
              <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-sm text-muted-foreground">
                {isOwnProfile ? (
                  <>
                    <Link to="/friends" className="hover:text-primary transition-colors">
                      <strong className="text-foreground">{friendsCount || 0}</strong> bạn bè
                    </Link>
                    <span className="text-muted-foreground/50">•</span>
                    <Link to="/friends" className="hover:text-primary transition-colors">
                      <strong className="text-foreground">{followersCount || 0}</strong> theo dõi
                    </Link>
                    <span className="text-muted-foreground/50">•</span>
                    <Link to="/friends" className="hover:text-primary transition-colors">
                      <strong className="text-foreground">{followingCount || 0}</strong> đang theo dõi
                    </Link>
                  </>
                ) : (
                  <>
                    <span><strong className="text-foreground">{friendsCount || 0}</strong> bạn bè</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span><strong className="text-foreground">{followersCount || 0}</strong> theo dõi</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span><strong className="text-foreground">{followingCount || 0}</strong> đang theo dõi</span>
                  </>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
                  {profile.bio}
                </p>
              )}
              
              {/* Friend avatars - Hide on very small screens */}
              {friends && friends.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 mt-2">
                  <div className="flex -space-x-2">
                    {friends.slice(0, 6).map((friend, idx) => (
                      <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={friend.friend_profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs bg-muted">
                          {friend.friend_profile?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {friends.length > 6 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      +{friends.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex gap-2 pb-2 sm:pb-4 w-full sm:w-auto justify-center sm:justify-end">
              {/* Show friend/message buttons when NOT showing as owner (either other user or viewing as public) */}
              {(!showAsOwner && user) ? (
                <>
                  <Button onClick={friendBtn.action} variant={friendBtn.variant} size="sm" className="gap-1 h-9 text-xs sm:text-sm">
                    <friendBtn.icon className="h-4 w-4" />
                    <span className="hidden xs:inline">{friendBtn.text}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1 h-9 text-xs sm:text-sm"
                    onClick={() => isFollowing ? unfollow.mutate(userId!) : follow.mutate(userId!)}
                  >
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </Button>
                  <Button variant="secondary" size="sm" className="h-9" onClick={() => navigate(`/chat?user=${userId}`)}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  {/* Mobile About Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 sm:hidden">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[60vh]">
                      <div className="py-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Giới thiệu
                        </h3>
                        <AboutInfo />
                      </div>
                    </SheetContent>
                  </Sheet>
                  {/* Exit view mode button when viewing own profile as public */}
                  {isOwnProfile && viewMode === 'public' && (
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setViewMode('normal')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : showAsOwner ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link to="/settings" className="flex-1 sm:flex-none">
                    <Button variant="secondary" className="gap-2 w-full h-9 text-xs sm:text-sm">
                      <Settings className="h-4 w-4" />
                      <span>Chỉnh sửa trang cá nhân</span>
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-9 w-9 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewMode('public')}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem với tư cách người khác
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info(
                        profile.is_banned 
                          ? `Tài khoản bị khóa: ${profile.ban_reason || 'Không có lý do'}` 
                          : 'Tài khoản đang hoạt động bình thường'
                      )}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Xem trạng thái tài khoản
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Đã sao chép liên kết');
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Sao chép liên kết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: profile.full_name || 'Trang cá nhân',
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Đã sao chép liên kết');
                        }
                      }}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Chia sẻ trang cá nhân
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-3 sm:my-4" />

        {/* Tabs Navigation - Facebook Style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-2 overflow-x-auto flex-nowrap">
            <TabsTrigger 
              value="posts" 
              className="rounded-full px-4 sm:px-6 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground hover:bg-muted transition-colors"
            >
              Bài viết
            </TabsTrigger>
            <TabsTrigger 
              value="about" 
              className="rounded-full px-4 sm:px-6 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground hover:bg-muted transition-colors"
            >
              Giới thiệu
            </TabsTrigger>
            <TabsTrigger 
              value="friends" 
              className="rounded-full px-4 sm:px-6 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground hover:bg-muted transition-colors"
            >
              Bạn bè
            </TabsTrigger>
            <TabsTrigger 
              value="photos" 
              className="rounded-full px-4 sm:px-6 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground hover:bg-muted transition-colors"
            >
              Ảnh
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Sidebar - Hidden on mobile, shown on lg+ */}
              <div className="hidden lg:block space-y-4">
                {/* Intro Card */}
                <Card className="p-4">
                  <AboutInfo />
                </Card>

                {/* Photos Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Ảnh</h3>
                    {allImages.length > 9 && (
                      <Button variant="link" size="sm" onClick={() => setActiveTab('photos')}>
                        Xem tất cả
                      </Button>
                    )}
                  </div>
                  {allImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1">
                      {allImages.slice(0, 9).map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt="" 
                          className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có ảnh nào</p>
                  )}
                </Card>

                {/* Friends Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Bạn bè</h3>
                    <Button variant="link" size="sm" onClick={() => setActiveTab('friends')}>
                      Xem tất cả
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{friendsCount || 0} người bạn</p>
                  {friends && friends.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {friends.slice(0, 9).map((friend, idx) => (
                        <Link key={idx} to={`/user/${(friend.friend_profile as any)?.username || friend.friend_profile?.user_id}`} className="text-center group">
                          <Avatar className="h-14 w-14 mx-auto mb-1 group-hover:ring-2 ring-primary transition-all">
                            <AvatarImage src={friend.friend_profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-muted text-sm">
                              {friend.friend_profile?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                            {friend.friend_profile?.full_name || 'Người dùng'}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có bạn bè</p>
                  )}
                </Card>
              </div>

              {/* Main Content - Posts */}
              <div className="lg:col-span-2 space-y-4">
                {showAsOwner && <CreatePostCard onSuccess={() => refetchPosts()} />}
                
                {posts && posts.length > 0 ? (
                  posts.map(post => <PostCard key={post.id} post={post} showPinOption={true} />)
                ) : (
                  <Card className="p-6 sm:p-8 text-center">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">Chưa có bài viết nào</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4 sm:mt-6">
            <Card className="max-w-2xl mx-auto p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                Giới thiệu về {profile.full_name || 'Người dùng'}
              </h2>
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-1 text-sm">Tiểu sử</h4>
                    <p className="text-sm sm:text-base">{profile.bio}</p>
                  </div>
                )}
                {profile.workplace && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Nơi làm việc</p>
                      <p className="text-muted-foreground text-sm">{profile.workplace}</p>
                    </div>
                  </div>
                )}
                {profile.school && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Trường học</p>
                      <p className="text-muted-foreground text-sm">{profile.school}</p>
                    </div>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Nơi sống</p>
                      <p className="text-muted-foreground text-sm">{profile.location}</p>
                    </div>
                  </div>
                )}
                {profile.relationship_status && (
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Tình trạng quan hệ</p>
                      <p className="text-muted-foreground text-sm">{profile.relationship_status}</p>
                    </div>
                  </div>
                )}
                {profile.birthday && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                    <p className="font-medium text-sm sm:text-base">Sinh nhật</p>
                      <p className="text-muted-foreground text-sm">{formatDate(profile.birthday, 'dd MMMM yyyy')}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Ngày tham gia</p>
                    <p className="text-muted-foreground text-sm">{formatDate(profile.created_at, 'dd MMMM yyyy')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="mt-4 sm:mt-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Bạn bè ({friendsCount || 0})</h2>
              {friends && friends.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {friends.map((friend, idx) => (
                    <Link 
                      key={idx} 
                      to={`/user/${(friend.friend_profile as any)?.username || friend.friend_profile?.user_id}`}
                      className="bg-card border rounded-xl p-3 sm:p-4 text-center hover:shadow-md transition-all group"
                    >
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-2 group-hover:ring-2 ring-primary transition-all">
                        <AvatarImage src={friend.friend_profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xl sm:text-2xl bg-muted">
                          {friend.friend_profile?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {friend.friend_profile?.full_name || 'Người dùng'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">Chưa có bạn bè nào</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-4 sm:mt-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Ảnh ({allImages.length})</h2>
              {allImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 sm:gap-2">
                  {allImages.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt="" 
                      className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity hover:ring-2 ring-primary"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">Chưa có ảnh nào</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Avatar View Dialog - For other users viewing */}
      <AvatarViewDialog 
        open={avatarViewOpen}
        onOpenChange={setAvatarViewOpen}
        profile={profile}
        activeFrame={activeFrame}
      />

      {/* Avatar Upload Dialog - For profile owner */}
      <AvatarUploadDialog 
        open={avatarUploadOpen}
        onOpenChange={setAvatarUploadOpen}
        activeFrame={activeFrame}
        allFrames={frames || []}
        userOwnedFrameIds={userOwnedFrameIds}
      />
    </Layout>
  );
}
