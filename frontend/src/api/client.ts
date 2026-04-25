import axios from 'axios';



// Intelligent API URL detection
// Local: Uses the Vite proxy (/api)
// Production: Uses your Railway backend (api.serrafashion.in)
export const API_URL = (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost'))
    ? import.meta.env.VITE_API_BASE_URL
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '/api/v1' 
        : 'https://api.serrafashion.in/api/v1');



// Safe localStorage helper to prevent crashes in restricted WebViews (like Instagram)
const safeStorage = {
    getItem: (key: string) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch (e) { /* ignored */ }
    },
    removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch (e) { /* ignored */ }
    }
};

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
        const token = safeStorage.getItem('accessToken');
        if (token && config.headers) {
            if (typeof config.headers.set === 'function') {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isLoginRequest = originalRequest.url?.includes('/auth/login');

        if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
            originalRequest._retry = true;
            try {
                const rfToken = safeStorage.getItem('refreshToken');
                if (!rfToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken: rfToken
                });

                const { access, refresh } = res.data.data;
                safeStorage.setItem('accessToken', access);
                safeStorage.setItem('refreshToken', refresh);

                if (typeof originalRequest.headers.set === 'function') {
                    originalRequest.headers.set('Authorization', `Bearer ${access}`);
                } else {
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                }

                return api(originalRequest);
            } catch (e) {
                safeStorage.removeItem('accessToken');
                safeStorage.removeItem('refreshToken');
                safeStorage.removeItem('user');

                // Only redirect if not already on the login page to avoid infinite loops and losing form state
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(e);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
