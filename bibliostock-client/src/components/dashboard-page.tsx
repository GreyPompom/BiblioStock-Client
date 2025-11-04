import { useState, useEffect } from 'react';
import { Produto, Movimentacao } from '../types';
import { getProdutos, getMovimentacoes, getCategorias } from '../lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';

export function DashboardPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProdutos(getProdutos());
    setMovimentacoes(getMovimentacoes());
    setCategorias(getCategorias());
  };

  const totalProdutos = produtos.length;
  const produtosAbaixoMinimo = produtos.filter(p => p.quantidadeEstoque < p.quantidadeMinima).length;
  const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.quantidadeEstoque * p.precoUnitario), 0);
  
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  const movimentacoesMes = movimentacoes.filter(m => {
    const data = new Date(m.data);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });

  const entradasMes = movimentacoesMes.filter(m => m.tipo === 'Entrada').length;
  const saidasMes = movimentacoesMes.filter(m => m.tipo === 'Saída').length;

  const produtosRecentes = [...produtos]
    .sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do sistema de controle de estoque</p>
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
              Em {categorias.length} categorias
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
              Valor estimado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Movimentações (Mês)</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{movimentacoesMes.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{entradasMes}</span> entradas, <span className="text-red-600">-{saidasMes}</span> saídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Alertas de Estoque</CardTitle>
            <AlertTriangle className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{produtosAbaixoMinimo}</div>
            <p className="text-xs text-muted-foreground">
              Produtos abaixo do mínimo
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
            <div className="space-y-4">
              {produtosRecentes.map(produto => (
                <div key={produto.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p>{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">{produto.autor}</p>
                  </div>
                  <div className="text-right">
                    <p>R$ {produto.precoUnitario.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs">
                      Estoque: {produto.quantidadeEstoque}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
            <CardDescription>Produtos que precisam de reposição</CardDescription>
          </CardHeader>
          <CardContent>
            {produtosAbaixoMinimo === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">Nenhum produto com estoque baixo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {produtos
                  .filter(p => p.quantidadeEstoque < p.quantidadeMinima)
                  .slice(0, 5)
                  .map(produto => (
                    <div key={produto.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p>{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">Mínimo: {produto.quantidadeMinima}</p>
                      </div>
                      <Badge variant="destructive">
                        {produto.quantidadeEstoque} em estoque
                      </Badge>
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