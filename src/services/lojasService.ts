import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Loja, ApiResponse } from '@/types';

export const lojasService = {
  async getAll(): Promise<ApiResponse<Loja[]>> {
    return api.get<Loja[]>(API_ENDPOINTS.lojas);
  },

  async getById(id: number): Promise<ApiResponse<Loja>> {
    return api.get<Loja>(API_ENDPOINTS.loja(id));
  },

  async create(loja: Omit<Loja, 'id' | 'created_at'>): Promise<ApiResponse<Loja>> {
    return api.post<Loja>(API_ENDPOINTS.lojas, loja);
  },

  async update(id: number, loja: Partial<Loja>): Promise<ApiResponse<Loja>> {
    return api.put<Loja>(API_ENDPOINTS.loja(id), loja);
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return api.delete<void>(API_ENDPOINTS.loja(id));
  },

  async toggleStatus(id: number, ativo: boolean): Promise<ApiResponse<Loja>> {
    return api.put<Loja>(API_ENDPOINTS.loja(id), { ativo });
  },
};
