import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useSellerWebhooks as useSellerWebhooksQuery,
  useCreateSellerWebhook,
  useDeleteSellerWebhook,
  useBulkImportJobs,
  type SellerWebhook 
} from '@/hooks/useSellerWebhooks';
import { Webhook, Plus, Trash2, RefreshCw, Upload, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerWebhooksManagerProps {
  sellerId: string;
}

export const SellerWebhooksManager = ({ sellerId }: SellerWebhooksManagerProps) => {
  const { formatDateTime } = useDateFormat();
  const { data: webhooks, isLoading: isLoadingWebhooks, refetch: refetchWebhooks } = useSellerWebhooksQuery(sellerId);
  const { data: bulkImports, refetch: refetchImports } = useBulkImportJobs(sellerId);
  const createWebhook = useCreateSellerWebhook();
  const deleteWebhook = useDeleteSellerWebhook();

  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [webhookFormData, setWebhookFormData] = useState({
    url: '',
    events: ['order.created', 'order.completed']
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableEvents = [
    { value: 'order.created', label: 'Đơn hàng mới' },
    { value: 'order.completed', label: 'Đơn hoàn thành' },
    { value: 'order.cancelled', label: 'Đơn bị hủy' },
    { value: 'dispute.created', label: 'Có dispute mới' },
    { value: 'review.created', label: 'Có đánh giá mới' }
  ];

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWebhook.mutateAsync({
      seller_id: sellerId,
      name: 'Webhook',
      url: webhookFormData.url,
      events: webhookFormData.events,
      is_active: true
    });
    setIsWebhookDialogOpen(false);
    setWebhookFormData({ url: '', events: ['order.created', 'order.completed'] });
  };

  const handleTestWebhook = async (webhook: SellerWebhook) => {
    setIsTesting(webhook.id);
    try {
      const { data, error } = await supabase.functions.invoke('seller-webhook-dispatch', {
        body: {
          event: webhook.events[0] || 'order.created',
          seller_id: sellerId,
          data: {},
          test: true
        }
      });

      if (error) throw error;
      
      toast.success(`Test webhook đã gửi! (${data.success_count}/${data.sent} thành công)`);
      refetchWebhooks();
    } catch (error: any) {
      toast.error('Lỗi test webhook: ' + error.message);
    } finally {
      setIsTesting(null);
    }
  };

  const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Vui lòng chọn file CSV');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('seller_id', sellerId);

      const { data, error } = await supabase.functions.invoke('bulk-import-products', {
        body: formData
      });

      if (error) throw error;

      toast.success(`Import hoàn tất: ${data.success_count} thành công, ${data.fail_count} lỗi`);
      refetchImports();
    } catch (error: any) {
      toast.error('Lỗi import: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `title,description,price,category,images,account_info,account_data,status
"Acc VIP Liên Quân #001","Acc full tướng, full skin, nhiều trang phục hiếm",500000,"lien-quan","https://example.com/img1.jpg,https://example.com/img2.jpg","Level:50|Rank:Cao Thủ|Tướng:100|Skin:200|Server:Việt Nam","Email: abc@gmail.com - Pass: 123456",available
"Acc Rank Kim Cương #002","Acc rank Kim cương 5 sao, có nhiều skin",300000,"lien-quan","https://example.com/img3.jpg","Level:30|Rank:Kim Cương|Tướng:50|Skin:80","Đăng nhập Facebook: fb.com/abc",available
"Acc Newbie #003","Acc mới tạo, sẵn sàng chơi",50000,"lien-quan","","Level:1|Server:Việt Nam","Email: newbie@gmail.com - Pass: abc123",available`;

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-import-san-pham.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="imports">Import hàng loạt</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo real-time khi có sự kiện mới
              </p>
            </div>
            <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm Webhook mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateWebhook} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">URL Webhook</label>
                    <Input
                      value={webhookFormData.url}
                      onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
                      placeholder="https://your-server.com/webhook"
                      type="url"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Sự kiện</label>
                    <div className="space-y-2 mt-2">
                      {availableEvents.map((event) => (
                        <label key={event.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={webhookFormData.events.includes(event.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookFormData({
                                  ...webhookFormData,
                                  events: [...webhookFormData.events, event.value]
                                });
                              } else {
                                setWebhookFormData({
                                  ...webhookFormData,
                                  events: webhookFormData.events.filter(ev => ev !== event.value)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsWebhookDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={createWebhook.isPending}>
                      Thêm
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingWebhooks ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : webhooks && webhooks.length > 0 ? (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Webhook className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <p className="font-mono text-sm break-all">{webhook.url}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                          {webhook.last_triggered_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Gửi lần cuối: {formatDateTime(webhook.last_triggered_at)}
                            </p>
                          )}
                          {webhook.failure_count > 0 && (
                            <p className="text-xs text-destructive mt-1">
                              Lỗi: {webhook.failure_count} lần
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                          {webhook.is_active ? 'Hoạt động' : 'Đã tắt'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestWebhook(webhook as SellerWebhook)}
                          disabled={isTesting === webhook.id}
                        >
                          {isTesting === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteWebhook.mutate(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có webhook nào</p>
              </CardContent>
            </Card>
          )}

          {webhooks && webhooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Webhooks sẽ gửi POST request đến URL của bạn với các headers:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1">
                  <p>X-Webhook-Signature: HMAC-SHA256 signature</p>
                  <p>X-Webhook-Event: event type</p>
                  <p>X-Webhook-Timestamp: ISO timestamp</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Import hàng loạt</h3>
              <p className="text-sm text-muted-foreground">
                Upload file CSV để thêm nhiều sản phẩm cùng lúc
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleUploadCSV}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Đang import...' : 'Upload CSV'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hướng dẫn format CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                <p className="text-muted-foreground"># Header (bắt buộc)</p>
                <p>title,description,price,category,images,account_info,account_data,status</p>
                <p className="text-muted-foreground mt-2"># Ví dụ data</p>
                <p>"Acc VIP #001","Full skin, full tướng",500000,"lien-quan","url1,url2","Level:50|Rank:Cao Thủ|Server:VN","Email:abc@gmail.com Pass:123456",available</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="font-medium">title *</p>
                  <p className="text-muted-foreground text-xs">Tên sản phẩm</p>
                </div>
                <div>
                  <p className="font-medium">price *</p>
                  <p className="text-muted-foreground text-xs">Giá (số)</p>
                </div>
                <div>
                  <p className="font-medium">description</p>
                  <p className="text-muted-foreground text-xs">Mô tả sản phẩm</p>
                </div>
                <div>
                  <p className="font-medium">category</p>
                  <p className="text-muted-foreground text-xs">Slug danh mục</p>
                </div>
                <div>
                  <p className="font-medium">images</p>
                  <p className="text-muted-foreground text-xs">URLs (dấu phẩy)</p>
                </div>
                <div>
                  <p className="font-medium text-primary">account_info</p>
                  <p className="text-muted-foreground text-xs">Tên:Giá trị (dấu |)</p>
                </div>
                <div>
                  <p className="font-medium text-primary">account_data</p>
                  <p className="text-muted-foreground text-xs">Info đăng nhập (bí mật)</p>
                </div>
                <div>
                  <p className="font-medium">status</p>
                  <p className="text-muted-foreground text-xs">available / sold</p>
                </div>
              </div>
              
              <div className="p-3 bg-primary/10 rounded-lg text-sm">
                <p className="font-medium mb-1">📌 account_info format:</p>
                <p className="text-muted-foreground">Dùng <code className="bg-muted px-1 rounded">Tên:Giá trị</code> và ngăn cách các trường bằng <code className="bg-muted px-1 rounded">|</code></p>
                <p className="text-muted-foreground mt-1">VD: <code className="bg-muted px-1 rounded">Level:50|Rank:Cao Thủ|Tướng:100</code></p>
              </div>

              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Tải file mẫu
              </Button>
            </CardContent>
          </Card>

          {bulkImports && bulkImports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử import</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bulkImports.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{job.file_name || 'Không có tên'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(job.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <p className="text-green-600">{job.success_rows || 0} thành công</p>
                          <p className="text-red-600">{job.failed_rows || 0} lỗi</p>
                        </div>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {job.status === 'completed' ? 'Hoàn thành' :
                           job.status === 'failed' ? 'Lỗi' :
                           job.status === 'processing' ? 'Đang xử lý' : 'Chờ'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
