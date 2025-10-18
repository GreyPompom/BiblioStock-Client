import { useEffect, useState } from 'react';
import { initializeSampleData } from './lib/storage';
import { DashboardPage } from './components/dashboard-page';
import { ProdutosPage } from './components/produtos-page';
import { CategoriasPage } from './components/categorias-page';
import { AutoresPage } from './components/autores-page';
import { MovimentacoesPage } from './components/movimentacoes-page';
import { RelatoriosPage } from './components/relatorios-page';
import { ReajustesPage } from './components/reajustes-page';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { BookOpen, Package, FolderTree, ArrowLeftRight, FileText, Percent, Menu, X, User } from 'lucide-react';

type Page = 'dashboard' | 'produtos' | 'categorias' | 'autores' | 'movimentacoes' | 'relatorios' | 'reajustes';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeSampleData();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'categorias', label: 'Categorias', icon: FolderTree },
    { id: 'autores', label: 'Autores', icon: User },
    { id: 'movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'reajustes', label: 'Reajustes', icon: Percent },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'produtos':
        return <ProdutosPage />;
      case 'categorias':
        return <CategoriasPage />;
      case 'autores':
        return <AutoresPage />;
      case 'movimentacoes':
        return <MovimentacoesPage />;
      case 'relatorios':
        return <RelatoriosPage />;
      case 'reajustes':
        return <ReajustesPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-b border-amber-200 bg-gradient-to-b from-amber-900 to-orange-900 text-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-800/50">
              <BookOpen className="size-6" />
            </div>
            <div>
              <h1 className="text-xl">BiblioStock</h1>
              <p className="text-xs text-amber-200">Sistema de Estoque</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>

        <nav className={`space-y-1 p-4 ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 ${
                  currentPage === item.id
                    ? 'bg-amber-800 text-white hover:bg-amber-700'
                    : 'text-amber-100 hover:bg-amber-800/50 hover:text-white'
                }`}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Icon className="size-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="hidden border-t border-amber-800 p-4 lg:block">
          <div className="rounded-lg bg-amber-800/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="size-4" />
              <p className="text-sm">Livraria Modelo</p>
            </div>
            <p className="text-xs text-amber-200">
              Sistema de controle de estoque para gerenciamento eficiente de livros e produtos
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          {renderPage()}
        </div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}