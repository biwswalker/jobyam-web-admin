/**
 * Central API service for making HTTP requests
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/';

// Response type for API responses
export interface ApiResponse<T> {
  message: string;
  code: number;
  status: string;
  data: T;
}

// Error type for API errors
export interface ApiError {
  code: number;
  status: string;
  message: string;
}

/**
 * Generic fetch function with error handling
 */
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}${endpoint}`;
    
    // Set headers based on body type
    let headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers = {
        'Content-Type': 'application/json',
        ...headers,
      };
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        code: response.status,
        status: response.statusText,
        message: errorData.message || 'An error occurred',
      };
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * API methods for different HTTP verbs
 */
interface UploadOptions {
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

const api = {
  get: <T>(endpoint: string, options: RequestInit = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data: any, options: RequestInit = {}) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
  
  put: <T>(endpoint: string, data: any, options: RequestInit = {}) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
  
  patch: <T>(endpoint: string, data: any, options: RequestInit = {}) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
  
  delete: <T>(endpoint: string, options: RequestInit = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
    
  upload: async <T = any>(
    endpoint: string, 
    file: File, 
    options: UploadOptions = {}
  ): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `${API_URL}${endpoint}`);
      
      // Set headers
      const headers = options.headers || {};
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options.onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          options.onProgress(percentComplete);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject({
              code: xhr.status,
              status: xhr.statusText,
              message: 'Failed to parse response'
            });
          }
        } else {
          reject({
            code: xhr.status,
            status: xhr.statusText,
            message: xhr.statusText
          });
        }
      };
      
      xhr.onerror = () => {
        reject({
          code: 0,
          status: 'Network Error',
          message: 'Network request failed'
        });
      };
      
      xhr.send(formData);
    });
  },
};

export default api;
