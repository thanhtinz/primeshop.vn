import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Save, Loader2 } from 'lucide-react';
import { useDesignSellerNotes, useSaveSellerNote } from '@/hooks/useDesignAdvanced';
import { cn } from '@/lib/utils';

interface SellerNotesProps {
  ticketId: string;
  sellerId: string;
  className?: string;
}

export function SellerNotes({ ticketId, sellerId, className }: SellerNotesProps) {
  const { data: notes } = useDesignSellerNotes(ticketId, sellerId);
  const saveNote = useSaveSellerNote();
  const [noteText, setNoteText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (notes?.[0]) {
      setNoteText(notes[0].note);
    }
  }, [notes]);

  const handleSave = () => {
    saveNote.mutate(
      { ticketId, sellerId, note: noteText },
      {
        onSuccess: () => setHasChanges(false),
      }
    );
  };

  return (
    <Card className={cn('border-dashed border-yellow-500/50', className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-yellow-500" />
            <span>Ghi chú riêng</span>
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            (Chỉ bạn thấy)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <Textarea
          value={noteText}
          onChange={(e) => {
            setNoteText(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Ghi chú về ticket này (chỉ bạn thấy)..."
          className="min-h-[100px] resize-none text-sm bg-yellow-50/50 dark:bg-yellow-900/10"
        />
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveNote.isPending}
            className="w-full"
          >
            {saveNote.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu ghi chú
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
