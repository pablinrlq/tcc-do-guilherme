# SkillEx VS Code Tasks Guide

## Como Usar as Tasks

Abra a paleta de comandos:
- **Windows/Linux**: `Ctrl + Shift + P`
- **macOS**: `Cmd + Shift + P`

Ou use o atalho `Terminal > Run Task`.

## Tasks Principais

### 🚀 Desenvolvimento

| Task | Descrição | Atalho |
|------|-----------|--------|
| **Dev: Backend + Frontend** | Inicia ambos os servidores em paralelo | `Ctrl+Shift+P` → "Dev: Backend" |
| **Backend: Dev Server** | Roda apenas o servidor Express (porta 3333) | - |
| **Frontend: Dev Server** | Roda apenas o Vite (porta 5173) | - |

**Resultado esperado:**
- Backend: "🎯 API running at http://localhost:3333"
- Frontend: "✓ local: http://localhost:5173"

---

### 📦 Configuração Inicial

| Task | Descrição |
|------|-----------|
| **Setup: Database + Install** | Cria o banco SQLite e seed com dados de teste |
| **npm: Install All Dependencies** | Instala dependências do backend e frontend |
| **Backend: DB Reset** | Reseta o banco (schema + seed) |

**Primeiro uso:**
```
1. Setup: Database + Install
2. Dev: Backend + Frontend
3. Abra http://localhost:5173
```

---

### ✅ Validação

| Task | Descrição |
|------|-----------|
| **Check: Types (Frontend + Backend)** | Roda `tsc --noEmit` em ambos (sem gerar `.js`) |
| **Frontend: Type-Check** | Verifica tipos do frontend apenas |
| **Backend: Type-Check** | Verifica tipos do backend apenas |

Use **antes de fazer commit** para garantir type-safety.

---

### 🔨 Build para Produção

| Task | Descrição |
|------|-----------|
| **Build: Frontend + Backend** | Gera bundles otimizados (`dist/` e `build/`) |
| **Frontend: Build** | Compila o Vite (minified, otimizado) |
| **Backend: Build** | Compila TypeScript para JavaScript |

---

## Dicas de Produtividade

### Múltiplas Tasks em Paralelo
Use o painel "Terminal" para abrir vários terminais:
1. Clique no **+** no painel inferior
2. Execute tarefas diferentes em cada aba

### Problemas Comuns

**"Port 3333/5173 already in use"**
- Kill o processo: `netstat -ano | findstr :3333` (Windows) ou `lsof -i :3333` (Mac/Linux)
- Ou aguarde 5s e inicie de novo

**Tipos não compilam**
- Execute `npm: Install All Dependencies` (dependências desatualizadas)
- Rode `Check: Types (Frontend + Backend)` para diagnóstico

**"Cannot find module"**
- Frontend: delete `node_modules/` e `package-lock.json`, depois `npm --prefix frontend install`
- Mesmo para backend

---

## Integrações

### Pre-commit Hook (Recomendado)

Adicione ao seu workflow antes de fazer push:
1. Rode **Check: Types (Frontend + Backend)**
2. Verifique se há erros no painel "Problems"
3. Se tudo passar: `git commit`

### CI/CD

As mesmas tasks rodam no servidor (GitHub Actions/GitLab CI):
- `npm run build` (compila ambos)
- `npm run dev` (testes locais)

---

## Referência de Ports

| Serviço | Porta | URL |
|---------|-------|-----|
| Backend API | 3333 | http://localhost:3333 |
| Frontend App | 5173 | http://localhost:5173 |
| Database | - | `backend/prisma/dev.db` |

---

## Troubleshooting

**Task não aparece na paleta?**
- Recarregue a janela: `Cmd/Ctrl + R`

**"Task terminated with exit code 1"**
- Verifique a aba "Terminal" para erros detalhados
- Pode ser port em uso, dependência faltante ou erro de sintaxe

**Build lento?**
- Normal para first run (análise de dependências)
- Próximas builds são incrementais e mais rápidas
