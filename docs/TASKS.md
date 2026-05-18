# Backlog de Tasks Detalhado — SkillEx

> **Documento:** `TASKS.md`
> **Projeto:** SkillEx
> **Versão:** 1.0
> **Última atualização:** 12/05/2026

Este documento detalha as tasks técnicas de cada **História de Usuário (US)** definida no [backlog refinado](BACKLOGS.md), seguindo o padrão de nomenclatura definido no [guia de governança](GUIA_PADRONIZAÇÃO.md):

```
[USxx][SIGLA][Txx] — Descrição da task → @responsável
```

### Legenda de responsáveis

| Apelido | Membro |
|---|---|
| `@guilherme` | Guilherme Vieira |
| `@gustavo` | Gustavo Leal |
| `@geovane` | Geovane Alves |
| `@pablo` | Pablo Henrique |
| `@vanessa` | Vanessa Santos |
| `@valeria` | Valeria Santos |

---

## [US00] — Planejamento e Arquitetura (Sprint S0)

> Sprint inicial: produção da documentação que viabiliza o desenvolvimento.

`[US00][DOC][T01]` — Inicialização do repositório: criar repositório GitHub, configurar `.gitignore`, definir permissões da equipe, criar branch `main` protegida e adicionar `README.md` com nome do projeto e stack. → **@guilherme**

`[US00][DOC][T02]` — Refinamento do backlog: transformar os requisitos funcionais do TAP em 12 EPICs e ~39 User Stories com critérios de aceitação e prioridade (entregável: `BACKLOGS.md`). → **@guilherme**

`[US00][BD][T03]` — Modelagem do banco (DER): produzir o Diagrama de Entidade-Relacionamento das 17 entidades em Mermaid + dicionário de dados (entregável: `DER.md`). → **@guilherme**

`[US00][DOC][T04]` — Cronograma e distribuição: estruturar o cronograma de 6 sprints semanais a partir de 12/05/2026 e distribuir as US (entregável: `CRONOGRAMA_SPRINTS.md`). → **@gustavo**

`[US00][DOC][T05]` — Quebra de Stories em tasks técnicas: produzir o backlog detalhado com atribuição por membro (este documento, `TASKS.md`). → **@gustavo**

`[US00][DOC][T06]` — Governança e padronização: definir padrão de branches, commits Conventional, nomenclatura de tasks, siglas de sistema e padrão de arquivos em `/docs` (entregável: `GUIA_PADRONIZAÇÃO.md`). → **@guilherme**

`[US00][FE][T07]` — Wireframes de baixa fidelidade: desenhar telas-chave (Feed, Profile, RequestNew, Wallet) e validar fluxo com a equipe. → **@vanessa**

`[US00][INFRA][T08]` — CI inicial: configurar GitHub Actions com lint + testes em PRs e proteção da branch `main`. → **@guilherme**

---

## [US01] — Fundação e Autenticação (Sprint S1)

`[US01][INFRA][T01]` — Setup do monorepo: estruturar pastas `backend/` e `frontend/`, inicializar Express + TypeScript e React 18 + Vite, configurar scripts de dev e build. → **@guilherme**

`[US01][BD][T02]` — Schema Prisma inicial: criar models `User`, `UserProfile`, `Wallet` e `PasswordResetToken` com relacionamentos e migrations. → **@guilherme**

`[US01][API][T03]` — Rota `POST /auth/register`: validação Zod (nome, e-mail, senha forte), hash bcrypt, criação de `User` + `Wallet` em transação. → **@gustavo**

`[US01][API][T04]` — Rota `POST /auth/login`: validação Zod, bcrypt.compare, emissão de JWT com `JWT_SECRET` via env. → **@gustavo**

`[US01][API][T05]` — Middleware `requireAuth`: extrai e valida JWT em rotas protegidas, popula `req.user`. → **@guilherme**

`[US01][FE][T06]` — Tela de cadastro: formulário com componente `PasswordStrengthMeter` (8+, maiúscula, minúscula, número, especial), feedback de erro. → **@vanessa**

`[US01][FE][T07]` — Integração IBGE no cadastro: dropdowns em cascata Estado → Cidade consumindo `servicodados.ibge.gov.br`. → **@valeria**

`[US01][FE][T08]` — Crop de avatar no cadastro: componente de upload + crop em canvas antes da submissão, conversão para base64/Blob. → **@geovane**

