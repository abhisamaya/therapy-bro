import axios from 'axios';
import { AuthResponse, RegisterData, LoginData, Listener, ProfileUpdateData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('listener_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<Listener> => {
    const response = await api.get<Listener>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: ProfileUpdateData): Promise<Listener> => {
    const response = await api.put<Listener>('/auth/profile', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('listener_token');
  },
};

export const chatApi = {
  getMessages: async (conversationId: string, limit = 50) => {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { limit },
    });
    return response.data;
  },
};

export default api;
