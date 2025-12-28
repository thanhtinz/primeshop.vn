import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component to handle OAuth callback and show success toast
 * Handles both Supabase OAuth (hash params) and custom backend OAuth (query params)
 */
export const OAuthSuccessHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasHandled = useRef(false);
  const toastShown = useRef(false);

  useEffect(() => {
    // Check if this is an OAuth callback from custom backend (has access_token in query)
    const searchParams = new URLSearchParams(location.search);
    const accessToken = searchParams.get('access_token');
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    // Handle error from OAuth
    if (error && !hasHandled.current) {
      hasHandled.current = true;
      toast.error(decodeURIComponent(error));
      navigate(location.pathname, { replace: true });
      return;
    }

    // Handle success message (e.g., account linked)
    if (success && !hasHandled.current) {
      hasHandled.current = true;
      const messages: Record<string, string> = {
        'google_linked': 'Đã liên kết tài khoản Google!',
        'discord_linked': 'Đã liên kết tài khoản Discord!',
        'google_unlinked': 'Đã hủy liên kết tài khoản Google!',
        'discord_unlinked': 'Đã hủy liên kết tài khoản Discord!',
      };
      toast.success(messages[success] || 'Thành công!');
      navigate(location.pathname, { replace: true });
      return;
    }

    // Handle custom backend OAuth callback with access_token
    if (accessToken && !hasHandled.current) {
      hasHandled.current = true;
      
      // Store token for auth context to pick up
      sessionStorage.setItem('oauth_access_token', accessToken);
      sessionStorage.setItem('oauth_just_logged_in', 'true');
      
      // Clean up the URL
      navigate('/', { replace: true });
      
      // Reload to let AuthContext pick up the new token
      window.location.reload();
      return;
    }

    // Check for hash params (Supabase OAuth flow)
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const hasAccessToken = hashParams.has('access_token');
    const hasRefreshToken = hashParams.has('refresh_token');
    const hasCode = searchParams.has('code');

    if ((hasAccessToken || hasRefreshToken || hasCode) && !hasHandled.current) {
      hasHandled.current = true;
      sessionStorage.setItem('oauth_just_logged_in', 'true');
      
      // Clean up the URL
      if (location.hash || hasCode) {
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location, navigate]);

  // Separate effect to show toast after login
  useEffect(() => {
    const showToastIfNeeded = () => {
      const justLoggedIn = sessionStorage.getItem('oauth_just_logged_in');
      
      if (justLoggedIn && user && !toastShown.current) {
        toastShown.current = true;
        sessionStorage.removeItem('oauth_just_logged_in');
        
        // Small delay to ensure Toaster is mounted
        setTimeout(() => {
          toast.success('Đăng nhập thành công!');
        }, 300);
      }
    };

    // Run check after a delay to ensure everything is mounted
    const timer = setTimeout(showToastIfNeeded, 500);
    return () => clearTimeout(timer);
  }, [user]);

  return null;
};

