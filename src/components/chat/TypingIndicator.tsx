import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  typingUsers: { user_id: string; username?: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const displayText = typingUsers.length === 1 
    ? `${typingUsers[0].username || 'Ai đó'} đang nhập...`
    : typingUsers.length === 2
      ? `${typingUsers[0].username || 'Ai đó'} và ${typingUsers[1].username || 'ai đó'} đang nhập...`
      : `${typingUsers.length} người đang nhập...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      <span>{displayText}</span>
    </div>
  );
}
