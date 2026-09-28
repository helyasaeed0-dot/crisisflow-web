import axios from 'axios';

// Empty in development (Vite proxy); the backend URL in production
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Turns a backend path like "/api/media/..." into a full URL in production
export const apiUrl = (path) => (path && path.startsWith('/') ? `${API_URL}${path}` : path);

const ACCESS_KEY = 'cf_access_token';
const REFRESH_KEY = 'cf_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Routes where a 401 means "wrong credentials", not "token expired"
const NO_REFRESH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh'];

// Shared promise so parallel requests trigger only one refresh
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skip = NO_REFRESH_ROUTES.some((route) => original?.url?.startsWith(route));

    if (status === 401 && original && !original._retry && !skip && tokenStore.getRefresh()) {
      original._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          axios
            .post(`${API_URL}/api/auth/refresh`, { refreshToken: tokenStore.getRefresh() })
            .then((res) => {
              tokenStore.set(res.data.data);
              return res.data.data.accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });

        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

export default api;