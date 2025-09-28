// src/config/api.config.ts

/**
 * Главный конфигурационный файл для взаимодействия с API.
 * `as const` делает объект и все его вложенные свойства неизменяемыми (readonly),
 * что помогает избежать случайных мутаций конфигурации в коде.
 */
export const API_CONFIG = {
  /**
   * Базовый URL для всех запросов к API.
   * Использует переменную окружения Vite (VITE_API_URL).
   * Если переменная не задана, используется значение по умолчанию для локальной разработки.
   */
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',

  /**
   * Коллекция эндпоинтов API.
   * Эндпоинты с динамическими параметрами (например, :uuid) представлены в виде функций
   * для более чистого и безопасного формирования URL.
   */
  ENDPOINTS: {
    // --- Аутентификация ---
    AUTHENTICATE: '/authenticate',
    REGISTER: '/register',
    LOGOUT: '/logout',
    ME: '/me',

    // --- Упражнения (приватные, для авторизованных пользователей) ---
    GET_TASKS_HISTORY: '/history/getTasks',
    GET_TASK_BY_UUID: (uuid: string) => `/history/getTask/${uuid}`,
    TOGGLE_EXERCISE_PUBLIC: (uuid: string) => `/exercise/${uuid}/toggle-public`,

    // --- Упражнения (публичные) ---
    GET_PUBLIC_EXERCISE_BY_UUID: (uuid: string) => `/public/exercise/${uuid}`,
  },

  /**
   * Таймаут для запросов в миллисекундах.
   */
  TIMEOUT: 10000, // 10 секунд

  /**
   * Заголовки по умолчанию, которые можно добавлять к запросам.
   */
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Рекомендуется добавлять, чтобы сервер знал, какой формат ответа ожидает клиент.
  },
} as const;

/**
 * Вспомогательная функция для получения полного URL эндпоинта.
 * @param endpoint - Путь из API_CONFIG.ENDPOINTS (например, '/authenticate' или результат вызова функции, как `API_CONFIG.ENDPOINTS.GET_TASK_BY_UUID('some-id')`)
 * @returns Полный URL для запроса (например, 'http://localhost:8080/api/authenticate')
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

