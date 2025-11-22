import { useState, useEffect } from 'react';
import type { Produto } from '../types';
import { getProdutos, getCategorias } from '../lib/storage';
import { fetchDashboardOverview } from '../lib/api/dashboardApi';
import type { DashboardOverviewDTO } from '../types/dashboard.dto';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverviewDTO | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // dados que já existem no front (até migrar totalmente)
      const categoriasLocal = getCategorias();

      setCategorias(categoriasLocal);

      // dados de dashboard vindos da API
      const dashboardOverview = await fetchDashboardOverview();
      setOverview(dashboardOverview);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setLoadError('Não foi possível carregar os dados do dashboard.');
      toast.error('Erro ao carregar dashboard.');
    } finally {
      setIsLoading(false);
    }
  };


  // Total de produtos: prioriza a API, cai para o localStorage se necessário
  const totalProdutos = overview?.stockValue.totalProducts ?? 0;
  const totalCategorias = overview?.productCount.totalCategories ?? categorias.length;
  // Valor total do estoque vindo da API
  const valorTotalEstoque = overview?.stockValue.totalStockValue ?? 0;
  const valorTotalEstoquePercentual = overview?.stockValue.totalStockValuePercentage ?? 0;
  // Resumo de movimentações vindo da API
  const totalMovimentacoes = overview?.movementSummary.totalMovements ?? 0;
  const entradasTotal = overview?.movementSummary.totalEntradas ?? 0;
  const saidasTotal = overview?.movementSummary.totalSaidas ?? 0;

  // Produtos recentes vindos da API
  const produtosRecentes = overview?.lastProducts ?? [];


  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do sistema de controle de estoque</p>
      </div>
      <div>
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Carregando dados do dashboard...
          </p>
        )}
        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total de Produtos</CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">
              Em {totalCategorias} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Valor Total do Estoque</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">R$ {valorTotalEstoque.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor bruto em estoque
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Valor Total do Estoque (%)</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">R$ {valorTotalEstoquePercentual.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor ajustado com percentual aplicado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Movimentações (Mês)</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalMovimentacoes}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{entradasTotal}</span> entradas, <span className="text-red-600">-{saidasTotal}</span> saídas
            </p>
          </CardContent>
        </Card>


      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos Recentes</CardTitle>
            <CardDescription>Últimos produtos cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {produtosRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto recente encontrado.
              </p>
            ) : (
              <div className="space-y-4">
                {produtosRecentes.map(produto => (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p>{produto.name}</p>
                    </div>
                    <div className="text-right">
                      <p>R$ {produto.price.toFixed(2)}</p>
                      <Badge variant="secondary" className="text-xs">
                        Estoque: {produto.stockQty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      
      </div>
    </div>
  );
}