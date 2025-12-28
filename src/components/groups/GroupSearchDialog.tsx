import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearchGroups } from '@/hooks/useGroups';
import { Search, Users, Globe, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GroupSearchDialogProps {
  trigger?: React.ReactNode;
}

export function GroupSearchDialog({ trigger }: GroupSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: results = [], isLoading } = useSearchGroups(search);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tìm kiếm nhóm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm nhóm theo tên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : search.length >= 2 && results.length > 0 ? (
              results.map(group => (
                <Link 
                  key={group.id}
                  to={`/groups/${group.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarImage 
                      src={group.avatar_url || group.cover_url || undefined} 
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10">
                      {group.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{group.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {group.visibility === 'public' ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      <span>{group.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</span>
                      <span>·</span>
                      <Users className="h-3 w-3" />
                      <span>{group.member_count.toLocaleString()} thành viên</span>
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : search.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Không tìm thấy nhóm nào</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nhập ít nhất 2 ký tự để tìm kiếm</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
