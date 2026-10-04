# Calash Frontend

Frontend da aplicação Calash, desenvolvido em React + Vite para gestão de agenda e agendamentos de profissionais, com área pública para clientes e painel administrativo para o profissional.

## Visão geral

Este projeto oferece:

- autenticação e cadastro de usuários
- painel profissional com agenda e gestão de serviços
- horários de funcionamento
- agendamentos e agenda pública por slug do profissional
- anamnese e ficha do cliente
- perfil do usuário e histórico de agendamentos

A aplicação consome a API do backend via Axios, configurada com a variável de ambiente `VITE_API_URL`.

## Tecnologias

- React 19
- React Router DOM
- Vite
- Tailwind CSS
- Axios
- Oxlint

## Estrutura do projeto

```bash
src/
├── components/
├── pages/
├── services/
├── App.jsx
├── main.jsx
├── index.css
├── assets/
└── ...
```

Principais áreas:

- `src/pages`: páginas da aplicação (login, cadastro, dashboard, agenda, serviços, horários, anamnese, perfil)
- `src/components`: componentes reutilizáveis e rotas protegidas
- `src/services/api.js`: configuração do cliente Axios com token de autenticação

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- Node.js 18+
- npm
- backend Calash em execução, se a aplicação depender da API

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/machadopy/calash-frontend.git
cd calash-frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure a URL da API em um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8000/api/
```

> Ajuste a URL conforme o ambiente do backend.

## Scripts disponíveis

```bash
npm run dev
```

Inicia o servidor de desenvolvimento do Vite.

```bash
npm run build
```

Gera a versão de produção em `dist/`.

```bash
npm run preview
```

Serve a build de produção localmente para pré-visualização.

```bash
npm run lint
```

Executa a análise estática com oxlint.

## Fluxo principal da aplicação

- A rota inicial redireciona para a agenda pública do profissional (`/calash`)
- Usuários podem entrar em `/login` e `/register`
- No painel profissional, é possível:
  - gerenciar procedimentos
  - configurar expediente
  - visualizar agenda diária e mensal
  - administrar agendamentos
  - revisar anamnese e perfil

## Observações

- A autenticação usa tokens salvos em `localStorage`
- As rotas administrativas são protegidas por componentes de rota (`ProfessionalRoute` e `AuthenticatedRoute`)
- A URL pública do profissional é montada pelo `slug`, permitindo agendas individuais por cliente/profissional

## Licença

Este projeto está licenciado sob a [MIT License](./LICENSE).

## Contribuição

Contribuições são bem-vindas. Para colaborar:

1. crie uma branch para sua alteração
2. faça o commit com uma mensagem clara
3. abra um pull request descrevendo a mudança

## Autor

Projeto desenvolvido por [machadopy](https://github.com/machadopy).

