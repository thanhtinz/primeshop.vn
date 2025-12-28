import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useSaveGroupOrder } from '@/hooks/useGroupOrder';

interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  cover_url: string | null;
}

interface GroupSortDialogProps {
  groups: Group[];
  trigger?: React.ReactNode;
}

export function GroupSortDialog({ groups, trigger }: GroupSortDialogProps) {
  const [open, setOpen] = useState(false);
  const [orderedGroups, setOrderedGroups] = useState<Group[]>([]);
  const saveOrder = useSaveGroupOrder();
  
  useEffect(() => {
    if (open && groups) {
      setOrderedGroups([...groups]);
    }
  }, [open, groups]);
  
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedGroups];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedGroups(newOrder);
  };
  
  const moveDown = (index: number) => {
    if (index === orderedGroups.length - 1) return;
    const newOrder = [...orderedGroups];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedGroups(newOrder);
  };
  
  const handleSave = async () => {
    const groupIds = orderedGroups.map(g => g.id);
    await saveOrder.mutateAsync(groupIds);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-primary">
            Sắp xếp
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sắp xếp thứ tự nhóm</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {orderedGroups.map((group, index) => (
            <div
              key={group.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              
              <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
                <AvatarImage 
                  src={group.avatar_url || group.cover_url || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-lg bg-primary/10">
                  {group.name[0]}
                </AvatarFallback>
              </Avatar>
              
              <span className="font-medium text-sm flex-1 truncate">{group.name}</span>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveDown(index)}
                  disabled={index === orderedGroups.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={saveOrder.isPending}
          >
            {saveOrder.isPending ? 'Đang lưu...' : 'Lưu thứ tự'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
