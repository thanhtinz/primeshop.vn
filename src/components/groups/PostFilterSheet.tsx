import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, TrendingUp, ArrowUpCircle, ListOrdered } from 'lucide-react';

export type PostFilterType = 'relevant' | 'recent-activity' | 'newest';

interface PostFilterSheetProps {
  value: PostFilterType;
  onChange: (value: PostFilterType) => void;
  trigger?: React.ReactNode;
}

const filterOptions: { 
  id: PostFilterType; 
  label: string; 
  description: string; 
  icon: React.ReactNode;
}[] = [
  {
    id: 'relevant',
    label: 'Phù hợp nhất',
    description: 'Hiển thị bài viết phù hợp nhất trước tiên. Nếu không có, các bài viết sẽ được sắp xếp theo hoạt động gần đây.',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    id: 'recent-activity',
    label: 'Hoạt động mới đây',
    description: 'Hiển thị bài viết có bình luận gần đây đầu tiên',
    icon: <ArrowUpCircle className="h-5 w-5" />,
  },
  {
    id: 'newest',
    label: 'Bài viết mới',
    description: 'Hiển thị bài viết gần đây đầu tiên',
    icon: <ListOrdered className="h-5 w-5" />,
  },
];

export function PostFilterSheet({ value, onChange, trigger }: PostFilterSheetProps) {
  const [open, setOpen] = useState(false);
  
  const currentFilter = filterOptions.find(f => f.id === value);
  
  const handleSelect = (filterId: PostFilterType) => {
    onChange(filterId);
    setOpen(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity py-2">
            <span className="font-semibold">{currentFilter?.label || 'Phù hợp nhất'}</span>
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-4" />
        <SheetHeader className="sr-only">
          <SheetTitle>Bộ lọc bài viết</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{option.label}</h4>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <div className="flex-shrink-0 mt-1">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  value === option.id 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground/30'
                }`}>
                  {value === option.id && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
