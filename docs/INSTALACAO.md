# 🚀 Guia de Instalação e Execução — SkillEx

Este guia explica como configurar e executar a plataforma localmente.

## Pré-requisitos

- **Node.js 18 ou superior** ([download](https://nodejs.org))
- **npm** (acompanha o Node.js)
- Um navegador moderno (Chrome, Edge, Firefox)

Verifique a instalação:

```bash
node --version
npm --version
```

---

## 1. Backend (API)

A API roda na porta **3333** e usa um banco **SQLite** (criado automaticamente).

```bash
cd backend

# 1. Instalar dependências
npm install

# 2. Criar o banco, aplicar as migrations e popular com dados fictícios
npm run db:setup

# 3. Iniciar a API em modo desenvolvimento
npm run dev
```

A API estará disponível em **http://localhost:3333**.
Teste o *healthcheck*: http://localhost:3333/health

> O arquivo `.env` já vem configurado para desenvolvimento. Em produção, gere um
> `JWT_SECRET` forte.

### Scripts úteis do backend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia a API com *hot reload* |
| `npm run db:setup` | Cria o banco + migrations + seed |
| `npm run seed` | Repopula o banco com dados fictícios |
| `npm run db:reset` | Apaga e recria o banco do zero |
| `npm run prisma:studio` | Abre o Prisma Studio (visualizador do banco) |
| `npm run build` | Compila o TypeScript para produção |

---

## 2. Frontend (Interface)

Em **outro terminal**, com a API já rodando:

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Iniciar a interface
npm run dev
```

Acesse **http://localhost:5173** no navegador.

> O Vite encaminha automaticamente as chamadas `/api`, `/uploads` e o WebSocket
> `/socket.io` para a porta 3333 (proxy), evitando problemas de CORS.

---

## 3. Contas de teste

Todas as contas usam a senha **`senha123`**.

| E-mail | Papel | Destaque |
|--------|-------|----------|
| `ana@skillex.com` | **Admin** | Ensina Violino, quer Tricô (match perfeito com Bruno) |
| `bruno@skillex.com` | Usuário | Ensina Tricô, quer Violino |
| `carla@skillex.com` | Usuário | Ensina Inglês/Fotografia, quer Programação |
| `diego@skillex.com` | Usuário | Ensina Programação, quer Inglês |
| `lucas@skillex.com` | Usuário | Fotógrafo (recebeu pagamento em moedas) |

> Dica para a banca: faça login como **`bruno@skillex.com`** e abra o **Feed** — a
> **Ana** aparece no topo com **score 100** (match perfeito violino ↔ tricô).

---

## 4. Solução de problemas

| Problema | Solução |
|----------|---------|
| Porta 3333 ocupada | Altere `PORT` no arquivo `backend/.env` |
| Erro "Cannot find module" | Rode `npm install` na pasta correspondente |
| Banco com dados estranhos | Rode `npm run db:reset` e depois `npm run seed` |
| Tela em branco no front | Verifique se a API (porta 3333) está rodando |
| Fotos de perfil não carregam | As fotos do seed usam o serviço externo *pravatar* (requer internet) |

---

## 5. Build de produção (opcional)

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build   # gera a pasta dist/
```
