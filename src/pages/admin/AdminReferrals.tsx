import React from 'react';
import { useReferralCodes, useRewardRequests, useUpdateRewardRequest } from '@/hooks/useReferrals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Check, X } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

const AdminReferrals = () => {
  const { data: referralCodes, isLoading: loadingCodes } = useReferralCodes();
  const { data: rewardRequests, isLoading: loadingRequests } = useRewardRequests();
  const updateRequest = useUpdateRewardRequest();
  const { formatPrice } = useCurrency();
  const { formatDateTime, formatDate } = useDateFormat();

  const handleApprove = async (requestId: string) => {
    try {
      await updateRequest.mutateAsync({ id: requestId, status: 'approved' });
      toast.success('Đã duyệt yêu cầu');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateRequest.mutateAsync({ id: requestId, status: 'rejected' });
      toast.success('Đã từ chối yêu cầu');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loadingCodes || loadingRequests) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const pendingRequests = rewardRequests?.filter(r => r.status === 'pending') || [];

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    const labels = {
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      pending: 'Chờ duyệt',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Quản lý giới thiệu</h1>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Yêu cầu nhận thưởng chờ duyệt ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            {/* Mobile */}
            <div className="md:hidden space-y-3 p-4">
              {pendingRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{request.referral_code?.email}</p>
                      <p className="text-lg font-bold text-primary">{formatPrice(Number(request.amount))}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(request.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(request.id)}
                        disabled={updateRequest.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={updateRequest.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.referral_code?.email}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(request.amount))}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(request.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleApprove(request.id)}
                        disabled={updateRequest.isPending}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleReject(request.id)}
                        disabled={updateRequest.isPending}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Danh sách mã giới thiệu</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Mobile */}
          <div className="md:hidden space-y-3 p-4">
            {referralCodes?.map((code) => (
              <div key={code.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground truncate max-w-[180px]">{code.email}</p>
                    <p className="font-mono font-bold text-primary">{code.code}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(code.created_at)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Giới thiệu</p>
                    <p className="font-medium">{code.total_referrals}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tổng</p>
                    <p className="font-medium">{formatPrice(Number(code.total_credits))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Còn lại</p>
                    <p className="font-medium text-primary">{formatPrice(Number(code.available_credits))}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!referralCodes || referralCodes.length === 0) && (
              <div className="py-8 text-center text-muted-foreground">
                Chưa có mã giới thiệu nào
              </div>
            )}
          </div>
          {/* Desktop */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Mã giới thiệu</TableHead>
                <TableHead>Số người giới thiệu</TableHead>
                <TableHead>Tổng credits</TableHead>
                <TableHead>Còn lại</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referralCodes?.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>{code.email}</TableCell>
                  <TableCell className="font-mono font-medium">{code.code}</TableCell>
                  <TableCell>{code.total_referrals}</TableCell>
                  <TableCell>{formatPrice(Number(code.total_credits))}</TableCell>
                  <TableCell className="font-medium">{formatPrice(Number(code.available_credits))}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(code.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {(!referralCodes || referralCodes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có mã giới thiệu nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {rewardRequests && rewardRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Lịch sử yêu cầu nhận thưởng</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            {/* Mobile */}
            <div className="md:hidden space-y-3 p-4">
              {rewardRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">{request.referral_code?.email}</p>
                      <p className="font-medium">{formatPrice(Number(request.amount))}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewardRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.referral_code?.email}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(request.amount))}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(request.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminReferrals;