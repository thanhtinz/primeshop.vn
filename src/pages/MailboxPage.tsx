import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Send,
  FileText,
  Star,
  AlertTriangle,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Tag,
  MoreVertical,
  Paperclip,
  Clock,
  Users,
  Filter,
  FolderPlus,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMailbox,
  useCreateMailbox,
  useMailFolders,
  useMailMessages,
  useMailMessage,
  useUpdateMessage,
  useMoveToFolder,
  useDeleteMessages,
  useMarkAsRead,
  useToggleStar,
  useMailboxStats,
  useCreateFolder,
} from '@/hooks/useMail';
import type { MailMessage, MailFolder } from '@/types/mail';
import { ComposeMailDialog } from '@/components/mail/ComposeMailDialog';
import { MailMessageView } from '@/components/mail/MailMessageView';
import { SetupMailbox } from '@/components/mail/SetupMailbox';

const FOLDER_ICONS: Record<string, React.ElementType> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  important: Star,
  spam: AlertTriangle,
  trash: Trash2,
};

const MailboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { folder = 'inbox' } = useParams<{ folder: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMessageId = searchParams.get('message');

  const { user } = useAuth();
  const { data: mailbox, isLoading: mailboxLoading } = useMailbox();
  const createMailbox = useCreateMailbox();
  const { data: folders, isLoading: foldersLoading } = useMailFolders(mailbox?.id);
  const { data: stats } = useMailboxStats(mailbox?.id);

  const currentFolder = folders?.find(f => f.slug === folder);
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useMailMessages(
    mailbox?.id,
    currentFolder?.id
  );
  const messages = messagesData?.messages || [];

  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'replyAll' | 'forward'>('new');
  const [replyToMessage, setReplyToMessage] = useState<MailMessage | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const moveToFolder = useMoveToFolder();
  const deleteMessages = useDeleteMessages();
  const markAsRead = useMarkAsRead();
  const toggleStar = useToggleStar();
  const createFolder = useCreateFolder();

  // Handle no mailbox - show setup
  if (!mailboxLoading && !mailbox) {
    return <SetupMailbox onSetup={(email, domainId) => createMailbox.mutate({ 
      email_address: email, 
      domain_id: domainId,
      local_part: email.split('@')[0]
    })} />;
  }

  const handleSelectMessage = (id: string) => {
    setSearchParams({ message: id });
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMessages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map(m => m.id)));
    }
  };

  const handleCompose = (mode: 'new' | 'reply' | 'replyAll' | 'forward' = 'new', message?: MailMessage) => {
    setComposeMode(mode);
    setReplyToMessage(message || null);
    setComposeOpen(true);
  };

  const handleMoveSelected = async (targetFolderId: string) => {
    if (selectedMessages.size === 0) return;
    await moveToFolder.mutateAsync({
      messageIds: Array.from(selectedMessages),
      folderId: targetFolderId,
    });
    setSelectedMessages(new Set());
  };

  const handleDeleteSelected = async (permanent = false) => {
    if (selectedMessages.size === 0) return;
    await deleteMessages.mutateAsync({
      messageIds: Array.from(selectedMessages),
      permanent,
    });
    setSelectedMessages(new Set());
  };

  const handleMarkRead = async (isRead: boolean) => {
    if (selectedMessages.size === 0) return;
    await markAsRead.mutateAsync({
      messageIds: Array.from(selectedMessages),
      isRead,
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !mailbox) return;
    await createFolder.mutateAsync({
      mailbox_id: mailbox.id,
      name: newFolderName.trim(),
    });
    setNewFolderName('');
    setNewFolderOpen(false);
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const filteredMessages = messages.filter(m =>
    !searchQuery ||
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.from_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 240 }}
        className="border-r bg-card flex flex-col h-full"
      >
        {/* Compose Button */}
        <div className="p-3">
          <Button
            onClick={() => handleCompose('new')}
            className={cn(
              'w-full gap-2 shadow-lg',
              sidebarCollapsed && 'px-0'
            )}
          >
            <Edit3 className="h-4 w-4" />
            {!sidebarCollapsed && 'Soạn thư'}
          </Button>
        </div>

        {/* Folders */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {foldersLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : (
              folders?.map((f) => {
                const Icon = FOLDER_ICONS[f.slug] || Tag;
                const isActive = f.slug === folder;

                return (
                  <TooltipProvider key={f.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => navigate(`/mail/${f.slug}`)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 text-left truncate">{f.name}</span>
                              {f.unread_count! > 0 && (
                                <Badge variant={isActive ? 'secondary' : 'default'} className="h-5 min-w-5 text-xs">
                                  {f.unread_count}
                                </Badge>
                              )}
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right">
                          <span>{f.name}</span>
                          {f.unread_count! > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5">
                              {f.unread_count}
                            </Badge>
                          )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            )}
          </nav>

          {/* Add Folder */}
          {!sidebarCollapsed && (
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setNewFolderOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Thêm thư mục
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="h-14 border-b px-4 flex items-center gap-4 bg-card">
          <Checkbox
            checked={selectedMessages.size > 0 && selectedMessages.size === messages.length}
            onCheckedChange={handleSelectAll}
            className="data-[state=checked]:bg-primary"
          />

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thư..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedMessages.size > 0 && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleMarkRead(true)}>
                        <MailOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Đánh dấu đã đọc</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleMarkRead(false)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Đánh dấu chưa đọc</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {folders?.filter(f => f.slug !== folder).map(f => (
                      <DropdownMenuItem
                        key={f.id}
                        onClick={() => handleMoveSelected(f.id)}
                      >
                        Chuyển đến {f.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSelected(folder === 'trash')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {folder === 'trash' ? 'Xóa vĩnh viễn' : 'Chuyển vào thùng rác'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            <Separator orientation="vertical" className="h-6" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => refetchMessages()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Làm mới</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/mail/settings')}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cài đặt</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Message List */}
          <ScrollArea className={cn(
            'border-r bg-background transition-all',
            selectedMessageId ? 'w-[400px]' : 'flex-1'
          )}>
            {messagesLoading ? (
              <div className="p-4 space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-1">Không có thư</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? 'Không tìm thấy thư phù hợp với tìm kiếm của bạn'
                    : `Thư mục ${currentFolder?.name || folder} đang trống`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <MailListItem
                    key={message.id}
                    message={message}
                    isSelected={selectedMessages.has(message.id)}
                    isActive={message.id === selectedMessageId}
                    onSelect={() => handleToggleSelect(message.id)}
                    onClick={() => handleSelectMessage(message.id)}
                    onStar={() => toggleStar.mutate({ messageId: message.id, isStarred: !message.is_starred })}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Message View */}
          <AnimatePresence mode="wait">
            {selectedMessageId && (
              <motion.div
                key={selectedMessageId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 min-w-0"
              >
                <MailMessageView
                  messageId={selectedMessageId}
                  onClose={() => setSearchParams({})}
                  onReply={(msg) => handleCompose('reply', msg)}
                  onReplyAll={(msg) => handleCompose('replyAll', msg)}
                  onForward={(msg) => handleCompose('forward', msg)}
                  onDelete={(id) => deleteMessages.mutate({ messageIds: [id] })}
                  folders={folders || []}
                  onMoveToFolder={(id, folderId) => moveToFolder.mutate({ messageIds: [id], folderId })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Compose Dialog */}
      <ComposeMailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
        replyToMessage={replyToMessage}
        mailbox={mailbox}
      />

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo thư mục mới</DialogTitle>
            <DialogDescription>
              Nhập tên cho thư mục mới của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Tên thư mục</Label>
              <Input
                id="folderName"
                placeholder="Nhập tên thư mục..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Tạo thư mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Mail List Item Component
interface MailListItemProps {
  message: MailMessage;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onClick: () => void;
  onStar: () => void;
}

const MailListItem: React.FC<MailListItemProps> = ({
  message,
  isSelected,
  isActive,
  onSelect,
  onClick,
  onStar,
}) => {
  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(d, 'HH:mm');
    } else if (diffDays < 7) {
      return format(d, 'EEE', { locale: vi });
    } else {
      return format(d, 'dd/MM', { locale: vi });
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer transition-colors',
        !message.is_read && 'bg-primary/5',
        isActive && 'bg-accent',
        isSelected && 'bg-primary/10',
        'hover:bg-accent'
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStar();
          }}
          className={cn(
            'p-1 rounded hover:bg-accent transition-colors',
            message.is_starred ? 'text-yellow-500' : 'text-muted-foreground'
          )}
        >
          <Star className={cn('h-4 w-4', message.is_starred && 'fill-current')} />
        </button>
      </div>

      <div onClick={onClick} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(message.from_name, message.from_address)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                'truncate text-sm',
                !message.is_read && 'font-semibold'
              )}>
                {message.from_name || message.from_address}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(message.received_at)}
              </span>
            </div>

            <p className={cn(
              'truncate text-sm',
              !message.is_read ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {message.subject || '(Không có tiêu đề)'}
            </p>

            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {message.preview || '(Không có nội dung)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 pl-10">
          {message.has_attachments && (
            <Paperclip className="h-3 w-3 text-muted-foreground" />
          )}
          {message.priority === 'high' && (
            <Badge variant="destructive" className="h-4 text-[10px]">Quan trọng</Badge>
          )}
          {message.labels?.map((label, i) => (
            <Badge key={i} variant="outline" className="h-4 text-[10px]">
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MailboxPage;
