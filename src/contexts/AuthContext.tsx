import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from "react";
import { apiService } from '../services/api';
import type { CommonUserDataDTO } from '../types/api';

interface AuthContextType {
  user: CommonUserDataDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null; // ID пользователя из cookies
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    homePage?: string | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CommonUserDataDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Читает cookies и возвращает map с данными
  const getCookiesMap = (): Record<string, string> => {
    try {
      const cookies = document.cookie;
      if (!cookies) {
        return {};
      }
      
      const cookieMap: Record<string, string> = {};
      cookies.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          cookieMap[key] = decodeURIComponent(value);
        }
      });
      
      return cookieMap;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error reading cookies:', error);
      }
      return {};
    }
  };

  // Получает ID пользователя из cookies
  const getUserIdFromCookies = (): string | null => {
    const cookieMap = getCookiesMap();
    return cookieMap['id'] || null;
  };

  // Читает данные пользователя из cookies
  const getUserFromCookies = (): CommonUserDataDTO | null => {
    try {
      const cookieMap = getCookiesMap();
      
      const id = cookieMap['id'];
      const userName = cookieMap['userName'];
      const roles = cookieMap['roles'];
      
      if (import.meta.env.DEV) {
        console.log('Reading user from cookies:', { id, userName, roles });
      }
      
      // Если есть userName, создаем объект пользователя
      if (userName && userName !== '') {
        return {
          userName: userName,
          avatarTumbnailUrl: '',
          createdAt: '',
          homePage: '',
          lastActive: null,
          threads: [],
        };
      }
      
      return null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error reading user from cookies:', error);
      }
      return null;
    }
  };

  // const checkAuth = async () => {
  //   try {
  //     if (import.meta.env.DEV) {
  //       console.log('🔍 Checking authentication...');
  //     }
      
  //     // Используем /api/auth/init/ только для проверки статуса (200 = аутентифицирован, 401 = не аутентифицирован)
  //     let isAuthenticated = false;
  //     try {
  //       await apiService.init();
  //       // Если init вернул 200 OK (даже с пустым телом), значит пользователь аутентифицирован
  //       isAuthenticated = true;
  //       if (import.meta.env.DEV) {
  //         console.log('✅ Init returned 200 - user is authenticated');
  //       }
  //     } catch (error: any) {
  //       const status = error.response?.status;
  //       if (status === 401) {
  //         // 401 означает, что пользователь не аутентифицирован
  //         isAuthenticated = false;
  //         if (import.meta.env.DEV) {
  //           console.log('❌ Init returned 401 - user not authenticated');
  //         }
  //       } else {
  //         // Другие ошибки - логируем, но не считаем это признаком неаутентификации
  //         if (import.meta.env.DEV) {
  //           console.warn('Init returned error, but will try to read from cookies:', error.message);
  //         }
  //         // Пробуем прочитать из cookies на всякий случай
  //         isAuthenticated = true;
  //       }
  //     }
      
  //     // Данные пользователя всегда читаем из cookies
  //     const user = getUserFromCookies();
  //     const currentUserId = getUserIdFromCookies();
      
  //     // Обновляем userId
  //     setUserId(currentUserId);
      
  //     if (user && isAuthenticated) {
  //       setUser(user);
  //       if (import.meta.env.DEV) {
  //         console.log('✅ Authentication successful, user:', user.userName);
  //       }
  //     } else {
  //       setUser(null);
  //       if (import.meta.env.DEV) {
  //         if (!isAuthenticated) {
  //           console.log('❌ User not authenticated (401 from init)');
  //         } else if (!user) {
  //           console.log('❌ No user data found in cookies');
  //         }
  //       }
  //     }
  //   } catch (error: any) {
  //     const status = error.response?.status;
  //     if (import.meta.env.DEV) {
  //       console.log('❌ Auth check result:', {
  //         status,
  //         message: error.message,
  //         data: error.response?.data,
  //         // Проверяем, были ли отправлены cookies в запросе
  //         requestUrl: error.config?.url,
  //         withCredentials: error.config?.withCredentials,
  //       });
        
  //       // Если 401, возможно cookies не были отправлены
  //       if (status === 401) {
  //         console.warn('⚠️ 401 Unauthorized - possible reasons:');
  //         console.warn('  1. JWT cookie not set by server');
  //         console.warn('  2. JWT cookie not sent by browser (check CORS, SameSite, Secure flags)');
  //         console.warn('  3. JWT token expired or invalid');
  //         console.warn('  4. Server not reading cookie correctly');
  //       }
  //     }
      
  //     // Если ошибка 401, значит пользователь не аутентифицирован
  //     if (status === 401) {
  //       setUser(null);
  //       if (import.meta.env.DEV) {
  //         console.log('User not authenticated (401)');
  //       }
  //     } else {
  //       // Другие ошибки - логируем, но не сбрасываем пользователя
  //       console.error('Ошибка проверки аутентификации:', error);
  //       // Не сбрасываем user при других ошибках, чтобы не потерять состояние
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const checkAuth = async () => {
  try {
    setIsLoading(true);
    if (import.meta.env.DEV) console.log('🔍 Checking authentication...');

    // Запрашиваем данные. Если 401 — упадет в catch.
    const response = await apiService.init(); 
    
    // response.data теперь содержит объект с userName, id и т.д.
    const userData = response.data;

    if (userData && userData.userName) {
      setUser(userData);
      setUserId(userData.id);
      if (import.meta.env.DEV) console.log('✅ Auth success:', userData.userName);
    }
  } catch (error: any) {
    setUser(null);
    setUserId(null);
    if (import.meta.env.DEV) console.warn('❌ Not authenticated');
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    checkAuth();
  }, []);
  
  // Периодически проверяем аутентификацию, если пользователь не загружен
  // Это помогает, если cookies установились позже
  // useEffect(() => {
  //   if (user || isLoading) {
  //     return; // Пользователь загружен или идет загрузка, не проверяем
  //   }
    
  //   const interval = setInterval(() => {
  //     if (import.meta.env.DEV) {
  //       console.log('Periodic auth check - user not loaded, retrying...');
  //     }
  //     checkAuth();
  //   }, 3000); // Проверяем каждые 3 секунды
    
  //   return () => clearInterval(interval);
  // }, [user, isLoading]);

  const login = async (email: string, password: string) => {
    try {
      // Выполняем логин
      const loginResponse = await apiService.login({ email, password });
      
      if (import.meta.env.DEV) {
        console.log('Login response:', loginResponse);
      }
      
      // Логин успешен! Читаем данные пользователя из cookies
      // Небольшая задержка, чтобы cookies точно успели установиться
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Пытаемся прочитать данные из cookies несколько раз
      let user: CommonUserDataDTO | null = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts && !user) {
        user = getUserFromCookies();
        const currentUserId = getUserIdFromCookies();
        setUserId(currentUserId); // Обновляем userId сразу
        
        if (user) {
          setUser(user);
          if (import.meta.env.DEV) {
            console.log('✅ Authentication confirmed via cookies after login, user:', user.userName);
          }
          return; // Успешно получили данные, выходим
        }
        
        // Если это последняя попытка, запускаем фоновую проверку
        if (attempts === maxAttempts - 1) {
          if (import.meta.env.DEV) {
            console.warn('Could not read user from cookies after login, but login was successful. Will retry in background.');
          }
          // Пробуем прочитать из cookies в фоне несколько раз
          let retryCount = 0;
          const maxRetries = 10;
          const retryInterval = 500;
          
          const retryAuthLoad = async () => {
            if (retryCount >= maxRetries) {
              if (import.meta.env.DEV) {
                console.warn('Max retries reached for reading cookies after login');
              }
              return;
            }
            
            retryCount++;
            setTimeout(() => {
              const user = getUserFromCookies();
              const currentUserId = getUserIdFromCookies();
              setUserId(currentUserId); // Обновляем userId
              
              if (user) {
                setUser(user);
                if (import.meta.env.DEV) {
                  console.log('✅ Authentication confirmed via cookies in background after login');
                }
              } else {
                // Продолжаем попытки
                retryAuthLoad();
              }
            }, retryInterval);
          };
          
          retryAuthLoad();
          // Не выбрасываем ошибку - логин успешен
          return;
        }
        
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
    } catch (error: any) {
      // Если сам логин не удался (не 200), выбрасываем ошибку
      if (import.meta.env.DEV) {
        console.error('Login failed:', error);
      }
      setUser(null);
      throw error;
    }
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
    await apiService.logout();
    setUser(null);
    setUserId(null); // Очищаем userId при выходе
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  // isAuthenticated должен проверяться не только по user, но и по userId из cookies
  // Это важно, так как user может быть null, если данные еще не загрузились, но userId уже есть в cookies
  const isAuthenticated = useMemo(() => {
    return !!user || !!userId;
  }, [user, userId]);
  
  // Периодически обновляем userId из cookies, чтобы он был актуальным
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUserId = getUserIdFromCookies();
      if (currentUserId !== userId) {
        setUserId(currentUserId);
      }
    }, 1000); // Проверяем каждую секунду
    
    return () => clearInterval(interval);
  }, [userId]);

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

