import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Lock, Globe, Eye, MessageCircle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface GroupCardProps {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  visibility: 'public' | 'private' | 'hidden';
  member_count: number;
  post_count: number;
  monthly_fee?: number | null;
  entry_fee?: number | null;
  is_member?: boolean;
  category?: string | null;
}

const visibilityIcons = {
  public: Globe,
  private: Lock,
  hidden: Eye,
};

const visibilityLabels = {
  public: 'Công khai',
  private: 'Riêng tư',
  hidden: 'Ẩn',
};

export function GroupCard({
  id,
  name,
  description,
  avatar_url,
  cover_url,
  visibility,
  member_count,
  post_count,
  monthly_fee,
  entry_fee,
  is_member,
  category,
}: GroupCardProps) {
  const VisibilityIcon = visibilityIcons[visibility];
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Cover Image */}
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5">
        {cover_url && (
          <img 
            src={cover_url} 
            alt={name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            <VisibilityIcon className="h-3 w-3" />
            {visibilityLabels[visibility]}
          </Badge>
        </div>
      </div>
      
      <CardContent className="pt-0 -mt-8 relative">
        {/* Avatar */}
        <Avatar className="h-16 w-16 border-4 border-background">
          <AvatarImage src={avatar_url || undefined} />
          <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="mt-2">
          <Link to={`/groups/${id}`}>
            <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
              {name}
            </h3>
          </Link>
          
          {category && (
            <Badge variant="outline" className="mt-1 text-xs">
              {category}
            </Badge>
          )}
          
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {description}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {member_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post_count.toLocaleString()}
            </span>
          </div>
          
          {/* Fees */}
          {(entry_fee || monthly_fee) && (
            <div className="flex items-center gap-2 mt-2">
              {entry_fee && entry_fee > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Phí vào: {entry_fee.toLocaleString()}đ
                </Badge>
              )}
              {monthly_fee && monthly_fee > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Phí/tháng: {monthly_fee.toLocaleString()}đ
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        {is_member ? (
          <Button asChild className="w-full">
            <Link to={`/groups/${id}`}>Truy cập</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link to={`/groups/${id}`}>Xem chi tiết</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
