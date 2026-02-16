import axios from 'axios';

const host = window.location.hostname;
export const API_URL = import.meta.env.VITE_API_URL || `http://${host}:5002/api/v1`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
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
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const rfToken = localStorage.getItem('refreshToken');
                if (!rfToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken: rfToken
                });

                const { access, refresh } = res.data.data;
                localStorage.setItem('accessToken', access);
                localStorage.setItem('refreshToken', refresh);

                if (typeof originalRequest.headers.set === 'function') {
                    originalRequest.headers.set('Authorization', `Bearer ${access}`);
                } else {
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                }

                return api(originalRequest);
            } catch (e) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(e);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
