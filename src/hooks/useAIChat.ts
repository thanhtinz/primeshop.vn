import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id?: string;
  session_id: string;
  title?: string;
  is_escalated: boolean;
  escalated_to?: string;
  escalated_at?: string;
  created_at: string;
  updated_at: string;
}

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('ai_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ai_session_id', sessionId);
  }
  return sessionId;
};

export const useAIConversations = () => {
  const { user } = useAuth();
  const sessionId = getSessionId();
  
  return useQuery({
    queryKey: ['ai-conversations', user?.id, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AIConversation[];
    }
  });
};

export const useAIMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['ai-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AIMessage[];
    },
    enabled: !!conversationId
  });
};

export const useCreateAIConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (title?: string) => {
      const sessionId = getSessionId();
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          title: title || 'Cuộc hội thoại mới'
        })
        .select()
        .single();

      if (error) throw error;
      return data as AIConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    }
  });
};

export const useStreamingAIChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (
    conversationId: string,
    message: string,
    previousMessages: AIMessage[]
  ) => {
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Insert user message
      const { error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        });

      if (userMsgError) throw userMsgError;

      // Prepare messages for AI
      const messages = previousMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      messages.push({ role: 'user', content: message });

      // Stream from AI
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({ messages, conversationId })
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau');
        }
        if (response.status === 402) {
          throw new Error('Đã hết quota AI, vui lòng liên hệ admin');
        }
        throw new Error('Lỗi kết nối AI');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save assistant message
      await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullContent
        });

      // Update conversation
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      queryClient.invalidateQueries({ queryKey: ['ai-messages', conversationId] });
      
      return fullContent;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi không xác định');
      throw error;
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [queryClient]);

  return {
    sendMessage,
    isStreaming,
    streamingContent
  };
};

export const useEscalateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('ai_conversations')
        .update({
          is_escalated: true,
          escalated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Đã chuyển sang nhân viên hỗ trợ');
    }
  });
};
