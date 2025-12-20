import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  UserRegisterDto,
  UserLoginDto,
  ThreadCreateDTO,
  ThreadUpdateDTO,
  CommentCreateDTO,
  CommentUpdateDTO,
  UserUpdateAvatarDTO,
  ThreadsThreeDTOResponce,
  ThreadResponseDTO,
  ThreadWithCommentsDTO,
  CommentResponseDTO,
  CommonUserDataDTO,
  AuthInitDTO,
  ApiError,
  PaginatedCommentsDTO,
} from '../types/api';
import { buildApiUrl } from '../config/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (import.meta.env.DEV) {
          // Проверяем cookies детально
          const cookies = document.cookie;
          const allCookies = cookies.split(';').map(c => c.trim());
          const jwtCookie = allCookies.find(c => c.startsWith('jwt='));
          
          // Пытаемся получить информацию о cookie через document.cookie
          // (HttpOnly cookies не будут видны, но мы можем проверить, отправляются ли они)
          console.log('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            withCredentials: config.withCredentials,
            hasJwtCookie: !!jwtCookie,
            jwtCookieValue: jwtCookie ? jwtCookie.substring(0, 50) + '...' : 'not found',
            allCookies: allCookies,
            cookiesString: cookies || 'no cookies',
            // Проверяем заголовки запроса
            requestHeaders: config.headers,
          });
          
          // Важно: HttpOnly cookies не видны через document.cookie
          // Но они должны отправляться автоматически, если withCredentials: true
          if (!jwtCookie && config.url?.includes('/profile')) {
            console.warn('⚠️ JWT cookie not found in document.cookie, but HttpOnly cookies are not visible via JavaScript');
            console.warn('⚠️ Cookie should still be sent if withCredentials: true and server sets it correctly');
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Логируем Set-Cookie заголовки для всех ответов
        if (import.meta.env.DEV) {
          const setCookieHeaders = response.headers['set-cookie'] || response.headers['Set-Cookie'];
          if (setCookieHeaders) {
            console.log('✅ Response Set-Cookie headers:', {
              url: response.config.url,
              headers: Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders],
            });
            
            // Проверяем, есть ли JWT cookie в Set-Cookie заголовках
            const setCookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
            const hasJwtInHeaders = setCookieArray.some(cookie => 
              typeof cookie === 'string' && cookie.toLowerCase().includes('jwt=')
            );
            
            if (hasJwtInHeaders) {
              console.log('✅ JWT cookie found in Set-Cookie headers');
            } else {
              console.log('ℹ️ No JWT cookie in Set-Cookie headers (may use id/userName/roles cookies instead)');
            }
          }
          
          // Детальное логирование для /api/auth/init
          if (response.config.url?.includes('/api/auth/init')) {
            console.log('🔍 Init endpoint response details:', {
              status: response.status,
              statusText: response.statusText,
              contentType: response.headers['content-type'],
              data: response.data,
              dataType: typeof response.data,
              dataIsEmpty: !response.data || (typeof response.data === 'string' && response.data.trim() === ''),
              dataString: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
            });
          }
          
          // После получения ответа проверяем, появились ли cookies
          const cookiesAfter = document.cookie;
          const jwtCookieAfter = cookiesAfter.split(';').find(c => c.trim().startsWith('jwt='));
          if (jwtCookieAfter && response.config.url?.includes('/login')) {
            console.log('✅ JWT cookie detected after login response:', {
              cookie: jwtCookieAfter.substring(0, 50) + '...',
              allCookies: document.cookie,
            });
          } else if (response.config.url?.includes('/login')) {
            console.warn('⚠️ No JWT cookie found in document.cookie after login (HttpOnly cookies are not visible via JavaScript)');
            console.warn('⚠️ But cookie should still be sent automatically if withCredentials: true');
          }
        }
        return response;
      },
      (error: AxiosError<ApiError>) => {
        // Логируем ошибку для отладки
        if (import.meta.env.DEV) {
          const cookies = document.cookie;
          const allCookies = cookies.split(';').map(c => c.trim());
          const hasIdCookie = allCookies.some(c => c.startsWith('id='));
          const hasUserNameCookie = allCookies.some(c => c.startsWith('userName='));
          
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            withCredentials: error.config?.withCredentials,
            cookies: cookies || 'no cookies',
            hasIdCookie,
            hasUserNameCookie,
          });
          
          // При 401 ошибке проверяем, что могло пойти не так
          if (error.response?.status === 401) {
            console.warn('⚠️ 401 Unauthorized - possible issues:');
            console.warn('  1. JWT cookie not set or expired');
            console.warn('  2. JWT cookie not sent (check CORS, SameSite, Secure flags)');
            console.warn('  3. Backend expects JWT cookie but only id/userName/roles cookies are set');
            console.warn('  4. Cookies not sent due to proxy configuration');
          }
        }
        
        // При 401 ошибке можно обновить состояние аутентификации
        // Но это будет сделано через AuthContext
        if (error.response?.status === 401) {
          // Cookies могут быть недействительными
          // Состояние обновится через AuthContext при следующей проверке
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: UserRegisterDto): Promise<{ message: string }> {
    const response = await this.client.post(
      buildApiUrl('/api/auth/register/'),
      data
    );
    return response.data;
  }

  async login(data: UserLoginDto): Promise<{ message: string }> {
    try {
      const response = await this.client.post(
        buildApiUrl('/api/auth/login/'),
        data
      );
      
      if (import.meta.env.DEV) {
        // Проверяем Set-Cookie заголовки
        const setCookieHeaders = response.headers['set-cookie'] || response.headers['Set-Cookie'] || [];
        const cookiesAfterLogin = document.cookie;
        const jwtCookieAfter = cookiesAfterLogin.split(';').find(c => c.trim().startsWith('jwt='));
        
        console.log('Login API response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: {
            'set-cookie': setCookieHeaders,
            'content-type': response.headers['content-type'],
            allHeaders: Object.keys(response.headers),
          },
          cookiesAfterLogin: cookiesAfterLogin || 'no cookies',
          hasJwtCookieAfter: !!jwtCookieAfter,
          allCookies: document.cookie,
        });
      }
      
      return response.data;
    } catch (error: any) {
      // Логируем детали ошибки для отладки
      if (import.meta.env.DEV) {
        console.error('Login API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.client.post(buildApiUrl('/api/auth/logout/'));
    return response.data;
  }

  async init(): Promise<AuthInitDTO | null> {
    try {
      const response = await this.client.get<AuthInitDTO | string>(
        buildApiUrl('/api/auth/init/')
      );
      
      if (import.meta.env.DEV) {
        console.log('Init response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
          dataType: typeof response.data,
          dataString: JSON.stringify(response.data),
        });
      }
      
      // Если ответ 200 OK с пустым телом - это нормально (данные в cookies)
      // Не выбрасываем ошибку, возвращаем null
      if (!response.data || response.data === '' || (typeof response.data === 'string' && response.data.trim() === '')) {
        if (import.meta.env.DEV) {
          console.log('Init response is empty (200 OK) - data should be in cookies');
        }
        return null;
      }
      
      // Если данные приходят как строка, пытаемся распарсить
      if (typeof response.data === 'string') {
        try {
          return JSON.parse(response.data);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error('Failed to parse init response as JSON:', e);
          }
          return null;
        }
      }
      
      return response.data as AuthInitDTO;
    } catch (error: any) {
      // Если 401, это нормально - пользователь не аутентифицирован
      if (error.response?.status === 401) {
        if (import.meta.env.DEV) {
          console.log('Init returned 401 - user not authenticated');
        }
        throw error; // Пробрасываем 401, чтобы фронтенд знал, что пользователь не аутентифицирован
      }
      
      if (import.meta.env.DEV) {
        console.error('Init error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  }

  // Thread endpoints
  async getThreads(after?: Date | null, limit: number = 20): Promise<ThreadsThreeDTOResponce[]> {
    const params: Record<string, string | number> = { limit };
    if (after) {
      params.after = after.toISOString();
    }
    const response = await this.client.get<ThreadsThreeDTOResponce[]>(
      buildApiUrl('/threads/', params)
    );
    
    // Обрабатываем ответ - проверяем, что это массив
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    
    // Если это объект с массивом внутри (например, { data: [...] })
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
      return (data as any).data;
    }
    
    // Если это объект с другим полем массива
    if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as any).items)) {
      return (data as any).items;
    }
    
    // Логируем неожиданный формат
    console.error('Неожиданный формат ответа от API /threads/:', data);
    return [];
  }

  async getThread(threadId: string): Promise<ThreadWithCommentsDTO> {
    const response = await this.client.get<ThreadWithCommentsDTO>(
      buildApiUrl(`/threads/${threadId}/`)
    );
    const data = response.data;
    // Убеждаемся, что comments всегда является массивом
    if (!data.comments || !Array.isArray(data.comments)) {
      data.comments = [];
    }
    return data;
  }

  async createThread(data: ThreadCreateDTO): Promise<ThreadResponseDTO> {
    const response = await this.client.post<ThreadResponseDTO>(
      buildApiUrl('/threads/'),
      data
    );
    return response.data;
  }

  async updateThread(threadId: string, data: ThreadUpdateDTO): Promise<ThreadResponseDTO> {
    const response = await this.client.put<ThreadResponseDTO>(
      buildApiUrl(`/threads/${threadId}/`),
      { ...data, threadId }
    );
    return response.data;
  }

  async deleteThread(threadId: string): Promise<{ message: string }> {
    const response = await this.client.delete(
      buildApiUrl(`/threads/${threadId}/`)
    );
    return response.data;
  }

  async restoreThread(threadId: string): Promise<{ message: string }> {
    const response = await this.client.put(
      buildApiUrl('/threads/', { id: threadId })
    );
    return response.data;
  }

