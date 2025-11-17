import { useState, useEffect } from 'react';
//import type { Movimentacao, Produto, TipoMovimentacao } from '../types';
//import { getMovimentacoes, saveMovimentacoes, getProdutos, saveProdutos } from '../lib/storage';

import type { MovimentacaoUI, MovementFormData  } from '../types/movements.dto';
import type { Produto, TipoMovimentacao } from '../types';
import { getProdutos, saveProdutos } from '../lib/storage';
import { fetchAllMovements, createMovement  } from '../lib/api/movementsApi';
import { mapMovementApiToUi } from '../lib/mappers/movementMapper';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';

export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoUI[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const [formData, setFormData] = useState<MovementFormData>({
    produtoId: '',
    quantidade: '',
    tipo: 'Entrada',
    observacao: '',
  });

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
    const apiMovements = await fetchAllMovements();
    console.log('apiMovements:', apiMovements); // ajuda a debugar formato

    if (!Array.isArray(apiMovements)) {
      console.error('Movimentações não vieram como array:', apiMovements);
      setLoadError('Formato de dados de movimentações inválido.');
      return;
    }

      const uiMovements = apiMovements
        .map(mapMovementApiToUi)
        .sort(
          (a, b) =>
            new Date(b.data).getTime() - new Date(a.data).getTime(),
        );

      setMovimentacoes(uiMovements);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      setLoadError('Não foi possível carregar as movimentações. Tente novamente mais tarde.');
      toast.error('Erro ao carregar movimentações de estoque.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      produtoId: '',
      quantidade: '',
      tipo: 'Entrada',
      observacao: '',
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.produtoId || !formData.quantidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const quantidade = parseInt(formData.quantidade, 10);

    // Validações de quantidade
    if (quantidade < 0) {
      toast.error('A quantidade não pode ser menor que zero');
      return;
    }

    if (quantidade > 99999) {
      toast.error('A quantidade não pode ter mais de 5 dígitos');
      return;
    }

    if (Number.isNaN(quantidade) || quantidade === 0) {
      toast.error('Digite uma quantidade válida maior que zero');
      return;
    }

    const produto = produtos.find(p => p.id === formData.produtoId);

    if (!produto) {
      toast.error('Produto não encontrado');
      return;
    }

    // Validar estoque para saída (ainda usando estoque local enquanto produto não vem da API)
    if (formData.tipo === 'Saída' && produto.quantidadeEstoque < quantidade) {
      toast.error('Quantidade insuficiente em estoque');
      return;
    }

    try {
      setIsSaving(true);

      // Chama a API para registrar a movimentação
      const movementCreatedApi = await createMovement({
        productId: formData.produtoId,
        quantity: quantidade,
        type: formData.tipo === 'Entrada' ? 'ENTRADA' : 'SAIDA',
        observation: formData.observacao || undefined,
      });

      const movementCreatedUi = mapMovementApiToUi(movementCreatedApi);

      // Atualizar estoque do produto LOCALMENTE (até migrar produtos para API)
      const novoEstoque =
        formData.tipo === 'Entrada'
          ? produto.quantidadeEstoque + quantidade
          : produto.quantidadeEstoque - quantidade;

      const produtosAtualizados = produtos.map(p =>
        p.id === formData.produtoId
          ? { ...p, quantidadeEstoque: novoEstoque }
          : p,
      );

      // Verificar alertas de estoque
      if (novoEstoque < produto.quantidadeMinima) {
        toast.warning(`Atenção: Estoque de "${produto.nome}" abaixo do mínimo!`, {
          duration: 5000,
        });
      } else if (novoEstoque > produto.quantidadeMaxima) {
        toast.warning(`Atenção: Estoque de "${produto.nome}" acima do máximo!`, {
          duration: 5000,
        });
      }

      // Atualizar estado local com a nova movimentação (já vinda da API)
      setMovimentacoes(prev => [movementCreatedUi, ...prev]);
      setProdutos(produtosAtualizados);
      saveProdutos(produtosAtualizados);

      toast.success('Movimentação registrada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Não foi possível registrar a movimentação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };
  const filteredMovimentacoes =
    filterTipo === 'all'
      ? movimentacoes
      : movimentacoes.filter((m) => m.tipo === filterTipo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Movimentações de Estoque</h2>
          <p className="text-muted-foreground">Registre entradas e saídas de produtos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="size-4" />
          Nova Movimentação
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          value={filterTipo}
          onValueChange={(value: string) => setFilterTipo(value as 'all' | TipoMovimentacao)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Entrada">Entradas</SelectItem>
            <SelectItem value="Saída">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Carregando movimentações...
          </p>
        )}

        {loadError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovimentacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhuma movimentação registrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMovimentacoes.map(mov => (
                <TableRow key={mov.id}>
                  <TableCell>
                    {new Date(mov.data).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{mov.produtoNome}</TableCell>
                  <TableCell>
                    {mov.tipo === 'Entrada' ? (
                      <Badge className="gap-1 bg-green-600 hover:bg-green-700">
                        <ArrowUpCircle className="size-3" />
                        Entrada
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-red-600 hover:bg-red-700">
                        <ArrowDownCircle className="size-3" />
                        Saída
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{mov.quantidade}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{mov.observacao || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída de estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Movimentação *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: TipoMovimentacao) =>
                  setFormData(prev => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada (Compra/Reposição)</SelectItem>
                  <SelectItem value="Saída">Saída (Venda/Devolução)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="produto">Produto *</Label>
              <Select
                value={formData.produtoId}
                onValueChange={(value: any) =>
                  setFormData(prev => ({ ...prev, produtoId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map(produto => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} (Estoque: {produto.quantidadeEstoque})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.produtoId && (
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Estoque atual:{' '}
                  {produtos.find(p => p.id === formData.produtoId)?.quantidadeEstoque || 0}{' '}
                  unidades
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                max="99999"
                value={formData.quantidade}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || (/^\d+$/.test(value) && value.length <= 5)) {
                    setFormData(prev => ({ ...prev, quantidade: value }));
                  }
                }}
                onBlur={e => {
                  const num = parseInt(e.target.value, 10) || 0;
                  if (num < 0) {
                    toast.error('Quantidade não pode ser menor que zero');
                    setFormData(prev => ({ ...prev, quantidade: '' }));
                  } else if (num === 0 && e.target.value !== '') {
                    toast.error('Quantidade deve ser maior que zero');
                    setFormData(prev => ({ ...prev, quantidade: '' }));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Máximo: 99.999 unidades</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Ex: Compra de fornecedor, venda, devolução, etc."
                value={formData.observacao}
                onChange={e =>
                  setFormData(prev => ({ ...prev, observacao: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
