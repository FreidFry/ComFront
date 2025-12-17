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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CommonUserDataDTO | null>(() => {
    const saved = localStorage.getItem('auth_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(user?.id || null);

  // Вспомогательная функция для сохранения данных пользователя
  const saveUserData = (data: any) => {
    if (data && data.id) {
      const userData: CommonUserDataDTO = {
        id: data.id,
        userName: data.userName || 'User',
        avatarTumbnailUrl: data.avatarTumbnailUrl || '',
        createdAt: data.createdAt || '',
        homePage: data.homePage || '',
        threads: data.threads || [],
      };
      setUser(userData);
      setUserId(userData.id);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    }
    return null;
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.init(); 
      
      // Если init вернул объект с данными (не пустую строку)
      if (response && typeof response === 'object' && response.id) {
        saveUserData(response);
      } 
      // Если ответ пустой (как в твоих логах), мы не очищаем localStorage,
      // чтобы сохранить сессию, если куки валидны
    } catch (error) {
      console.warn("Session check failed or inactive");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // --- ФУНКЦИИ ДЕЙСТВИЙ ---

  const login = async (email: string, password: string) => {
    // В твоих логах Login API возвращает объект пользователя в response.data
    const response = await apiService.login({ email, password });
    
    // Сохраняем данные СРАЗУ из ответа логина
    const userData = saveUserData(response);
    
    // Если в ответе логина вдруг нет данных, пробуем дернуть init
    if (!userData) {
      await checkAuth();
    }
  };

  const register = async (data: any) => {
    const response = await apiService.register(data);
    // Если регистрация сразу логинит пользователя и возвращает данные:
    saveUserData(response);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
      setUserId(null);
      localStorage.removeItem('auth_user');
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const isAuthenticated = useMemo(() => !!user, [user]);

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