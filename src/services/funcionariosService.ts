import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Funcionario, FiltrosFuncionario, ApiResponse } from '@/types';

export const funcionariosService = {
  async getAll(filtros?: FiltrosFuncionario): Promise<ApiResponse<Funcionario[]>> {
    let endpoint = API_ENDPOINTS.funcionarios;
    
    if (filtros) {
      const params = new URLSearchParams();
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.loja_id) params.append('loja_id', filtros.loja_id.toString());
      if (filtros.setor) params.append('setor', filtros.setor);
      if (filtros.sistema_id) params.append('sistema_id', filtros.sistema_id.toString());
      if (filtros.incluir_inativos) params.append('incluir_inativos', '1');
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    return api.get<Funcionario[]>(endpoint);
  },

  async getById(id: number): Promise<ApiResponse<Funcionario>> {
    return api.get<Funcionario>(API_ENDPOINTS.funcionario(id));
  },

  async create(funcionario: Omit<Funcionario, 'id' | 'created_at' | 'loja' | 'acessos'>): Promise<ApiResponse<Funcionario>> {
    return api.post<Funcionario>(API_ENDPOINTS.funcionarios, funcionario);
  },

  async update(id: number, funcionario: Partial<Funcionario>): Promise<ApiResponse<Funcionario>> {
    return api.put<Funcionario>(API_ENDPOINTS.funcionario(id), funcionario);
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return api.delete<void>(API_ENDPOINTS.funcionario(id));
  },

  async toggleStatus(id: number, ativo: boolean): Promise<ApiResponse<Funcionario>> {
    return api.put<Funcionario>(API_ENDPOINTS.funcionario(id), { ativo });
  },
};
