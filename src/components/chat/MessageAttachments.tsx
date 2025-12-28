import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export interface Attachment {
  type: 'image' | 'sticker';
  url?: string;
  sticker?: {
    id: string;
    url: string;
    name: string;
  };
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {attachments.map((attachment, index) => {
        if (attachment.type === 'image' && attachment.url) {
          return (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <img
                  src={attachment.url}
                  alt="Attachment"
                  className="max-w-[200px] max-h-[150px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border"
                />
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 overflow-hidden">
                <img
                  src={attachment.url}
                  alt="Full size attachment"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </DialogContent>
            </Dialog>
          );
        }

        if (attachment.type === 'sticker' && attachment.sticker) {
          return (
            <img 
              key={index} 
              src={attachment.sticker.url}
              alt={attachment.sticker.name}
              className="w-24 h-24 object-contain"
            />
          );
        }

        return null;
      })}
    </div>
  );
};

export default MessageAttachments;