`[US01][FE][T09]` — Tela de Login: formulário + integração com `/auth/login`, persistência do JWT no `localStorage`, redirect para `/feed`. → **@geovane**

`[US01][API][T10]` — Recuperação de senha: rotas `POST /auth/forgot-password` (gera token + SHA-256) e `POST /auth/reset-password` (valida hash + expiração + uso único). → **@pablo**

`[US01][FE][T11]` — Telas `ForgotPassword` e `ResetPassword` integradas à API. → **@pablo**

`[US01][API][T12]` — Rota `POST /auth/change-password`: valida senha atual, exige senha forte, atualiza hash. → **@pablo**

`[US01][QA][T13]` — Testes unitários + integração do módulo `auth` (cadastro válido/inválido, login, JWT, recuperação, alteração). → **@gustavo**

`[US01][FE][T14]` — `AuthContext` global e roteamento protegido com `<ProtectedRoute>`. → **@vanessa**

---

## [US02] — Perfil e Onboarding (Sprint S2)

`[US02][BD][T01]` — Garantir model `UserProfile` (1:1) com campos `gender`, `birthDate`, `nationality`, `languages` (JSON), `availability` (JSON), `learningPrefs` (JSON), `preferredModality`. → **@guilherme**

`[US02][API][T02]` — Endpoints `GET /users/me`, `PATCH /users/me`, `POST /users/me/onboarding-step`. → **@gustavo**

`[US02][API][T03]` — Endpoint público `GET /users/:id` retornando dados do perfil + média de reviews + skills (teach/learn). → **@gustavo**

`[US02][FE][T04]` — Tela `Onboarding`: multi-step com persistência por etapa e marcação de `onboardingCompleted` ao final. → **@pablo**

`[US02][FE][T05]` — Tela `EditProfile`: edição de avatar, bio, cidade/estado (IBGE), idiomas, disponibilidade, modalidade. → **@vanessa**

`[US02][FE][T06]` — Tela `Profile` (público): exibe avatar, bio, skills, média de estrelas, botões Favoritar/Solicitar. → **@geovane**

`[US02][QA][T07]` — Testes de integração do módulo `users`. → **@vanessa**

---

## [US03] — Habilidades (Sprint S2)

`[US03][BD][T01]` — Models `Category`, `Skill`, `UserTeachingSkill`, `UserLearningSkill` com `@@unique(userId, skillId)`. → **@guilherme**

`[US03][BD][T02]` — Seed inicial de categorias e habilidades populares (Música, Idiomas, Tecnologia, Esportes, Arte...). → **@gustavo**

`[US03][API][T03]` — Endpoints `GET /categories`, `GET /skills` (com filtro por categoria), `POST /skills` (admin). → **@gustavo**

`[US03][API][T04]` — Endpoints `GET|POST|PATCH|DELETE /users/me/teaching-skills`. → **@pablo**

`[US03][API][T05]` — Endpoints `GET|POST|PATCH|DELETE /users/me/learning-skills` + validação de skill não duplicada entre teach/learn. → **@pablo**

`[US03][FE][T06]` — Tela `Skills`: abas Teach/Learn, busca no catálogo, formulário de adição com nível, modalidade, preço. → **@valeria**

`[US03][QA][T07]` — Testes do módulo `skills` (validação de duplicação, vínculos, listagem). → **@valeria**

---

## [US04] — Feed, Match e Descoberta (Sprint S3)

`[US04][API][T01]` — **Algoritmo de match (função pura)**: implementar `calculateMatch(a, b)` retornando `{score, type, breakdown}` com os 7 critérios ponderados (reciprocidade 50, skillMatch 20, location 8, language 7, modality 7, availability 5, activity 3). → **@guilherme**

`[US04][BD][T02]` — Model `Match` para cache da compatibilidade calculada (`userAId`, `userBId`, `score`, `type`). → **@guilherme**

`[US04][API][T03]` — Endpoint `GET /match/:userId` que carrega dados de A e B, chama `calculateMatch` e cacheia em `Match`. → **@guilherme**

`[US04][API][T04]` — Endpoint `GET /feed` priorizado: lista candidatos ordenados por score, com paginação. → **@pablo**

`[US04][API][T05]` — Endpoint `GET /feed/suggestions`: top N matches recém-calculados para destaque. → **@pablo**

`[US04][API][T06]` — Endpoints `GET /users` com busca avançada por habilidade, categoria, cidade, modalidade (query params). → **@gustavo**

