// src/services/api.ts - Enhanced for better debugging and handling of URL construction

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Get API base URL from environment variables
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://webviewerv2back-fdffdsavchafg3af.centralus-01.azurewebsites.net/api/v1';
const API_TIMEOUT = 30000000; // 30 seconds

// Debug flag - set to true during development
const DEBUG = true;

/**
 * Base axios instance configured for API requests
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Debug logging for API requests
        if (DEBUG) {
            console.log(`🚀 API Request [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`, {
                headers: config.headers,
                params: config.params,
                data: config.data
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
    (response) => {
        // Debug logging for API responses
        if (DEBUG) {
            console.log(`✅ API Response [${response.status}] ${response.config.url}`, {
                data: response.data ? 'Data received' : 'No data',
                size: JSON.stringify(response.data).length
            });
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Detailed error logging
        if (DEBUG) {
            if (error.response) {
                console.error(`❌ API Error [${error.response.status}] ${originalRequest.url}`, {
                    data: error.response.data,
                    headers: error.response.headers,
                    config: originalRequest
                });

                // If receiving HTML instead of JSON, log it
                if (error.response.headers['content-type']?.includes('text/html')) {
                    console.error('Received HTML instead of JSON - likely an error page or wrong URL');

                    if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
                        console.error('Response contains HTML - first 100 chars:', error.response.data.substring(0, 100));
                    }
                }
            } else if (error.request) {
                console.error('❌ No response received:', error.request);
            } else {
                console.error('❌ Error setting up request:', error.message);
            }
        }

        // Token refresh logic
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                    refresh: refreshToken
                });

                if (response.data.access) {
                    localStorage.setItem('accessToken', response.data.access);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    } else if (originalRequest.headers === undefined) {
                        originalRequest.headers = { Authorization: `Bearer ${response.data.access}` };
                    }

                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Generic API request function with proper typing
 */
export const apiRequest = async <T = unknown>(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> => {
    try {
        // Ensure URL starts with a slash if it doesn't already
        const formattedUrl = url.startsWith('/') ? url : `/${url}`;

        const response: AxiosResponse<T> = await apiClient({
            method,
            url: formattedUrl,
            data,
            ...config,
        });
        return response.data;
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 * Convenience methods for different HTTP methods
 */
export const apiGet = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>('get', url, undefined, config);

export const apiPost = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>('post', url, data, config);

export const apiPut = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>('put', url, data, config);

export const apiPatch = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>('patch', url, data, config);

export const apiDelete = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>('delete', url, undefined, config);

/**
 * Creates a URLSearchParams object from a parameters object
 */
export const createQueryParams = (params: Record<string, unknown>): URLSearchParams => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
                queryParams.append(key, value ? 'true' : 'false');
            } else {
                queryParams.append(key, String(value));
            }
        }
    });

    return queryParams;
};

export default apiClient;