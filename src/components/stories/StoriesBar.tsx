import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStories, StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { StoryViewer } from './StoryViewer';
import { CreateStoryDialog } from './CreateStoryDialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useMyNote, useCreateNote, useDeleteNote } from '@/hooks/useNotes';

const NOTE_BACKGROUNDS = [
  { id: 'gradient-1', class: 'bg-gradient-to-br from-pink-400 to-purple-500', textClass: 'text-white' },
  { id: 'gradient-2', class: 'bg-gradient-to-br from-blue-400 to-cyan-400', textClass: 'text-white' },
  { id: 'gradient-3', class: 'bg-gradient-to-br from-green-400 to-emerald-500', textClass: 'text-white' },
  { id: 'gradient-4', class: 'bg-gradient-to-br from-yellow-300 to-orange-400', textClass: 'text-gray-800' },
  { id: 'gradient-5', class: 'bg-gradient-to-br from-rose-400 to-red-500', textClass: 'text-white' },
  { id: 'solid-1', class: 'bg-slate-800', textClass: 'text-white' },
];

// Create Note Dialog inline
function CreateNoteInlineDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(NOTE_BACKGROUNDS[0]);
  const createNote = useCreateNote();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      await createNote.mutateAsync({
        content: content.trim(),
        background_style: selectedBg.id,
        expires_in_hours: 24
      });
      setOpen(false);
      setContent('');
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Chia sẻ ghi chú
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className={cn(
            "relative rounded-2xl p-6 min-h-[100px] flex items-center justify-center transition-all",
            selectedBg.class
          )}>
            <p className={cn(
              "text-center font-medium",
              selectedBg.textClass
            )}>
              {content || 'Hôm nay bạn nghĩ gì?'}
            </p>
          </div>

          {/* Background selector */}
          <div className="flex gap-2 justify-center">
            {NOTE_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  bg.class,
                  selectedBg.id === bg.id ? 'ring-2 ring-primary ring-offset-2' : 'border-transparent'
                )}
                onClick={() => setSelectedBg(bg)}
              />
            ))}
          </div>

          {/* Content input */}
          <Textarea
            placeholder="Viết ghi chú của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={60}
            rows={2}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{content.length}/60</p>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!content.trim() || createNote.isPending}
          >
            {createNote.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang đăng...
              </>
            ) : (
              'Đăng ghi chú'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Note Avatar with bubble - shows user's note or create button
function NoteAvatarItem() {
  const { user, profile } = useAuth();
  const { data: myNote } = useMyNote();
  const deleteNote = useDeleteNote();

  const bgConfig = myNote 
    ? NOTE_BACKGROUNDS.find(bg => bg.id === myNote.background_style) || NOTE_BACKGROUNDS[0]
    : NOTE_BACKGROUNDS[0];

  if (!user) return null;

  // If user has a note, show it
  if (myNote) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-1 shrink-0 relative"
      >
        {/* Note bubble on top */}
        <div className="relative mb-1">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "relative rounded-xl px-2 py-1.5 max-w-[90px] shadow-md cursor-pointer group",
              bgConfig.class
            )}
          >
            <p className={cn(
              "text-[10px] font-medium leading-tight text-center line-clamp-2",
              bgConfig.textClass
            )}>
              {myNote.content}
            </p>
            
            {/* Delete button */}
            <button
              onClick={() => deleteNote.mutate(myNote.id)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
            >
              ×
            </button>
            
            {/* Bubble tail */}
            <div className={cn(
              "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45",
              bgConfig.class
            )} />
          </motion.div>
        </div>

        {/* Avatar with gradient ring */}
        <div className={cn("p-0.5 rounded-full", bgConfig.class)}>
          <Avatar className="w-14 h-14 border-2 border-background">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {(profile?.full_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <span className="text-[10px] font-medium text-center max-w-[70px] truncate">
          Ghi chú của bạn
        </span>
      </motion.div>
    );
  }

  // Show create note button
  return (
    <CreateNoteInlineDialog>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center gap-1 shrink-0"
      >
        {/* Comic bubble placeholder */}
        <div className="relative mb-1">
          <div className="relative rounded-xl px-2 py-1.5 border-2 border-dashed border-primary/40 bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center whitespace-nowrap">
              Chia sẻ ghi chú...
            </p>
            {/* Bubble tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-b-2 border-r-2 border-dashed border-primary/40 bg-muted/30" />
          </div>
        </div>

        {/* Avatar with plus icon */}
        <div className="relative">
          <Avatar className="w-14 h-14 border-2 border-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary">
              {(profile?.full_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Plus badge with note icon */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
            <StickyNote className="h-2.5 w-2.5" />
          </div>
        </div>
        
        <span className="text-[10px] text-primary font-medium">Tạo ghi chú</span>
      </motion.button>
    </CreateNoteInlineDialog>
  );
}

export function StoriesBar() {
  const { user, profile } = useAuth();
  const { data: storyGroups, isLoading } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  const handleStoryClick = (index: number) => {
    setSelectedGroupIndex(index);
    setViewerOpen(true);
  };

  const myStories = storyGroups?.find(g => g.user_id === user?.id);
  const otherStories = storyGroups?.filter(g => g.user_id !== user?.id) || [];

  if (isLoading) {
    return (
      <div className="flex gap-3 p-4 overflow-x-auto">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted" />
            <div className="w-12 h-3 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Don't render if no stories available and user is not logged in
  const hasMyStory = user && myStories && myStories.stories && myStories.stories.length > 0;
  const hasOtherStories = otherStories && otherStories.length > 0;
  
  if (!hasMyStory && !hasOtherStories && !user) {
    return null;
  }

  return (
    <>
      <div className="bg-card rounded-xl border">
        <ScrollArea className="w-full">
          <div className="flex gap-3 p-3">
            {/* Note Avatar - First item */}
            {user && <NoteAvatarItem />}

            {/* Separator */}
            {user && <div className="w-px bg-border self-stretch my-2" />}

            {/* Create story button or my story */}
            {myStories ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStoryClick(storyGroups?.findIndex(g => g.user_id === user?.id) || 0)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <Avatar className="w-full h-full border-2 border-background">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(profile?.full_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs font-medium truncate max-w-[64px]">Story của bạn</span>
              </motion.button>
            ) : user ? (
              <CreateStoryDialog>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-background">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(profile?.full_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                      <Plus className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[64px]">Tạo story</span>
                </motion.button>
              </CreateStoryDialog>
            ) : null}

            {/* Other users' stories */}
            {otherStories.map((group, index) => {
              const actualIndex = myStories ? index + 1 : index;
              return (
                <motion.button
                  key={group.user_id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStoryClick(actualIndex)}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full p-0.5",
                    group.has_unviewed 
                      ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" 
                      : "bg-muted"
                  )}>
                    <Avatar className="w-full h-full border-2 border-background">
                      <AvatarImage src={group.user_profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary">
                        {(group.user_profile.full_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className={cn(
                    "text-xs truncate max-w-[64px]",
                    group.has_unviewed ? "font-medium" : "text-muted-foreground"
                  )}>
                    {group.user_profile.full_name || group.user_profile.username || 'User'}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {storyGroups && storyGroups.length > 0 && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
