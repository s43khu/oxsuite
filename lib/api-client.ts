import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('oxsuite_api_key', key);
    }
  }

  getApiKey(): string | null {
    if (this.apiKey) return this.apiKey;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('oxsuite_api_key');
    }
    return null;
  }

  clearApiKey() {
    this.apiKey = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oxsuite_api_key');
    }
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      params?: any;
      requireAuth?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const apiKey = this.getApiKey();
      const requireAuth = options.requireAuth !== false;
      
      if (requireAuth && !apiKey) {
        return {
          success: false,
          error: 'API key is required. Please set your API key first.'
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (requireAuth && apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await axios({
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        headers
      });

      // NOTE: API returns { success: true, data: ... } structure
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      // NOTE: Handle both axios error structure and API error response
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData.error || errorData.message || error.message || 'An error occurred'
        };
      }
      return {
        success: false,
        error: error.message || 'An error occurred'
      };
    }
  }

  async webCheck<T = any>(url: string, requireAuth = false): Promise<ApiResponse<T>> {
    const endpoint = requireAuth ? '/web-check' : '/web-check/public';
    return this.request<T>(endpoint, {
      method: 'POST',
      data: { url },
      requireAuth
    });
  }
}

export const apiClient = new ApiClient();

