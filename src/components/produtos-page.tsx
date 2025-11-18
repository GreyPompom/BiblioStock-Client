import { useState, useEffect } from 'react';
import { Produto, Categoria, Autor } from '../types';
import { getProdutos, saveProdutos, getCategorias, getAutores } from '../lib/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { fetchProdutos } from '../lib/api/productsApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, AlertTriangle, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';
import api from '../lib/api';

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [autores, setAutores] = useState<Autor[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');

  const [formData, setFormData] = useState({
    nome: '',
    precoUnitario: '',
    unidadeMedida: 'unidade',
    quantidadeEstoque: '',
    quantidadeMinima: '',
    quantidadeMaxima: '',
    categoriaId: '',
    authorIds: [] as string[],
    editora: '',
    isbn: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProdutos();
  }, [produtos, searchTerm, filterCategoria]);

  const loadData = async () => {
    try {
      const produtosData = await fetchProdutos();
      setProdutos(produtosData);
      // Se você tiver endpoints para categorias e autores:
      const categoriasRes = await api.get<Categoria[]>('/categories');
      setCategorias(categoriasRes.data);
      const autoresRes = await api.get<Autor[]>('/authors');
      setAutores(autoresRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados da API');
      console.error(error);
    }
  };

  const filterProdutos = () => {
    let filtered = [...produtos];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const autoresNomes = getAutoresNomes(p.authorIds).toLowerCase();
        return (
          p.nome.toLowerCase().includes(term) ||
          autoresNomes.includes(term) ||
          p.editora.toLowerCase().includes(term) ||
          p.isbn.includes(term)
        );
      });
    }

    if (filterCategoria !== 'all') {
      filtered = filtered.filter(p => p.categoriaId === filterCategoria);
    }

    setFilteredProdutos(filtered);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      precoUnitario: '',
      unidadeMedida: 'unidade',
      quantidadeEstoque: '',
      quantidadeMinima: '',
      quantidadeMaxima: '',
      categoriaId: '',
      authorIds: [],
      editora: '',
      isbn: '',
    });
    setEditingProduto(null);
  };

  const handleOpenDialog = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        nome: produto.nome,
        precoUnitario: produto.precoUnitario.toString(),
        unidadeMedida: produto.unidadeMedida,
        quantidadeEstoque: produto.quantidadeEstoque.toString(),
        quantidadeMinima: produto.quantidadeMinima.toString(),
        quantidadeMaxima: produto.quantidadeMaxima.toString(),
        categoriaId: produto.categoriaId,
        authorIds: produto.authorIds || [],
        editora: produto.editora,
        isbn: produto.isbn,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.categoriaId || !formData.precoUnitario) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // RN006: Cada livro deve ter pelo menos um autor associado
    if (formData.authorIds.length === 0) {
      toast.error('Selecione pelo menos um autor para o livro');
      return;
    }

    // Validações de quantidade
    const estoque = parseInt(formData.quantidadeEstoque) || 0;
    const minima = parseInt(formData.quantidadeMinima) || 0;
    const maxima = parseInt(formData.quantidadeMaxima) || 0;

    if (estoque < 0 || minima < 0 || maxima < 0) {
      toast.error('As quantidades não podem ser menores que zero');
      return;
    }

    if (estoque > 99999 || minima > 99999 || maxima > 99999) {
      toast.error('As quantidades não podem ter mais de 5 dígitos');
      return;
    }

    const novoProduto: Produto = {
      id: editingProduto?.id || Date.now().toString(),
      nome: formData.nome,
      precoUnitario: parseFloat(formData.precoUnitario),
      unidadeMedida: formData.unidadeMedida,
      quantidadeEstoque: parseInt(formData.quantidadeEstoque) || 0,
      quantidadeMinima: parseInt(formData.quantidadeMinima) || 0,
      quantidadeMaxima: parseInt(formData.quantidadeMaxima) || 0,
      categoriaId: formData.categoriaId,
      authorIds: formData.authorIds,
      editora: formData.editora,
      isbn: formData.isbn,
      dataCadastro: editingProduto?.dataCadastro || new Date().toISOString(),
    };

    try {
      if (editingProduto) {
        await api.put(`/products/${editingProduto.id}`, novoProduto);
        setProdutos(prev => prev.map(p => p.id === editingProduto.id ? novoProduto : p));
        toast.success('Produto atualizado com sucesso!');
      } else {
        const res = await api.post('/products', novoProduto);
        setProdutos(prev => [...prev, res.data]);
        toast.success('Produto cadastrado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error(error);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const confirmDelete = async () => {
    if (!produtoToDelete) return;

    try {
      await api.delete(`/products/${produtoToDelete}`);
      setProdutos(prev => prev.filter(p => p.id !== produtoToDelete));
      toast.success('Produto excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir produto');
      console.error(error);
    }

    setIsDeleteDialogOpen(false);
    setProdutoToDelete(null);
  };

  const getCategoriaNome = (categoriaId: string) => {
    return categorias.find(c => c.id === categoriaId)?.nome || 'N/A';
  };

  // RN009: Exibir múltiplos autores separados por vírgula
  const getAutoresNomes = (authorIds: string[]) => {
    if (!authorIds || authorIds.length === 0) return 'Nenhum autor';
    return authorIds
      .map(id => autores.find(a => a.id === id)?.nomeCompleto || 'Desconhecido')
      .join(', ');
  };

  const getStatusBadge = (produto: Produto) => {
    if (produto.quantidadeEstoque === 0) {
      return <Badge variant="destructive">Indisponível</Badge>;
    }
    if (produto.quantidadeEstoque < produto.quantidadeMinima) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Estoque Baixo</Badge>;
    }
    if (produto.quantidadeEstoque > produto.quantidadeMaxima) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Excedente</Badge>;
    }
    return <Badge variant="secondary">Normal</Badge>;
  };

  const toggleAuthor = (authorId: string) => {
    const newAuthorIds = formData.authorIds.includes(authorId)
      ? formData.authorIds.filter(id => id !== authorId)
      : [...formData.authorIds, authorId];
    setFormData({ ...formData, authorIds: newAuthorIds });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Gerenciamento de Produtos</h2>
          <p className="text-muted-foreground">Cadastre e gerencie o estoque de livros e itens da livraria</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="size-4" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, autor, editora ou ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Autor(es)</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map(produto => (
                <TableRow key={produto.id}>
                  <TableCell>{produto.id}</TableCell>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell>{getAutoresNomes(produto.authorIds)}</TableCell>
                  <TableCell>{getCategoriaNome(produto.categoriaId)}</TableCell>
                  <TableCell>R$ {produto.precoUnitario.toFixed(2)}</TableCell>
                  <TableCell>
                    {produto.quantidadeEstoque}
                    {produto.quantidadeEstoque < produto.quantidadeMinima && (
                      <AlertTriangle className="ml-1 inline size-4 text-orange-500" />
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(produto)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(produto)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(produto.id)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              Preencha as informações do produto abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            {/* Seleção Múltipla de Autores */}
            <div className="grid gap-2">
              <Label>Autores * (selecione pelo menos um)</Label>
              {autores.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum autor cadastrado. Cadastre autores primeiro.
                </p>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  {autores.map(autor => (
                    <div key={autor.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`autor-${autor.id}`}
                        checked={formData.authorIds.includes(autor.id)}
                        onCheckedChange={() => toggleAuthor(autor.id)}
                      />
                      <Label
                        htmlFor={`autor-${autor.id}`}
                        className="cursor-pointer"
                      >
                        {autor.nomeCompleto} - {autor.nacionalidade}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {formData.authorIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.authorIds.map(id => {
                    const autor = autores.find(a => a.id === id);
                    return autor ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {autor.nomeCompleto}
                        <button
                          type="button"
                          onClick={() => toggleAuthor(id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editora">Editora</Label>
                <Input
                  id="editora"
                  value={formData.editora}
                  onChange={(e) => setFormData({ ...formData, editora: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formData.categoriaId} onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="preco">Preço Unitário *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precoUnitario}
                  onChange={(e) => setFormData({ ...formData, precoUnitario: e.target.value })}
                  onBlur={(e) => {
                    const num = parseFloat(e.target.value) || 0;
                    if (num < 0) {
                      toast.error('Preço não pode ser menor que zero');
                      setFormData({ ...formData, precoUnitario: '0' });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidade">Unidade de Medida</Label>
                <Input
                  id="unidade"
                  value={formData.unidadeMedida}
                  onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estoque">Qtd. Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  min="0"
                  max="99999"
                  value={formData.quantidadeEstoque}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (/^\d+$/.test(value) && value.length <= 5)) {
                      setFormData({ ...formData, quantidadeEstoque: value });
                    }
                  }}
                  onBlur={(e) => {
                    const num = parseInt(e.target.value) || 0;
                    if (num < 0) {
                      toast.error('Quantidade em estoque não pode ser menor que zero');
                      setFormData({ ...formData, quantidadeEstoque: '0' });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minima">Qtd. Mínima</Label>
                <Input
                  id="minima"
                  type="number"
                  min="0"
                  max="99999"
                  value={formData.quantidadeMinima}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (/^\d+$/.test(value) && value.length <= 5)) {
                      setFormData({ ...formData, quantidadeMinima: value });
                    }
                  }}
                  onBlur={(e) => {
                    const num = parseInt(e.target.value) || 0;
                    if (num < 0) {
                      toast.error('Quantidade mínima não pode ser menor que zero');
                      setFormData({ ...formData, quantidadeMinima: '0' });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxima">Qtd. Máxima</Label>
                <Input
                  id="maxima"
                  type="number"
                  min="0"
                  max="99999"
                  value={formData.quantidadeMaxima}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (/^\d+$/.test(value) && value.length <= 5)) {
                      setFormData({ ...formData, quantidadeMaxima: value });
                    }
                  }}
                  onBlur={(e) => {
                    const num = parseInt(e.target.value) || 0;
                    if (num < 0) {
                      toast.error('Quantidade máxima não pode ser menor que zero');
                      setFormData({ ...formData, quantidadeMaxima: '0' });
                    }
                  }}
                />
              </div>
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
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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