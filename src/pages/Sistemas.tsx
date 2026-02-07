import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Monitor, ExternalLink } from 'lucide-react';
import { sistemasService } from '@/services/sistemasService';
import type { Sistema } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Sistemas() {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSistema, setEditingSistema] = useState<Sistema | null>(null);
  const [showInativos, setShowInativos] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '', url: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadSistemas();
  }, [showInativos]);

  const loadSistemas = async () => {
    setIsLoading(true);
    const response = await sistemasService.getAll(showInativos);
    if (response.success && response.data) {
      setSistemas(response.data);
    } else {
      toast({
        title: 'Erro',
        description: response.error || 'Erro ao carregar sistemas',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSistema) {
      const response = await sistemasService.update(editingSistema.id, formData);
      if (response.success) {
        toast({ title: 'Sucesso', description: 'Sistema atualizado!' });
        loadSistemas();
        closeDialog();
      } else {
        toast({
          title: 'Erro',
          description: response.error,
          variant: 'destructive',
        });
      }
    } else {
      const response = await sistemasService.create({ ...formData, ativo: true });
      if (response.success) {
        toast({ title: 'Sucesso', description: 'Sistema criado!' });
        loadSistemas();
        closeDialog();
      } else {
        toast({
          title: 'Erro',
          description: response.error,
          variant: 'destructive',
        });
      }
    }
  };

  const handleToggleStatus = async (sistema: Sistema) => {
    const response = await sistemasService.toggleStatus(sistema.id, !sistema.ativo);
    if (response.success) {
      loadSistemas();
    } else {
      toast({
        title: 'Erro',
        description: response.error,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este sistema?')) return;
    
    const response = await sistemasService.delete(id);
    if (response.success) {
      toast({ title: 'Sucesso', description: 'Sistema excluído!' });
      loadSistemas();
    } else {
      toast({
        title: 'Erro',
        description: response.error,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (sistema: Sistema) => {
    setEditingSistema(sistema);
    setFormData({
      nome: sistema.nome,
      descricao: sistema.descricao || '',
      url: sistema.url || '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSistema(null);
    setFormData({ nome: '', descricao: '', url: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="h-8 w-8" />
            Sistemas
          </h1>
          <p className="text-muted-foreground">Gerencie os sistemas de acesso</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-inativos"
              checked={showInativos}
              onCheckedChange={setShowInativos}
            />
            <Label htmlFor="show-inativos">Mostrar inativos</Label>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => closeDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Sistema
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSistema ? 'Editar Sistema' : 'Novo Sistema'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL de Acesso</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                  />
                </div>
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
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : sistemas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum sistema cadastrado. Conecte o backend PHP para começar.
                </TableCell>
              </TableRow>
            ) : (
              sistemas.map((sistema) => (
                <TableRow key={sistema.id}>
                  <TableCell className="font-medium">{sistema.nome}</TableCell>
                  <TableCell>
                    {sistema.url ? (
                      <a
                        href={sistema.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        Acessar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {sistema.descricao || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sistema.ativo}
                        onCheckedChange={() => handleToggleStatus(sistema)}
                      />
                      <Badge variant={sistema.ativo ? 'default' : 'secondary'}>
                        {sistema.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(sistema)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sistema.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
