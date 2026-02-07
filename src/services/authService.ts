import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Admin, LoginCredentials, ApiResponse } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<Admin>> {
    return api.post<Admin>(API_ENDPOINTS.login, credentials);
  },

  async logout(): Promise<ApiResponse<void>> {
    return api.post<void>(API_ENDPOINTS.logout, {});
  },

  async checkSession(): Promise<ApiResponse<Admin>> {
    return api.get<Admin>(API_ENDPOINTS.checkSession);
  },
};
