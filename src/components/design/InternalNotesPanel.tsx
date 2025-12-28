import { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, Send, Loader2, CheckCircle, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InternalNote {
  id: string;
  content: string;
  author_id: string;
  is_task: boolean;
  task_status: string | null;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface InternalNotesPanelProps {
  ticketId: string;
  orderId: string;
  isSeller: boolean;
}

export function InternalNotesPanel({ ticketId, orderId, isSeller }: InternalNotesPanelProps) {
  const { user } = useAuth();
  const { formatRelative } = useDateFormat();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isTask, setIsTask] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('design_ticket_internal_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching notes:', error);
        return;
      }

      // Get author info
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(n => n.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', authorIds);
        
        const notesWithAuthors = data.map(note => ({
          ...note,
          author: profiles?.find(p => p.user_id === note.author_id),
        }));
        
        setNotes(notesWithAuthors);
      } else {
        setNotes([]);
      }
      
      setLoading(false);
    };

    fetchNotes();

    // Realtime subscription
    const channel = supabase
      .channel(`internal-notes-${ticketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'design_ticket_internal_notes', filter: `ticket_id=eq.${ticketId}` },
        () => fetchNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  // Scroll to bottom on new notes
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  const handleSendNote = async () => {
    if (!newNote.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('design_ticket_internal_notes')
        .insert({
          ticket_id: ticketId,
          order_id: orderId,
          author_id: user.id,
          content: newNote.trim(),
          is_task: isTask,
          task_status: isTask ? 'pending' : null,
        });

      if (error) throw error;
      
      setNewNote('');
      setIsTask(false);
    } catch (error) {
      toast.error('Không thể gửi ghi chú');
    } finally {
      setSending(false);
    }
  };

  const handleToggleTaskStatus = async (noteId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    
    try {
      const { error } = await supabase
        .from('design_ticket_internal_notes')
        .update({ task_status: newStatus })
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      toast.error('Không thể cập nhật task');
    }
  };

  if (!isSeller) return null;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-yellow-500" />
                Ghi chú nội bộ
              </div>
              <Badge variant="secondary" className="text-xs">
                {notes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Notes List */}
                <ScrollArea className="h-[200px] mb-4">
                  <div className="space-y-3 pr-4">
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có ghi chú nào
                      </p>
                    ) : (
                      notes.map((note) => (
                        <div 
                          key={note.id}
                          className={cn(
                            'p-3 rounded-lg text-sm',
                            note.is_task ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900' : 'bg-muted/50'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {note.is_task && (
                              <Checkbox
                                checked={note.task_status === 'done'}
                                onCheckedChange={() => handleToggleTaskStatus(note.id, note.task_status)}
                                className="mt-0.5"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'whitespace-pre-wrap break-words',
                                note.task_status === 'done' && 'line-through text-muted-foreground'
                              )}>
                                {note.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={note.author?.avatar_url || ''} />
                                  <AvatarFallback className="text-[8px]">
                                    {note.author?.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{note.author?.full_name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{formatRelative(note.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is-task"
                      checked={isTask}
                      onCheckedChange={(checked) => setIsTask(!!checked)}
                    />
                    <label htmlFor="is-task" className="text-xs text-muted-foreground cursor-pointer">
                      Đánh dấu là task
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Thêm ghi chú nội bộ..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendNote();
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSendNote}
                      disabled={sending || !newNote.trim()}
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Ctrl + Enter để gửi</p>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
