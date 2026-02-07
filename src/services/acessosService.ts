import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Acesso, ApiResponse } from '@/types';

export const acessosService = {
  async getByFuncionario(funcionarioId: number): Promise<ApiResponse<Acesso[]>> {
    return api.get<Acesso[]>(API_ENDPOINTS.acessosByFuncionario(funcionarioId));
  },

  async getById(id: number): Promise<ApiResponse<Acesso>> {
    return api.get<Acesso>(API_ENDPOINTS.acesso(id));
  },

  async create(acesso: Omit<Acesso, 'id' | 'created_at' | 'sistema'>): Promise<ApiResponse<Acesso>> {
    return api.post<Acesso>(API_ENDPOINTS.acessos, acesso);
  },

  async update(id: number, acesso: Partial<Acesso>): Promise<ApiResponse<Acesso>> {
    return api.put<Acesso>(API_ENDPOINTS.acesso(id), acesso);
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return api.delete<void>(API_ENDPOINTS.acesso(id));
  },
};
