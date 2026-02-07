import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Store } from 'lucide-react';
import { lojasService } from '@/services/lojasService';
import type { Loja } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Lojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [formData, setFormData] = useState({ nome: '', endereco: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadLojas();
  }, []);

  const loadLojas = async () => {
    setIsLoading(true);
    const response = await lojasService.getAll();
    if (response.success && response.data) {
      setLojas(response.data);
    } else {
      toast({
        title: 'Erro',
        description: response.error || 'Erro ao carregar lojas',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLoja) {
      const response = await lojasService.update(editingLoja.id, formData);
      if (response.success) {
        toast({ title: 'Sucesso', description: 'Loja atualizada!' });
        loadLojas();
        closeDialog();
      } else {
        toast({
          title: 'Erro',
          description: response.error,
          variant: 'destructive',
        });
      }
    } else {
      const response = await lojasService.create({ ...formData, ativo: true });
      if (response.success) {
        toast({ title: 'Sucesso', description: 'Loja criada!' });
        loadLojas();
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

  const handleToggleStatus = async (loja: Loja) => {
    const response = await lojasService.toggleStatus(loja.id, !loja.ativo);
    if (response.success) {
      loadLojas();
    } else {
      toast({
        title: 'Erro',
        description: response.error,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) return;
    
    const response = await lojasService.delete(id);
    if (response.success) {
      toast({ title: 'Sucesso', description: 'Loja excluída!' });
      loadLojas();
    } else {
      toast({
        title: 'Erro',
        description: response.error,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (loja: Loja) => {
    setEditingLoja(loja);
    setFormData({ nome: loja.nome, endereco: loja.endereco || '' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingLoja(null);
    setFormData({ nome: '', endereco: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Lojas
          </h1>
          <p className="text-muted-foreground">Gerencie as unidades/lojas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Loja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLoja ? 'Editar Loja' : 'Nova Loja'}
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
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : lojas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma loja cadastrada. Conecte o backend PHP para começar.
                </TableCell>
              </TableRow>
            ) : (
              lojas.map((loja) => (
                <TableRow key={loja.id}>
                  <TableCell className="font-medium">{loja.nome}</TableCell>
                  <TableCell>{loja.endereco || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={loja.ativo}
                        onCheckedChange={() => handleToggleStatus(loja)}
                      />
                      <Badge variant={loja.ativo ? 'default' : 'secondary'}>
                        {loja.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(loja)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(loja.id)}
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