`[US04][API][T07]` — Endpoints `GET|POST|DELETE /favorites` e `GET|POST|DELETE /users/me/saved-skills`. → **@gustavo**

`[US04][FE][T08]` — Tela `Feed` com cards de match (badge de score, habilidades em comum, CTA para perfil). → **@vanessa**

`[US04][FE][T09]` — Tela `Search` com filtros persistidos na URL (query string), paginação. → **@vanessa**

`[US04][FE][T10]` — Tela `Favorites` listando usuários e skills salvos. → **@valeria**

`[US04][QA][T11]` — **Testes do algoritmo de match**: cenários `PERFECT`, `PARTIAL`, `COIN_ONLY`, perfil incompleto, atividade recente. → **@guilherme**

---

## [US05] — Solicitações de Troca (Sprint S3)

`[US05][BD][T01]` — Models `ExchangeRequest` e `ExchangeRequestEvent` com FK em cascata. → **@guilherme**

`[US05][API][T02]` — Endpoint `POST /requests`: cria solicitação `EXCHANGE` ou `COIN`, valida coerência (se EXCHANGE → offeredSkillId obrigatório; se COIN → coinAmount > 0), gera evento `PENDING`. → **@gustavo**

`[US05][API][T03]` — Endpoint `PATCH /requests/:id/accept`: muda status para `ACCEPTED`, gera evento, dispara notificação ao requester, em COIN dispara LOCK na wallet. → **@gustavo**

`[US05][API][T04]` — Endpoint `PATCH /requests/:id/reject`: muda status para `REJECTED`, gera evento, notifica. → **@gustavo**

`[US05][API][T05]` — Endpoint `PATCH /requests/:id/complete`: muda para `COMPLETED`, em COIN executa UNLOCK + SPEND + EARNING atomicamente. → **@guilherme**

`[US05][API][T06]` — Endpoint `PATCH /requests/:id/cancel`: muda para `CANCELLED`, em COIN aceito executa REFUND. → **@guilherme**

`[US05][API][T07]` — Endpoints `GET /requests` (inbox), `GET /requests/:id` (detalhe com eventos). → **@pablo**

`[US05][FE][T08]` — Tela `RequestNew`: formulário com seletor de tipo (EXCHANGE / COIN), skill solicitada, skill ofertada ou valor em moedas. → **@geovane**

`[US05][FE][T09]` — Tela `Requests` (inbox): abas Enviadas/Recebidas com filtro por status. → **@valeria**

`[US05][FE][T10]` — Tela `RequestDetail`: timeline de eventos, botões aceitar/rejeitar/concluir/cancelar conforme status. → **@geovane**

`[US05][QA][T11]` — Testes de integração: ciclo completo PENDING → ACCEPTED → COMPLETED, com e sem moedas. → **@gustavo**

---

## [US06] — Carteira SkillCoins (Sprint S4)

`[US06][BD][T01]` — Garantir model `Wallet` (1:1 com User, criada no cadastro) + `CoinTransaction`. → **@guilherme**

`[US06][API][T02]` — Endpoint `GET /wallet`: retorna `balance`, `lockedBalance`, `total`. → **@gustavo**

`[US06][API][T03]` — Endpoint `GET /wallet/transactions`: histórico paginado ordenado por `createdAt desc`. → **@gustavo**

`[US06][API][T04]` — **Service `wallet.service.ts` com operações atômicas**: `lockBalance(userId, amount, requestId)`, `unlockAndSpend(...)`, `earn(...)`, `refund(...)`, `bonus(...)` — todas usando `prisma.$transaction` para garantir atomicidade entre alteração de saldo e criação de `CoinTransaction`. → **@guilherme**

`[US06][API][T05]` — Endpoint `POST /wallet/bonus` (admin): credita bônus a um usuário. → **@gustavo**

`[US06][FE][T06]` — Tela `Wallet`: cards de saldo disponível + bloqueado + total, gráfico simples de movimentações. → **@vanessa**

`[US06][FE][T07]` — Tela `Wallet`: lista de transações com tipo, valor, descrição, link para request relacionada. → **@vanessa**

`[US06][QA][T08]` — Testes do `wallet.service`: cenários LOCK/UNLOCK/SPEND/EARNING/REFUND, concorrência básica, rejeição quando saldo insuficiente. → **@guilherme**

---

## [US07] — Avaliações (Sprint S4)

`[US07][BD][T01]` — Model `Review` com `@@unique(requestId, authorId)`. → **@guilherme**

