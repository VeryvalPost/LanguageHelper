// src/config/api.config.ts

/**
 * Главный конфигурационный файл для взаимодействия с API.
 * `as const` делает объект и все его вложенные свойства неизменяемыми (readonly),
 * что помогает избежать случайных мутаций конфигурации в коде.
 */
export const API_CONFIG = {
  /**
   * Базовый URL для всех запросов к API.
   * Используем относительные пути для избежания проблем с HTTP/HTTPS.
   */
  BASE_URL: '',

  /**
   * Коллекция эндпоинтов API.
   * Эндпоинты с динамическими параметрами (например, :uuid) представлены в виде функций
   * для более чистого и безопасного формирования URL.
   */
  ENDPOINTS: {
    // --- Аутентификация ---
    AUTHENTICATE: '/api/authenticate',
    REGISTER: '/api/register',
    LOGOUT: '/api/logout',
    ME: '/api/me',

    // --- Упражнения (приватные, для авторизованных пользователей) ---
    GET_TASKS_HISTORY: '/api/history/getTasks',
    GET_TASK_BY_UUID: (uuid: string) => `/api/history/getTask/${uuid}`,
    TOGGLE_EXERCISE_PUBLIC: (uuid: string) => `/api/history/togglePublic/${uuid}`,

    // --- Упражнения (публичные) ---
    GET_PUBLIC_EXERCISE_BY_UUID: (uuid: string) => `/api/public/exercise/${uuid}`,

    // --- Генерация упражнений ---
    EXERCISE: '/api/exercise',
    EXERCISE_ABCD: '/api/exercise/abcd',
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
 * @param endpoint - Путь из API_CONFIG.ENDPOINTS (например, '/api/authenticate' или результат вызова функции, как `API_CONFIG.ENDPOINTS.GET_TASK_BY_UUID('some-id')`)
 * @returns Полный URL для запроса (например, '/api/authenticate')
 */
export const getApiUrl = (endpoint: string): string => {
  // Используем относительные пути для избежания проблем с HTTP/HTTPS
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};