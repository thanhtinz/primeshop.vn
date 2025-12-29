// Re-export from MySQL version for backward compatibility
// All auth operations now go through MySQL backend
export * from './AuthContext.mysql';
        
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
