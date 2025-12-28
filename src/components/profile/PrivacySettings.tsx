import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, MessageCircle, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function PrivacySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: privacySettings, isLoading } = useQuery({
    queryKey: ['privacy-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('friend_request_followers_only, message_friends_only')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const updatePrivacy = useMutation({
    mutationFn: async (updates: { friend_request_followers_only?: boolean; message_friends_only?: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings', user?.id] });
      toast.success('Đã cập nhật cài đặt riêng tư');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt');
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cài đặt quyền riêng tư
        </CardTitle>
        <CardDescription>
          Quản lý ai có thể tương tác với bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Friend Request Setting */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="friend-request-setting" className="text-base font-medium">
                Chỉ cho người theo dõi gửi lời mời kết bạn
              </Label>
              <p className="text-sm text-muted-foreground">
                Khi bật, chỉ những người đang theo dõi bạn mới có thể gửi lời mời kết bạn
              </p>
            </div>
          </div>
          <Switch
            id="friend-request-setting"
            checked={privacySettings?.friend_request_followers_only || false}
            onCheckedChange={(checked) => 
              updatePrivacy.mutate({ friend_request_followers_only: checked })
            }
            disabled={updatePrivacy.isPending}
          />
        </div>

        <Separator />

        {/* Message Setting */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="message-setting" className="text-base font-medium">
                Chỉ cho bạn bè nhắn tin
              </Label>
              <p className="text-sm text-muted-foreground">
                Khi bật, chỉ những người đã là bạn bè mới có thể gửi tin nhắn cho bạn
              </p>
            </div>
          </div>
          <Switch
            id="message-setting"
            checked={privacySettings?.message_friends_only || false}
            onCheckedChange={(checked) => 
              updatePrivacy.mutate({ message_friends_only: checked })
            }
            disabled={updatePrivacy.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}