import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Monitor, Users, Key } from 'lucide-react';

export default function Dashboard() {
  // These would come from API calls in a real implementation
  const stats = [
    { label: 'Lojas', value: '—', icon: Store, color: 'bg-blue-500' },
    { label: 'Sistemas', value: '—', icon: Monitor, color: 'bg-green-500' },
    { label: 'Funcionários', value: '—', icon: Users, color: 'bg-purple-500' },
    { label: 'Acessos', value: '—', icon: Key, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gerenciamento de senhas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  Conecte o backend para ver os dados
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Para conectar este frontend ao backend PHP:</p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Copie os arquivos PHP para <code className="bg-muted px-1 rounded">C:\xampp\htdocs\admin-senhas\</code></li>
            <li>Importe o script SQL no MySQL via phpMyAdmin</li>
            <li>Inicie o Apache e MySQL no XAMPP</li>
            <li>Atualize a URL da API em <code className="bg-muted px-1 rounded">src/config/api.ts</code> se necessário</li>
            <li>Use as credenciais padrão: <strong>admin / admin123</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
