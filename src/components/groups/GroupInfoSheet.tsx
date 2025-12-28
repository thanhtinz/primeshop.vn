import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Globe, Lock, Eye, Clock, Tag, MapPin, 
  MessageSquare, Users, Calendar, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useLanguage } from '@/contexts/LanguageContext';

interface GroupInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    created_at?: string;
  };
  members?: Array<{
    user_id: string;
    role: string;
    profile?: {
      full_name?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
}

const visibilityInfo = {
  public: { 
    icon: Globe, 
    label: 'Công khai',
    description: 'Bất kỳ ai cũng có thể nhìn thấy mọi người trong nhóm và những gì họ đăng.'
  },
  private: { 
    icon: Lock, 
    label: 'Riêng tư',
    description: 'Chỉ thành viên mới có thể xem nội dung trong nhóm.'
  },
  hidden: { 
    icon: Eye, 
    label: 'Ẩn',
    description: 'Chỉ thành viên mới có thể tìm thấy nhóm này.'
  },
};

export function GroupInfoSheet({ open, onOpenChange, group, members = [] }: GroupInfoSheetProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatDate, formatRelative } = useDateFormat();
  const visibility = visibilityInfo[group.visibility];
  const VisibilityIcon = visibility.icon;
  
  const admins = members.filter(m => m.role === 'owner' || m.role === 'manager').slice(0, 3);
  const recentMembers = members.slice(0, 3);
  
  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return language === 'vi' ? 'Không rõ' : 'Unknown';
    return formatRelative(dateStr);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="truncate">{group.name}</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="h-[calc(85vh-80px)] overflow-y-auto scrollbar-hide">
          <div className="py-4 space-y-6">
            {/* Giới thiệu */}
            {group.description && (
              <div>
                <h3 className="font-bold text-lg mb-2">Giới thiệu</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{group.description}</p>
              </div>
            )}
            
            {/* Công khai / Riêng tư */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <VisibilityIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{visibility.label}</p>
                  <p className="text-sm text-muted-foreground">{visibility.description}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Hiển thị</p>
                  <p className="text-sm text-muted-foreground">
                    {group.visibility === 'hidden' 
                      ? 'Chỉ thành viên mới có thể tìm thấy nhóm này.'
                      : 'Ai cũng có thể tìm thấy nhóm này.'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{language === 'vi' ? 'Xem lịch sử nhóm' : 'View group history'}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'vi' ? 'Tạo ra' : 'Created'} {getTimeAgo(group.created_at)}.
                    {group.created_at && ` ${language === 'vi' ? 'Đã tạo nhóm vào' : 'Group created on'} ${formatDate(group.created_at, 'd MMMM, yyyy')}.`}
                  </p>
                </div>
              </div>
              
              {group.category && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Thể nhóm: {group.category}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hoạt động trong nhóm */}
            <div className="border-t pt-4">
              <h3 className="font-bold text-lg mb-4">Hoạt động trong nhóm</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span>{group.post_count.toLocaleString()} bài viết</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span>Tổng số thành viên: {group.member_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>Tạo ra {getTimeAgo(group.created_at)}</span>
                </div>
              </div>
            </div>
            
            {/* Thành viên */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Thành viên</h3>
                <Button 
                  variant="link" 
                  className="text-primary p-0 h-auto"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/groups/${group.id}/members`);
                  }}
                >
                  Xem tất cả
                </Button>
              </div>
              
            {recentMembers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex -space-x-2">
                    {recentMembers.map((member) => (
                      <Avatar key={member.user_id} className="border-2 border-background h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {member.profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {members.length > 3 && (
                      <div className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{members.length - 3}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recentMembers.filter(m => m.profile?.full_name).map(m => m.profile?.full_name).join(', ') || 'Các thành viên'}
                    {members.length > 3 && ` và ${members.length - 3} người khác`}
                  </p>
                </div>
              )}
              
              {admins.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {admins.filter(a => a.profile?.full_name).map(a => a.profile?.full_name).join(', ') || 'Quản trị viên'}
                    </span>
                    {' '}là quản trị viên.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
