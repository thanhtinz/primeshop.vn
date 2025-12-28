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
  Image, 
  Video, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  view_count: number;
  created_at: string;
  expires_at: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

const AdminStories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { formatRelative } = useDateFormat();

  const { data: stories, isLoading } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(s => ({ 
        ...s, 
        full_name: profileMap.get(s.user_id)?.full_name, 
        avatar_url: profileMap.get(s.user_id)?.avatar_url 
      })) as Story[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Đã xóa story');
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (stories || []).filter((s) => 
    !searchTerm || 
    s.caption?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isExpired = (d: string) => new Date(d) < new Date();
  const activeStories = filtered.filter(s => !isExpired(s.expires_at));
  const expiredStories = filtered.filter(s => isExpired(s.expires_at));
  const totalViews = filtered.reduce((sum, s) => sum + s.view_count, 0);
  const videoCount = filtered.filter(s => s.media_type === 'video').length;

  const handleView = (story: Story) => {
    setSelectedStory(story);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setStoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý Stories</h1>
          <p className="text-sm text-muted-foreground">Quản lý stories người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filtered.length}</p>
                <p className="text-xs text-muted-foreground">Tổng stories</p>
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
                <p className="text-2xl font-bold">{activeStories.length}</p>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
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
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Video className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videoCount}</p>
                <p className="text-xs text-muted-foreground">Video</p>
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
              placeholder="Tìm kiếm story..." 
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
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Không có story nào</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
                {filtered.map((story) => (
                  <div 
                    key={story.id} 
                    className="relative group rounded-xl overflow-hidden aspect-[9/16] bg-muted"
                  >
                    {/* Media */}
                    {story.media_type === 'video' ? (
                      <video 
                        src={story.media_url} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img 
                        src={story.media_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60">
                      {/* Top info */}
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border-2 border-white">
                            <AvatarImage src={story.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {story.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-white font-medium truncate max-w-[60px]">
                            {story.full_name || 'Ẩn danh'}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(story)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(story.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Media type badge */}
                      {story.media_type === 'video' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                            <Play className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Bottom info */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between text-white text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {story.view_count}
                          </span>
                          <Badge 
                            variant={isExpired(story.expires_at) ? "secondary" : "default"}
                            className={`text-[10px] h-5 ${!isExpired(story.expires_at) ? 'bg-green-500' : ''}`}
                          >
                            {isExpired(story.expires_at) ? 'Hết hạn' : 'Hoạt động'}
                          </Badge>
                        </div>
                        {story.caption && (
                          <p className="text-white text-xs mt-1 truncate">{story.caption}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="relative aspect-[9/16] bg-black">
            {selectedStory && (
              <>
                {selectedStory.media_type === 'video' ? (
                  <video 
                    src={selectedStory.media_url} 
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img 
                    src={selectedStory.media_url} 
                    alt="" 
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
                  <div className="flex items-center gap-3">
                    <Avatar className="border-2 border-white">
                      <AvatarImage src={selectedStory.avatar_url || ''} />
                      <AvatarFallback>{selectedStory.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="text-white">
                      <p className="font-medium">{selectedStory.full_name || 'Ẩn danh'}</p>
                      <p className="text-xs opacity-80">
                        {formatRelative(selectedStory.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedStory.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm">{selectedStory.caption}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Story sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => storyToDelete && deleteMutation.mutate(storyToDelete)}
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

export default AdminStories;
