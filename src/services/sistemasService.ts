import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Sistema, ApiResponse } from '@/types';

export const sistemasService = {
  async getAll(incluirInativos = false): Promise<ApiResponse<Sistema[]>> {
    const endpoint = incluirInativos 
      ? `${API_ENDPOINTS.sistemas}?incluir_inativos=1`
      : API_ENDPOINTS.sistemas;
    return api.get<Sistema[]>(endpoint);
  },

  async getById(id: number): Promise<ApiResponse<Sistema>> {
    return api.get<Sistema>(API_ENDPOINTS.sistema(id));
  },

  async create(sistema: Omit<Sistema, 'id' | 'created_at'>): Promise<ApiResponse<Sistema>> {
    return api.post<Sistema>(API_ENDPOINTS.sistemas, sistema);
  },

  async update(id: number, sistema: Partial<Sistema>): Promise<ApiResponse<Sistema>> {
    return api.put<Sistema>(API_ENDPOINTS.sistema(id), sistema);
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return api.delete<void>(API_ENDPOINTS.sistema(id));
  },

  async toggleStatus(id: number, ativo: boolean): Promise<ApiResponse<Sistema>> {
    return api.put<Sistema>(API_ENDPOINTS.sistema(id), { ativo });
  },
};
