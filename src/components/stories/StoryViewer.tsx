import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, Heart, Send, Eye, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Story, StoryGroup, useViewStory, useReactToStory } from '@/hooks/useStories';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function StoryViewer({ storyGroups, initialGroupIndex, isOpen, onClose }: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const viewStory = useViewStory();
  const reactToStory = useReactToStory();

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.has_viewed) {
      viewStory.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  // Progress timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return;

    const startTime = Date.now();
    const duration = currentStory.media_type === 'video' ? 15000 : STORY_DURATION;

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        goToNextStory();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, currentStory?.id, currentGroupIndex, currentStoryIndex]);

  const goToNextStory = () => {
    setProgress(0);
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    setProgress(0);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(storyGroups[currentGroupIndex - 1].stories.length - 1);
    }
  };

  const handleReact = (emoji: string) => {
    if (currentStory) {
      reactToStory.mutate({ storyId: currentStory.id, emoji });
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      goToPrevStory();
    } else if (x > (width * 2) / 3) {
      goToNextStory();
    } else {
      setIsPaused(prev => !prev);
    }
  };

  if (!currentStory || !currentGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg p-0 bg-black border-0 overflow-hidden h-[90vh] max-h-[800px]">
        <div className="relative h-full flex flex-col" onClick={handleTap}>
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
            {currentGroup.stories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white">
                <AvatarImage src={currentGroup.user_profile.avatar_url || undefined} />
                <AvatarFallback>
                  {(currentGroup.user_profile.full_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">
                  {currentGroup.user_profile.full_name || currentGroup.user_profile.username || 'User'}
                </p>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale: vi })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(prev => !prev);
                }}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>
              {currentStory.media_type === 'video' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(prev => !prev);
                  }}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Story content */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStory.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {currentStory.media_type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={currentStory.media_url}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted={isMuted}
                    playsInline
                  />
                ) : (
                  <img
                    src={currentStory.media_url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Text overlay */}
            {currentStory.text_content && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <p className="text-white text-2xl font-bold text-center drop-shadow-lg">
                  {currentStory.text_content}
                </p>
              </div>
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <p className="text-white text-sm bg-black/30 backdrop-blur rounded-lg p-3">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Footer - Reactions & Reply */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Trả lời..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-white/20 border-0 text-white placeholder:text-white/50"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-1">
                {['❤️', '😂', '😮', '😢', '👏', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    className="text-xl hover:scale-125 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            {/* View count */}
            <div className="flex items-center gap-1 text-white/60 text-xs mt-2">
              <Eye className="h-3 w-3" />
              <span>{currentStory.view_count} lượt xem</span>
            </div>
          </div>

          {/* Navigation arrows */}
          {currentGroupIndex > 0 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevStory();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentGroupIndex < storyGroups.length - 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
              onClick={(e) => {
                e.stopPropagation();
                goToNextStory();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
