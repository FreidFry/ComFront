import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Прокси для всех API запросов
      // Используется только если VITE_API_BASE_URL не указан в .env
      '/api': {
        // HTTPS адрес бэкенда (Docker или локальный)
        // Можно переопределить через переменную окружения VITE_PROXY_TARGET
        target: process.env.VITE_PROXY_TARGET || 'https://localhost:8081',
        changeOrigin: true,
        secure: false, // Отключаем проверку SSL для самоподписанных сертификатов (HTTPS)
        rewrite: (path) => path, // Не переписываем путь
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Логируем Set-Cookie заголовки для отладки
            const raw = proxyRes.headers['set-cookie'];
const cookies: string[] =
  typeof raw === 'string'
    ? [raw]
    : Array.isArray(raw)
      ? raw
      : [];
      const modifiedCookies = cookies.map((cookie: string) => {
  let modified = cookie;

  if (modified.includes('SameSite=None')) {
    modified = modified.replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
    modified = modified.replace(/;\s*Secure/gi, '');
  } else if (!modified.includes('SameSite=')) {
    modified += '; SameSite=Lax';
  }

  modified = modified.replace(/;\s*Domain=[^;]+/gi, '');

  if (!modified.includes('Path=')) {
    modified += '; Path=/';
  }

  return modified;
});

proxyRes.headers['set-cookie'] = modifiedCookies;

          });
        },
      },
      // Прокси для threads API (HTTPS)
      // Используем bypass для проверки, является ли запрос API запросом
      '/threads': {
        target: process.env.VITE_PROXY_TARGET || 'https://localhost:8081',
        changeOrigin: true,
        secure: false, // Для самоподписанных сертификатов
        // Проксируем только API запросы, не SPA роуты
        bypass: (req) => {
          const acceptHeader = req.headers.accept || '';
          // Если это запрос от браузера для страницы (text/html), не проксируем
          // Запрос обработается React Router
          if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
            // Возвращаем путь к index.html для SPA роута
            return '/index.html';
          }
          // Для API запросов (application/json) проксируем
          return null;
        },
      },
      // Прокси для comments API (HTTPS)
      // Используем bypass для проверки, является ли запрос API запросом
      '/comments': {
        target: process.env.VITE_PROXY_TARGET || 'https://localhost:8081',
        changeOrigin: true,
        secure: false, // Для самоподписанных сертификатов
        // Проксируем только API запросы, не SPA роуты
        bypass: (req) => {
          const acceptHeader = req.headers.accept || '';
          // Если это запрос от браузера для страницы (text/html), не проксируем
          // Запрос обработается React Router
          if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
            // Возвращаем путь к index.html для SPA роута
            return '/index.html';
          }
          // Для API запросов (application/json) проксируем
          return null;
        },
      },
      // Прокси для profile API (HTTPS)
      // Используем bypass для проверки, является ли запрос API запросом
      '/profile': {
        target: process.env.VITE_PROXY_TARGET || 'https://localhost:8081',
        changeOrigin: true,
        secure: false, // Для самоподписанных сертификатов
        // Проксируем только API запросы, не SPA роуты
        bypass: (req) => {
          const acceptHeader = req.headers.accept || '';
          // Если это запрос от браузера для страницы (text/html), не проксируем
          // Запрос обработается React Router
          if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
            // Возвращаем путь к index.html для SPA роута
            return '/index.html';
          }
          // Для API запросов (application/json) проксируем
          return null;
        },
      },
    },
  },
})
