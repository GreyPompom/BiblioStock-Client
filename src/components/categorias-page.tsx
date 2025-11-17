import { useState, useEffect } from 'react';
import { Categoria, HistoricoReajuste } from '../types';
import { getCategorias, saveCategorias, getProdutos, getHistoricoReajustes, saveHistoricoReajustes } from '../lib/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    tamanho: 'Médio' as const,
    tipoEmbalagem: 'Papelão' as const,
    percentualReajustePadrao: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCategorias(getCategorias());
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tamanho: 'Médio',
      tipoEmbalagem: 'Papelão',
      percentualReajustePadrao: 0,
    });
    setEditingCategoria(null);
  };

  const handleOpenDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nome: categoria.nome,
        tamanho: categoria.tamanho,
        tipoEmbalagem: categoria.tipoEmbalagem,
        percentualReajustePadrao: categoria.percentualReajustePadrao,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    const novaCategoria: Categoria = {
      id: editingCategoria?.id || Date.now().toString(),
      nome: formData.nome,
      tamanho: formData.tamanho,
      tipoEmbalagem: formData.tipoEmbalagem,
      percentualReajustePadrao: formData.percentualReajustePadrao,
    };

    // Verificar se o percentual foi alterado (ao editar) ou se é uma nova categoria com percentual diferente de 0
    const percentualAlterado = editingCategoria 
      ? editingCategoria.percentualReajustePadrao !== formData.percentualReajustePadrao
      : formData.percentualReajustePadrao !== 0;

    const updatedCategorias = editingCategoria
      ? categorias.map(c => c.id === editingCategoria.id ? novaCategoria : c)
      : [...categorias, novaCategoria];

    saveCategorias(updatedCategorias);
    setCategorias(updatedCategorias);

    // Registrar no histórico se o percentual foi alterado
    if (percentualAlterado) {
      const historico = getHistoricoReajustes();
      const novoHistorico: HistoricoReajuste = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        percentual: formData.percentualReajustePadrao,
        categoriaId: novaCategoria.id,
        categoriaNome: novaCategoria.nome,
      };
      const updatedHistorico = [novoHistorico, ...historico];
      saveHistoricoReajustes(updatedHistorico);
    }

    setIsDialogOpen(false);
    resetForm();
    toast.success(editingCategoria ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!');
  };

  const handleDelete = (id: string) => {
    // Verificar se existem produtos vinculados
    const produtos = getProdutos();
    const hasProducts = produtos.some(p => p.categoriaId === id);
    
    if (hasProducts) {
      toast.error('Não é possível excluir uma categoria vinculada a produtos');
      return;
    }
    
    setCategoriaToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoriaToDelete) {
      const updatedCategorias = categorias.filter(c => c.id !== categoriaToDelete);
      saveCategorias(updatedCategorias);
      setCategorias(updatedCategorias);
      toast.success('Categoria excluída com sucesso!');
    }
    setIsDeleteDialogOpen(false);
    setCategoriaToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Gerenciamento de Categorias</h2>
          <p className="text-muted-foreground">Configure as categorias de produtos da livraria</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="size-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Tipo de Embalagem</TableHead>
              <TableHead>Reajuste Padrão (%)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma categoria cadastrada
                </TableCell>
              </TableRow>
            ) : (
              categorias.map(categoria => (
                <TableRow key={categoria.id}>
                  <TableCell>{categoria.id}</TableCell>
                  <TableCell>{categoria.nome}</TableCell>
                  <TableCell>{categoria.tamanho}</TableCell>
                  <TableCell>{categoria.tipoEmbalagem}</TableCell>
                  <TableCell>{categoria.percentualReajustePadrao}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(categoria)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(categoria.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              Preencha as informações da categoria abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Categoria *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tamanho">Tamanho</Label>
              <Select value={formData.tamanho} onValueChange={(value: any) => setFormData({ ...formData, tamanho: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pequeno">Pequeno</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="embalagem">Tipo de Embalagem</Label>
              <Select value={formData.tipoEmbalagem} onValueChange={(value: any) => setFormData({ ...formData, tipoEmbalagem: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Papelão">Papelão</SelectItem>
                  <SelectItem value="Plástico">Plástico</SelectItem>
                  <SelectItem value="Vidro">Vidro</SelectItem>
                  <SelectItem value="Lata">Lata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reajuste">Reajuste Padrão (%)</Label>
              <Input
                id="reajuste"
                type="number"
                step="0.01"
                value={formData.percentualReajustePadrao}
                onChange={(e) => setFormData({ ...formData, percentualReajustePadrao: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}