import axios from 'axios';
import { getApiBaseURL, getAuthBaseURL } from './urls';

const api = axios.create({
    baseURL: getApiBaseURL(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const authBaseURL = getAuthBaseURL();
                    const response = await axios.post(`${authBaseURL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });
                    localStorage.setItem('token', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
