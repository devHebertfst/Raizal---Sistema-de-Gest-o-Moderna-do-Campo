# Raizal

Aplicacao web de gestao rural para acompanhamento operacional, financeiro e produtivo de fazendas. O projeto foi construido como um prototipo front-end em React, com fluxo de autenticacao local, dashboard executivo e modulos para propriedades, plantacoes, rebanho, estoque, tarefas, calendario, relatorios e administracao de acessos.

## Visao geral

O Raizal centraliza indicadores e cadastros de uma operacao agropecuaria em uma unica interface. A aplicacao possui dois perfis:

- `gestor`: acessa o painel principal e os modulos de operacao
- `admin`: acessa o painel administrativo para cadastrar e remover gestores

Atualmente os dados sao carregados por `seed` local e mantidos em estado no cliente. A autenticacao tambem e mockada, com persistencia apenas em `localStorage` e `sessionStorage`.

## Principais funcionalidades

- Dashboard com indicadores financeiros, operacionais e produtivos
- Filtros por propriedade e periodo
- Gestao de propriedades, lavouras e rebanho
- Controle financeiro com receitas, despesas e contas
- Controle de estoque, tarefas e calendario operacional
- Alertas visuais para pendencias, vencimentos e itens criticos
- Area administrativa para gestao de usuarios do tipo gestor
- Alternancia de tema e interface responsiva

## Stack

- React 18
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- shadcn/ui + Radix UI
- TanStack Query
- Recharts
- Vitest + Testing Library

## Estrutura do projeto

```text
src/
  components/
    agro/        # componentes de dominio
    ui/          # base visual e componentes reutilizaveis
  context/       # autenticacao, tema e estado da fazenda
  data/          # tipos e dados iniciais mockados
  layouts/       # layout principal autenticado
  pages/         # paginas e modulos da aplicacao
  test/          # setup e testes
```

## Como executar

### Pre-requisitos

- Node.js 18+ recomendado
- npm

### Instalacao

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

### Build de producao

```bash
npm run build
```

### Preview local

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Testes

```bash
npm run test
```

## Acessos de demonstracao

Use as credenciais abaixo na tela de login:

### Gestor

- E-mail: `gestor@Raizal.com`
- Senha: `gestor123`

### Administrador

- E-mail: `admin@Raizal.com`
- Senha: `admin123`

## Estado atual do projeto

Este repositorio representa principalmente um prototipo funcional de interface. Hoje ele:

- nao possui backend real
- nao integra banco de dados
- nao possui autenticacao segura em servidor
- usa dados mockados para demonstracao
- mantem parte dos dados apenas em memoria durante a sessao

## Possiveis proximos passos

- integrar API e banco de dados
- substituir autenticacao mockada por autenticacao real
- persistir dados operacionais por usuario e propriedade
- adicionar testes de fluxos principais
- criar controle de permissoes mais granular
- publicar pipeline de CI/CD

## Scripts disponiveis

- `npm run dev`: inicia o servidor de desenvolvimento
- `npm run build`: gera a build de producao
- `npm run build:dev`: gera build em modo development
- `npm run preview`: abre a build localmente
- `npm run lint`: executa o ESLint
- `npm run test`: executa os testes uma vez
- `npm run test:watch`: executa os testes em modo watch
