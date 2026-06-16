# 🔄 SkillEx — Plataforma de Troca de Habilidades

> Projeto de TCC — Curso de Desenvolvimento de Sistemas.
> Rede social colaborativa onde pessoas **ensinam e aprendem habilidades entre si** (Skill Exchange), com sistema de match inteligente e moeda interna.

![status](https://img.shields.io/badge/status-MVP%20funcional-orange)
![stack](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20TypeScript%20%7C%20Express%20%7C%20Prisma%20%7C%20Socket.IO%20%7C%20SQLite-blue)

---

## 📖 Sobre

A **SkillEx** conecta pessoas com conhecimentos complementares. Exemplo clássico:
uma pessoa sabe **violino** e quer aprender **tricô**; outra sabe **tricô** e quer aprender
**violino** → a plataforma detecta o **match perfeito** e sugere a troca. Quem não tem uma
habilidade compatível pode pagar a aula com a **moeda interna (SkillCoins)**.

## 🧱 Arquitetura

```
┌──────────────────────┐      HTTP/JSON + JWT      ┌──────────────────────┐
│   Frontend (SPA)     │  ───────────────────────► │   Backend (API REST) │
│  React + TS + SCSS   │                           │   Express + TS       │
│  PWA · mobile-first  │  ◄─────────────────────── │   Prisma ORM         │
└──────────────────────┘   WebSocket (socket.io)   └──────────┬───────────┘
                                                              │
                                                       ┌──────▼───────┐
                                                       │   SQLite     │
                                                       └──────────────┘
```

## 🗂️ Estrutura do repositório

| Pasta | Descrição |
|-------|-----------|
| `backend/`  | API REST (Express + Prisma + SQLite) |
| `frontend/` | Aplicação SPA (React + Vite + TypeScript + SCSS) |
| `docs/`     | Documentação técnica e acadêmica do TCC |

## 🚀 Como rodar (resumo)

```bash
# 1. Backend
cd backend
npm install
npm run db:setup     # cria banco, aplica migrations e popula com dados fictícios
npm run dev          # API em http://localhost:3333

# 2. Frontend (em outro terminal)
cd frontend
npm install
npm run dev          # App em http://localhost:5173
```

> Instruções completas de instalação, contas de teste e detalhes de cada módulo estão em [`docs/`](docs/).

## 🐳 Deploy com Docker

A forma mais simples de subir tudo (frontend + backend + banco) é via Docker.

```bash
# 1. (uma vez) dê permissão de execução ao script
chmod +x deploy.sh

# 2. build + sobe em segundo plano (cria o .env e gera o JWT_SECRET sozinho)
./deploy.sh
```

Depois disso a aplicação fica disponível em:

| Serviço | URL |
|---------|-----|
| App (frontend) | http://localhost |
| API | http://localhost:3333 |
| Healthcheck | http://localhost:3333/health |
| Swagger | http://localhost:3333/api-docs |

Conta de teste (criada quando `SEED_ON_START=true`): **ana@skillex.com / senha123**.

Outros comandos do script:

```bash
./deploy.sh logs      # acompanha os logs
./deploy.sh status    # estado dos containers
./deploy.sh down      # para (mantém o banco e os uploads)
./deploy.sh reset     # para e APAGA os volumes (zera o banco)
./deploy.sh rebuild   # rebuild sem cache
```

> No Windows, rode o script pelo **Git Bash** ou **WSL**. Ajustes de produção
> (JWT_SECRET, CLIENT_URL, desligar o seed) ficam no arquivo `.env` da raiz.

## ✨ Funcionalidades

- Cadastro, login e autenticação segura (JWT + bcrypt)
- Alteração e recuperação de senha (token de uso único)
- Onboarding guiado em etapas
- Cadastro de habilidades que ensina e que deseja aprender
- Feed social priorizado por compatibilidade
- Busca avançada com filtros
- **Algoritmo de match inteligente** (pontuação 0–100)
- Solicitações de troca e de aula paga
- Carteira e moeda interna (SkillCoins) com histórico
- Avaliações e reputação
- Notificações, favoritos e chat **em tempo real** (WebSocket via socket.io)
- Painel administrativo (gestão de usuários, categorias e habilidades)
- Exclusão de conta com anonimização de dados (LGPD)
- Segurança reforçada (helmet + rate limiting por IP)
- **PWA instalável** no celular e no desktop (vite-plugin-pwa)
- Tema claro/escuro · design mobile-first

## 👥 Integrantes do Grupo

| Nome | GitHub |
|------|--------|
| Geovane Alves da Silva | [@geovanelvs](https://github.com/geovanelvs) |
| Guilherme Otavio Amantino Vieira | [@guilhermevieirao](https://github.com/guilhermevieirao) |
| Gustavo Henrique Felix Nobre Leal | [@Gustavoleal007](https://github.com/Gustavoleal007) |
| Pablo Henrique de Jesus de Oliveira | [@pablohenriquejs](https://github.com/pablohenriquejs) |
| Valéria Martins dos Santos | [@Valmartinssantos](https://github.com/Valmartinssantos) |
| Vanessa Martins dos Santos | [@Vans-n](https://github.com/Vans-n) |

## 🎓 Orientador

**Rubens Lemos da Cruz Junior** — [@snebur84](https://github.com/snebur84)

## 📜 Licença

Projeto acadêmico desenvolvido para fins educacionais no curso Técnico em Desenvolvimento de Sistemas do SENAI.
