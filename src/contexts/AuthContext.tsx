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

// ... (остальной импорт без изменений)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CommonUserDataDTO | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(user?.id || null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const authData = await apiService.init(); 

      if (authData && authData.id && authData.userName) {
        const userData: CommonUserDataDTO = {
          id: authData.id,
          userName: authData.userName,
          avatarTumbnailUrl: '', 
          createdAt: '',
          homePage: '',
          threads: [],
        };
        setUser(userData);
        setUserId(userData.id);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        throw new Error('Not authenticated');
      }
    } catch (error) {
      setUser(null);
      setUserId(null);
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // --- ОБЪЯВЛЕНИЕ ФУНКЦИЙ (Initializer) ---

  const login = async (email: string, password: string) => {
    await apiService.login({ email, password });
    await checkAuth();
  };

  const register = async (data: {
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    homePage?: string | null;
  }) => {
    await apiService.register(data);
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
        login,        // Теперь инициализатор существует
        register,     // Теперь инициализатор существует
        logout,       // Теперь инициализатор существует
        refreshUser,  // Теперь инициализатор существует
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