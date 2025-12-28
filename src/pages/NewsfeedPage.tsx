import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsfeed } from '@/hooks/usePosts';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import PostCard from '@/components/social/PostCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsfeedPage() {
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNewsfeed();

  const posts = data?.pages.flatMap(page => page.posts) || [];

  return (
    <Layout>
      <div className="container py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Bảng tin</h1>
          
          {user ? (
            <CreatePostCard />
          ) : (
            <div className="bg-card rounded-xl border p-4 text-center">
              <p className="text-muted-foreground mb-2">Đăng nhập để đăng bài viết</p>
              <Link to="/auth"><Button>Đăng nhập</Button></Link>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : posts.length > 0 ? (
            <>
              {posts.map(post => (
                <PostCard key={post.id} post={post} showGroupBanner={(post as any).is_group_post} />
              ))}
              {hasNextPage && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : t('viewMore')}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
