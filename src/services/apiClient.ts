// HTTP Client Utility
// Axios-based client with TypeScript support, authentication, and error handling

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getApiBaseUrl } from '@/config/api';

/**
 * Create configured Axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors globally
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Unauthorized - could trigger logout here
        console.error('Unauthorized request');
      } else if (error.response?.status === 500) {
        console.error('Server error:', error.response.data);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();

/**
 * Generic API request wrapper with error handling
 */
export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const response: AxiosResponse<T> = await apiClient.request(config);
    return { data: response.data, error: null };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      return { data: null, error: message };
    }
    return { data: null, error: 'An unexpected error occurred' };
  }
};

/**
 * Test API connection health
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Update API base URL and recreate client
 */
export const updateApiBaseUrl = (newBaseUrl: string): void => {
  localStorage.setItem('api_base_url', newBaseUrl);
  apiClient.defaults.baseURL = newBaseUrl;
};
