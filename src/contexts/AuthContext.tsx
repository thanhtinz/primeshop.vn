import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  balance: number;
  total_spent: number;
  vip_level_id: string | null;
  birthday: string | null;
  birthday_voucher_sent_year: number | null;
  username: string | null;
  avatar_frame_id: string | null;
  has_prime_boost?: boolean;
  prime_expires_at?: string | null;
  prime_plan_type?: string | null;
  active_name_color_id?: string | null;
  active_effect_id?: string | null;
}

interface VipLevel {
  id: string;
  name: string;
  min_spending: number;
  discount_percent: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  vipLevel: VipLevel | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithDiscord: () => Promise<{ error: string | null }>;
  linkGoogle: () => Promise<{ error: string | null }>;
  linkDiscord: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vipLevel, setVipLevel] = useState<VipLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // If profile doesn't exist, create it
      if (!profileData && userEmail) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: userEmail,
            full_name: '',
            balance: 0,
            total_spent: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return;
        }
        profileData = newProfile;
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      if (profileData?.vip_level_id) {
        const { data: vipData } = await supabase
          .from('vip_levels')
          .select('*')
          .eq('id', profileData.vip_level_id)
          .single();
        
        setVipLevel(vipData);
      } else {
        // Get default VIP level (Member)
        const { data: defaultVip } = await supabase
          .from('vip_levels')
          .select('*')
          .order('min_spending', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        setVipLevel(defaultVip);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip setting user if we're in the middle of signup (pending verification)
        const isSignupPending = sessionStorage.getItem('signup_pending_verification');
        
        if (isSignupPending && event === 'SIGNED_IN') {
          // Don't set user during signup - wait for OTP verification
          console.log('Signup pending verification, skipping auto-login');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchProfile(session.user.id, session.user.email);
          }, 0);
          
          // OAuth toast is handled by OAuthSuccessHandler component
          // to ensure it shows after page reload
        } else {
          setProfile(null);
          setVipLevel(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Skip if signup is pending verification
      const isSignupPending = sessionStorage.getItem('signup_pending_verification');
      if (isSignupPending) {
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Set flag BEFORE signup to prevent auto-login from onAuthStateChange
    sessionStorage.setItem('signup_pending_verification', 'true');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || ''
        }
      }
    });

    if (error) {
      // Clear the flag if signup failed
      sessionStorage.removeItem('signup_pending_verification');
      if (error.message.includes('already registered')) {
        return { error: 'Email này đã được đăng ký' };
      }
      return { error: error.message };
    }

    // Sign out immediately to prevent auto-login before OTP verification
    await supabase.auth.signOut();

    // Send custom verification email via edge function
    try {
      await supabase.functions.invoke('send-verification-email', {
        body: { email, fullName }
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Email hoặc mật khẩu không đúng' };
      }
      return { error: error.message };
    }

    // Check if email is confirmed
    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { error: 'Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư của bạn.' };
    }

    // Record login history
    if (data?.user) {
      const userAgent = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      const deviceType = isMobile ? 'Mobile' : 'Desktop';
      
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      let os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

      // Insert login history
      supabase
        .from('login_history')
        .insert({
          user_id: data.user.id,
          user_agent: userAgent,
          device_type: deviceType,
          browser,
          os,
        })
        .then(() => {
          // Create notification if enabled
          supabase
            .from('profiles')
            .select('login_notification_enabled')
            .eq('user_id', data.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile?.login_notification_enabled) {
                supabase
                  .from('notifications')
                  .insert({
                    user_id: data.user.id,
                    type: 'security',
                    title: 'Đăng nhập mới',
                    message: `Tài khoản vừa được đăng nhập từ ${browser} trên ${os} (${deviceType})`,
                    link: '/settings',
                  });
              }
            });
        });
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const linkGoogle = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/settings`
      }
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const linkDiscord = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/settings`
      }
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    // Clear local state first
    setUser(null);
    setSession(null);
    setProfile(null);
    setVipLevel(null);
    
    try {
      // Try to sign out from Supabase
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    // Force clear any cached auth data
    try {
      localStorage.removeItem('sb-wlfytumovijolhtlnilu-auth-token');
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      vipLevel,
      isLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithDiscord,
      linkGoogle,
      linkDiscord,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Default auth context value for when context is not available
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  vipLevel: null,
  isLoading: true,
  signUp: async () => ({ error: 'Auth not initialized' }),
  signIn: async () => ({ error: 'Auth not initialized' }),
  signInWithGoogle: async () => ({ error: 'Auth not initialized' }),
  signInWithDiscord: async () => ({ error: 'Auth not initialized' }),
  linkGoogle: async () => ({ error: 'Auth not initialized' }),
  linkDiscord: async () => ({ error: 'Auth not initialized' }),
  signOut: async () => {},
  refreshProfile: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return default context instead of throwing to prevent crashes during initial render
  if (context === undefined) {
    console.warn('useAuth called outside AuthProvider, returning default context');
    return defaultAuthContext;
  }
  return context;
};

// Safe version of useAuth that returns null instead of throwing when outside provider
export const useAuthSafe = () => {
  return useContext(AuthContext);
};
