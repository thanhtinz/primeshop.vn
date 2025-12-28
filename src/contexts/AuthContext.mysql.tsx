import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, getAccessToken, setAccessToken } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  emailVerified?: boolean;
  createdAt: string;
}

interface Profile {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  balance: number;
  totalSpent: number;
  vipLevelId: string | null;
  birthday: string | null;
  birthdayVoucherSentYear: number | null;
  username: string | null;
  avatarFrameId: string | null;
  hasPrimeBoost?: boolean;
  primeExpiresAt?: string | null;
  primePlanType?: string | null;
  activeNameColorId?: string | null;
  activeEffectId?: string | null;
  // Mapped fields for compatibility with old code
  user_id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  total_spent?: number;
  vip_level_id?: string | null;
  birthday_voucher_sent_year?: number | null;
  avatar_frame_id?: string | null;
  has_prime_boost?: boolean;
  prime_expires_at?: string | null;
  prime_plan_type?: string | null;
  active_name_color_id?: string | null;
  active_effect_id?: string | null;
}

interface VipLevel {
  id: string;
  name: string;
  minSpending: number;
  discountPercent: number;
  // Mapped fields for compatibility
  min_spending?: number;
  discount_percent?: number;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
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

// Helper to map camelCase to snake_case for compatibility
const mapProfileToLegacy = (profile: any): Profile => {
  if (!profile) return profile;
  return {
    ...profile,
    user_id: profile.userId,
    full_name: profile.fullName || profile.displayName,
    avatar_url: profile.avatarUrl,
    total_spent: profile.totalSpent,
    vip_level_id: profile.vipLevelId,
    birthday_voucher_sent_year: profile.birthdayVoucherSentYear,
    avatar_frame_id: profile.avatarFrameId,
    has_prime_boost: profile.hasPrimeBoost,
    prime_expires_at: profile.primeExpiresAt,
    prime_plan_type: profile.primePlanType,
    active_name_color_id: profile.activeNameColorId,
    active_effect_id: profile.activeEffectId,
  };
};

const mapVipLevelToLegacy = (vipLevel: any): VipLevel => {
  if (!vipLevel) return vipLevel;
  return {
    ...vipLevel,
    min_spending: vipLevel.minSpending,
    discount_percent: vipLevel.discountPercent,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vipLevel, setVipLevel] = useState<VipLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await db
        .from<any>('profiles')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(mapProfileToLegacy(profileData));

        if (profileData.vipLevelId) {
          const { data: vipData } = await db
            .from<any>('vip_levels')
            .select('*')
            .eq('id', profileData.vipLevelId)
            .single();
          
          setVipLevel(mapVipLevelToLegacy(vipData));
        } else {
          // Get default VIP level (Member)
          const { data: defaultVip } = await db
            .from<any>('vip_levels')
            .select('*')
            .order('minSpending', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          setVipLevel(mapVipLevelToLegacy(defaultVip));
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      const token = getAccessToken();
      
      if (token) {
        try {
          const userData = await auth.getUser();
          setUser(userData);
          await fetchProfile(userData.id);
        } catch (error) {
          // Token expired or invalid
          setAccessToken(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const data = await auth.signUp(email, password, fullName);
      setUser(data.user);
      await fetchProfile(data.user.id);
      return { error: null };
    } catch (error: any) {
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        return { error: 'Email này đã được đăng ký' };
      }
      return { error: error.message || 'Đăng ký thất bại' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await auth.signIn(email, password);
      setUser(data.user);
      await fetchProfile(data.user.id);

      // Record login history
      try {
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

        await db.from('login_history').insert({
          userId: data.user.id,
          userAgent,
          deviceType,
          browser,
          os,
        });
      } catch (historyError) {
        console.error('Failed to record login history:', historyError);
      }

      return { error: null };
    } catch (error: any) {
      if (error.message?.includes('Invalid') || error.status === 401) {
        return { error: 'Email hoặc mật khẩu không đúng' };
      }
      return { error: error.message || 'Đăng nhập thất bại' };
    }
  };

  // OAuth methods - would need OAuth setup on backend
  const signInWithGoogle = async () => {
    // For now, redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/google`;
    return { error: null };
  };

  const signInWithDiscord = async () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/discord`;
    return { error: null };
  };

  const linkGoogle = async () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/link/google`;
    return { error: null };
  };

  const linkDiscord = async () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/link/discord`;
    return { error: null };
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    setUser(null);
    setProfile(null);
    setVipLevel(null);
  };

  const session = user ? { user } : null;

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
  if (context === undefined) {
    console.warn('useAuth called outside AuthProvider, returning default context');
    return defaultAuthContext;
  }
  return context;
};

export const useAuthSafe = () => {
  return useContext(AuthContext);
};
