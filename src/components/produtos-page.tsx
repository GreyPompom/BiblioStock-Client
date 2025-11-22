// src/components/ProdutosPage.tsx
import { useState, useEffect, type SetStateAction } from 'react';
import type {  AuthorResponseDTO } from '../types/authors.dto';
import type { CategoryResponseDTO } from '../types/Category.dto';
import type {
  ProductRequestDTO,
  ProductResponseDTO,
  ProductFormData,
} from '../types/products.dto';
import { createEmptyProductFormData } from '../types/products.dto';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Plus, Pencil, Trash2, Search, AlertTriangle, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../lib/api/productsApi';
import { getAuthors } from '../lib/api/authorsApi';
import { getCategories } from '../lib/api/categoryApi';

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProductResponseDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoryResponseDTO[]>([]);
  const [autores, setAutores] = useState<AuthorResponseDTO[]>([]);
  const [filteredProdutos, setFilteredProdutos] =
    useState<ProductResponseDTO[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<number | null>(null);
  const [editingProduto, setEditingProduto] =
    useState<ProductResponseDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterTipoProduto, setFilterTipoProduto] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>(
    createEmptyProductFormData(),
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProdutos();
  }, [produtos, searchTerm, filterCategoria, filterTipoProduto]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const produtosDto = await getProducts();
      setProdutos(produtosDto);

      const categoriasDto = await getCategories();
      setCategorias(categoriasDto);

      const autoresDto = await getAuthors();
      setAutores(autoresDto);
    } catch (error) {
      toast.error('Erro ao carregar dados da API');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProdutos = () => {
    let filtered = [...produtos];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const autoresNomes = (p.authors ?? [])
          .map(a => a.fullName)
          .join(', ')
          .toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.productType && p.productType.toLowerCase().includes(term)) ||
          autoresNomes.includes(term) ||
          (p.publisher && p.publisher.toLowerCase().includes(term)) ||
          (p.isbn && p.isbn.includes(term))
        );
      });
    }

    if (filterCategoria !== 'all') {
      filtered = filtered.filter(
        p => p.category && String(p.category.id) === filterCategoria,
      );
    }

    if (filterTipoProduto !== 'all') {
      filtered = filtered.filter(p => p.productType === filterTipoProduto);
    }

    setFilteredProdutos(filtered);
  };

  const resetForm = () => {
    setFormData(createEmptyProductFormData());
    setEditingProduto(null);
  };

  const handleOpenDialog = (produto?: ProductResponseDTO) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        nome: produto.name || '',
        sku: produto.sku || '',
        tipoProduto: produto.productType || 'Livro',
        precoUnitario: produto.price.toString(),
        unidadeMedida: produto.unit || 'unidade',
        quantidadeEstoque: produto.stockQty?.toString() || '',
        quantidadeMinima: produto.minQty?.toString() || '',
        quantidadeMaxima: produto.maxQty?.toString() || '',
        categoriaId: produto.category ? String(produto.category.id) : '',
        authorIds: (produto.authors ?? []).map(a => String(a.id)),
        editora: produto.publisher || '',
        isbn: produto.isbn || '',
        precoComPercentualReajuste: produto.priceWithPercent.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setProdutoToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (produtoToDelete == null) return;

    try {
      await deleteProduct(produtoToDelete);
      setProdutos(prev => prev.filter(p => p.id !== produtoToDelete));
      toast.success('Produto excluído com sucesso!');
    } catch (error: any) {
      if (error.response) {
        const errorMessage = extractBackendErrorMessage(error.response.data);
        toast.error(errorMessage);
      } else {
        toast.error('Erro ao excluir produto.');
      }
      console.error(error);
    } finally {
      setIsDeleteDialogOpen(false);
      setProdutoToDelete(null);
    }
  };

  const handleSave = async () => {
    try {
      const estoque = parseInt(formData.quantidadeEstoque) || 0;
      const minima = parseInt(formData.quantidadeMinima) || 0;
      const maxima = formData.quantidadeMaxima
        ? parseInt(formData.quantidadeMaxima)
        : 0;
      const preco = parseFloat(formData.precoUnitario) || 0;

      if (
        !formData.nome ||
        !formData.sku ||
        !formData.categoriaId ||
        !formData.isbn
      ) {
        toast.error('Preencha todos os campos obrigatórios (*).');
        return;
      }

      if (!formData.authorIds.length) {
        toast.error('Selecione pelo menos um autor.');
        return;
      }

      const payload: ProductRequestDTO = {
        name: formData.nome.trim(),
        sku: formData.sku.trim(),
        productType: formData.tipoProduto || 'Livro',
        price: preco,
        unit: formData.unidadeMedida || 'unidade',
        stockQty: estoque,
        minQty: minima,
        maxQty: maxima || null,
        categoryId: Number(formData.categoriaId),
        authorIds: formData.authorIds.map(id => Number(id)),
        publisher: formData.editora ? formData.editora.trim() : null,
        isbn: formData.isbn.trim(),
      };

      if (editingProduto) {
        const updatedDto = await updateProduct(editingProduto.id, payload);
        setProdutos(prev =>
          prev.map(p => (p.id === editingProduto.id ? updatedDto : p)),
        );
        toast.success('Produto atualizado com sucesso!');
      } else {
        const createdDto = await createProduct(payload);
        setProdutos(prev => [...prev, createdDto]);
        toast.success('Produto criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      if (error.response) {
        console.error('API error:', error.response.data);
        const errorMessage = extractBackendErrorMessage(error.response.data);
        toast.error(errorMessage);
      } else {
        console.error(error);
        toast.error('Erro ao salvar produto.');
      }
    }
  };

  const extractBackendErrorMessage = (errorData: any): string => {
    if (typeof errorData === 'string') return errorData;
    if (errorData.error) return errorData.error;
    if (errorData.message) return errorData.message;
    if (errorData.details) return errorData.details;

    if (Array.isArray(errorData.errors)) {
      const messages = errorData.errors.map((err: any) =>
        err.defaultMessage || err.message || err.field || 'Erro de validação',
      );
      return messages.join(', ');
    }

    if (typeof errorData === 'object') {
      const messages = Object.values(errorData).filter(
        msg => typeof msg === 'string',
      );
      if (messages.length > 0) return messages.join(', ');
    }

    return 'Erro ao processar a solicitação. Tente novamente.';
  };

  const getStatusBadge = (produto: ProductResponseDTO) => {
    if (produto.stockQty === 0) {
      return <Badge variant="destructive">Indisponível</Badge>;
    }
    if (produto.stockQty < produto.minQty) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">
          Estoque Baixo
        </Badge>
      );
    }
    if (produto.stockQty > produto.maxQty) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">Excedente</Badge>
      );
    }
    return <Badge variant="secondary">Normal</Badge>;
  };

  const toggleAuthor = (authorId: string) => {
    const newAuthorIds = formData.authorIds.includes(authorId)
      ? formData.authorIds.filter(id => id !== authorId)
      : [...formData.authorIds, authorId];
    setFormData({ ...formData, authorIds: newAuthorIds });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Gerenciamento de Produtos</h2>
          <p className="text-muted-foreground">
            Cadastre e gerencie o estoque de livros e itens da livraria
          </p>
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
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterCategoria}
          onValueChange={(value: SetStateAction<string>) => setFilterCategoria(value)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterTipoProduto}
          onValueChange={(value: SetStateAction<string>) => setFilterTipoProduto(value)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo de produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Livro">Livro</SelectItem>
            <SelectItem value="Revista">Revista</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Autor(es)</TableHead>
              <TableHead>Editora</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>W %</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Qtd. Estoque</TableHead>
              <TableHead>Qtd. Mínima</TableHead>
              <TableHead>Qtd. Máxima</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={15}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map(produto => (
                <TableRow key={produto.id}>
                  <TableCell>{produto.sku || '-'}</TableCell>
                  <TableCell>{produto.name}</TableCell>
                  <TableCell>{produto.isbn || '-'}</TableCell>
                  <TableCell>{produto.productType || '-'}</TableCell>
                  <TableCell>
                    {produto.authors.length === 0
                      ? 'Nenhum autor'
                      : produto.authors.map(a => a.fullName).join(', ')}
                  </TableCell>
                  <TableCell>{produto.publisher || '-'}</TableCell>
                  <TableCell>{produto.category?.name ?? 'N/A'}</TableCell>
                  <TableCell>R$ {produto.price.toFixed(2)}</TableCell>
                  <TableCell>
                    R$ {produto.priceWithPercent?.toFixed(2) ?? 0}
                  </TableCell>
                  <TableCell>{produto.unit || '-'}</TableCell>
                  <TableCell>
                    {produto.stockQty}
                    {produto.stockQty < produto.minQty && (
                      <AlertTriangle className="ml-1 inline size-4 text-orange-500" />
                    )}
                  </TableCell>
                  <TableCell>{produto.minQty}</TableCell>
                  <TableCell>{produto.maxQty || '-'}</TableCell>
                  <TableCell>{getStatusBadge(produto)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(produto)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(produto.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do produto abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                maxLength={200}
                value={formData.nome}
                onChange={e =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  maxLength={50}
                  value={formData.sku}
                  onChange={e =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Ex: SKU-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipoProduto">Tipo de Produto *</Label>
                <Select
                  value={formData.tipoProduto}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, tipoProduto: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Livro">Livro</SelectItem>
                    <SelectItem value="Revista">Revista</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Autores * (selecione pelo menos um)</Label>
              {autores.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum autor cadastrado. Cadastre autores primeiro.
                </p>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  {autores.map(autor => {
                    const autorIdStr = String(autor.id);
                    const checked = formData.authorIds.includes(autorIdStr);
                    return (
                      <div key={autor.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`autor-${autor.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleAuthor(autorIdStr)}
                        />
                        <Label
                          htmlFor={`autor-${autor.id}`}
                          className="cursor-pointer"
                        >
                          {autor.fullName} - {autor.nationality}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
              {formData.authorIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.authorIds.map(idStr => {
                    const autor = autores.find(a => a.id === Number(idStr));
                    return autor ? (
                      <Badge key={idStr} variant="secondary" className="gap-1">
                        {autor.fullName}
                        <button
                          type="button"
                          onClick={() => toggleAuthor(idStr)}
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
                  maxLength={100}
                  value={formData.editora}
                  onChange={e =>
                    setFormData({ ...formData, editora: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  maxLength={20}
                  value={formData.isbn}
                  onChange={e =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoriaId}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, categoriaId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
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
                  onChange={e =>
                    setFormData({
                      ...formData,
                      precoUnitario: e.target.value,
                    })
                  }
                  onBlur={e => {
                    const num = parseFloat(e.target.value) || 0;
                    if (num < 0) {
                      toast.error('Preço não pode ser menor que zero');
                      setFormData({
                        ...formData,
                        precoUnitario: '0',
                      });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidade">Unidade de Medida</Label>
                <Input
                  id="unidade"
                  maxLength={20}
                  value={formData.unidadeMedida}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      unidadeMedida: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estoque">Qtd. Estoque *</Label>
                <Input
                  id="estoque"
                  type="number"
                  min="0"
                  max="99999"
                  value={formData.quantidadeEstoque}
                  onChange={e => {
                    const value = e.target.value;
                    if (
                      value === '' ||
                      (/^\d+$/.test(value) && value.length <= 5)
                    ) {
                      setFormData({
                        ...formData,
                        quantidadeEstoque: value,
                      });
                    }
                  }}
                  onBlur={e => {
                    const num = parseInt(e.target.value) || 0;
                    if (num < 0) {
                      toast.error(
                        'Quantidade em estoque não pode ser menor que zero',
                      );
                      setFormData({
                        ...formData,
                        quantidadeEstoque: '0',
                      });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minima">Qtd. Mínima *</Label>
                <Input
                  id="minima"
                  type="number"
                  min="0"
                  max="99999"
                  value={formData.quantidadeMinima}
                  onChange={e => {
                    const value = e.target.value;
                    if (
                      value === '' ||
                      (/^\d+$/.test(value) && value.length <= 5)
                    ) {
                      setFormData({
                        ...formData,
                        quantidadeMinima: value,
                      });
                    }
                  }}
                  onBlur={e => {
                    const num = parseInt(e.target.value) || 0;
                    if (num < 0) {
                      toast.error(
                        'Quantidade mínima não pode ser menor que zero',
                      );
                      setFormData({
                        ...formData,
                        quantidadeMinima: '0',
                      });
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
                  onChange={e => {
                    const value = e.target.value;
                    if (
                      value === '' ||
                      (/^\d+$/.test(value) && value.length <= 5)
                    ) {
                      setFormData({
                        ...formData,
                        quantidadeMaxima: value,
                      });
                    }
                  }}
                  onBlur={e => {
                    const num = parseInt(e.target.value) || 0;
                    if (num < 0) {
                      toast.error(
                        'Quantidade máxima não pode ser menor que zero',
                      );
                      setFormData({
                        ...formData,
                        quantidadeMaxima: '0',
                      });
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
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProdutosPage;
