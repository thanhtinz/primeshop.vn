import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Callback Page
 * Handles the OAuth provider callback and redirects to backend
 */
export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      // Redirect to auth page with error
      navigate(`/auth?error=${encodeURIComponent(error)}`);
      return;
    }

    if (code && provider) {
      // Redirect to backend OAuth callback endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const callbackUrl = `${apiUrl}/oauth/${provider}/callback?code=${code}${state ? `&state=${state}` : ''}`;
      window.location.href = callbackUrl;
    } else {
      // No code, redirect to auth
      navigate('/auth?error=missing_code');
    }
  }, [provider, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <h1 className="text-xl font-semibold">Đang xác thực...</h1>
        <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
}
