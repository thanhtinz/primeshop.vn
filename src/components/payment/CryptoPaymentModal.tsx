import { useState, useEffect, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Copy, Check, ExternalLink, Clock, AlertTriangle, 
  CheckCircle2, XCircle, Loader2, RefreshCw
} from 'lucide-react';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  amountUsdt: number;
  amountOriginal: number;
  currencyOriginal: string;
  walletAddress: string;
  qrCode?: string;
  network: string;
  expiresAt: string;
}

// USDT Icon
const USDTIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path fill="#fff" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
  </svg>
);

export function CryptoPaymentModal({
  isOpen,
  onClose,
  paymentId,
  amountUsdt,
  amountOriginal,
  currencyOriginal,
  walletAddress,
  qrCode,
  network,
  expiresAt,
}: CryptoPaymentModalProps) {
  const { refreshProfile } = useAuth();
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'failed'>('pending');
  const [timeLeft, setTimeLeft] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setStatus('expired');
        setTimeLeft('Hết hạn');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Auto-check status every 10 seconds
  useEffect(() => {
    if (!isOpen || status !== 'pending') return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fpayment-usdt', {
          body: {
            action: 'check_status',
            paymentId: paymentId,
          }
        });

        if (data?.data?.status === 'completed') {
          setStatus('completed');
          toast.success('Thanh toán thành công!');
          refreshProfile();
        } else if (data?.data?.status === 'expired' || data?.data?.status === 'failed') {
          setStatus(data.data.status);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [isOpen, paymentId, status, refreshProfile]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied('address');
      toast.success('Đã copy địa chỉ ví');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Không thể copy');
    }
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(amountUsdt.toFixed(2));
      setCopied('amount');
      toast.success('Đã copy số tiền');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Không thể copy');
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('fpayment-usdt', {
        body: {
          action: 'check_status',
          paymentId: paymentId,
        }
      });

      if (data?.data?.status === 'completed') {
        setStatus('completed');
        toast.success('Thanh toán thành công!');
        refreshProfile();
      } else if (data?.data?.status === 'expired') {
        setStatus('expired');
        toast.error('Giao dịch đã hết hạn');
      } else if (data?.data?.status === 'failed') {
        setStatus('failed');
        toast.error('Giao dịch thất bại');
      } else {
        toast.info('Đang chờ thanh toán...');
      }
    } catch (error) {
      toast.error('Không thể kiểm tra trạng thái');
    } finally {
      setIsChecking(false);
    }
  };

  const renderStatusContent = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Thanh toán thành công!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Số tiền {amountUsdt.toFixed(2)} USDT đã được ghi nhận.<br />
              Số dư của bạn đã được cập nhật.
            </p>
            <Button onClick={onClose} className="mt-6">
              Đóng
            </Button>
          </div>
        );
      
      case 'expired':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-orange-600 mb-2">Giao dịch hết hạn</h3>
            <p className="text-sm text-muted-foreground text-center">
              Giao dịch này đã hết thời gian thanh toán.<br />
              Vui lòng tạo giao dịch mới nếu cần.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-6">
              Đóng
            </Button>
          </div>
        );
      
      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">Giao dịch thất bại</h3>
            <p className="text-sm text-muted-foreground text-center">
              Đã có lỗi xảy ra trong quá trình thanh toán.<br />
              Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-6">
              Đóng
            </Button>
          </div>
        );
      
      default:
        return (
          <>
            {/* Amount Display */}
            <div className="text-center py-4 px-4 rounded-lg bg-[#26A17B]/10 border border-[#26A17B]/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <USDTIcon />
                <span className="text-2xl font-bold text-[#26A17B]">{amountUsdt.toFixed(2)} USDT</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ≈ {currencyOriginal === 'USD' ? `$${amountOriginal.toFixed(2)}` : `${amountOriginal.toLocaleString('vi-VN')} VNĐ`}
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 py-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm">
                Thời gian còn lại: <span className="font-mono font-bold text-orange-500">{timeLeft}</span>
              </span>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center py-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <img 
                    src={qrCode} 
                    alt="USDT Payment QR Code" 
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* Wallet Address */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Địa chỉ ví {network}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 text-xs bg-muted rounded-lg font-mono break-all border">
                  {walletAddress}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAddress}
                  className="shrink-0"
                >
                  {copied === 'address' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Amount to send */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Số tiền cần gửi</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 text-lg bg-muted rounded-lg font-mono font-bold border text-center">
                  {amountUsdt.toFixed(2)} USDT
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAmount}
                  className="shrink-0"
                >
                  {copied === 'amount' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700 dark:text-yellow-500">Lưu ý quan trọng:</p>
                  <ul className="mt-1 space-y-1 text-yellow-600 dark:text-yellow-400">
                    <li>• Chỉ gửi USDT qua mạng <strong>{network}</strong></li>
                    <li>• Gửi đúng số tiền để được xử lý tự động</li>
                    <li>• Thanh toán trong thời gian quy định</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Check Status Button */}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleCheckStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kiểm tra trạng thái thanh toán
                </>
              )}
            </Button>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <USDTIcon />
            Thanh toán USDT
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Quét mã QR hoặc copy địa chỉ ví để thanh toán
            <Badge variant="secondary">{network}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {renderStatusContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
