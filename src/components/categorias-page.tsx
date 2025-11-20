import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

import type { CategoryRequestDTO, CategoryResponseDTO, CategoryFormData } from '../types/Category.dto';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../lib/api/categoryApi';

const mapFormToRequestDto = (form: CategoryFormData): CategoryRequestDTO => ({
  name: form.nome,
  size: form.tamanho,
  packagingType: form.tipoEmbalagem,
  defaultAdjustmentPercent: form.percentualReajustePadrao,
});

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoryResponseDTO[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<CategoryResponseDTO[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<number | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<CategoryResponseDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    nome: '',
    tamanho: '',
    tipoEmbalagem: '',
    percentualReajustePadrao: 0,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const apiCategorias = await getCategories();
      setCategorias(apiCategorias);
      setFilteredCategorias(apiCategorias);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar categorias do servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...categorias];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          c.size.toLowerCase().includes(term)
      );
    }
    setFilteredCategorias(filtered);
  }, [searchTerm, categorias]);

  const resetForm = () => {
    setFormData({
      nome: '',
      tamanho: '',
      tipoEmbalagem: '',
      percentualReajustePadrao: 0,
    });
    setEditingCategoria(null);
  };

  const handleOpenDialog = (categoria?: CategoryResponseDTO) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nome: categoria.name,
        tamanho: categoria.size,
        tipoEmbalagem: categoria.packagingType,
        percentualReajustePadrao: categoria.defaultAdjustmentPercent,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Preencha o nome da categoria.');
      return;
    }

    const payload: CategoryRequestDTO = mapFormToRequestDto(formData);

    try {
      setIsLoading(true);

      if (editingCategoria) {
        const updated = await updateCategory(editingCategoria.id, payload);
        setCategorias(prev => prev.map(c => c.id === editingCategoria.id ? updated : c));
        toast.success('Categoria atualizada com sucesso!');
      } else {
        const created = await createCategory(payload);
        setCategorias(prev => [...prev, created]);
        toast.success('Categoria cadastrada com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar categoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setCategoriaToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoriaToDelete == null) return;

    try {
      setIsLoading(true);
      await deleteCategory(categoriaToDelete);
      setCategorias(prev => prev.filter(c => c.id !== categoriaToDelete));
      toast.success('Categoria excluída com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir categoria.');
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoriaToDelete(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Gerenciamento de Categorias</h2>
          <p className="text-muted-foreground">Cadastre e gerencie as categorias de produtos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={isLoading}>
          <Plus className="size-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou tamanho..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Tipo de Embalagem</TableHead>
              <TableHead>Reajuste (%)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCategorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma categoria encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCategorias.map(categoria => (
                <TableRow key={categoria.id}>
                  <TableCell>{categoria.id}</TableCell>
                  <TableCell>{categoria.name}</TableCell>
                  <TableCell>{categoria.size}</TableCell>
                  <TableCell>{categoria.packagingType}</TableCell>
                  <TableCell>{categoria.defaultAdjustmentPercent}%</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(categoria)}
                        disabled={isLoading}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(categoria.id)}
                        disabled={isLoading}
                      >
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

      {/* Modal Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>Preencha as informações da categoria abaixo</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tamanho</Label>
              <Select value={formData.tamanho} onValueChange={(value: any) => setFormData({ ...formData, tamanho: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pequeno">Pequeno</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tipo de Embalagem</Label>
              <Select
                value={formData.tipoEmbalagem}
                onValueChange={(value: any) => setFormData({ ...formData, tipoEmbalagem: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Papelão">Papelão</SelectItem>
                  <SelectItem value="Plástico">Plástico</SelectItem>
                  <SelectItem value="Vidro">Vidro</SelectItem>
                  <SelectItem value="Lata">Lata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Reajuste Padrão (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.percentualReajustePadrao}
                onChange={e =>
                  setFormData({
                    ...formData,
                    percentualReajustePadrao: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
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
