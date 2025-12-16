import { apiService } from '../services/api';

/**
 * Тестовая функция для проверки подключения к API
 */
export async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    
    // Пробуем получить список тем (не требует аутентификации)
    const threads = await apiService.getThreads(null, 1);
    console.log('✅ API connection successful!', threads);
    return { success: true, message: 'API подключен успешно' };
  } catch (error: any) {
    console.error('❌ API connection failed:', error);
    
    if (!error.response) {
      return {
        success: false,
        message: 'Не удалось подключиться к серверу. Проверьте адрес API и что бэкенд запущен.',
        details: error.message,
      };
    }

    return {
      success: false,
      message: `Ошибка подключения: ${error.response.status} ${error.response.statusText}`,
      details: error.response.data,
    };
  }
}

