import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useGroupProofs, useSubmitProof } from '@/hooks/useGroupProofs';
import { Plus, Loader2, FileImage, Clock, Hash } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface GroupProofsTabProps {
  groupId: string;
}

export function GroupProofsTab({ groupId }: GroupProofsTabProps) {
  const { data: proofs, isLoading } = useGroupProofs(groupId);
  const submitProof = useSubmitProof();
  const { formatDateTime } = useDateFormat();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    referenceType: 'general',
    description: '',
    mediaUrls: [] as string[],
  });
  
  const handleSubmit = async () => {
    await submitProof.mutateAsync({
      groupId,
      referenceType: formData.referenceType,
      description: formData.description || undefined,
      mediaUrls: formData.mediaUrls.length > 0 ? formData.mediaUrls : undefined,
    });
    
    setOpen(false);
    setFormData({ referenceType: 'general', description: '', mediaUrls: [] });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Submit Proof Button */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Gửi bằng chứng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gửi bằng chứng</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Input
                  value={formData.referenceType}
                  onChange={(e) => setFormData({ ...formData, referenceType: e.target.value })}
                  placeholder="VD: task, deal, general..."
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả bằng chứng"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Link ảnh (mỗi dòng 1 link)</Label>
                <Textarea
                  value={formData.mediaUrls.join('\n')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    mediaUrls: e.target.value.split('\n').filter(Boolean) 
                  })}
                  placeholder="https://example.com/image.jpg"
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={submitProof.isPending}
              >
                {submitProof.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Gửi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Proofs List */}
      {proofs?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileImage className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có bằng chứng nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proofs?.map((proof) => (
            <Card key={proof.id}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={proof.submitter?.avatar_url || undefined} />
                    <AvatarFallback>
                      {proof.submitter?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {proof.submitter?.full_name || 'Người dùng'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(proof.captured_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {proof.reference_type}
                      </span>
                      {proof.hash && (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {proof.hash.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    
                    {proof.description && (
                      <p className="text-sm mb-3">{proof.description}</p>
                    )}
                    
                    {/* Media */}
                    {proof.media_urls && proof.media_urls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {proof.media_urls.map((url, i) => (
                          <a 
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img 
                              src={url}
                              alt=""
                              className="rounded-lg object-cover aspect-video w-full hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
