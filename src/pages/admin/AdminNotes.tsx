import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Trash2, 
  Eye, 
  Pin, 
  Loader2,
  StickyNote,
  CheckCircle,
  Clock,
  MoreVertical,
  Music
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

interface Note {
  id: string;
  user_id: string;
  content: string;
  music_url: string | null;
  music_name: string | null;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  expires_at: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

const AdminNotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { formatRelative, formatDateTime } = useDateFormat();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['admin-notes', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('user_notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (searchTerm) {
        query = query.ilike('content', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const userIds = [...new Set((data || []).map(n => n.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(n => ({ 
        ...n, 
        full_name: profileMap.get(n.user_id)?.full_name, 
        avatar_url: profileMap.get(n.user_id)?.avatar_url 
      })) as Note[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      toast.success('Đã xóa ghi chú');
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = notes || [];
  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  const activeNotes = filtered.filter(n => !isExpired(n.expires_at));
  const pinnedNotes = filtered.filter(n => n.is_pinned);
  const totalViews = filtered.reduce((sum, n) => sum + (n.view_count || 0), 0);

  const handleView = (note: Note) => {
    setSelectedNote(note);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý Ghi chú</h1>
          <p className="text-sm text-muted-foreground">Quản lý ghi chú người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <StickyNote className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filtered.length}</p>
                <p className="text-xs text-muted-foreground">Tổng ghi chú</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeNotes.length}</p>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Pin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pinnedNotes.length}</p>
                <p className="text-xs text-muted-foreground">Đã ghim</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Eye className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews}</p>
                <p className="text-xs text-muted-foreground">Lượt xem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm ghi chú..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Không có ghi chú nào</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {filtered.map((note) => (
                  <Card 
                    key={note.id} 
                    className={`relative overflow-hidden hover:shadow-md transition-shadow ${
                      note.is_pinned ? 'ring-2 ring-primary/50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={note.avatar_url || ''} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {note.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {note.full_name || 'Ẩn danh'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(note.created_at)}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(note)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(note.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Content */}
                      <div className="bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-3 min-h-[80px]">
                        <p className="text-sm line-clamp-3">{note.content}</p>
                      </div>

                      {/* Music */}
                      {note.music_name && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Music className="h-3 w-3" />
                          <span className="truncate">{note.music_name}</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {note.view_count || 0}
                          </span>
                          {note.is_pinned && (
                            <Pin className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <Badge 
                          variant={isExpired(note.expires_at) ? "secondary" : "default"}
                          className={`text-[10px] h-5 ${!isExpired(note.expires_at) ? 'bg-green-500' : ''}`}
                        >
                          {isExpired(note.expires_at) ? 'Hết hạn' : 'Hoạt động'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết ghi chú</DialogTitle>
            <DialogDescription>Xem nội dung đầy đủ của ghi chú</DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedNote.avatar_url || ''} />
                  <AvatarFallback>{selectedNote.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedNote.full_name || 'Ẩn danh'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedNote.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{selectedNote.content}</p>
              </div>

              {selectedNote.music_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="h-4 w-4" />
                  <span>{selectedNote.music_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {selectedNote.view_count || 0} lượt xem
                </span>
                {selectedNote.is_pinned && (
                  <span className="flex items-center gap-1">
                    <Pin className="h-4 w-4 text-primary" /> Đã ghim
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Ghi chú sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => noteToDelete && deleteMutation.mutate(noteToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotes;
