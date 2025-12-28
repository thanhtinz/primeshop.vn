import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Edit, Trash2, Palette, Star, Package, Eye, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentSeller } from '@/hooks/useMarketplace';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  useDesignCategories,
  useSellerDesignServices,
  useCreateDesignService,
  useUpdateDesignService,
  useDeleteDesignService,
  DesignService,
} from '@/hooks/useDesignServices';
import DesignServiceForm from '@/components/design/DesignServiceForm';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

export default function SellerDesignServicesPage() {
  const { data: seller } = useCurrentSeller();
  const { formatPrice } = useCurrency();
  const { data: services, isLoading } = useSellerDesignServices(seller?.id);
  const createMutation = useCreateDesignService();
  const updateMutation = useUpdateDesignService();
  const deleteMutation = useDeleteDesignService();
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<DesignService | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (service: DesignService) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (data: any) => {
    if (!seller?.id) return;

    try {
      if (editingService) {
        await updateMutation.mutateAsync({ id: editingService.id, ...data });
        toast.success('Đã cập nhật dịch vụ');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Đã tạo dịch vụ mới');
      }
      handleCloseForm();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Đã xóa dịch vụ');
      setDeleteId(null);
    } catch (error) {
      toast.error('Lỗi khi xóa dịch vụ');
    }
  };

  const FormWrapper = isMobile ? Sheet : Dialog;
  const FormContent = isMobile ? SheetContent : DialogContent;
  const FormHeader = isMobile ? SheetHeader : DialogHeader;
  const FormTitle = isMobile ? SheetTitle : DialogTitle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Dịch vụ thiết kế</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Quản lý các gói dịch vụ thiết kế của bạn
            </p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Thêm dịch vụ</span>
          <span className="sm:hidden">Thêm</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <Package className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground truncate">Tổng dịch vụ</p>
              <p className="text-lg md:text-2xl font-bold">{services?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <Star className="h-8 w-8 md:h-10 md:w-10 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground truncate">Đánh giá TB</p>
              <p className="text-lg md:text-2xl font-bold">
                {services?.length ? (services.reduce((acc, s) => acc + s.average_rating, 0) / services.length).toFixed(1) : '0.0'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <Package className="h-8 w-8 md:h-10 md:w-10 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground truncate">Hoàn thành</p>
              <p className="text-lg md:text-2xl font-bold">
                {services?.reduce((acc, s) => acc + s.completed_orders, 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List - Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center">Đang tải...</CardContent></Card>
          ) : services?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Palette className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Chưa có dịch vụ nào</p>
                <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Tạo dịch vụ đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            services?.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    {service.portfolio_images?.[0] ? (
                      <img
                        src={service.portfolio_images[0]}
                        alt={service.name}
                        className="w-20 h-20 object-cover rounded-lg shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Palette className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.category?.name}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/design/services/${service.id}`}>
                                <Eye className="h-4 w-4 mr-2" /> Xem
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(service)}>
                              <Edit className="h-4 w-4 mr-2" /> Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteId(service.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-medium text-primary">{formatPrice(service.price)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{service.delivery_days} ngày</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {service.average_rating.toFixed(1)}
                        </div>
                        <Badge variant={service.is_active ? 'default' : 'secondary'} className="text-xs">
                          {service.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                  </TableRow>
                ) : services?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Palette className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Chưa có dịch vụ nào</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  services?.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {service.portfolio_images?.[0] ? (
                            <img
                              src={service.portfolio_images[0]}
                              alt={service.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Palette className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">{service.delivery_days} ngày • {service.revision_count} chỉnh sửa</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{service.category?.name}</TableCell>
                      <TableCell className="font-medium">{formatPrice(service.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {service.average_rating.toFixed(1)}
                          <span className="text-muted-foreground">({service.rating_count})</span>
                        </div>
                      </TableCell>
                      <TableCell>{service.completed_orders}/{service.total_orders}</TableCell>
                      <TableCell>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Đang hoạt động' : 'Tạm ẩn'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/design/services/${service.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(service.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog/Sheet */}
      <FormWrapper open={isFormOpen} onOpenChange={setIsFormOpen}>
        <FormContent className={isMobile ? 'w-full h-[95vh]' : 'max-w-2xl max-h-[90vh] overflow-y-auto'}>
          <FormHeader>
            <FormTitle>{editingService ? 'Sửa dịch vụ' : 'Tạo dịch vụ mới'}</FormTitle>
          </FormHeader>
          {seller && (
            <DesignServiceForm
              service={editingService}
              sellerId={seller.id}
              onSubmit={handleSubmit}
              isPending={createMutation.isPending || updateMutation.isPending}
              onCancel={handleCloseForm}
            />
          )}
        </FormContent>
      </FormWrapper>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dịch vụ?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Dịch vụ sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}