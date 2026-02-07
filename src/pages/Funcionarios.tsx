import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Key,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { funcionariosService } from '@/services/funcionariosService';
import { lojasService } from '@/services/lojasService';
import { sistemasService } from '@/services/sistemasService';
import { acessosService } from '@/services/acessosService';
import type { Funcionario, Loja, Sistema, Acesso, TipoFuncionario, SetorCentralVendas, FiltrosFuncionario } from '@/types';
import { useToast } from '@/hooks/use-toast';

const SETORES: { value: SetorCentralVendas; label: string }[] = [
  { value: 'cartao', label: 'Cartão' },
  { value: 'consignado', label: 'Consignado' },
  { value: 'energia', label: 'Energia' },
  { value: 'fgts', label: 'FGTS' },
];

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAcessoDialogOpen, setIsAcessoDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosFuncionario>({
    nome: '',
    loja_id: undefined,
    setor: undefined,
    sistema_id: undefined,
    incluir_inativos: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tipo: 'loja' as TipoFuncionario,
    loja_id: undefined as number | undefined,
    setor: undefined as SetorCentralVendas | undefined,
  });

  // Acesso form
  const [acessoForm, setAcessoForm] = useState({
    sistema_id: undefined as number | undefined,
    usuario: '',
    senha: '',
    observacao: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadFuncionarios();
  }, [filtros]);

  const loadData = async () => {
    const [lojasRes, sistemasRes] = await Promise.all([
      lojasService.getAll(),
      sistemasService.getAll(),
    ]);

    if (lojasRes.success && lojasRes.data) setLojas(lojasRes.data);
    if (sistemasRes.success && sistemasRes.data) setSistemas(sistemasRes.data);

    loadFuncionarios();
  };

  const loadFuncionarios = async () => {
    setIsLoading(true);
    const response = await funcionariosService.getAll(filtros);
    if (response.success && response.data) {
      setFuncionarios(response.data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      loja_id: formData.tipo === 'loja' ? formData.loja_id : undefined,
      setor: formData.tipo === 'central_vendas' ? formData.setor : undefined,
      ativo: true,
    };

    if (editingFuncionario) {
      const response = await funcionariosService.update(editingFuncionario.id, payload);
      if (response.success) {
        toast({ title: 'Sucesso', description: 'Funcionário atualizado!' });
        loadFuncionarios();
        closeDialog();
      } else {
        toast({ title: 'Erro', description: response.error, variant: 'destructive' });
      }
    } else {
      const response = await funcionariosService.create(payload);
      if (response.success) {
        toast({ title: 'Sucesso', description: 'Funcionário criado!' });
        loadFuncionarios();
        closeDialog();
      } else {
        toast({ title: 'Erro', description: response.error, variant: 'destructive' });
      }
    }
  };

  const handleToggleStatus = async (funcionario: Funcionario) => {
    const response = await funcionariosService.toggleStatus(funcionario.id, !funcionario.ativo);
    if (response.success) {
      loadFuncionarios();
    } else {
      toast({ title: 'Erro', description: response.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    const response = await funcionariosService.delete(id);
    if (response.success) {
      toast({ title: 'Sucesso', description: 'Funcionário excluído!' });
      loadFuncionarios();
    } else {
      toast({ title: 'Erro', description: response.error, variant: 'destructive' });
    }
  };

  const handleAddAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuncionario || !acessoForm.sistema_id) return;

    const response = await acessosService.create({
      funcionario_id: selectedFuncionario.id,
      sistema_id: acessoForm.sistema_id,
      usuario: acessoForm.usuario,
      senha: acessoForm.senha,
      observacao: acessoForm.observacao,
    });

    if (response.success) {
      toast({ title: 'Sucesso', description: 'Acesso adicionado!' });
      loadFuncionarios();
      setAcessoForm({ sistema_id: undefined, usuario: '', senha: '', observacao: '' });
      setIsAcessoDialogOpen(false);
    } else {
      toast({ title: 'Erro', description: response.error, variant: 'destructive' });
    }
  };

  const handleDeleteAcesso = async (acessoId: number) => {
    if (!confirm('Excluir este acesso?')) return;

    const response = await acessosService.delete(acessoId);
    if (response.success) {
      toast({ title: 'Sucesso', description: 'Acesso removido!' });
      loadFuncionarios();
    } else {
      toast({ title: 'Erro', description: response.error, variant: 'destructive' });
    }
  };

  const togglePasswordVisibility = (acessoId: number) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(acessoId)) {
      newSet.delete(acessoId);
    } else {
      newSet.add(acessoId);
    }
    setVisiblePasswords(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência' });
  };

  const openEditDialog = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      email: funcionario.email || '',
      tipo: funcionario.tipo,
      loja_id: funcionario.loja_id,
      setor: funcionario.setor,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFuncionario(null);
    setFormData({
      nome: '',
      email: '',
      tipo: 'loja',
      loja_id: undefined,
      setor: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Funcionários
          </h1>
          <p className="text-muted-foreground">Gerencie funcionários e seus acessos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: TipoFuncionario) =>
                    setFormData({ ...formData, tipo: value, loja_id: undefined, setor: undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="central_vendas">Central de Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === 'loja' && (
                <div className="space-y-2">
                  <Label>Loja</Label>
                  <Select
                    value={formData.loja_id?.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, loja_id: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a loja" />
                    </SelectTrigger>
                    <SelectContent>
                      {lojas.filter(l => l.ativo).map((loja) => (
                        <SelectItem key={loja.id} value={loja.id.toString()}>
                          {loja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.tipo === 'central_vendas' && (
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select
                    value={formData.setor}
                    onValueChange={(value: SetorCentralVendas) =>
                      setFormData({ ...formData, setor: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETORES.map((setor) => (
                        <SelectItem key={setor.value} value={setor.value}>
                          {setor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Buscar por nome..."
                value={filtros.nome}
                onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Loja</Label>
              <Select
                value={filtros.loja_id?.toString() || 'all'}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, loja_id: value === 'all' ? undefined : parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.id.toString()}>
                      {loja.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={filtros.setor || 'all'}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, setor: value === 'all' ? undefined : value as SetorCentralVendas })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {SETORES.map((setor) => (
                    <SelectItem key={setor.value} value={setor.value}>
                      {setor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sistema</Label>
              <Select
                value={filtros.sistema_id?.toString() || 'all'}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, sistema_id: value === 'all' ? undefined : parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema.id} value={sistema.id.toString()}>
                      {sistema.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={filtros.incluir_inativos}
                  onCheckedChange={(checked) =>
                    setFiltros({ ...filtros, incluir_inativos: checked })
                  }
                />
                <span className="text-sm">Incluir inativos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Funcionários */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : funcionarios.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum funcionário encontrado. Conecte o backend PHP para começar.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {funcionarios.map((funcionario) => (
              <AccordionItem
                key={funcionario.id}
                value={funcionario.id.toString()}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="flex-1">
                      <div className="font-medium">{funcionario.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {funcionario.tipo === 'loja'
                          ? funcionario.loja?.nome || 'Loja não definida'
                          : SETORES.find(s => s.value === funcionario.setor)?.label || 'Setor não definido'}
                      </div>
                    </div>
                    <Badge variant={funcionario.tipo === 'loja' ? 'default' : 'secondary'}>
                      {funcionario.tipo === 'loja' ? 'Loja' : 'Central'}
                    </Badge>
                    <Badge variant={funcionario.ativo ? 'outline' : 'destructive'}>
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {funcionario.acessos?.length || 0} acessos
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(funcionario)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(funcionario)}
                      >
                        {funcionario.ativo ? 'Inativar' : 'Reativar'}
                      </Button>
                      <Dialog open={isAcessoDialogOpen} onOpenChange={setIsAcessoDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedFuncionario(funcionario)}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Adicionar Acesso
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Acesso</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleAddAcesso} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Sistema</Label>
                              <Select
                                value={acessoForm.sistema_id?.toString()}
                                onValueChange={(value) =>
                                  setAcessoForm({ ...acessoForm, sistema_id: parseInt(value) })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o sistema" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sistemas.filter(s => s.ativo).map((sistema) => (
                                    <SelectItem key={sistema.id} value={sistema.id.toString()}>
                                      {sistema.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Usuário</Label>
                              <Input
                                value={acessoForm.usuario}
                                onChange={(e) =>
                                  setAcessoForm({ ...acessoForm, usuario: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Senha</Label>
                              <Input
                                value={acessoForm.senha}
                                onChange={(e) =>
                                  setAcessoForm({ ...acessoForm, senha: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Observação</Label>
                              <Input
                                value={acessoForm.observacao}
                                onChange={(e) =>
                                  setAcessoForm({ ...acessoForm, observacao: e.target.value })
                                }
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAcessoDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button type="submit">Salvar</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(funcionario.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>

                    {/* Acessos Table */}
                    {funcionario.acessos && funcionario.acessos.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sistema</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Senha</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {funcionario.acessos.map((acesso) => (
                            <TableRow key={acesso.id}>
                              <TableCell className="font-medium">
                                {acesso.sistema?.nome || `Sistema ${acesso.sistema_id}`}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {acesso.usuario}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(acesso.usuario)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">
                                    {visiblePasswords.has(acesso.id)
                                      ? acesso.senha
                                      : '••••••••'}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => togglePasswordVisibility(acesso.id)}
                                  >
                                    {visiblePasswords.has(acesso.id) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(acesso.senha)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{acesso.observacao || '—'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteAcesso(acesso.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum acesso cadastrado para este funcionário.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
