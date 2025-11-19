import { useState, useEffect } from 'react';
import { Produto, Categoria, Autor } from '../types';
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

// Função para mapear produto do backend para frontend
const mapProdutoFromBackend = (produtoBackend: any): Produto => {
  console.log('Mapeando produto do backend:', produtoBackend); // Debug
  return {
    id: produtoBackend.id,
    nome: produtoBackend.name || produtoBackend.nome || '-',
    sku: produtoBackend.sku || '-',
    tipoProduto: produtoBackend.productType || produtoBackend.tipoProduto || 'Livro',
    precoUnitario: produtoBackend.price || produtoBackend.precoUnitario || 0,
    unidadeMedida: produtoBackend.unit || produtoBackend.unidadeMedida || 'unidade',
    quantidadeEstoque: produtoBackend.stockQty || produtoBackend.quantidadeEstoque || 0,
    quantidadeMinima: produtoBackend.minQty || produtoBackend.quantidadeMinima || 0,
    quantidadeMaxima: produtoBackend.maxQty || produtoBackend.quantidadeMaxima || 0,
    categoriaId: (produtoBackend.categoryId || produtoBackend.categoriaId)?.toString() || '',
    authorIds: (produtoBackend.authorIds || produtoBackend.authorIds || []).map((id: any) => id.toString()),
    editora: produtoBackend.publisher || produtoBackend.editora || '-',
    isbn: produtoBackend.isbn || '-'
  };
};

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
  const [filterTipoProduto, setFilterTipoProduto] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    tipoProduto: 'Livro',
    precoUnitario: '',
    unidadeMedida: 'unidade',
    quantidadeEstoque: '',
    quantidadeMinima: '',
    quantidadeMaxima: '',
    categoriaId: '',
    authorIds: [] as string[],
    editora: '',
    isbn: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProdutos();
  }, [produtos, searchTerm, filterCategoria, filterTipoProduto]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('Carregando dados...'); // Debug

      const produtosData = await fetchProdutos();
      console.log('Produtos recebidos:', produtosData); // Debug

      // Garantir que todos os produtos estão mapeados corretamente
      const produtosMapeados = produtosData.map((produto: any) => {
        // Se o produto já veio mapeado do fetchProdutos, use-o diretamente
        if (produto.nome && produto.sku !== undefined) {
          return produto;
        }
        // Caso contrário, mapeie
        return mapProdutoFromBackend(produto);
      });

      console.log('Produtos mapeados:', produtosMapeados); // Debug
      setProdutos(produtosMapeados);

      const categoriasRes = await api.get<Categoria[]>('/categories');
      setCategorias(categoriasRes.data);

      const autoresRes = await api.get<Autor[]>('/authors');
      setAutores(autoresRes.data);

    } catch (error) {
      toast.error('Erro ao carregar dados da API');
      console.error('Erro detalhado:', error);
    } finally {
      setIsLoading(false);
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
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.tipoProduto && p.tipoProduto.toLowerCase().includes(term)) ||
          autoresNomes.includes(term) ||
          (p.editora && p.editora.toLowerCase().includes(term)) ||
          (p.isbn && p.isbn.includes(term))
        );
      });
    }

    if (filterCategoria !== 'all') {
      filtered = filtered.filter(p => p.categoriaId === filterCategoria);
    }

    if (filterTipoProduto !== 'all') {
      filtered = filtered.filter(p => p.tipoProduto === filterTipoProduto);
    }

    setFilteredProdutos(filtered);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      sku: '',
      tipoProduto: 'Livro',
      precoUnitario: '',
      unidadeMedida: 'unidade',
      quantidadeEstoque: '',
      quantidadeMinima: '',
      quantidadeMaxima: '',
      categoriaId: '',
      authorIds: [],
      editora: '',
      isbn: ''
    });
    setEditingProduto(null);
  };

  const handleOpenDialog = (produto?: Produto) => {
    if (produto) {
      console.log('Editando produto:', produto); // Debug
      setEditingProduto(produto);
      setFormData({
        nome: produto.nome || '',
        sku: produto.sku || '',
        tipoProduto: produto.tipoProduto || 'Livro',
        precoUnitario: produto.precoUnitario?.toString() || '',
        unidadeMedida: produto.unidadeMedida || 'unidade',
        quantidadeEstoque: produto.quantidadeEstoque?.toString() || '',
        quantidadeMinima: produto.quantidadeMinima?.toString() || '',
        quantidadeMaxima: produto.quantidadeMaxima?.toString() || '',
        categoriaId: produto.categoriaId || '',
        authorIds: produto.authorIds || [],
        editora: produto.editora || '',
        isbn: produto.isbn || ''
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProdutoToDelete(id);
    setIsDeleteDialogOpen(true);
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

  const handleSave = async () => {

    try {
      // Validação de Nome do Produto (obrigatório)
      if (!formData.nome || formData.nome.trim() === '') {
        toast.error('O nome do produto é obrigatório.');
        return;
      }

      // Validação de SKU (obrigatório)
      if (!formData.sku || formData.sku.trim() === '') {
        toast.error('O SKU é obrigatório.');
        return;
      }

      // Validação de ISBN (obrigatório)
      if (!formData.isbn || formData.isbn.trim() === '') {
        toast.error('O ISBN é obrigatório.');
        return;
      }

      // Validação de Tipo de Produto (obrigatório)
      if (!formData.tipoProduto || formData.tipoProduto.trim() === '') {
        toast.error('O tipo de produto é obrigatório.');
        return;
      }

      // Validação de Categoria (obrigatório)
      if (!formData.categoriaId) {
        toast.error('A categoria é obrigatória.');
        return;
      }

      // Validação de Autores (obrigatório)
      if (formData.authorIds.length === 0) {
        toast.error('Selecione pelo menos um autor.');
        return;
      }

      // Validação de Preço (obrigatório e > 0)
      if (!formData.precoUnitario || formData.precoUnitario.trim() === '') {
        toast.error('O preço é obrigatório.');
        return;
      }
      const preco = parseFloat(formData.precoUnitario);
      if (isNaN(preco) || preco <= 0) {
        toast.error('O preço deve ser maior que zero.');
        return;
      }

      // Validação de Quantidade em Estoque (obrigatório e >= 0)
      const estoqueStr = formData.quantidadeEstoque.trim();
      if (estoqueStr === '') {
        toast.error('A quantidade em estoque é obrigatória.');
        return;
      }
      const estoque = parseInt(estoqueStr);
      if (isNaN(estoque) || estoque < 0) {
        toast.error('A quantidade em estoque não pode ser negativa.');
        return;
      }
      if (estoque > 99999) {
        toast.error('A quantidade em estoque não pode ter mais de 5 dígitos.');
        return;
      }

      // Validação de Quantidade Mínima (obrigatório e > 0)
      const minimaStr = formData.quantidadeMinima.trim();
      if (minimaStr === '') {
        toast.error('A quantidade mínima é obrigatória.');
        return;
      }
      const minima = parseInt(minimaStr);
      if (isNaN(minima) || minima <= 0) {
        toast.error('A quantidade mínima deve ser maior que zero.');
        return;
      }
      if (minima > 99999) {
        toast.error('A quantidade mínima não pode ter mais de 5 dígitos.');
        return;
      }

      // Validação de Quantidade Máxima (opcional, mas se preenchido deve ser válido)
      let maxima = 0;
      const maximaStr = formData.quantidadeMaxima.trim();
      if (maximaStr !== '') {
        maxima = parseInt(maximaStr);
        if (isNaN(maxima) || maxima < 0) {
          toast.error('A quantidade máxima não pode ser negativa.');
          return;
        }
        if (maxima > 99999) {
          toast.error('A quantidade máxima não pode ter mais de 5 dígitos.');
          return;
        }
      }

      // payload CORRETO baseado na estrutura do seu backend
      const payload = {
        name: formData.nome,
        sku: formData.sku || undefined, // Mude de null para undefined
        productType: formData.tipoProduto || 'Livro',
        price: preco,
        unit: formData.unidadeMedida || 'unidade',
        stockQty: estoque,
        minQty: minima,
        maxQty: maxima,
        categoryId: Number(formData.categoriaId), // O backend espera categoryId, não categoriaId
        authorIds: formData.authorIds.map(id => Number(id)),
        publisher: formData.editora || undefined, // Mude de null para undefined
        isbn: formData.isbn || undefined // Mude de null para undefined
      };

      console.log('Enviando payload:', payload); // Debug

      if (editingProduto) {
        const res = await api.put(`/products/${editingProduto.id}`, payload);
        console.log('Resposta da edição:', res.data); // Debug

        // Use a função de mapeamento
        const updatedProduto = mapProdutoFromBackend(res.data);

        setProdutos(prev =>
          prev.map(p => (p.id === editingProduto.id ? updatedProduto : p))
        );
        toast.success('Produto atualizado com sucesso!');
      }
      else {
        // criar
        const res = await api.post('/products', payload);
        console.log('Resposta da criação:', res.data); // Debug
        // Mapeie a resposta do backend
        const novoProduto = mapProdutoFromBackend(res.data);
        setProdutos(prev => [...prev, novoProduto]);
        toast.success('Produto criado com sucesso!');
      }

      // fecha modal e reseta formulário
      setIsDialogOpen(false);
      resetForm();

    } catch (error: any) {
      if (error.response) {
        console.error('API error:', error.response.data);
        toast.error('Erro ao salvar produto: ' + (error.response.data?.message || 'Verifique os campos'));
      } else {
        console.error(error);
        toast.error('Erro ao salvar produto');
      }
    }
  };

  const getCategoriaNome = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nome || 'N/A';
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
        <Select value={filterTipoProduto} onValueChange={setFilterTipoProduto}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo de produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Livro">Livro</SelectItem>
            <SelectItem value="Revista">Revista</SelectItem>
            <SelectItem value="Jornal">Jornal</SelectItem>
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
                <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map(produto => (
                <TableRow key={produto.id}>
                  <TableCell>{produto.sku || '-'}</TableCell>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell>{produto.isbn || '-'}</TableCell>
                  <TableCell>{produto.tipoProduto || '-'}</TableCell>
                  <TableCell>{getAutoresNomes(produto.authorIds)}</TableCell>
                  <TableCell>{produto.editora || '-'}</TableCell>
                  <TableCell>{getCategoriaNome(produto.categoriaId)}</TableCell>
                  <TableCell>R$ {produto.precoUnitario.toFixed(2)}</TableCell>
                  <TableCell>{produto.unidadeMedida || '-'}</TableCell>
                  <TableCell>
                    {produto.quantidadeEstoque}
                    {produto.quantidadeEstoque < produto.quantidadeMinima && (
                      <AlertTriangle className="ml-1 inline size-4 text-orange-500" />
                    )}
                  </TableCell>
                  <TableCell>{produto.quantidadeMinima}</TableCell>
                  <TableCell>{produto.quantidadeMaxima || '-'}</TableCell>
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
                maxLength={200}
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  maxLength={50}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: LIV-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipoProduto">Tipo de Produto *</Label>
                <Select value={formData.tipoProduto} onValueChange={(value) => setFormData({ ...formData, tipoProduto: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Livro">Livro</SelectItem>
                    <SelectItem value="Revista">Revista</SelectItem>
                    <SelectItem value="Jornal">Jornal</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  maxLength={100}
                  value={formData.editora}
                  onChange={(e) => setFormData({ ...formData, editora: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  maxLength={20}
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
                  maxLength={20}
                  value={formData.unidadeMedida}
                  onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value })}
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
                <Label htmlFor="minima">Qtd. Mínima *</Label>
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

export default ProdutosPage;