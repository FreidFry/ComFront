import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from "react";
import { apiService } from '../services/api';
import type { CommonUserDataDTO } from '../types/api';

interface AuthContextType {
  user: CommonUserDataDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'auth_user'; // Ключ для LocalStorage

export function AuthProvider({ children }: { children: ReactNode }) {
  // Инициализируем состояние сразу из LocalStorage, чтобы избежать "мерцания" UI
  const [user, setUser] = useState<CommonUserDataDTO | null>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(user?.id || null);

  // Хелпер для сохранения данных
  const saveUserData = (userData: CommonUserDataDTO) => {
    setUser(userData);
    setUserId(userData.id || null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  // Хелпер для очистки данных
  const clearUserData = () => {
    setUser(null);
    setUserId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      if (import.meta.env.DEV) console.log('🔍 Checking authentication...');

      const response = await apiService.init(); 
      const userData = response.data;

      if (userData && userData.userName) {
        saveUserData(userData);
        if (import.meta.env.DEV) console.log('✅ Auth success, saved to storage');
      } else {
        clearUserData();
      }
    } catch (error: any) {
      clearUserData();
      if (import.meta.env.DEV) console.warn('❌ Not authenticated or server error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const loginResponse = await apiService.login({ email, password });
      
      // Если бэк возвращает данные пользователя в loginResponse.data, используем их
      // Если нет — вызываем checkAuth для получения данных из /init
      if (loginResponse.data && loginResponse.data.userName) {
        saveUserData(loginResponse.data);
      } else {
        await checkAuth();
      }
      
    } catch (error: any) {
      clearUserData();
      throw error;
    }
  };

  const register = async (data: any) => {
    await apiService.register(data);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      // Очищаем локальные данные в любом случае
      clearUserData();
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        userId,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}