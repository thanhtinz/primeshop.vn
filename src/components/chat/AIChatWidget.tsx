import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, 
  Minimize2, Maximize2, UserPlus, Sparkles 
} from 'lucide-react';
import { useAIConversations, useAIMessages, useCreateAIConversation, useStreamingAIChat, useEscalateConversation } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [] } = useAIConversations();
  const { data: messages = [] } = useAIMessages(currentConversationId);
  const createConversation = useCreateAIConversation();
  const { sendMessage, isStreaming, streamingContent } = useStreamingAIChat();
  const escalate = useEscalateConversation();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);
    
    if (!currentConversationId && conversations.length === 0) {
      const newConv = await createConversation.mutateAsync('Cuộc hội thoại mới');
      setCurrentConversationId(newConv.id);
    } else if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || !currentConversationId) return;
    
    const message = inputValue;
    setInputValue('');
    
    await sendMessage(currentConversationId, message, messages);
  };

  const handleNewChat = async () => {
    const newConv = await createConversation.mutateAsync('Cuộc hội thoại mới');
    setCurrentConversationId(newConv.id);
  };

  const handleEscalate = () => {
    if (currentConversationId) {
      escalate.mutate(currentConversationId);
    }
  };

  const allMessages = [...messages];
  if (streamingContent) {
    allMessages.push({
      id: 'streaming',
      conversation_id: currentConversationId || '',
      role: 'assistant' as const,
      content: streamingContent,
      created_at: new Date().toISOString()
    });
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={handleOpen}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : 500
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]",
              "bg-card border border-border rounded-2xl shadow-2xl overflow-hidden",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                </div>
                <div>
                  <p className="font-semibold">AI Assistant</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Hỗ trợ 24/7
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewChat}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {/* Welcome message */}
                    {allMessages.length === 0 && (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                        <p className="font-medium">Xin chào! 👋</p>
                        <p className="text-sm text-muted-foreground">
                          Tôi có thể giúp gì cho bạn?
                        </p>
                        
                        {/* Quick actions */}
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {['Hướng dẫn mua hàng', 'Kiểm tra đơn hàng', 'Chính sách hoàn tiền'].map((q) => (
                            <Button
                              key={q}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInputValue(q);
                                inputRef.current?.focus();
                              }}
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {allMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2",
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.id === 'streaming' && (
                            <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1" />
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isStreaming && !streamingContent && (
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Escalate button */}
                {messages.length > 3 && (
                  <div className="px-4 pb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={handleEscalate}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Kết nối với nhân viên hỗ trợ
                    </Button>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      disabled={isStreaming}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isStreaming || !inputValue.trim()}>
                      {isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;
