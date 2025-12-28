import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X, Clock, Eye, UserCheck, Search, MoreVertical, Phone, Mail, Calendar } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface ReferralRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const AdminReferralRegistrations = () => {
  const { formatDateTime } = useDateFormat();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<ReferralRegistration | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['referral-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReferralRegistration[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, email, fullName }: { id: string; email: string; fullName: string }) => {
      const { error: updateError } = await supabase
        .from('referral_registrations')
        .update({ status: 'approved', admin_notes: adminNotes || null })
        .eq('id', id);

      if (updateError) throw updateError;

      const code = fullName.split(' ').pop()?.toUpperCase().slice(0, 4) + 
        Math.random().toString(36).substring(2, 6).toUpperCase();

      const { error: codeError } = await supabase
        .from('referral_codes')
        .insert({
          email: email.toLowerCase(),
          code,
        });

      if (codeError) throw codeError;

      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ['referral-registrations'] });
      toast.success(`Đã duyệt và cấp mã: ${code}`);
      setDialogOpen(false);
      setSelectedReg(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('referral_registrations')
        .update({ status: 'rejected', admin_notes: adminNotes || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-registrations'] });
      toast.success('Đã từ chối yêu cầu');
      setDialogOpen(false);
      setSelectedReg(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });

  const filteredRegistrations = registrations?.filter(reg => {
    const matchSearch = !search || 
      reg.full_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" />Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Từ chối</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openDialog = (reg: ReferralRegistration) => {
    setSelectedReg(reg);
    setAdminNotes(reg.admin_notes || '');
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const pendingCount = registrations?.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Đăng ký giới thiệu</h1>
            {pendingCount > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="text-amber-600 font-semibold">{pendingCount}</span> yêu cầu đang chờ duyệt
              </p>
            )}
          </div>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="h-4 w-4 mr-1" />
            {pendingCount} chờ duyệt
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'pending', label: 'Chờ duyệt' },
            { value: 'approved', label: 'Đã duyệt' },
            { value: 'rejected', label: 'Từ chối' },
          ].map(item => (
            <Button
              key={item.value}
              variant={statusFilter === item.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(item.value)}
              className="whitespace-nowrap"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {filteredRegistrations?.map((reg) => (
          <Card key={reg.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium truncate">{reg.full_name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{reg.email}</span>
                  </div>
                  {reg.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{reg.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDateTime(reg.created_at, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(reg.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => openDialog(reg)}>
                        <Eye className="h-4 w-4 mr-2" /> Chi tiết
                      </DropdownMenuItem>
                      {reg.status === 'pending' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedReg(reg);
                              approveMutation.mutate({ id: reg.id, email: reg.email, fullName: reg.full_name });
                            }}
                            className="text-green-600"
                          >
                            <UserCheck className="h-4 w-4 mr-2" /> Duyệt
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedReg(reg);
                              rejectMutation.mutate(reg.id);
                            }}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" /> Từ chối
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {reg.note && (
                <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded truncate">
                  {reg.note}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!filteredRegistrations || filteredRegistrations.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có yêu cầu đăng ký nào
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations?.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.full_name}</TableCell>
                  <TableCell>{reg.email}</TableCell>
                  <TableCell>{reg.phone || '-'}</TableCell>
                  <TableCell>{formatDateTime(reg.created_at, 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>{getStatusBadge(reg.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(reg)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {reg.status === 'pending' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedReg(reg);
                            approveMutation.mutate({ id: reg.id, email: reg.email, fullName: reg.full_name });
                          }}
                          className="text-green-600 hover:text-green-600"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedReg(reg);
                            rejectMutation.mutate(reg.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredRegistrations || filteredRegistrations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Không có yêu cầu đăng ký nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đăng ký</DialogTitle>
          </DialogHeader>
          {selectedReg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Họ tên</p>
                  <p className="font-medium">{selectedReg.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{selectedReg.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Điện thoại</p>
                  <p className="font-medium">{selectedReg.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ngày đăng ký</p>
                  <p className="font-medium">{formatDateTime(selectedReg.created_at, 'HH:mm dd/MM/yyyy')}</p>
                </div>
              </div>

              {selectedReg.note && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Ghi chú từ người đăng ký</p>
                  <p className="bg-muted rounded p-3 text-sm">{selectedReg.note}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Ghi chú admin</Label>
                <Textarea
                  placeholder="Ghi chú (tùy chọn)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>{getStatusBadge(selectedReg.status)}</div>
                {selectedReg.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => rejectMutation.mutate(selectedReg.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button 
                      onClick={() => approveMutation.mutate({ 
                        id: selectedReg.id, 
                        email: selectedReg.email, 
                        fullName: selectedReg.full_name 
                      })}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Duyệt & cấp mã
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReferralRegistrations;