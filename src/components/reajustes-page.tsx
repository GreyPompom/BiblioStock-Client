import { useState, useEffect } from 'react';
import type {
  CategoryPercentDTO,
  PriceAdjustmentHistoryItemDTO,
  ScopeType,
} from '../types/priceAdjustments.dto';
import {
  getCategoriesPercent,
  getPriceAdjustmentsHistory,
  applyPriceAdjustment,
  getGlobalPercent,
} from '../lib/api/priceAdjustmentsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
import { Percent, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';

export function ReajustesPage() {
  const [categoriasPercent, setCategoriasPercent] = useState<CategoryPercentDTO[]>([]);
  const [historico, setHistorico] = useState<PriceAdjustmentHistoryItemDTO[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tipoReajuste, setTipoReajuste] = useState<ScopeType | 'PADRAO_UI'>('GLOBAL');
  const [percentualInput, setPercentualInput] = useState(''); // em %
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  const [globalPercent, setGlobalPercent] = useState<number>(0);
  const [nota, setNota] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cats, hist, global] = await Promise.all([
        getCategoriesPercent(),
        getPriceAdjustmentsHistory(),
        getGlobalPercent(),
      ]);
      // ordenar histórico por data desc
      const sortedHist = [...hist].sort(
        (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
      setCategoriasPercent(cats);
      setHistorico(sortedHist);
      setGlobalPercent(global);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados de reajuste.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validarReajuste = () => {
    if (tipoReajuste === 'GLOBAL') {
      if (!percentualInput) {
        toast.error('Informe o percentual de reajuste global.');
        return false;
      }
    }

    if (tipoReajuste === 'CATEGORIA') {
      if (!percentualInput || !categoriaSelecionada) {
        toast.error('Informe o percentual e selecione a categoria.');
        return false;
      }
    }

    return true;
  };

  const handleAbrirDialog = (tipo: ScopeType) => {
    setTipoReajuste(tipo);
    if (!validarReajuste()) return;
    setIsDialogOpen(true);
  };

  const confirmarReajuste = async () => {
    try {
      const percNumber = parseFloat(percentualInput.replace(',', '.')) || 0;
      const decimalPercent = percNumber / 100; // converter 5 -> 0.05
      let scopeType: ScopeType = 'GLOBAL';
      let categoryId: number | undefined;
      let noteToSend: string | undefined = nota || undefined;

      if (tipoReajuste === 'CATEGORIA') {
        scopeType = 'CATEGORIA';
        categoryId = Number(categoriaSelecionada);

        const categoria = categoriasPercent.find(c => c.categoryId === categoryId);
        if (!noteToSend) {
          noteToSend = `Atualização de percentual da categoria ${categoria?.nameCategory ?? ''} para ${percNumber}%`;
        }
      } else {
        scopeType = 'GLOBAL';
        if (!noteToSend) {
          noteToSend = `Reajuste global de ${percNumber}%`;
        }
      }

      await applyPriceAdjustment({
        scopeType,
        percent: decimalPercent,
        categoryId,
        note: noteToSend,
      });

      toast.success(
        scopeType === 'GLOBAL'
          ? `Reajuste global de ${percNumber}% enviado com sucesso!`
          : `Reajuste da categoria aplicado com sucesso!`,
      );

      // recarregar histórico e percentuais
      await loadData();

      // resetar estado
      setIsDialogOpen(false);
      setPercentualInput('');
      setCategoriaSelecionada('');
      setNota('');
      setTipoReajuste('GLOBAL');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao aplicar reajuste. Verifique os dados e tente novamente.');
    }
  };

  const formatPercentDecimalToView = (decimal: number) => {
    // backend manda 0.05 -> exibir "5"
    return (decimal * 100).toFixed(2).replace('.', ',');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Reajuste de Preços</h2>
        <p className="text-muted-foreground">
          Ajuste os preços dos produtos de forma global ou por categoria, integrado com a API.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Reajuste Global */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="size-5" />
              Reajuste Global 
            </CardTitle>
            <CardDescription>Aplicar o mesmo percentual a todos os produtos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="percentual-global">Percentual {globalPercent.toFixed(2).replace('.', ',')} (%)</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual-global">Percentual (%)</Label>
              <Input
                id="percentual-global"
                type="number"
                step="0.01"
                placeholder="Ex: 10"
                value={tipoReajuste === 'GLOBAL' ? percentualInput : ''}
                onChange={e => {
                  setTipoReajuste('GLOBAL');
                  setPercentualInput(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nota-global">Observação (opcional)</Label>
              <Input
                id="nota-global"
                placeholder="Ex: Reajuste global trimestral"
                value={tipoReajuste === 'GLOBAL' ? nota : ''}
                onChange={e => {
                  setTipoReajuste('GLOBAL');
                  setNota(e.target.value);
                }}
              />
            </div>
            <Button className="w-full" onClick={() => handleAbrirDialog('GLOBAL')} disabled={isLoading}>
              Aplicar Reajuste Global
            </Button>
          </CardContent>
        </Card>

        {/* Reajuste por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Configurar Percentual da Categoria
            </CardTitle>
            <CardDescription>
              Definir o percentual padrão de uma categoria (o backend aplica sobre os preços).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={tipoReajuste === 'CATEGORIA' ? categoriaSelecionada : ''}
                onValueChange={(value: string) => {
                  setTipoReajuste('CATEGORIA');
                  setCategoriaSelecionada(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasPercent.map(cat => (
                    <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                      {cat.nameCategory} (atual: {formatPercentDecimalToView(cat.percent)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual-categoria">Novo Percentual (%)</Label>
              <Input
                id="percentual-categoria"
                type="number"
                step="0.01"
                placeholder="Ex: 5"
                value={tipoReajuste === 'CATEGORIA' ? percentualInput : ''}
                onChange={e => {
                  setTipoReajuste('CATEGORIA');
                  setPercentualInput(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nota-categoria">Observação (opcional)</Label>
              <Input
                id="nota-categoria"
                placeholder="Ex: Ajuste de percentual da categoria"
                value={tipoReajuste === 'CATEGORIA' ? nota : ''}
                onChange={e => {
                  setTipoReajuste('CATEGORIA');
                  setNota(e.target.value);
                }}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleAbrirDialog('CATEGORIA')}
              disabled={isLoading || !categoriasPercent.length}
            >
              Atualizar Percentual da Categoria
            </Button>
          </CardContent>
        </Card>

        {/* Painel de Percentuais por Categoria (apenas visualização) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Percentuais por Categoria
            </CardTitle>
            <CardDescription>
              Visualize os percentuais atuais de cada categoria conforme registrados na API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoriasPercent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum percentual de categoria configurado.
              </p>
            ) : (
              <div className="space-y-1">
                {categoriasPercent.map(cat => (
                  <div key={cat.categoryId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{cat.nameCategory}</span>
                    <Badge variant="secondary">
                      {formatPercentDecimalToView(cat.percent)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Reajustes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reajustes</CardTitle>
          <CardDescription>Registro de todos os reajustes aplicados (API /history)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum reajuste registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  historico.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.appliedAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {item.scopeType === 'CATEGORIA' ? (
                          <Badge variant="secondary">Por Categoria</Badge>
                        ) : (
                          <Badge>Global</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.category?.name ?? 'Todas'}</TableCell>
                      <TableCell>{formatPercentDecimalToView(item.percent)}%</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={item.note}>
                        {item.note ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tipoReajuste === 'CATEGORIA'
                ? 'Confirmar Atualização de Percentual da Categoria'
                : 'Confirmar Reajuste Global'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tipoReajuste === 'GLOBAL' && (
                <>
                  Você está prestes a aplicar um reajuste de{' '}
                  <strong>{percentualInput}%</strong> aos preços de todos os produtos. Essa
                  operação será processada pela API e não pode ser desfeita.
                </>
              )}
              {tipoReajuste === 'CATEGORIA' && (
                <>
                  Você está prestes a atualizar o percentual da categoria{' '}
                  <strong>
                    {
                      categoriasPercent.find(
                        c => String(c.categoryId) === categoriaSelecionada,
                      )?.nameCategory
                    }
                  </strong>{' '}
                  para <strong>{percentualInput}%</strong>. O backend é responsável por aplicar
                  esse percentual sobre os preços da categoria.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarReajuste} disabled={isLoading}>
              {tipoReajuste === 'CATEGORIA'
                ? 'Confirmar Atualização'
                : 'Confirmar Reajuste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
