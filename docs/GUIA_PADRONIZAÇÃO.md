# Guia de Governança e Padronização — SkillEx

> **Documento:** `GUIA_PADRONIZAÇÃO.md`
> **Projeto:** SkillEx — Rede social colaborativa de troca de habilidades
> **Versão:** 1.0
> **Última atualização:** 12/05/2026

Este documento define as regras obrigatórias de desenvolvimento do projeto SkillEx. Todos os integrantes da equipe devem seguir estas diretrizes ao longo das sprints para garantir rastreabilidade entre Histórias de Usuário, tasks técnicas, commits e arquivos de documentação.

---

## 1. Nomenclatura de Branches

| Nível | Padrão | Exemplo |
|---|---|---|
| Story (branch principal da US) | `feature/USXX` | `feature/US01` |
| Task | `feature/USXX-SIGLA-TYY` | `feature/US05-API-T04` |
| Correção de bug | `fix/USXX-SIGLA-TYY` | `fix/US06-API-T03` |
| Hotfix em produção | `hotfix/descricao-curta` | `hotfix/login-timeout` |
| Documentação isolada | `docs/USXX-DOC-TYY` | `docs/US00-DOC-T05` |

### Regras

- Sempre em **letras maiúsculas** para `USXX`, `TYY` e a sigla.
- Separar palavras com **hífen (-)**, nunca underscore ou espaço.
- Nunca usar acentos, caracteres especiais ou espaços.
- A branch principal de produção é `main`. Toda branch nasce a partir da `main` atualizada.
- Pull Requests devem citar a US e a task no título: `[US01-API-T04] Adicionar rota POST /auth/login`.

---

## 2. Padrão de Commits

O projeto adota **Conventional Commits** adaptado para rastreabilidade direta com as tasks do backlog.

### Estrutura

```
tipo(USXX-SIGLA-TYY): descrição curta no imperativo
```

Com corpo opcional para detalhamento:

```
git commit -m "feat(US01-FE-T05): adicionar tela de cadastro com senha forte" \
           -m "Adicionado componente PasswordStrengthMeter validando 8+ caracteres, maiúscula, minúscula, número e caractere especial."
```

### Regras

- A descrição curta deve estar no **imperativo em português** (`adicionar`, `corrigir`, `criar`), nunca no passado (`adicionado`, `corrigido`).
- O corpo é **opcional** mas recomendado quando a mudança não é autoexplicativa.
- Todos os commits são em **português**.
- Nunca commitar código comentado, arquivos de debug, credenciais ou `console.log`.
- Um commit, um propósito — não misturar feature, refatoração e correção no mesmo commit.

### Exemplos práticos (SkillEx)

```bash
# Task de schema (Prisma)
git commit -m "feat(US01-BD-T02): adicionar models User, UserProfile e Wallet"

# Task de API
git commit -m "feat(US05-API-T03): criar rota POST /requests com validação Zod"

# Task de frontend
git commit -m "feat(US04-FE-T06): adicionar card de usuário no feed com score de match"

# Task de validação de regra de negócio
git commit -m "feat(US06-API-T04): bloquear saldo na carteira ao aceitar solicitação" \
           -m "Cria transação LOCK e move valor de balance para lockedBalance antes de atualizar status da request."

# Correção de bug
git commit -m "fix(US08-API-T02): corrigir autenticação JWT em conexões socket.io"

# Documentação
git commit -m "docs(US00-DOC-T02): adicionar backlog refinado e DER em /docs"

# Configuração / infraestrutura
git commit -m "chore(US01-INFRA-T01): configurar Prisma com SQLite e variáveis de ambiente"

# Testes
git commit -m "test(US04-QA-T08): cobrir algoritmo de match com cenários PERFECT, PARTIAL e COIN_ONLY"
```

---

## 3. Nomenclatura de Tasks

Toda task do backlog segue o padrão:

```
[USxx][SIGLA][Txx] — Descrição clara da task
```

| Parte | Descrição | Exemplo |
|---|---|---|
| **Identificador** | Número da História de Usuário, ou `AVULSO` para tarefas fora do cronograma | `US05`, `AVULSO` |
| **Sigla** | Sistema/camada afetada (ver tabela na seção 4) | `API`, `FE` |
| **Txx** | Número sequencial da task **dentro** da US | `T01`, `T02` |
| **Descrição** | Texto objetivo, começando com substantivo ou verbo no infinitivo | `Rota POST /auth/login com JWT` |

### Exemplos

```
[US01][BD][T02] — Schema Prisma inicial: User, UserProfile e Wallet
[US04][API][T03] — Algoritmo de match: função pura com 7 critérios ponderados
[US05][FE][T07] — Tela de detalhe da solicitação com chat realtime
[US08][API][T01] — Servidor socket.io com autenticação JWT por middleware
[US11][QA][T04] — Testes E2E Playwright: fluxo de exclusão de conta (LGPD)
```

