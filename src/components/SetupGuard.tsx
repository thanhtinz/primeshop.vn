import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface SetupGuardProps {
  children: ReactNode;
}

/**
 * Component that checks if initial setup is complete
 * If not complete, redirects to /setup page
 * Excludes /setup page itself from this check
 */
export const SetupGuard = ({ children }: SetupGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(true);

  useEffect(() => {
    // Don't check if already on setup page
    if (location.pathname === '/setup') {
      setIsChecking(false);
      return;
    }

    // Don't check for admin routes - they have their own auth
    if (location.pathname.startsWith('/admin')) {
      setIsChecking(false);
      return;
    }

    const checkSetupStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/setup/check`);
        
        if (response.ok) {
          const data = await response.json();
          setIsSetupComplete(data.isSetupComplete);
          
          if (!data.isSetupComplete) {
            // Redirect to setup page
            navigate('/setup', { replace: true });
          }
        } else {
          // If API fails, assume setup is needed
          setIsSetupComplete(false);
          navigate('/setup', { replace: true });
        }
      } catch (error) {
        // If can't connect to API, might need setup
        console.log('Setup check failed:', error);
        // Don't redirect on error - might just be API not running yet
        setIsSetupComplete(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetupStatus();
  }, [location.pathname, navigate]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  // If setup not complete and not on setup page, don't render children
  if (!isSetupComplete && location.pathname !== '/setup') {
    return null;
  }

  return <>{children}</>;
};

export default SetupGuard;
