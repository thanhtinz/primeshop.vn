import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  History, Download, CheckCircle, Eye, 
  FileImage, FileText, File 
} from 'lucide-react';
import { useDesignFileVersions, useApproveFileVersion, DesignFileVersion } from '@/hooks/useDesignAdvanced';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';

interface FileVersionHistoryProps {
  orderId: string;
  ticketId?: string;
  isBuyer?: boolean;
  isSeller?: boolean;
  canApprove?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FileVersionHistory({ 
  orderId, 
  ticketId,
  isBuyer = false, 
  isSeller = false,
  canApprove = false,
  open,
  onOpenChange
}: FileVersionHistoryProps) {
  const { data: versions, isLoading } = useDesignFileVersions(orderId);
  const approveVersion = useApproveFileVersion();
  const [selectedVersion, setSelectedVersion] = useState<DesignFileVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // If controlled mode (open/onOpenChange provided), wrap content in Dialog
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Lịch sử phiên bản ({versions?.length || 0})
            </DialogTitle>
          </DialogHeader>
          <FileVersionContent 
            versions={versions || []}
            isLoading={isLoading}
            isBuyer={isBuyer}
            canApprove={canApprove}
            orderId={orderId}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone card mode
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Lịch sử phiên bản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  if (!versions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Lịch sử phiên bản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có phiên bản nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <FileVersionContent 
      versions={versions}
      isLoading={isLoading}
      isBuyer={isBuyer}
      canApprove={canApprove}
      orderId={orderId}
      asCard
    />
  );
}

interface FileVersionContentProps {
  versions: DesignFileVersion[];
  isLoading: boolean;
  isBuyer: boolean;
  canApprove: boolean;
  orderId: string;
  asCard?: boolean;
}

function FileVersionContent({ versions, isLoading, isBuyer, canApprove, orderId, asCard = false }: FileVersionContentProps) {
  const approveVersion = useApproveFileVersion();
  const { formatDateTime } = useDateFormat();
  const [selectedVersion, setSelectedVersion] = useState<DesignFileVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-4">Đang tải...</p>;
  }

  if (!versions?.length) {
    return <p className="text-sm text-muted-foreground p-4">Chưa có phiên bản nào</p>;
  }

  const content = (
    <>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 p-4">
          {versions.map((version) => {
            const FileIcon = getFileIcon(version.file_type);
            
            return (
              <div
                key={version.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  version.is_approved && 'border-green-500 bg-green-50 dark:bg-green-900/10',
                  version.is_final && 'border-primary'
                )}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      V{version.version_number}
                    </span>
                    {version.is_final && (
                      <Badge variant="default" className="text-xs">Final</Badge>
                    )}
                    {version.is_approved && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã duyệt
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {version.file_name || 'File'} • {formatFileSize(version.file_size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(version.created_at, 'HH:mm dd/MM')}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedVersion(version);
                      setPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={version.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  {isBuyer && canApprove && !version.is_approved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600"
                      onClick={() => approveVersion.mutate({ versionId: version.id, orderId })}
                      disabled={approveVersion.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Phiên bản {selectedVersion?.version_number} - {selectedVersion?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedVersion?.file_type?.startsWith('image/') ? (
              <img
                src={selectedVersion.file_url}
                alt={selectedVersion.file_name || 'Preview'}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <File className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không thể xem trước định dạng này</p>
                <Button className="mt-4" asChild>
                  <a href={selectedVersion?.file_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống
                  </a>
                </Button>
              </div>
            )}
            {selectedVersion?.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm"><strong>Ghi chú:</strong> {selectedVersion.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (asCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Lịch sử phiên bản ({versions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}
