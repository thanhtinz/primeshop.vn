import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, getAccessToken, setAccessToken } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
}

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await db
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      return false;
    }
  };

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const userData = await auth.getUser();
          if (userData) {
            setUser(userData);
            const adminStatus = await checkAdminStatus(userData.id);
            setIsAdmin(adminStatus);
          }
        }
      } catch (error) {
        console.error('Admin auth init error:', error);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await auth.signIn(email, password);
      
      if (data.user) {
        const adminStatus = await checkAdminStatus(data.user.id);
        if (!adminStatus) {
          await auth.signOut();
          return { error: 'Bạn không có quyền truy cập Admin Panel' };
        }
        setUser(data.user);
        setIsAdmin(true);
      }
      return { error: null };
    } catch (err: any) {
      console.error('Sign in error:', err);
      return { error: err.message || 'Đã xảy ra lỗi khi đăng nhập' };
    }
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{ user, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
};
