import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((res) => res.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((res) => res.data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }).then((res) => res.data),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get<User>('/auth/me').then((res) => res.data),
};
