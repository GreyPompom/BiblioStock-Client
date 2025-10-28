import { useState, useEffect } from 'react';
import { Produto, Categoria, HistoricoReajuste } from '../types';
import { getProdutos, saveProdutos, getCategorias, saveCategorias, getHistoricoReajustes, saveHistoricoReajustes } from '../lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Percent, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';

export function ReajustesPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [historico, setHistorico] = useState<HistoricoReajuste[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tipoReajuste, setTipoReajuste] = useState<'global' | 'categoria' | 'padrao'>('global');
  const [percentual, setPercentual] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProdutos(getProdutos());
    setCategorias(getCategorias());
    setHistorico(getHistoricoReajustes().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  };

  const handleReajusteGlobal = () => {
    if (!percentual) {
      toast.error('Informe o percentual de reajuste');
      return;
    }

    setIsDialogOpen(true);
  };

  const handleReajusteCategoria = () => {
    if (!percentual || !categoriaSelecionada) {
      toast.error('Informe o percentual e selecione a categoria');
      return;
    }

    setIsDialogOpen(true);
  };

  const handleReajustePadrao = () => {
    setIsDialogOpen(true);
  };

  const confirmarReajuste = () => {
    const perc = parseFloat(percentual) || 0;
    let produtosAtualizados = [...produtos];
    let categoriasAtualizadas = [...categorias];
    let novoHistorico: HistoricoReajuste;

    if (tipoReajuste === 'global') {
      // Reajuste global - ALTERA OS PREÇOS de todos os produtos
      produtosAtualizados = produtos.map(p => ({
        ...p,
        precoUnitario: p.precoUnitario * (1 + perc / 100),
      }));

      novoHistorico = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        percentual: perc,
      };

      saveProdutos(produtosAtualizados);
      setProdutos(produtosAtualizados);
      toast.success(`Reajuste global de ${perc}% aplicado a todos os produtos!`);
    } else if (tipoReajuste === 'categoria') {
      // Reajuste por categoria - ALTERA O PERCENTUAL PADRÃO da categoria
      categoriasAtualizadas = categorias.map(c => 
        c.id === categoriaSelecionada
          ? { ...c, percentualReajustePadrao: perc }
          : c
      );

      const categoria = categorias.find(c => c.id === categoriaSelecionada);
      novoHistorico = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        percentual: perc,
        categoriaId: categoriaSelecionada,
        categoriaNome: categoria?.nome,
      };

      saveCategorias(categoriasAtualizadas);
      setCategorias(categoriasAtualizadas);
      toast.success(`Percentual de reajuste da categoria "${categoria?.nome}" atualizado para ${perc}%!`);
    } else {
      // Reajuste padrão - ALTERA OS PREÇOS aplicando o percentual de cada categoria
      produtosAtualizados = produtos.map(p => {
        const categoria = categorias.find(c => c.id === p.categoriaId);
        const percCategoria = categoria?.percentualReajustePadrao || 0;
        return {
          ...p,
          precoUnitario: p.precoUnitario * (1 + percCategoria / 100),
        };
      });

      novoHistorico = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        percentual: 0, // Múltiplos percentuais
      };

      saveProdutos(produtosAtualizados);
      setProdutos(produtosAtualizados);
      toast.success('Reajuste padrão aplicado conforme percentual de cada categoria!');
    }

    const novoHist = [novoHistorico, ...historico];
    saveHistoricoReajustes(novoHist);
    setHistorico(novoHist);

    setIsDialogOpen(false);
    setPercentual('');
    setCategoriaSelecionada('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Reajuste de Preços</h2>
        <p className="text-muted-foreground">Ajuste os preços dos produtos de forma global ou por categoria</p>
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
            <div className="space-y-2">
              <Label htmlFor="percentual-global">Percentual (%)</Label>
              <Input
                id="percentual-global"
                type="number"
                step="0.01"
                placeholder="Ex: 10"
                value={tipoReajuste === 'global' ? percentual : ''}
                onChange={(e) => {
                  setTipoReajuste('global');
                  setPercentual(e.target.value);
                }}
              />
            </div>
            <Button className="w-full" onClick={handleReajusteGlobal}>
              Aplicar Reajuste Global
            </Button>
          </CardContent>
        </Card>

        {/* Reajuste por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Configurar Percentual
            </CardTitle>
            <CardDescription>Definir o percentual padrão de uma categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={tipoReajuste === 'categoria' ? categoriaSelecionada : ''} 
                onValueChange={(value) => {
                  setTipoReajuste('categoria');
                  setCategoriaSelecionada(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome} (atual: {cat.percentualReajustePadrao}%)
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
                value={tipoReajuste === 'categoria' ? percentual : ''}
                onChange={(e) => {
                  setTipoReajuste('categoria');
                  setPercentual(e.target.value);
                }}
              />
            </div>
            <Button className="w-full" onClick={handleReajusteCategoria}>
              Atualizar Percentual
            </Button>
          </CardContent>
        </Card>

        {/* Reajuste Padrão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Reajuste Padrão
            </CardTitle>
            <CardDescription>Aplicar percentual padrão de cada categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">Percentuais configurados:</p>
              <div className="space-y-1">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{cat.nome}</span>
                    <Badge variant="secondary">{cat.percentualReajustePadrao}%</Badge>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                setTipoReajuste('padrao');
                handleReajustePadrao();
              }}
            >
              Aplicar Reajuste Padrão
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Reajustes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reajustes</CardTitle>
          <CardDescription>Registro de todos os reajustes aplicados</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum reajuste registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  historico.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {item.categoriaId ? (
                          <Badge variant="secondary">Por Categoria</Badge>
                        ) : item.percentual === 0 ? (
                          <Badge>Padrão</Badge>
                        ) : (
                          <Badge>Global</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.categoriaNome || 'Todas'}</TableCell>
                      <TableCell>
                        {item.percentual === 0 ? 'Variável' : `${item.percentual}%`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tipoReajuste === 'categoria' ? 'Confirmar Atualização de Percentual' : 'Confirmar Reajuste de Preços'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tipoReajuste === 'global' && (
                <>Você está prestes a aplicar um reajuste de <strong>{percentual}%</strong> aos preços de todos os produtos. Esta ação não pode ser desfeita.</>
              )}
              {tipoReajuste === 'categoria' && (
                <>Você está prestes a atualizar o percentual padrão da categoria <strong>{categorias.find(c => c.id === categoriaSelecionada)?.nome}</strong> para <strong>{percentual}%</strong>. Isso não altera os preços atuais dos produtos, apenas define o percentual que será usado em reajustes futuros.</>
              )}
              {tipoReajuste === 'padrao' && (
                <>Você está prestes a aplicar o reajuste padrão aos preços dos produtos conforme o percentual configurado para cada categoria. Esta ação não pode ser desfeita.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarReajuste}>
              {tipoReajuste === 'categoria' ? 'Confirmar Atualização' : 'Confirmar Reajuste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}