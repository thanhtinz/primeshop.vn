import React from 'react';
import { useShopPosts } from '@/hooks/useShopPosts';
import PostCard from '@/components/social/PostCard';
import { Loader2, FileText } from 'lucide-react';

interface ShopPostsTabProps {
  sellerId: string;
  shopName: string;
  shopAvatar?: string | null;
  isVerified?: boolean;
}

export function ShopPostsTab({ sellerId, shopName, shopAvatar, isVerified }: ShopPostsTabProps) {
  const { data: posts = [], isLoading } = useShopPosts(sellerId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Shop chưa đăng bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={{
            ...post,
            user_profile: {
              user_id: post.user_id,
              full_name: shopName,
              email: '',
              avatar_url: shopAvatar || null
            },
            // Add shop badge indicator
            is_shop_post: true,
            shop_name: shopName,
            shop_verified: isVerified
          } as any} 
        />
      ))}
    </div>
  );
}
