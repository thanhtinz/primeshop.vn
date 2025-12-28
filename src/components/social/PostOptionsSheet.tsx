import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Bookmark, Pin, Edit, Trash2, Flag, EyeOff, UserX } from 'lucide-react';

interface PostOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  authorName: string;
  authorAvatar?: string | null;
  isOwner: boolean;
  isGroupPost?: boolean;
  isShopPost?: boolean;
  isPinned?: boolean;
  showPinOption?: boolean;
  isGroupOwnerOrAdmin?: boolean;
  onHidePost?: () => void;
  onHideAuthor?: () => void;
  onReport?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface OptionItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
}

function OptionItem({ icon, title, description, onClick, danger }: OptionItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
    >
      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${danger ? 'text-destructive' : ''}`}>{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>
    </button>
  );
}

export function PostOptionsSheet({
  open,
  onOpenChange,
  postId,
  authorName,
  isOwner,
  isGroupPost,
  isShopPost,
  isPinned,
  showPinOption,
  isGroupOwnerOrAdmin,
  onHidePost,
  onHideAuthor,
  onReport,
  onPin,
  onEdit,
  onDelete,
}: PostOptionsSheetProps) {
  
  const handleAction = (action?: () => void) => {
    action?.();
    onOpenChange(false);
  };

  // Shop posts always show "other" options
  const isOtherPost = !isOwner || isShopPost;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-xl p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Tùy chọn bài viết</SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-20px)] scrollbar-hide p-4 pb-8 space-y-1">
          {isOtherPost ? (
            <>
              {/* Ẩn bài viết */}
              <OptionItem
                icon={<EyeOff className="h-5 w-5" />}
                title="Ẩn bài viết"
                description="Ẩn bớt các bài viết tương tự."
                onClick={() => handleAction(onHidePost)}
              />
              
              {/* Ẩn người đăng bài */}
              <OptionItem
                icon={<UserX className="h-5 w-5" />}
                title={`Ẩn ${authorName}`}
                description="Không nhìn thấy bài viết của người này nữa."
                onClick={() => handleAction(onHideAuthor)}
              />
              
              {/* Báo cáo bài viết */}
              <OptionItem
                icon={<Flag className="h-5 w-5" />}
                title="Báo cáo bài viết"
                description={`Chúng tôi sẽ không cho ${authorName} biết ai đã báo cáo.`}
                onClick={() => handleAction(onReport)}
              />

              {/* Group admin can also delete */}
              {isGroupPost && isGroupOwnerOrAdmin && (
                <OptionItem
                  icon={<Trash2 className="h-5 w-5 text-destructive" />}
                  title="Xóa bài viết (Quản trị)"
                  danger
                  onClick={() => handleAction(onDelete)}
                />
              )}
            </>
          ) : (
            <>
              {/* Ghim - chỉ ở trang cá nhân */}
              {showPinOption && !isGroupPost && (
                <OptionItem
                  icon={<Pin className="h-5 w-5" />}
                  title={isPinned ? "Bỏ ghim bài viết" : "Ghim bài viết"}
                  onClick={() => handleAction(onPin)}
                />
              )}
              
              {/* Chỉnh sửa */}
              <OptionItem
                icon={<Edit className="h-5 w-5" />}
                title="Chỉnh sửa bài viết"
                onClick={() => handleAction(onEdit)}
              />
              
              {/* Xóa */}
              <OptionItem
                icon={<Trash2 className="h-5 w-5 text-destructive" />}
                title="Xóa bài viết"
                danger
                onClick={() => handleAction(onDelete)}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
