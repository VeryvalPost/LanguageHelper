import { User } from '../components/AuthPage';
import { API_CONFIG, getApiUrl } from '../config/api';

// Функция для получения токена из localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Функция для установки токена в localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Функция для удаления токена из localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// Функция для проверки, авторизован ли пользователь
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Функция для создания заголовков с токеном авторизации
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Функция для обработки ответов API
const handleApiResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    let errorMessage = 'Произошла ошибка';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Если не удалось распарсить JSON, используем статус
      switch (response.status) {
        case 401:
          errorMessage = 'Неверные учетные данные';
          break;
        case 403:
          errorMessage = 'Доступ запрещен';
          break;
        case 404:
          errorMessage = 'Ресурс не найден';
          break;
        case 409:
          errorMessage = 'Пользователь с таким email уже существует';
          break;
        case 422:
          errorMessage = 'Неверные данные';
          break;
        case 500:
          errorMessage = 'Ошибка сервера';
          break;
        default:
          errorMessage = `Ошибка ${response.status}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Функция для входа пользователя
export const authenticateUser = async (email: string, password: string): Promise<User> => {
  const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTHENTICATE), {
    method: 'POST',
    headers: API_CONFIG.DEFAULT_HEADERS,
    body: JSON.stringify({ email, password }),
  });

  const userData = await handleApiResponse(response);
  
  const user: User = {
    id: userData.id || userData.userId,
    email: userData.email,
    username: userData.name || userData.username,
    token: userData.token || userData.token,
  };

  console.log(user);

  // Сохраняем токен
  if (user.token) {
    setAuthToken(user.token);
  }

  return user;
};

// Функция для регистрации пользователя
export const registerUser = async (username: string, email: string, password: string): Promise<User> => {
  const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
    method: 'POST',
    headers: API_CONFIG.DEFAULT_HEADERS,
    body: JSON.stringify({ username, email, password }),
  });

  const userData = await handleApiResponse(response);
  
  const user: User = {
    id: userData.id || userData.userId,
    email: userData.email,
    username: userData.name || userData.username,
    token: userData.token || userData.accessToken,
  };

  // Сохраняем токен
  if (user.token) {
    setAuthToken(user.token);
  }

  return user;
};

// Функция для выхода пользователя
export const logoutUser = async (): Promise<void> => {
  const token = getAuthToken();
  
  if (token) {
    try {
      // Пытаемся вызвать API для logout
      await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.warn('Ошибка при logout на сервере:', error);
    }
  }
  
  // В любом случае удаляем токен локально
  removeAuthToken();
};

// Функция для получения информации о текущем пользователе
export const getCurrentUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ME), {
      headers: getAuthHeaders(),
    });

    const userData = await handleApiResponse(response);
    
    return {
      id: userData.id || userData.userId,
      email: userData.email,
      username: userData.name || userData.username,
      token,
    };
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    // Если не удалось получить информацию, удаляем токен
    removeAuthToken();
    return null;
  }
};
