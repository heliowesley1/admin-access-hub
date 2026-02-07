// API Configuration
// Change this URL to match your XAMPP backend location
export const API_BASE_URL = 'http://localhost/admin-senhas/api';

export const API_ENDPOINTS = {
  // Auth
  login: '/auth/login.php',
  logout: '/auth/logout.php',
  checkSession: '/auth/check-session.php',
  
  // Lojas
  lojas: '/lojas/index.php',
  loja: (id: number) => `/lojas/index.php?id=${id}`,
  
  // Sistemas
  sistemas: '/sistemas/index.php',
  sistema: (id: number) => `/sistemas/index.php?id=${id}`,
  
  // Funcionarios
  funcionarios: '/funcionarios/index.php',
  funcionario: (id: number) => `/funcionarios/index.php?id=${id}`,
  
  // Acessos
  acessos: '/acessos/index.php',
  acesso: (id: number) => `/acessos/index.php?id=${id}`,
  acessosByFuncionario: (funcionarioId: number) => `/acessos/index.php?funcionario_id=${funcionarioId}`,
};
