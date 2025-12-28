import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * OAuth Success Page
 * Handles the redirect from OAuth callback and processes the access token
 */
export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (accessToken) {
      // Store the access token in localStorage for auth context to pick up
      localStorage.setItem('access_token', accessToken);
      sessionStorage.setItem('oauth_just_logged_in', 'true');
      setStatus('success');

      // Redirect after a short delay
      setTimeout(() => {
        toast.success('Đăng nhập thành công!');
        navigate('/', { replace: true });
        // Trigger a page reload to reinitialize auth
        window.location.href = '/';
      }, 1500);
    } else if (!isLoading && user) {
      // Already logged in, redirect home
      navigate('/', { replace: true });
    } else if (!isLoading && !user) {
      // No token and not logged in
      setStatus('error');
      setError('Không tìm thấy thông tin đăng nhập');
    }
  }, [searchParams, navigate, user, isLoading]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h1 className="text-xl font-semibold">Đang xử lý đăng nhập...</h1>
          <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-xl font-semibold">Đăng nhập thành công!</h1>
          <p className="text-muted-foreground">Đang chuyển hướng về trang chủ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <XCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Đăng nhập thất bại</h1>
        <p className="text-muted-foreground">{error || 'Đã xảy ra lỗi không xác định'}</p>
        <button
          onClick={() => navigate('/auth')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
