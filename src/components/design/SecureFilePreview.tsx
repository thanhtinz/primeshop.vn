import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Lock, ZoomIn, ZoomOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecureFilePreviewProps {
  fileUrl: string;
  fileName?: string;
  isPreview?: boolean; // true = watermark, false = full access
  watermarkText?: string;
  onDownload?: () => void;
  canDownload?: boolean;
  className?: string;
}

export function SecureFilePreview({
  fileUrl,
  fileName = 'Design Preview',
  isPreview = true,
  watermarkText = 'PREVIEW - DO NOT COPY',
  onDownload,
  canDownload = false,
  className,
}: SecureFilePreviewProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Disable right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable PrintScreen, Ctrl+P, Ctrl+S, Ctrl+Shift+S
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 's')
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
  const isPdf = /\.pdf$/i.test(fileUrl);

  return (
    <>
      <div
        className={cn(
          'relative group cursor-pointer rounded-lg overflow-hidden border',
          className
        )}
        onClick={() => setOpen(true)}
      >
        {isImage ? (
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-full object-cover"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">{fileName}</span>
          </div>
        )}

        {/* Preview overlay */}
        {isPreview && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" />
              Xem preview
            </Badge>
          </div>
        )}

        {/* Lock indicator */}
        {isPreview && (
          <div className="absolute top-2 right-2">
            <div className="bg-yellow-500/90 text-white p-1 rounded">
              <Lock className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] p-0 overflow-hidden"
          onContextMenu={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {fileName}
                {isPreview && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                    <Lock className="h-3 w-3 mr-1" />
                    Preview Only
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                {canDownload && !isPreview && onDownload && (
                  <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Tải xuống
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div
            ref={containerRef}
            className="relative overflow-auto bg-muted/50"
            style={{ 
              maxHeight: 'calc(90vh - 80px)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onDragStart={(e) => e.preventDefault()}
          >
            {isImage && (
              <div className="relative flex items-center justify-center p-4 min-h-[400px]">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom})`,
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />

                {/* Dynamic Watermark Pattern */}
                {isPreview && (
                  <div 
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                    style={{
                      background: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 100px,
                        rgba(255,255,255,0.03) 100px,
                        rgba(255,255,255,0.03) 200px
                      )`,
                    }}
                  >
                    {/* Multiple watermark texts */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute text-2xl font-bold opacity-10 text-foreground whitespace-nowrap select-none"
                        style={{
                          top: `${(i % 4) * 30 + 10}%`,
                          left: `${Math.floor(i / 4) * 35 - 10}%`,
                          transform: `rotate(-30deg)`,
                        }}
                      >
                        {watermarkText}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isPdf && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {isPreview 
                    ? 'PDF preview không khả dụng trong chế độ bảo vệ' 
                    : 'Nhấn tải xuống để xem PDF'}
                </p>
                {canDownload && !isPreview && onDownload && (
                  <Button onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống PDF
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Protection notice */}
          {isPreview && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t text-center text-sm text-yellow-700 dark:text-yellow-300">
              🔒 File được bảo vệ. Vui lòng xác nhận hoàn tất đơn hàng để tải file gốc.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
