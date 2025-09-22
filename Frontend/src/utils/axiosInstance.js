import axios from 'axios';
import { API_PATHS } from './apiPaths';

// Base URL for API requests
const BASE_URL = 'http://localhost:3001';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for sending cookies with cross-origin requests
});

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Request URL:', config.url);
        console.log('Request Method:', config.method);
        console.log('Request Headers:', config.headers);
        
        // Skip auth header for login/register requests
        if (config.url.includes('/auth/')) {
            console.log('Auth request, skipping auth header');
            return config;
        }
        
        const accessToken = localStorage.getItem("token");
        
        if (accessToken) {
            console.log('Adding auth token to request');
            config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            console.warn('No access token found in localStorage');
        }
        
        return config;
    }, 
    (error) => { 
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // You can add any response transformation here if needed
        return response;
    },
    async (error) => {
        const originalRequest = error?.config;
        
        // Log the error for debugging
        console.error('Response error:', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            data: error.response?.data
        });

        // If there's no response, it's a network error
        if (!error.response) {
            console.error('Network Error:', 'Unable to connect to the server. Please check your internet connection.');
            return Promise.reject(error);
        }

        const { status, data } = error.response;
        
        // Handle 401 Unauthorized errors (token expired or invalid)
        if (status === 401) {
            // If this is a login request, just reject it
            if (originalRequest?.url?.includes(API_PATHS.AUTH.LOGIN)) {
                return Promise.reject(error);
            }
            
            // If we're already refreshing the token, queue the request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Mark that we're refreshing the token
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (!refreshToken) {
                    console.error('No refresh token available');
                    throw new Error('No refresh token available');
                }

                console.log('Attempting to refresh token...');
                const response = await axios.post(`${BASE_URL}${API_PATHS.AUTH.REFRESH}`, {
                    refreshToken: refreshToken
                });

                console.log('Token refresh response:', response.data);
                
                const { token, refreshToken: newRefreshToken } = response.data;
                
                if (!token) {
                    throw new Error('No token received in refresh response');
                }
                
                // Update tokens in localStorage
                localStorage.setItem('token', token);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }
                
                // Update axios default header
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                
                // Process queued requests
                processQueue(null, token);
                
                // Retry the original request
                return axiosInstance(originalRequest);
                
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                // Clear tokens and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                delete axiosInstance.defaults.headers.common['Authorization'];
                
                // Process queued requests with error
                processQueue(refreshError, null);
                
                // Only redirect if this isn't a login page request
                if (!window.location.pathname.includes('/login')) {
                    redirectToLogin();
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // Handle other status codes
        switch (status) {
            case 400:
                console.error('Bad Request:', data?.message || 'Invalid request');
                break;
            case 403:
                console.error('Forbidden:', 'You do not have permission to access this resource');
                // Optionally redirect to a forbidden page or show a message
                if (!window.location.pathname.includes('/login')) {
                    // Redirect to login or show access denied message
                    redirectToLogin();
                }
                break;
            case 404:
                console.error('Not Found:', 'The requested resource was not found');
                // Optionally redirect to a 404 page
                break;
            case 429:
                console.error('Too Many Requests:', 'Please wait before making more requests');
                break;
            case 500:
                console.error('Server Error:', data?.message || 'An internal server error occurred');
                break;
            default:
                console.error(`Error ${status}:`, data?.message || 'An error occurred');
        }

        // For any error, reject with the error
        return Promise.reject(error);
    }
);

/**
 * Helper function to redirect to the login page
 * Stores the current URL to redirect back after successful login
 * @param {string} message - Optional message to display after redirect
 */
const redirectToLogin = (message = '') => {
    // Only redirect if not already on the login page
    if (!window.location.pathname.includes('/login')) {
        // Store the current URL to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        
        // Don't store the login page as the redirect target
        if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
            localStorage.setItem('redirectAfterLogin', currentPath);
        }
        
        // Add a message to display after redirect if provided
        if (message) {
            sessionStorage.setItem('loginMessage', message);
        }
        
        // Use window.location.replace to prevent the login page from being added to browser history
        window.location.replace('/login');
    }
};

export default axiosInstance;
