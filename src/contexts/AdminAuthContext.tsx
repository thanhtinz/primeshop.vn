import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, setAccessToken } from '@/lib/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Key để lưu admin user vào localStorage
const ADMIN_USER_KEY = 'adminUser';

interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Helper để decode JWT một cách an toàn
const decodeToken = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    // Kiểm tra token hết hạn
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('Token đã hết hạn');
      return null;
    }
    return payload;
  } catch (e) {
    console.error('Lỗi decode token:', e);
    return null;
  }
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        // Thử lấy từ localStorage trước
        const savedUser = localStorage.getItem(ADMIN_USER_KEY);
        const token = getAccessToken();
        
        if (token) {
          const payload = decodeToken(token);
          
          if (payload && payload.isAdmin) {
            // Token còn hạn và là admin
            const userData: User = {
              id: payload.userId,
              email: payload.email,
              role: payload.role || 'admin',
            };
            setUser(userData);
            setIsAdmin(true);
            // Lưu user vào localStorage để khôi phục nhanh
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(userData));
          } else if (savedUser) {
            // Token không hợp lệ nhưng có savedUser - xóa cả hai
            localStorage.removeItem(ADMIN_USER_KEY);
            setAccessToken(null);
          }
        } else if (savedUser) {
          // Không có token nhưng có savedUser - xóa savedUser
          localStorage.removeItem(ADMIN_USER_KEY);
        }
      } catch (error) {
        console.error('Admin auth init error:', error);
        // Xóa dữ liệu lỗi
        localStorage.removeItem(ADMIN_USER_KEY);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Đăng nhập thất bại' };
      }

      // Lưu token
      setAccessToken(data.accessToken);
      
      // Lưu user info
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role || 'admin',
      };
      setUser(userData);
      setIsAdmin(true);
      
      // Lưu vào localStorage để persist qua reload
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(userData));
      
      return { error: null };
    } catch (err: any) {
      console.error('Sign in error:', err);
      return { error: err.message || 'Đã xảy ra lỗi khi đăng nhập' };
    }
  };

  const signOut = async () => {
    setAccessToken(null);
    localStorage.removeItem(ADMIN_USER_KEY);
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