`[US07][API][T02]` — Endpoint `POST /reviews`: valida que request está `COMPLETED` e autor é participante, rating 1–5. → **@pablo**

`[US07][API][T03]` — Endpoint `GET /users/:id/reviews` e cálculo agregado `GET /users/:id/rating`. → **@pablo**

`[US07][FE][T04]` — Modal de avaliação após conclusão (estrelas + comentário). → **@valeria**

`[US07][FE][T05]` — Bloco de reviews no `Profile` público (média, contagem, últimos comentários). → **@valeria**

`[US07][QA][T06]` — Testes do módulo `reviews` (validação de status, unicidade). → **@pablo**

---

## [US08] — Notificações e Realtime (Sprint S4)

`[US08][BD][T01]` — Models `Notification` e `ChatMessage`. → **@guilherme**

`[US08][API][T02]` — **Servidor socket.io**: instanciar junto ao Express na mesma porta, middleware de autenticação JWT no `handshake`, rooms `user:{id}` e `request:{id}`. → **@guilherme**

`[US08][API][T03]` — Service `notifications.service.ts`: cria `Notification` + emite evento via socket para `user:{id}`. → **@guilherme**

`[US08][API][T04]` — Endpoints `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`. → **@gustavo**

`[US08][API][T05]` — Service de chat: `POST /requests/:id/messages` cria `ChatMessage` e emite para `request:{id}`. → **@guilherme**

`[US08][API][T06]` — Disparar notificações nos eventos relevantes (REQUEST_RECEIVED, ACCEPTED, REJECTED, COMPLETED, NEW_MESSAGE, NEW_MATCH, REVIEW_RECEIVED, COINS_RECEIVED). → **@gustavo**

`[US08][FE][T07]` — Hook `useRealtime()`: cliente socket.io com JWT, reconexão automática, listeners por tipo de evento. → **@guilherme**

`[US08][FE][T08]` — Sidebar com badge de notificações não lidas em tempo real. → **@valeria**

`[US08][FE][T09]` — Tela `Notifications`: lista, marcar como lida, navegar para `link`. → **@valeria**

`[US08][FE][T10]` — Chat realtime na tela `RequestDetail`: lista de mensagens com scroll para o final, input de envio, indicador "lida". → **@geovane**

`[US08][QA][T11]` — Testes do socket.io (cliente real conectando, recebendo evento de notificação). → **@guilherme**

---

## [US09] — Denúncias (Sprint S5)

`[US09][BD][T01]` — Model `Report` com tipos `INAPPROPRIATE_CONTENT | HARASSMENT | SCAM | FAKE_PROFILE | SPAM | OTHER` e status `PENDING | UNDER_REVIEW | RESOLVED | DISMISSED`. → **@guilherme**

`[US09][API][T02]` — Endpoint `POST /reports`: validação Zod, alvo opcional (user e/ou request), descrição obrigatória. → **@gustavo**

`[US09][API][T03]` — Endpoints `GET /admin/reports` (com filtro por status) e `PATCH /admin/reports/:id` (mudança de status + `adminNote` + `resolvedById`). → **@gustavo**

`[US09][FE][T04]` — Modal "Denunciar usuário" acessível em Profile e RequestDetail. → **@pablo**

`[US09][FE][T05]` — Aba "Denúncias" no painel `Admin` com filtros e fluxo de moderação. → **@vanessa**

`[US09][QA][T06]` — Testes do módulo `reports`. → **@pablo**

---

## [US10] — Painel Administrativo (Sprint S5)

`[US10][API][T01]` — Middleware `requireAdmin` (valida `role = ADMIN`). → **@guilherme**

`[US10][API][T02]` — Endpoints `GET /admin/users`, `PATCH /admin/users/:id` (alterar `isActive`, `role`). → **@gustavo**

`[US10][API][T03]` — CRUD `/admin/categories` e `/admin/skills` com bloqueio de exclusão para skills em uso. → **@gustavo**

`[US10][API][T04]` — Endpoint `/stats` retornando contagem de usuários ativos, requests por status, denúncias pendentes, top skills. → **@pablo**

`[US10][FE][T05]` — Tela `Admin` com abas Usuários/Categorias/Skills/Denúncias/Estatísticas. → **@vanessa**

`[US10][FE][T06]` — Telas `Trends` (top skills) e `Ranking` (top usuários por reputação). → **@valeria**

`[US10][QA][T07]` — Testes do módulo `admin` (proteção via `requireAdmin`). → **@vanessa**

