// Types for the admin system

export interface Admin {
  id: number;
  username: string;
  nome: string;
}

export interface Loja {
  id: number;
  nome: string;
  endereco?: string;
  ativo: boolean;
  created_at: string;
}

export interface Sistema {
  id: number;
  nome: string;
  descricao?: string;
  url?: string;
  ativo: boolean;
  created_at: string;
}

export type TipoFuncionario = 'loja' | 'central_vendas';
export type SetorCentralVendas = 'cartao' | 'consignado' | 'energia' | 'fgts';

export interface Funcionario {
  id: number;
  nome: string;
  email?: string;
  tipo: TipoFuncionario;
  loja_id?: number;
  setor?: SetorCentralVendas;
  ativo: boolean;
  created_at: string;
  loja?: Loja;
  acessos?: Acesso[];
}

export interface Acesso {
  id: number;
  funcionario_id: number;
  sistema_id: number;
  usuario: string;
  senha: string;
  observacao?: string;
  created_at: string;
  sistema?: Sistema;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FiltrosFuncionario {
  nome?: string;
  loja_id?: number;
  setor?: SetorCentralVendas;
  sistema_id?: number;
  incluir_inativos?: boolean;
}
