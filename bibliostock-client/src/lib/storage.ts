import { Categoria, Produto, Movimentacao, HistoricoReajuste, Autor } from '../types';

const STORAGE_KEYS = {
  CATEGORIAS: 'livraria_categorias',
  PRODUTOS: 'livraria_produtos',
  MOVIMENTACOES: 'livraria_movimentacoes',
  REAJUSTES: 'livraria_reajustes',
  AUTORES: 'livraria_autores',
};

// Categorias
export const getCategorias = (): Categoria[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIAS);
  return data ? JSON.parse(data) : [];
};

export const saveCategorias = (categorias: Categoria[]) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(categorias));
};

// Produtos
export const getProdutos = (): Produto[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
  return data ? JSON.parse(data) : [];
};

export const saveProdutos = (produtos: Produto[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
};

// Movimentações
export const getMovimentacoes = (): Movimentacao[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MOVIMENTACOES);
  return data ? JSON.parse(data) : [];
};

export const saveMovimentacoes = (movimentacoes: Movimentacao[]) => {
  localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(movimentacoes));
};

// Histórico de Reajustes
export const getHistoricoReajustes = (): HistoricoReajuste[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REAJUSTES);
  return data ? JSON.parse(data) : [];
};

export const saveHistoricoReajustes = (historico: HistoricoReajuste[]) => {
  localStorage.setItem(STORAGE_KEYS.REAJUSTES, JSON.stringify(historico));
};

// Autores
export const getAutores = (): Autor[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUTORES);
  return data ? JSON.parse(data) : [];
};

export const saveAutores = (autores: Autor[]) => {
  localStorage.setItem(STORAGE_KEYS.AUTORES, JSON.stringify(autores));
};

const migrateProdutosData = () => {
  const produtosData = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
  if (produtosData) {
    try {
      const produtos = JSON.parse(produtosData);
      let needsMigration = false;
      const autoresMap = new Map<string, Autor>();

      // Verificar se há produtos com campo 'autor' antigo
      const produtosMigrados = produtos.map((produto: any) => {
        if (produto.autor && !produto.authorIds) {
          needsMigration = true;
          
          // Criar autor automaticamente se não existir
          const autorNome = produto.autor;
          let autorId = Array.from(autoresMap.values()).find(a => a.nomeCompleto === autorNome)?.id;
          
          if (!autorId) {
            autorId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            autoresMap.set(autorId, {
              id: autorId,
              nomeCompleto: autorNome,
              nacionalidade: 'Não informada',
              biografia: '',
              dataCadastro: new Date().toISOString(),
            });
          }

          const { autor, ...produtoSemAutor } = produto;
          return {
            ...produtoSemAutor,
            authorIds: [autorId],
          };
        }
        return produto;
      });

      if (needsMigration) {
        // Salvar autores criados automaticamente
        const autoresExistentes = getAutores();
        const novosAutores = Array.from(autoresMap.values()).filter(
          novoAutor => !autoresExistentes.find(a => a.nomeCompleto === novoAutor.nomeCompleto)
        );
        if (novosAutores.length > 0) {
          saveAutores([...autoresExistentes, ...novosAutores]);
        }

        // Salvar produtos migrados
        saveProdutos(produtosMigrados);
        console.log('Dados migrados com sucesso para o novo formato com autores');
      }
    } catch (error) {
      console.error('Erro ao migrar dados:', error);
    }
  }
};

// Inicializar dados de exemplo
export const initializeSampleData = () => {
  // Migrar dados antigos primeiro
  migrateProdutosData();

  if (!localStorage.getItem(STORAGE_KEYS.AUTORES)) {
    const autoresExemplo: Autor[] = [
      {
        id: '1',
        nomeCompleto: 'Robert C. Martin',
        nacionalidade: 'Americana',
        biografia: 'Engenheiro de software e autor conhecido por suas obras sobre clean code e arquitetura de software.',
        dataCadastro: new Date().toISOString(),
      },
      {
        id: '2',
        nomeCompleto: 'Antoine de Saint-Exupéry',
        nacionalidade: 'Francesa',
        biografia: 'Escritor, ilustrador e piloto francês, autor do clássico O Pequeno Príncipe.',
        dataCadastro: new Date().toISOString(),
      },
      {
        id: '3',
        nomeCompleto: 'Agatha Christie',
        nacionalidade: 'Britânica',
        biografia: 'Escritora britânica de romances policiais e de mistério, uma das autoras mais lidas de todos os tempos.',
        dataCadastro: new Date().toISOString(),
      },
    ];
    saveAutores(autoresExemplo);
  }

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIAS)) {
    const categoriasExemplo: Categoria[] = [
      {
        id: '1',
        nome: 'Livros Técnicos',
        tamanho: 'Grande',
        tipoEmbalagem: 'Papelão',
        percentualReajustePadrao: 10,
      },
      {
        id: '2',
        nome: 'Livros Infantis',
        tamanho: 'Médio',
        tipoEmbalagem: 'Papelão',
        percentualReajustePadrao: 5,
      },
      {
        id: '3',
        nome: 'Livros de Mistério',
        tamanho: 'Médio',
        tipoEmbalagem: 'Papelão',
        percentualReajustePadrao: 7,
      },
      {
        id: '4',
        nome: 'Revistas',
        tamanho: 'Pequeno',
        tipoEmbalagem: 'Plástico',
        percentualReajustePadrao: 3,
      },
    ];
    saveCategorias(categoriasExemplo);

    const produtosExemplo: Produto[] = [
      {
        id: '1',
        nome: 'Clean Code',
        precoUnitario: 89.90,
        unidadeMedida: 'unidade',
        quantidadeEstoque: 25,
        quantidadeMinima: 5,
        quantidadeMaxima: 50,
        categoriaId: '1',
        authorIds: ['1'],
        editora: 'Alta Books',
        isbn: '978-8576082675',
        dataCadastro: new Date().toISOString(),
      },
      {
        id: '2',
        nome: 'O Pequeno Príncipe',
        precoUnitario: 29.90,
        unidadeMedida: 'unidade',
        quantidadeEstoque: 45,
        quantidadeMinima: 10,
        quantidadeMaxima: 100,
        categoriaId: '2',
        authorIds: ['2'],
        editora: 'Agir',
        isbn: '978-8522008731',
        dataCadastro: new Date().toISOString(),
      },
      {
        id: '3',
        nome: 'E Não Sobrou Nenhum',
        precoUnitario: 39.90,
        unidadeMedida: 'unidade',
        quantidadeEstoque: 3,
        quantidadeMinima: 5,
        quantidadeMaxima: 30,
        categoriaId: '3',
        authorIds: ['3'],
        editora: 'HarperCollins',
        isbn: '978-8595084742',
        dataCadastro: new Date().toISOString(),
      },
      {
        id: '4',
        nome: 'Revista National Geographic',
        precoUnitario: 19.90,
        unidadeMedida: 'unidade',
        quantidadeEstoque: 60,
        quantidadeMinima: 15,
        quantidadeMaxima: 80,
        categoriaId: '4',
        authorIds: [],
        editora: 'National Geographic',
        isbn: '978-0000000000',
        dataCadastro: new Date().toISOString(),
      },
    ];
    saveProdutos(produtosExemplo);
  }
};