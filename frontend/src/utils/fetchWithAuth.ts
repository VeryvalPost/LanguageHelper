export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  // Корректно объединяем все заголовки
  const headers = new Headers();
  if (init.headers) {
    const oldHeaders = new Headers(init.headers as any);
    oldHeaders.forEach((value, key) => headers.set(key, value));
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Логируем параметры запроса
  console.log('[fetchWithAuth] URL:', input);
  console.log('[fetchWithAuth] Method:', init.method || 'GET');
  console.log('[fetchWithAuth] Headers:', Object.fromEntries(headers.entries()));
  if (init.body) {
    if (init.body instanceof FormData) {
      const formDataObj: Record<string, any> = {};
      (init.body as FormData).forEach((value, key) => {
        formDataObj[key] = value;
      });
      console.log('[fetchWithAuth] Body (FormData):', formDataObj);
    } else {
      console.log('[fetchWithAuth] Body:', init.body);
    }
  }
  return fetch(input, { ...init, headers });
}
