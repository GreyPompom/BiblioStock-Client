import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  fetchProductPricesReport,
  fetchBalanceReport,
  fetchProductsBelowMinimum,
  fetchProductsPerCategory,
  fetchMovementsHistoryReport,
} from '../lib/api/reportsApi';

import type {
  ProductPriceDTO,
  BalanceResponseDTO,
  ProductBelowMinimumDTO,
  ProductsPerCategoryDTO,
  MovementsHistoryReportDTO,
  MovementHistoryItemDTO,
} from '../types/reports.dto';

export function RelatoriosPage() {
  const [productPrices, setProductPrices] = useState<ProductPriceDTO[]>([]);
  const [balance, setBalance] = useState<BalanceResponseDTO | null>(null);
  const [productsBelowMinimum, setProductsBelowMinimum] = useState<ProductBelowMinimumDTO[]>([]);
  const [productsPerCategory, setProductsPerCategory] = useState<ProductsPerCategoryDTO[]>([]);
  const [movementsReport, setMovementsReport] = useState<MovementsHistoryReportDTO | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [
        prices,
        balanceResponse,
        belowMinimum,
        perCategory,
        movementsHistory,
      ] = await Promise.all([
        fetchProductPricesReport(),
        fetchBalanceReport(),
        fetchProductsBelowMinimum(),
        fetchProductsPerCategory(),
        fetchMovementsHistoryReport(),
      ]);

      setProductPrices(
        [...prices].sort((a, b) => a.productName.localeCompare(b.productName)),
      );
      setBalance(balanceResponse);
      setProductsBelowMinimum(belowMinimum);
      setProductsPerCategory(perCategory);
      setMovementsReport(movementsHistory);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setLoadError('Não foi possível carregar os relatórios.');
      toast.error('Erro ao carregar relatórios.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Derivações dos dados (equivalentes ao que você fazia antes) ---

  // Lista de preços já vem pronta (productPrices)

  // Balanço físico/financeiro
  const balanceItems = balance?.items ?? [];
  const totalInventoryValue = balance?.totalValue ?? 0;

  // Produtos abaixo do mínimo
  const produtosAbaixoMinimo = productsBelowMinimum;

  // Produtos por categoria
  const produtosPorCategoria = productsPerCategory.map(item => ({
    categoria: item.name,
    quantidade: item.productCount,
  }));

  // Movimento por produto (já vem da API)
  const movimentoPorProduto: MovementHistoryItemDTO[] =
    movementsReport?.movements ?? [];

  const produtoMaisEntradas =
    movimentoPorProduto.length > 0
      ? movimentoPorProduto.reduce((max, item) =>
        item.entries > max.entries ? item : max,
      )
      : { productName: '-', entries: 0, exits: 0, saldo: 0 };

  const produtoMaisSaidas =
    movimentoPorProduto.length > 0
      ? movimentoPorProduto.reduce((max, item) =>
        item.exits > max.exits ? item : max,
      )
      : { productName: '-', entries: 0, exits: 0, saldo: 0 };

  const exportarPDF = (relatorio: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório: ${relatorio}`, 10, 10);

    switch (relatorio) {
      case 'Lista de Preços':
        autoTable(doc, {
          startY: 20,
          head: [['ID', 'Nome', 'ISBN', 'Preço Unitário', 'Preço c/ Reajuste']],
          body: productPrices.map(item => [
            item.productId,
            item.productName,
            item.ISBN,
            `R$ ${Number(item.priceUnit).toFixed(2)}`,
            `R$ ${Number(item.priceWithPercent).toFixed(2)}`,
          ]),
        });
        break;

      case 'Balanço':
        doc.setFontSize(14);
        doc.text(
          `Valor Total do Estoque: R$ ${Number(totalInventoryValue).toFixed(2)}`,
          10,
          20,
        );
        autoTable(doc, {
          startY: 30,
          head: [['Nome', 'Qtd. Estoque', 'Valor Unit.', 'Valor Total']],
          body: balanceItems.map(item => [
            item.name,
            item.stockQty,
            `R$ ${Number(item.price).toFixed(2)}`,
            `R$ ${Number(item.totalValue).toFixed(2)}`,
          ]),
        });
        break;

      case 'Estoque Baixo':
        autoTable(doc, {
          startY: 20,
          head: [['ID', 'Nome', 'Qtd. Mínima', 'Qtd. Atual', 'Diferença', 'Status']],
          body: produtosAbaixoMinimo.map(item => {
            const diff = item.minQTD - item.stockQTD;
            return [
              item.productId,
              item.productName,
              item.minQTD,
              item.stockQTD,
              diff,
              'Crítico',
            ];
          }),
        });
        break;

      case 'Por Categoria':
        autoTable(doc, {
          startY: 20,
          head: [['Categoria', 'Quantidade de Produtos']],
          body: produtosPorCategoria.map(item => [item.categoria, item.quantidade]),
        });
        break;

      case 'Movimento':
        doc.setFontSize(14);
        doc.text(
          `Maior Número de Entradas: ${produtoMaisEntradas.productName} (${produtoMaisEntradas.entries} unidades)`,
          10,
          20,
        );
        doc.text(
          `Maior Número de Saídas: ${produtoMaisSaidas.productName} (${produtoMaisSaidas.exits} unidades)`,
          10,
          30,
        );
        autoTable(doc, {
          startY: 40,
          head: [['Produto', 'Total de Entradas', 'Total de Saídas', 'Saldo']],
          body: movimentoPorProduto.map(item => [
            item.productName,
            `+${item.entries}`,
            `-${item.exits}`,
            item.saldo,
          ]),
        });
        break;
      default:
        break;
    }

    doc.save(`relatorio_${relatorio.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Relatórios Gerenciais</h2>
        <p className="text-muted-foreground">Consulte informações detalhadas sobre estoque e movimentações</p>
      </div>
      <div>{isLoading && (
        <p className="text-sm text-muted-foreground">
          Carregando relatórios...
        </p>
      )}

        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}
      </div>
      <Tabs defaultValue="lista-precos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="lista-precos">Lista de Preços</TabsTrigger>
          <TabsTrigger value="balanco">Balanço</TabsTrigger>
          <TabsTrigger value="abaixo-minimo">Estoque Baixo</TabsTrigger>
          <TabsTrigger value="por-categoria">Por Categoria</TabsTrigger>
          <TabsTrigger value="movimento">Movimento</TabsTrigger>
        </TabsList>

        {/* Lista de Preços */}
        <TabsContent value="lista-precos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Lista de Preços
                  </CardTitle>
                  <CardDescription>Todos os produtos em ordem alfabética com seus atributos</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => exportarPDF('Lista de Preços')}>
                  <Download className="size-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Preço Unitário</TableHead>
                      <TableHead>Preço c/ Reajuste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productPrices.map(produto => (
                      <TableRow key={produto.productId}>
                        <TableCell>{produto.productId}</TableCell>
                        <TableCell>{produto.productName}</TableCell>
                        <TableCell>{produto.ISBN}</TableCell>
                        <TableCell>R$ {produto.priceUnit.toFixed(2)}</TableCell>
                        <TableCell>R$ {produto.priceWithPercent.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balanço Físico/Financeiro */}
        <TabsContent value="balanco" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="size-5" />
                    Balanço Físico e Financeiro
                  </CardTitle>
                  <CardDescription>Relação de todos os produtos com valor total do estoque</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => exportarPDF('Balanço')}>
                  <Download className="size-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-muted-foreground">Valor Total do Estoque</p>
                <p className="text-2xl">R$ {Number(totalInventoryValue).toFixed(2)}</p>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Qtd. Estoque</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceItems.map(produto => (
                      <TableRow key={produto.id}>
                        <TableCell>{produto.name}</TableCell>
                        <TableCell>{produto.stockQty}</TableCell>
                        <TableCell>R$ {produto.price.toFixed(2)}</TableCell>
                        <TableCell>R$ {produto.totalValue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4}></TableCell>
                      <TableCell>
                        <strong>R$ {Number(totalInventoryValue).toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produtos Abaixo da Quantidade Mínima */}
        <TabsContent value="abaixo-minimo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-orange-500" />
                    Produtos Abaixo da Quantidade Mínima
                  </CardTitle>
                  <CardDescription>Produtos que precisam de reposição urgente</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => exportarPDF('Estoque Baixo')}>
                  <Download className="size-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {produtosAbaixoMinimo.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <p className="text-muted-foreground">Nenhum produto abaixo do estoque mínimo</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Qtd. Mínima</TableHead>
                        <TableHead>Qtd. Atual</TableHead>
                        <TableHead>Diferença</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsBelowMinimum.map(product => (
                        <TableRow key={product.productId}>
                          <TableCell>{product.productId}</TableCell>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell>{product.minQTD}</TableCell>
                          <TableCell>{product.stockQTD}</TableCell>
                          <TableCell>{product.minQTD - product.stockQTD}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Crítico</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quantidade de Produtos por Categoria */}
        <TabsContent value="por-categoria" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quantidade de Produtos por Categoria</CardTitle>
                  <CardDescription>Distribuição dos produtos por categoria</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => exportarPDF('Por Categoria')}>
                  <Download className="size-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade de Produtos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosPorCategoria.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produtos com Maior Movimento */}
        <TabsContent value="movimento" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Produtos com Maior Movimento</CardTitle>
                  <CardDescription>Análise de entradas e saídas de produtos</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => exportarPDF('Movimento')}>
                  <Download className="size-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="size-5" />
                      Maior Número de Entradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{produtoMaisEntradas.productName}</p>
                    <p className="text-muted-foreground">{produtoMaisEntradas.entries} unidades</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="size-5" />
                      Maior Número de Saídas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{produtoMaisSaidas.productName}</p>
                    <p className="text-muted-foreground">{produtoMaisSaidas.exits} unidades</p>
                  </CardContent>
                </Card>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Nome do Produto</TableHead>
                      <TableHead>Total de Entradas</TableHead>
                      <TableHead>Total de Saídas</TableHead>
                      <TableHead>Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentoPorProduto.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productId}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-green-600">+{item.entries}</TableCell>
                        <TableCell className="text-red-600">-{item.exits}</TableCell>
                        <TableCell>{item.entries - item.exits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}