async getThreadComments(
  threadId: string,
  sortBy: string,
  isAscending: boolean,
  after?: string | Date | null,
  limit: number = 25,
): Promise<PaginatedCommentsDTO> {
  
  // Добавляем все параметры в объект, который пойдет в Query String
  const params: any = { 
    threadId,    // Должно совпадать с именем в C# DTO
    sortBy, 
    isAscending, 
    limit 
  };

  if (after) {
    params.after = after instanceof Date ? after.toISOString() : after;
  }

  const response = await this.client.get<PaginatedCommentsDTO>(
    buildApiUrl(`/threads/${threadId}/Comments`),
    { params }
  );

  // ВАЖНО: Достаем items из объекта пагинации
  const data = response.data;
  
  if (data && Array.isArray(data.items)) {
    return data;
  }
  
  // Если бэкенд вдруг вернет просто массив (на будущее)
  if (Array.isArray(data)) {
    return data;
  }

  return {
    items: [],
    nextCursor: null,
    hasMore: false
  };;
}

  // Comment endpoints
  async getComment(commentId: string): Promise<CommentResponseDTO> {
    const response = await this.client.get<CommentResponseDTO>(
      buildApiUrl(`/comments/${commentId}/`)
    );
    return response.data;
  }

  async createComment(data: CommentCreateDTO): Promise<CommentResponseDTO> {
    const formData = new FormData();
    formData.append('Content', data.content);
    formData.append('ThreadId', data.threadId);
    if (data.parentCommentId) {
      formData.append('ParentCommentId', data.parentCommentId);
    }
    if (data.formFile) {
      formData.append('FormFile', data.formFile);
    }

    if (import.meta.env.DEV) {
      console.log('Creating comment (multipart):', {
        content: data.content,
        threadId: data.threadId,
        parentCommentId: data.parentCommentId,
        hasFile: !!data.formFile,
        fileName: data.formFile?.name,
        fileType: data.formFile?.type,
      });
      // Проверяем cookies перед запросом
      const cookies = document.cookie;
      console.log('Cookies before createComment:', cookies);
    }
    
    try {
      const response = await this.client.post<CommentResponseDTO>(
        buildApiUrl('/comments/'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Обрабатываем ошибку 500, которая может возникнуть из-за проблемы с CreatedAtAction на бэкенде
      // Если это ошибка "No route matches the supplied values", комментарий все равно может быть создан
      if (error.response?.status === 500) {
        const errorData = error.response?.data;
        const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        
        if (errorString.includes('No route matches the supplied values') || 
            errorString.includes('CreatedAtActionResult')) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Backend returned 500 due to CreatedAtAction route issue, but comment may have been created');
            console.warn('⚠️ This is a backend issue - CreatedAtAction is trying to reference a non-existent route');
            console.warn('⚠️ Will try to refresh comments list to see if comment was created');
          }
          
          // Если комментарий был создан, но бэкенд не может вернуть правильный ответ,
          // мы просто выбрасываем ошибку, и компонент может обновить список комментариев
          // или мы можем попробовать получить комментарий через GET запрос
          // Но для простоты, просто выбрасываем специальную ошибку, которую можно обработать
          const customError = new Error('Comment may have been created, but backend returned 500 due to route issue');
          (customError as any).isBackendRouteError = true;
          (customError as any).status = 500;
          throw customError;
        }
      }
      
      if (import.meta.env.DEV) {
        console.error('CreateComment error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          withCredentials: error.config?.withCredentials,
        });
      }
      throw error;
    }
  }

  async updateComment(commentId: string, data: CommentUpdateDTO): Promise<CommentResponseDTO> {
    const response = await this.client.put<CommentResponseDTO>(
      buildApiUrl(`/comments/${commentId}/`),
      { ...data, commentId }
    );
    return response.data;
  }

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const response = await this.client.delete(
      buildApiUrl(`/comments/${commentId}/`)
    );
    return response.data;
  }

  // Profile endpoints
  async getProfile(userId?: string | null): Promise<CommonUserDataDTO> {
    // Бэкенд использует route параметр: GET /profile/{id}
    // Если userId не указан, используем /profile/ (для текущего пользователя)
    let url: string;
    if (userId) {
      // Используем route параметр: /profile/{id}/
      url = buildApiUrl(`/profile/${userId}/`);
    } else {
      // Для текущего пользователя: /profile/
      url = buildApiUrl('/profile/');
    }
    
    if (import.meta.env.DEV) {
      console.log('Getting profile:', { userId, url, withCredentials: this.client.defaults.withCredentials });
    }
    
    try {
      const response = await this.client.get<CommonUserDataDTO>(url);
      if (import.meta.env.DEV) {
        console.log('Profile response:', response.data);
      }
      return response.data;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('GetProfile error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          headers: error.config?.headers,
        });
      }
      throw error;
    }
  }

  async updateAvatar(data: UserUpdateAvatarDTO): Promise<{ message: string }> {
    const response = await this.client.put(
      buildApiUrl('/profile/avatar/'),
      data
    );
    return response.data;
  }
}

export const apiService = new ApiService();

