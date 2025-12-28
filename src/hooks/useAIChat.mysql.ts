// MySQL version - useAIChat
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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

// Legacy mappings
function mapConversation(data: any): AIConversation {
  if (!data) return data;
  return {
    id: data.id,
    user_id: data.userId || data.user_id,
    session_id: data.sessionId || data.session_id,
    title: data.title,
    is_escalated: data.isEscalated ?? data.is_escalated ?? false,
    escalated_to: data.escalatedTo || data.escalated_to,
    escalated_at: data.escalatedAt || data.escalated_at,
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at,
  };
}

function mapMessage(data: any): AIMessage {
  if (!data) return data;
  return {
    id: data.id,
    conversation_id: data.conversationId || data.conversation_id,
    role: data.role,
    content: data.content,
    metadata: data.metadata,
    created_at: data.createdAt || data.created_at,
  };
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
      let query = apiClient.from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapConversation);
    }
  });
};

export const useAIMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['ai-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await apiClient.from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapMessage);
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
      
      const { data, error } = await apiClient.from('ai_conversations')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          title: title || 'Cuộc hội thoại mới'
        })
        .select()
        .single();

      if (error) throw error;
      return mapConversation(data);
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
      const { error: userMsgError } = await apiClient.from('ai_messages')
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

      // Stream from AI endpoint
      const { data, error } = await apiClient.post('/ai/chat', { 
        messages, 
        conversationId 
      });

      if (error) {
        if (error.status === 429) {
          throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau');
        }
        if (error.status === 402) {
          throw new Error('Đã hết quota AI, vui lòng liên hệ admin');
        }
        throw new Error('Lỗi kết nối AI');
      }

      const fullContent = data.content || data.message || '';
      setStreamingContent(fullContent);

      // Save assistant message
      await apiClient.from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullContent
        });

      // Update conversation
      await apiClient.from('ai_conversations')
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
      const { error } = await apiClient.from('ai_conversations')
        .update({
          is_escalated: true,
          escalated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Đã chuyển sang nhân viên hỗ trợ');
    }
  });
};
