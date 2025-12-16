// API Configuration
// В режиме разработки с прокси Vite используем относительные пути
// В production используем полный URL из переменной окружения
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Если нужно использовать прямые запросы к API (без прокси), установите VITE_API_BASE_URL в .env:
// Для HTTPS: VITE_API_BASE_URL=https://localhost:7042
// Для HTTP: VITE_API_BASE_URL=http://localhost:5140

// Ensure all URLs end with trailing slash and are lowercase
export function normalizeUrl(path: string): string {
  const normalized = path.toLowerCase();
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function buildApiUrl(endpoint: string, queryParams?: Record<string, string | number | null>): string {
  const normalizedEndpoint = normalizeUrl(endpoint);
  
  // Если API_BASE_URL пустой (используем прокси Vite), возвращаем относительный путь
  if (!API_BASE_URL) {
    let url = normalizedEndpoint;
    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key.toLowerCase(), String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return url;
  }
  
  // Иначе используем полный URL
  const url = new URL(normalizedEndpoint, API_BASE_URL);
  
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key.toLowerCase(), String(value));
      }
    });
  }
  
  return url.toString();
}