---

## 4. Siglas de Sistema (Tasks e Commits)

Use estas siglas para o componente `[SIGLA]` em tasks e o `SIGLA` em commits.

| Sigla | Sistema | Escopo de atuação |
|---|---|---|
| **`BD`** | Banco de Dados | `prisma/schema.prisma`, migrations, seeds, scripts SQL |
| **`API`** | Backend Express | Rotas, controllers, services, middlewares, validações Zod, socket.io |
| **`FE`** | Frontend React | Pages, components, contexts, hooks, styles, integração com API |
| **`QA`** | Qualidade / Testes | Vitest unitário, Supertest integração, Playwright E2E |
| **`DOC`** | Documentação | Arquivos em `/docs`, README, comentários Swagger |
| **`INFRA`** | Infraestrutura | Docker, GitHub Actions (CI/CD), PWA (manifest + service worker), deploy |

---

## 5. Tipos de Commit

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade: model, rota, componente, endpoint, página |
| `fix` | Correção de bug ou comportamento incorreto |
| `docs` | Alterações apenas em documentação (`/docs`, README, JSDoc, Swagger) |
| `style` | Formatação, indentação, CSS puro — sem mudança de lógica |
| `refactor` | Reestruturação de código sem adicionar feature ou corrigir bug |
| `test` | Adição ou correção de testes |
| `chore` | Configuração de ambiente, dependências, `.gitignore`, scripts de build |

---

## 6. Nomenclatura de Arquivos em `/docs`

Todos os arquivos de documentação devem ser nomeados seguindo a estrutura:

```
SIGLA_nome-do-arquivo-em-kebab-case_vXX.extensão
```

### Tabela de referência

| Campo | Descrição | Regra | Exemplo |
|---|---|---|---|
| **SIGLA** | Área ou tipo do documento | Letras maiúsculas (2–5 caracteres) | `DOC`, `BD`, `API` |
| **nome** | Descrição do conteúdo | Minúsculas separadas por hífen (kebab-case) | `cronograma-sprints` |
| **versão** | Controle de revisão | Prefixo `v` seguido de dois dígitos | `v01`, `v02` |
| **extensão** | Tipo do arquivo | Preferencialmente `.md` | `.md`, `.png` |

### Siglas oficiais para documentação

| Sigla | Categoria | Conteúdo típico |
|---|---|---|
| **`DOC`** | Documentação geral | Planejamento, cronogramas, atas, governança, backlog, tasks |
| **`BD`** | Banco de dados | Diagramas Entidade-Relacionamento, dicionários de dados, scripts SQL |
| **`API`** | Backend / Interface | Especificação de endpoints, contratos JSON, autenticação |
| **`FE`** | Frontend | Wireframes, protótipos, guias de estilo, fluxogramas de tela |
| **`QA`** | Qualidade | Planos de teste, relatórios de bugs, checklists de homologação |
| **`INFRA`** | Infraestrutura | Manuais de deploy, arquitetura, diagramas de containers |
| **`TAP`** | Termo de Abertura | Documento inicial de escopo do TCC |

### Exemplos práticos no repositório SkillEx

| Tipo de arquivo | Nome sugerido |
|---|---|
| Guia de governança | `GUIA_PADRONIZAÇÃO.md` |
| Backlog refinado | `BACKLOGS.md` |
| Cronograma de sprints | `CRONOGRAMA_SPRINTS.md` |
| Backlog de tasks | `TASKS.md` |
| Diagrama ER | `DER.md` |
| Especificação da API | `API_referencia-endpoints_v01.md` |
| Wireframes | `FE_wireframes-baixa-fidelidade_v01.md` |
| Plano de testes | `QA_plano-testes_v01.md` |
| Arquitetura | `INFRA_arquitetura-deploy_v01.md` |

---

## 7. Definition of Done (DoD)

Uma task só é considerada **concluída** quando:

1. Código está mergeado na `main` via Pull Request aprovado por pelo menos 1 outro membro.
2. Commits seguem o padrão da seção 2.
3. Testes automatizados (quando aplicável) passam no CI.
4. Não há `console.log`, `TODO` órfão ou código comentado.
5. Documentação relacionada (Swagger, README, `/docs`) está atualizada.
6. A task foi marcada como `Done` no quadro do grupo.

---

## 8. Fluxo resumido

```
1. Criar branch  →  git checkout -b feature/US05-API-T03
2. Desenvolver   →  commits no padrão tipo(USXX-SIGLA-TYY): ...
3. Push          →  git push -u origin feature/US05-API-T03
4. Abrir PR      →  título [US05-API-T03] Criar rota POST /requests
5. Code review   →  ao menos 1 aprovação
6. Merge         →  squash & merge na main
7. Atualizar     →  marcar task como Done no quadro
```
