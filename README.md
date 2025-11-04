# 📚 Sistema BiblioStock

**Sistema Completo de Controle de Estoque para Livrarias**

![Status](https://img.shields.io/badge/status-completo-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/react-18-blue)
![TypeScript](https://img.shields.io/badge/typescript-5-blue)
![Tailwind](https://img.shields.io/badge/tailwind-4.0-blue)

---

## 🎯 Sobre o Projeto

Este repositório contém o **front-end** do sistema de controle de estoque desenvolvido como parte da disciplina **Sistemas Distribuídos e Mobile (A3)**.  
O projeto tem como objetivo gerenciar produtos, categorias e movimentações de estoque em uma **livraria**, oferecendo uma interface moderna e intuitiva.

---

## ✨ Funcionalidades Principais

### 🏠 Dashboard
- Visão geral com estatísticas em tempo real
- Cards de métricas (Total Produtos, Valor Estoque, Movimentações, Alertas)
- Produtos recentes cadastrados
- Alertas de produtos com estoque baixo

### 📁 Categorias
- CRUD completo (Create, Read, Update, Delete)
- Campos: Nome, Tamanho, Tipo Embalagem, % Reajuste Padrão
- Validação de produtos vinculados antes de excluir

### 👤 Autores
- CRUD com busca por nome ou nacionalidade
- Modal de detalhes mostrando livros do autor
- Validação: não permite excluir autor vinculado a livros (RN008)
- Campos: Nome Completo, Nacionalidade, Biografia

### 📚 Produtos (Livros)
- CRUD completo com filtros avançados
- **Seleção múltipla de autores** (obrigatório pelo menos um - RN006)
- Exibição de múltiplos autores separados por vírgula (RN009)
- Badges de status: Normal, Estoque Baixo, Excedente, Indisponível
- Campos: Nome, Autor(es), Editora, ISBN, Categoria, Preço, Qtd Estoque/Mínima/Máxima

### 📊 Movimentações de Estoque
- Registro de Entradas e Saídas
- Atualização automática do estoque do produto
- Alertas automáticos quando estoque fica abaixo do mínimo ou acima do máximo
- Reversão automática de estoque ao excluir movimentação
- Validação de quantidade suficiente para saídas

### 📈 Relatórios Gerenciais
1. **Lista de Preços**: Produtos em ordem alfabética com todos atributos
2. **Balanço Físico/Financeiro**: Quantidade × Preço com valor total
3. **Produtos Abaixo do Mínimo**: Lista de produtos críticos
4. **Produtos por Categoria**: Distribuição do estoque
5. **Produtos com Maior Movimento**: Análise de entradas e saídas

### 💰 Reajuste de Preços
- **Reajuste Global**: Aplica mesmo percentual a todos produtos
- **Reajuste por Categoria**: Aplica a uma categoria específica
- **Reajuste Padrão**: Aplica % configurado de cada categoria
- Histórico completo de todos reajustes aplicados
- Confirmação obrigatória antes de aplicar

---

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS 4.0** - Estilização
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones
- **Sonner** - Notificações (toasts)
- **LocalStorage** - Persistência de dados

---

## 📂 Estrutura do Projeto

```
/
├── App.tsx                       # Componente principal com navegação
├── types/index.ts                # Tipos TypeScript
├── lib/storage.ts                # Funções de LocalStorage
├── components/
│   ├── dashboard-page.tsx        # Dashboard
│   ├── categorias-page.tsx       # Gerenciamento de Categorias
│   ├── autores-page.tsx          # Gerenciamento de Autores
│   ├── produtos-page.tsx         # Gerenciamento de Produtos
│   ├── movimentacoes-page.tsx    # Movimentações de Estoque
│   ├── relatorios-page.tsx       # Relatórios Gerenciais
│   └── reajustes-page.tsx        # Reajustes de Preços
└── components/ui/                # Componentes shadcn/ui
```

---

## 🎨 Interface

### Paleta de Cores
- **Primary**: Amber (#D97706) - Tema de livraria
- **Secondary**: Orange (#EA580C)
- **Background**: Gradiente Amber → Orange → Rose
- **Status**: Verde (sucesso), Laranja (alerta), Vermelho (erro), Azul (info)

### Responsividade
- ✅ Desktop (≥1024px) - Sidebar fixa, grid 4 colunas
- ✅ Tablet (768-1023px) - Sidebar colapsável, grid 2 colunas
- ✅ Mobile (<768px) - Menu hamburger, grid 1 coluna

---

## 🤝 Contribuindo

Este é um projeto educacional e de portfólio. Sugestões são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👩‍💻 Equipe do Projeto

Desenvolvido como projeto de estudo de React + TypeScript + Tailwind CSS.

| Nome Completo |
|-------------------------------|
| Emely Santos da Silveira      |
| Hellen Machado Borba           |
| Letícia Beatriz Souza          |
| Maria Luiza Garcia             |
| Noah Freitas Rabelo            |

---

## 📊 Preview

### Dashboard
Visão geral com estatísticas, produtos recentes e alertas de estoque.

### Produtos
Gerenciamento completo com seleção múltipla de autores e filtros avançados.

### Relatórios
5 tipos de relatórios gerenciais para análise de negócio.

### Reajustes
3 formas de reajustar preços com histórico completo.

---

## 🔗 Links Úteis

- **React**: https://react.dev
- **TypeScript**: https://typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com
- **Lucide Icons**: https://lucide.dev

---

**Sistema BiblioStock v1.0.0**  
*Controle de Estoque Profissional para Livrarias*

Desenvolvido com ❤️ usando React, TypeScript e Tailwind CSS

---

<p align="center">
  <sub>Built with 📚 for book lovers and 💻 for developers</sub>
</p>



Este projeto está licenciado sob a **MIT License**.  
© 2025 - **Equipe A3 – Sistemas Distribuídos e Mobile**
