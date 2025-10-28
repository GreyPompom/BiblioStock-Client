import { useState, useEffect } from 'react';
import { Produto, Categoria, Movimentacao, Autor } from '../types';
import { getProdutos, getCategorias, getMovimentacoes, getAutores } from '../lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { FileText, Download, TrendingUp, TrendingDown, AlertTriangle, Package } from 'lucide-react';
import { Badge } from './ui/badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function RelatoriosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [autores, setAutores] = useState<Autor[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProdutos(getProdutos());
    setCategorias(getCategorias());
    setMovimentacoes(getMovimentacoes());
    setAutores(getAutores());
  };

  // Relatório: Lista de Preços
  const listaPrecos = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));

  // Calcular preço com reajuste da categoria
  const calcularPrecoComReajuste = (produto: Produto) => {
    const categoria = categorias.find(c => c.id === produto.categoriaId);
    const percentual = categoria?.percentualReajustePadrao || 0;
    return produto.precoUnitario * (1 + percentual / 100);
  };

  // Relatório: Balanço Físico/Financeiro
  const balancoFisico = [...produtos]
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map(p => ({
      ...p,
      valorTotal: p.quantidadeEstoque * p.precoUnitario,
    }));
  
  const valorTotalEstoque = balancoFisico.reduce((sum, p) => sum + p.valorTotal, 0);

  // Relatório: Produtos Abaixo da Quantidade Mínima
  const produtosAbaixoMinimo = produtos.filter(p => p.quantidadeEstoque < p.quantidadeMinima);

  // Relatório: Quantidade de Produtos por Categoria
  const produtosPorCategoria = categorias.map(cat => ({
    categoria: cat.nome,
    quantidade: produtos.filter(p => p.categoriaId === cat.id).length,
  }));

  // Relatório: Produtos com Maior Movimento
  const movimentoPorProduto = produtos.map(produto => {
    const movs = movimentacoes.filter(m => m.produtoId === produto.id);
    const entradas = movs.filter(m => m.tipo === 'Entrada').reduce((sum, m) => sum + m.quantidade, 0);
    const saidas = movs.filter(m => m.tipo === 'Saída').reduce((sum, m) => sum + m.quantidade, 0);
    return { produto: produto.nome, entradas, saidas };
  });

  const produtoMaisEntradas = movimentoPorProduto.reduce((max, p) => p.entradas > max.entradas ? p : max, movimentoPorProduto[0] || { produto: '-', entradas: 0, saidas: 0 });
  const produtoMaisSaidas = movimentoPorProduto.reduce((max, p) => p.saidas > max.saidas ? p : max, movimentoPorProduto[0] || { produto: '-', entradas: 0, saidas: 0 });

  const getCategoriaNome = (categoriaId: string) => {
    return categorias.find(c => c.id === categoriaId)?.nome || 'N/A';
  };

  const getAutoresNomes = (authorIds: string[]) => {
    if (!authorIds || authorIds.length === 0) return 'Sem autores';
    return authorIds
      .map(id => autores.find(a => a.id === id)?.nomeCompleto || 'Desconhecido')
      .join(', ');
  };

  const exportarPDF = (relatorio: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório: ${relatorio}`, 10, 10);

    switch (relatorio) {
      case 'Lista de Preços':
        autoTable(doc, {
          startY: 20,
          head: [['ID', 'Nome', 'Autor', 'Editora', 'Categoria', 'ISBN', 'Preço Unitário', 'Preço c/ Reajuste']],
          body: listaPrecos.map(produto => [
            produto.id,
            produto.nome,
            getAutoresNomes(produto.authorIds),
            produto.editora,
            getCategoriaNome(produto.categoriaId),
            produto.isbn,
            `R$ ${produto.precoUnitario.toFixed(2)}`,
            `R$ ${calcularPrecoComReajuste(produto).toFixed(2)}`,
          ]),
        });
        break;
      case 'Balanço':
        doc.setFontSize(14);
        doc.text(`Valor Total do Estoque: R$ ${valorTotalEstoque.toFixed(2)}`, 10, 20);
        autoTable(doc, {
          startY: 30,
          head: [['Nome', 'Categoria', 'Qtd. Estoque', 'Valor Unit.', 'Valor Total']],
          body: balancoFisico.map(produto => [
            produto.nome,
            getCategoriaNome(produto.categoriaId),
            produto.quantidadeEstoque,
            `R$ ${produto.precoUnitario.toFixed(2)}`,
            `R$ ${produto.valorTotal.toFixed(2)}`,
          ]),
        });
        break;
      case 'Estoque Baixo':
        autoTable(doc, {
          startY: 20,
          head: [['ID', 'Nome', 'Qtd. Mínima', 'Qtd. Atual', 'Diferença', 'Status']],
          body: produtosAbaixoMinimo.map(produto => [
            produto.id,
            produto.nome,
            produto.quantidadeMinima,
            produto.quantidadeEstoque,
            produto.quantidadeMinima - produto.quantidadeEstoque,
            'Crítico',
          ]),
        });
        break;
      case 'Por Categoria':
        autoTable(doc, {
          startY: 20,
          head: [['Categoria', 'Quantidade de Produtos']],
          body: produtosPorCategoria.map((item, index) => [
            item.categoria,
            item.quantidade,
          ]),
        });
        break;
      case 'Movimento':
        doc.setFontSize(14);
        doc.text(`Maior Número de Entradas: ${produtoMaisEntradas.produto} (${produtoMaisEntradas.entradas} unidades)`, 10, 20);
        doc.text(`Maior Número de Saídas: ${produtoMaisSaidas.produto} (${produtoMaisSaidas.saidas} unidades)`, 10, 30);
        autoTable(doc, {
          startY: 40,
          head: [['Produto', 'Total de Entradas', 'Total de Saídas', 'Saldo']],
          body: movimentoPorProduto.map((item, index) => [
            item.produto,
            `+${item.entradas}`,
            `-${item.saidas}`,
            item.entradas - item.saidas,
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
                      <TableHead>Autor</TableHead>
                      <TableHead>Editora</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Preço Unitário</TableHead>
                      <TableHead>Preço c/ Reajuste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listaPrecos.map(produto => (
                      <TableRow key={produto.id}>
                        <TableCell>{produto.id}</TableCell>
                        <TableCell>{produto.nome}</TableCell>
                        <TableCell>{getAutoresNomes(produto.authorIds)}</TableCell>
                        <TableCell>{produto.editora}</TableCell>
                        <TableCell>{getCategoriaNome(produto.categoriaId)}</TableCell>
                        <TableCell>{produto.isbn}</TableCell>
                        <TableCell>R$ {produto.precoUnitario.toFixed(2)}</TableCell>
                        <TableCell>R$ {calcularPrecoComReajuste(produto).toFixed(2)}</TableCell>
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
                <p className="text-2xl">R$ {valorTotalEstoque.toFixed(2)}</p>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Qtd. Estoque</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balancoFisico.map(produto => (
                      <TableRow key={produto.id}>
                        <TableCell>{produto.nome}</TableCell>
                        <TableCell>{getCategoriaNome(produto.categoriaId)}</TableCell>
                        <TableCell>{produto.quantidadeEstoque}</TableCell>
                        <TableCell>R$ {produto.precoUnitario.toFixed(2)}</TableCell>
                        <TableCell>R$ {produto.valorTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4}></TableCell>
                      <TableCell>
                        <strong>R$ {valorTotalEstoque.toFixed(2)}</strong>
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
                      {produtosAbaixoMinimo.map(produto => (
                        <TableRow key={produto.id}>
                          <TableCell>{produto.id}</TableCell>
                          <TableCell>{produto.nome}</TableCell>
                          <TableCell>{produto.quantidadeMinima}</TableCell>
                          <TableCell>{produto.quantidadeEstoque}</TableCell>
                          <TableCell>{produto.quantidadeMinima - produto.quantidadeEstoque}</TableCell>
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
                    <p className="mb-2">{produtoMaisEntradas.produto}</p>
                    <p className="text-muted-foreground">{produtoMaisEntradas.entradas} unidades</p>
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
                    <p className="mb-2">{produtoMaisSaidas.produto}</p>
                    <p className="text-muted-foreground">{produtoMaisSaidas.saidas} unidades</p>
                  </CardContent>
                </Card>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Total de Entradas</TableHead>
                      <TableHead>Total de Saídas</TableHead>
                      <TableHead>Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentoPorProduto.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.produto}</TableCell>
                        <TableCell className="text-green-600">+{item.entradas}</TableCell>
                        <TableCell className="text-red-600">-{item.saidas}</TableCell>
                        <TableCell>{item.entradas - item.saidas}</TableCell>
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