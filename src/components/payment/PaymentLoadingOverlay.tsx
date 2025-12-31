import { Loader2, CreditCard, Wallet, Shield } from 'lucide-react';

const PayPalIcon = () => (
  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="white">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.767.767 0 0 1 .757-.64h6.654c2.204 0 3.935.583 5.15 1.73.606.574 1.063 1.248 1.357 2.005.315.8.42 1.7.308 2.672-.27 2.291-1.246 4.093-2.907 5.357-1.553 1.183-3.467 1.783-5.694 1.783H8.29a.767.767 0 0 0-.757.64l-.457 2.97z"/>
  </svg>
);

interface PaymentLoadingOverlayProps {
  isProcessing: boolean;
  paymentMethod?: 'balance' | 'payos' | 'paypal' | 'crypto';
}

export const PaymentLoadingOverlay = ({ isProcessing, paymentMethod = 'payos' }: PaymentLoadingOverlayProps) => {
  if (!isProcessing) return null;

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'balance':
        return <Wallet className="h-10 w-10 text-primary-foreground" />;
      case 'paypal':
        return <PayPalIcon />;
      default:
        return <CreditCard className="h-10 w-10 text-primary-foreground" />;
    }
  };

  const getPaymentText = () => {
    switch (paymentMethod) {
      case 'balance':
        return 'Đang trừ số dư tài khoản...';
      case 'paypal':
        return 'Đang kết nối PayPal...';
      case 'crypto':
        return 'Đang kết nối Crypto...';
      default:
        return 'Đang kết nối cổng thanh toán...';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card border border-border shadow-2xl max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${paymentMethod === 'paypal' ? 'bg-[#003087]' : 'bg-gradient-to-br from-primary to-primary/60'}`}>
            {getPaymentIcon()}
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-foreground">Đang xử lý thanh toán</h3>
          <p className="text-sm text-muted-foreground">{getPaymentText()}</p>
        </div>

        {/* Loading spinner */}
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Vui lòng đợi...</span>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Giao dịch được bảo mật SSL 256-bit</span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