---

## [US11] — Segurança e LGPD (Sprint S5)

`[US11][API][T01]` — Configurar **helmet** com CSP adequado ao frontend Vite. → **@guilherme**

`[US11][API][T02]` — Configurar **rate-limit** por IP em `/auth/*`, `/reports`, `/auth/forgot-password`. → **@guilherme**

`[US11][API][T03]` — Validação global via Zod middleware nas camadas de rota. → **@gustavo**

`[US11][API][T04]` — Endpoint `DELETE /users/me`: marca `isActive = false`, anonimiza `name`, `email`, `avatarUrl`, `bio`, `city`, `state`; invalida senha. → **@guilherme**

`[US11][FE][T05]` — Tela `Settings` com botão "Excluir conta" + confirmação dupla. → **@pablo**

`[US11][FE][T06]` — Páginas `Terms` e `Privacy` acessíveis publicamente, com `LegalLayout` compartilhado. → **@pablo**

`[US11][QA][T07]` — Testes E2E (Playwright) do fluxo de exclusão de conta. → **@geovane**

`[US11][QA][T08]` — Testes de segurança: tentar acessar rotas protegidas sem token, com token expirado, com role insuficiente. → **@gustavo**

---

## [US12] — PWA, Testes e Entrega (Sprint S5)

`[US12][INFRA][T01]` — Configurar `vite-plugin-pwa`: `manifest.webmanifest` com nome, ícones (192/512/maskable), tema, cor de fundo. → **@valeria**

`[US12][INFRA][T02]` — Service worker com estratégia de cache para assets estáticos e fallback offline simples. → **@valeria**

`[US12][INFRA][T03]` — Dockerfile multistage para backend + Dockerfile para frontend + `docker-compose.yml`. → **@guilherme**

`[US12][INFRA][T04]` — CI GitHub Actions: lint + testes backend (Vitest) + testes frontend (Vitest) + testes E2E (Playwright) em PRs. → **@guilherme**

`[US12][API][T05]` — Swagger UI em `/api/docs` com schemas Zod convertidos via `zod-to-openapi`. → **@pablo**

`[US12][QA][T06]` — Testes E2E Playwright cobrindo fluxos críticos: cadastro, login, criação de solicitação, aceitação + chat, conclusão + avaliação, wallet, admin. → **@geovane**

`[US12][QA][T07]` — Garantir cobertura 100% em utils, hooks e componentes UI do frontend. → **@vanessa**

`[US12][DOC][T08]` — Atualizar `README.md` principal com setup, stack, scripts, links para `/docs`. → **@gustavo**

`[US12][DOC][T09]` — Roteiro de apresentação final para banca (`ROTEIRO-APRESENTACAO.md` já existente — revisar). → **@gustavo**

`[US12][DOC][T10]` — Manual de instalação atualizado (`INSTALACAO.md`). → **@pablo**

---

## Resumo de Distribuição

| Membro | Áreas de responsabilidade |
|---|---|
| **@guilherme** | Schema Prisma, algoritmo de match, wallet (transações atômicas), socket.io, LGPD, helmet/rate-limit, CI/Docker, governança, DER |
| **@gustavo** | Endpoints `/auth`, `/users`, `/admin`, `/skills`, `/categories`, seed, testes de integração, cronograma, README |
| **@geovane** | Crop de avatar, tela Login, RequestNew, RequestDetail com chat, testes E2E Playwright, perfil público |
| **@pablo** | Recuperação de senha, onboarding, feed, reviews, Settings, Terms/Privacy, Swagger, INSTALACAO |
| **@vanessa** | Tela Register, EditProfile, AuthContext, Feed, Wallet, Admin, wireframes, cobertura 100% UI |
| **@valeria** | IBGE, Skills (CRUD), Favorites, Notifications, Trends, Ranking, PWA (manifest + SW) |

---

## Resumo Quantitativo

| Sprint | US incluídas | Nº de tasks |
|---|---|---|
| **S0** | US00 | 8 |
| **S1** | US01 | 14 |
| **S2** | US02 + US03 | 7 + 7 = 14 |
| **S3** | US04 + US05 | 11 + 11 = 22 |
| **S4** | US06 + US07 + US08 | 8 + 6 + 11 = 25 |
| **S5** | US09 + US10 + US11 + US12 | 6 + 7 + 8 + 10 = 31 |
| **Total** | 12 US | **114 tasks** |
