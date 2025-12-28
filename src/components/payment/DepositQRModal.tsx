import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check, QrCode, Clock, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

interface DepositQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  qrCodeUrl: string;
  accountNo?: string;
  accountName?: string;
  description?: string;
  orderCode?: number;
  onPaymentSuccess?: () => void;
}

export const DepositQRModal = ({
  isOpen,
  onClose,
  amount,
  qrCodeUrl,
  accountNo,
  accountName,
  description,
  orderCode,
  onPaymentSuccess
}: DepositQRModalProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(900);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Hết thời gian thanh toán');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Đã sao chép!');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-primary-foreground">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <span>Thanh toán QR Code</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Thời gian còn lại:</span>
            <Badge variant="secondary" className="text-sm font-mono">
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Amount */}
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Số tiền thanh toán</p>
            <p className="text-2xl font-bold text-primary">{formatPrice(amount)}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative bg-white p-3 rounded-xl border-2 border-primary/20 shadow-lg">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code thanh toán" 
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Bank Info */}
          {(accountNo || accountName) && (
            <div className="space-y-2 text-sm">
              {accountNo && (
                <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Số tài khoản</p>
                    <p className="font-mono font-semibold">{accountNo}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleCopy(accountNo, 'accountNo')}
                  >
                    {copied === 'accountNo' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {accountName && (
                <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Tên tài khoản</p>
                    <p className="font-semibold">{accountName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Nội dung chuyển khoản</p>
                  <p className="font-mono font-semibold truncate">{description || `NAP${orderCode}`}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => handleCopy(description || `NAP${orderCode}`, 'description')}
                >
                  {copied === 'description' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Số tiền</p>
                  <p className="font-semibold text-primary">{formatPrice(amount)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleCopy(amount.toString(), 'amount')}
                >
                  {copied === 'amount' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-secondary/50 rounded-lg">
            <p className="font-medium text-foreground">Hướng dẫn:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Mở app ngân hàng và quét mã QR</li>
              <li>Kiểm tra thông tin và xác nhận thanh toán</li>
              <li>Số dư sẽ được cộng tự động sau khi thanh toán thành công</li>
            </ol>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            <span>Giao dịch được bảo mật bởi PayOS</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
