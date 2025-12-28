import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StickyNote, Plus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotes, useMyNote, useCreateNote, useDeleteNote, useReactToNote, Note } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useDateFormat } from '@/hooks/useDateFormat';

const NOTE_BACKGROUNDS = [
  { id: 'gradient-1', class: 'bg-gradient-to-br from-pink-400 to-purple-500', textClass: 'text-white' },
  { id: 'gradient-2', class: 'bg-gradient-to-br from-blue-400 to-cyan-400', textClass: 'text-white' },
  { id: 'gradient-3', class: 'bg-gradient-to-br from-green-400 to-emerald-500', textClass: 'text-white' },
  { id: 'gradient-4', class: 'bg-gradient-to-br from-yellow-300 to-orange-400', textClass: 'text-gray-800' },
  { id: 'gradient-5', class: 'bg-gradient-to-br from-rose-400 to-red-500', textClass: 'text-white' },
  { id: 'solid-1', class: 'bg-slate-800', textClass: 'text-white' },
  { id: 'solid-2', class: 'bg-amber-100', textClass: 'text-amber-900' },
  { id: 'solid-3', class: 'bg-sky-100', textClass: 'text-sky-900' },
];

const REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥', '💯', '✨'];

// Create Note Dialog
function CreateNoteDialog({ children, onSuccess }: { children?: React.ReactNode; onSuccess?: () => void }) {
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
      onSuccess?.();
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
            Tạo ghi chú mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className={cn(
            "relative rounded-2xl p-6 min-h-[120px] flex items-center justify-center transition-all",
            selectedBg.class
          )}>
            <p className={cn(
              "text-center font-medium text-lg",
              selectedBg.textClass
            )}>
              {content || 'Bạn đang nghĩ gì?'}
            </p>
          </div>

          {/* Background selector */}
          <div className="flex gap-2 justify-center flex-wrap">
            {NOTE_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
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

// Note bubble that appears on avatar
function NoteBubble({ note, isOwn, onClick }: { note: Note; isOwn?: boolean; onClick?: () => void }) {
  const bgConfig = NOTE_BACKGROUNDS.find(bg => bg.id === note.background_style) || NOTE_BACKGROUNDS[0];
  const deleteNote = useDeleteNote();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute -top-2 -left-2 -right-2 z-10"
    >
      <div 
        className={cn(
          "relative rounded-xl px-2 py-1.5 shadow-md cursor-pointer group",
          bgConfig.class
        )}
        onClick={onClick}
      >
        <p className={cn(
          "text-[11px] font-medium leading-tight text-center line-clamp-2",
          bgConfig.textClass
        )}>
          {note.content}
        </p>
        
        {/* Delete button for own notes */}
        {isOwn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNote.mutate(note.id);
            }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
        
        {/* Bubble tail pointing to avatar */}
        <div className={cn(
          "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45",
          bgConfig.class
        )} />
      </div>
    </motion.div>
  );
}

// Single Note Avatar with bubble
function NoteAvatar({ note, isOwn }: { note: Note; isOwn?: boolean }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const reactToNote = useReactToNote();

  const bgConfig = NOTE_BACKGROUNDS.find(bg => bg.id === note.background_style) || NOTE_BACKGROUNDS[0];

  const handleReact = (emoji: string) => {
    reactToNote.mutate({ noteId: note.id, emoji });
    setShowReactions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center min-w-[72px]"
    >
      {/* Note bubble on top of avatar */}
      <div className="relative mb-1">
        <NoteBubble 
          note={note} 
          isOwn={isOwn} 
          onClick={() => !isOwn && setShowReactions(!showReactions)}
        />
        
        {/* Avatar with gradient ring matching note */}
        <div className={cn(
          "relative mt-8 p-0.5 rounded-full",
          bgConfig.class
        )}>
          <Avatar className="w-14 h-14 border-2 border-background">
            <AvatarImage src={note.user_profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-lg">
              {(note.user_profile?.full_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Reactions popup */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card border rounded-full px-2 py-1 shadow-lg flex gap-0.5 z-20"
            >
              {REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={cn(
                    "text-base hover:scale-125 transition-transform p-0.5",
                    note.my_reaction === emoji && "bg-primary/20 rounded-full"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Name */}
      <span className="text-[11px] text-muted-foreground mt-1 truncate max-w-[70px] text-center">
        {isOwn ? 'Ghi chú của bạn' : (note.user_profile?.full_name || note.user_profile?.username || 'User')}
      </span>

      {/* Reactions display */}
      {note.reactions && note.reactions.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {note.reactions.slice(0, 3).map((r, i) => (
            <span key={i} className="text-[10px]">{r.emoji}</span>
          ))}
          {note.reactions.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{note.reactions.length - 3}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Create Note Avatar Button
function CreateNoteAvatar() {
  const { profile } = useAuth();

  return (
    <CreateNoteDialog>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex flex-col items-center min-w-[72px]"
      >
        {/* Placeholder bubble */}
        <div className="relative mb-1">
          <div className="relative rounded-xl px-2 py-1.5 border-2 border-dashed border-primary/40 bg-muted/50">
            <p className="text-[11px] text-muted-foreground text-center">
              Để lại ghi chú...
            </p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-b-2 border-r-2 border-dashed border-primary/40 bg-muted/50" />
          </div>
          
          {/* Avatar with plus icon */}
          <div className="relative mt-8">
            <Avatar className="w-14 h-14 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary">
                {(profile?.full_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Plus badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
              <Plus className="h-3 w-3" />
            </div>
          </div>
        </div>
        
        <span className="text-[11px] text-primary mt-1 font-medium">Tạo ghi chú</span>
      </motion.button>
    </CreateNoteDialog>
  );
}

// Notes Bar component
export function NotesBar() {
  const { user } = useAuth();
  const { data: notes, isLoading } = useNotes();
  const { data: myNote } = useMyNote();

  if (isLoading) {
    return (
      <div className="flex gap-3 py-3 overflow-x-auto">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse min-w-[72px]">
            <div className="w-16 h-10 rounded-xl bg-muted" />
            <div className="w-14 h-14 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const otherNotes = notes?.filter(n => n.user_id !== user?.id) || [];
  const hasAnyNotes = myNote || otherNotes.length > 0;

  if (!user && !hasAnyNotes) return null;

  return (
    <div className="bg-card rounded-xl border p-3">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Ghi chú</span>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {/* Create note or show my note */}
          {user && (
            myNote ? (
              <NoteAvatar note={{ ...myNote, user_profile: undefined } as Note} isOwn />
            ) : (
              <CreateNoteAvatar />
            )
          )}

          {/* Other users' notes */}
          {otherNotes.map(note => (
            <NoteAvatar key={note.id} note={note} />
          ))}

          {/* Empty state */}
          {!myNote && otherNotes.length === 0 && user && (
            <p className="text-sm text-muted-foreground py-4">
              Chưa có ai để lại ghi chú. Hãy là người đầu tiên!
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
