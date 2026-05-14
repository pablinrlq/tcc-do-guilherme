# Cronograma de Sprints — SkillEx

> **Documento:** `CRONOGRAMA_SPRINTS.md`
> **Projeto:** SkillEx
> **Versão:** 1.0
> **Última atualização:** 12/05/2026
> **Janela total:** 12/05/2026 → 22/06/2026 (6 sprints semanais)

---

## 1. Visão Geral

O cronograma do TCC SkillEx é organizado em **6 sprints semanais** (S0–S5), cada uma com duração de 7 dias corridos, de **terça-feira a segunda-feira**. A primeira sprint (S0) é dedicada ao **Planejamento e Arquitetura** — produção da documentação que viabiliza a execução das demais sprints. As sprints S1 a S5 cobrem o desenvolvimento incremental do MVP, agrupando as 12 Histórias de Usuário definidas no [backlog refinado](BACKLOGS.md).

### Equipe

| Membro | Papel |
|---|---|
| Guilherme Vieira | PO |
| Gustavo Leal | Desenvolvedor |
| Geovane Alves | Scrum Master |
| Pablo Henrique | Desenvolvedor |
| Vanessa Santos | Desenvolvedora |
| Valeria Santos | Desenvolvedora |

A distribuição detalhada de tasks por membro está em [`TASKS.md`](TASKS.md).

---

## 2. Cronograma Resumido

| Sprint | Período | Foco Principal | Histórias |
|---|---|---|---|
| **S0** | 12/05/2026 – 18/05/2026 | Planejamento e Arquitetura | US00 (documentação Sprint 0) |
| **S1** | 19/05/2026 – 25/05/2026 | Fundação & Autenticação | US01 |
| **S2** | 26/05/2026 – 01/06/2026 | Perfil, Onboarding e Habilidades | US02 + US03 |
| **S3** | 02/06/2026 – 08/06/2026 | Feed, Match e Solicitações | US04 + US05 |
| **S4** | 09/06/2026 – 15/06/2026 | Carteira, Avaliações e Realtime | US06 + US07 + US08 |
| **S5** | 16/06/2026 – 22/06/2026 | Denúncias, Admin, Segurança, PWA e Entrega | US09 + US10 + US11 + US12 |

---

## 3. Detalhamento por Sprint

### Sprint S0 — Planejamento e Arquitetura
**Período:** 12/05/2026 (ter) → 18/05/2026 (seg)
**Foco:** Produzir toda a documentação de Sprint 0 exigida pelo professor antes do início do desenvolvimento.

**Entregáveis**
- `GUIA_PADRONIZAÇÃO.md`
- `BACKLOGS.md`
- `DER.md`
- `CRONOGRAMA_SPRINTS.md` (este documento)
- `TASKS.md`
- Repositório inicializado com `.gitignore`, README, padrão de branches e CI básico configurado

**Stories trabalhadas**
- US00 — Sprint 0 de planejamento (ver tasks `[US00][...]` no doc de tasks)

**Distribuição em alto nível**
- Guilherme: governança e modelagem do banco
- Equipe inteira: revisão dos documentos e alinhamento de padrões

---

### Sprint S1 — Fundação e Autenticação
**Período:** 19/05/2026 (ter) → 25/05/2026 (seg)
**Foco:** Configurar a base técnica do projeto e implementar o ciclo completo de autenticação.

**Entregáveis**
- Monorepo configurado (backend Node/Express + frontend React+Vite).
- Schema Prisma inicial (`User`, `UserProfile`, `Wallet`, `PasswordResetToken`) com migrations.
- Endpoints `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`.
- Telas: Landing, Register (com IBGE + crop de avatar + senha forte), Login, ForgotPassword, ResetPassword.
- JWT, bcrypt, validação Zod, middleware `requireAuth`.
- Cobertura de testes do módulo `auth`.

**Stories**
- US01 — EPIC 1 (Stories 1.1 a 1.4)

**Distribuição em alto nível**
- Guilherme: schema Prisma, JWT, middlewares
- Gustavo: rotas `/auth/*`, testes de integração
- Pablo: recuperação de senha
- Vanessa: tela Register com senha forte
- Valeria: integração IBGE (estado/cidade)
- Geovane: crop de avatar e tela Login

---

### Sprint S2 — Perfil, Onboarding e Habilidades
**Período:** 26/05/2026 (ter) → 01/06/2026 (seg)
**Foco:** Coletar dados complementares dos usuários e habilitar o cadastro de habilidades.

**Entregáveis**
- Endpoints `/users/*` (perfil, edição, onboarding step), `/categories`, `/skills/*`, `/users/me/teaching-skills`, `/users/me/learning-skills`.
- Telas: Onboarding (multi-step), EditProfile, Profile (público), Skills (gestão de teach/learn).
- Seed inicial do catálogo de categorias e skills.
- Cobertura de testes dos módulos `users` e `skills`.

**Stories**
- US02 — Perfil e Onboarding (Stories 2.1, 2.2, 2.3)
- US03 — Habilidades (Stories 3.1, 3.2, 3.3)

**Distribuição em alto nível**
- Guilherme: schema das skills + relacionamentos N:N
- Gustavo: endpoints `/users/me/...` e seed
- Pablo: tela Onboarding multi-step
- Vanessa: tela EditProfile e Profile
- Valeria: tela Skills (CRUD teach/learn)
- Geovane: tela Profile público + integração

---

### Sprint S3 — Feed, Match e Solicitações
**Período:** 02/06/2026 (ter) → 08/06/2026 (seg)
**Foco:** Implementar o coração da plataforma — algoritmo de match e ciclo de solicitações.

**Entregáveis**
- Algoritmo de match puro (`match.algorithm.ts`) + endpoint `/match/:userId`.
- Endpoint `/feed` priorizado e `/feed/suggestions`.
- Telas: Feed, Search (com filtros na URL), Favorites, RequestNew, Requests (inbox), RequestDetail.
- Endpoints `/requests` (CRUD, accept, reject, complete, cancel) + `/favorites` + `/users/me/saved-skills`.
- Cobertura de testes do algoritmo (cenários PERFECT, PARTIAL, COIN_ONLY).

**Stories**
- US04 — Feed, Match e Descoberta (Stories 4.1 a 4.4)
- US05 — Solicitações de Troca (Stories 5.1 a 5.5)

**Distribuição em alto nível**
- Guilherme: algoritmo de match + transições de status da request + testes do algoritmo
- Gustavo: endpoints `/requests/*` + eventos
- Pablo: endpoint `/feed` priorizado
- Vanessa: tela Feed + Search
- Valeria: tela Requests (inbox) + Favorites
- Geovane: tela RequestNew + RequestDetail

---

### Sprint S4 — Carteira, Avaliações e Realtime
**Período:** 09/06/2026 (ter) → 15/06/2026 (seg)
**Foco:** Economia interna, reputação e infraestrutura realtime.

**Entregáveis**
- Schema `Wallet` + `CoinTransaction` + lógica de LOCK/UNLOCK/SPEND/EARNING/REFUND/BONUS.
- Endpoints `/wallet`, `/wallet/transactions`, `/reviews`, `/notifications`.
- Servidor socket.io com middleware JWT, rooms por requestId, eventos de notificação e chat.
- Telas: Wallet (com histórico de transações), Notifications, RequestDetail com chat em tempo real, atualização do Profile com média de estrelas.
- Cobertura de testes para wallet (transações atômicas) e socket.io (eventos básicos).

**Stories**
- US06 — Carteira SkillCoins (Stories 6.1 a 6.3)
- US07 — Avaliações (Stories 7.1 e 7.2)
- US08 — Notificações e Realtime (Stories 8.1 a 8.3)

**Distribuição em alto nível**
- Guilherme: módulo wallet com transações atômicas (LOCK/UNLOCK) + servidor socket.io com JWT
- Gustavo: endpoints `/wallet/*` e `/notifications`
- Pablo: endpoint `/reviews` e cálculo de média
- Vanessa: tela Wallet + histórico
- Valeria: tela Notifications + badge em tempo real
- Geovane: chat realtime no RequestDetail

---

### Sprint S5 — Denúncias, Admin, Segurança, PWA e Entrega Final
**Período:** 16/06/2026 (ter) → 22/06/2026 (seg, até 14:00)
**Foco:** Recursos de moderação, qualidade final, conformidade e entrega.

**Entregáveis**
- Endpoints `/reports`, `/admin/*`, `/stats`.
- Telas: Admin (CRUD usuários, categorias, skills, reports), Trends, Ranking, Settings, Terms, Privacy.
- Hardening: `helmet`, rate-limit, validação Zod global, headers de segurança.
- Exclusão de conta com anonimização (LGPD).
- PWA: manifest + service worker + ícones múltiplas resoluções.
- Swagger UI em `/api/docs`.
- Suíte de testes 100% (Vitest + Playwright E2E).
- Documentação final atualizada (README + roteiro de apresentação).

**Stories**
- US09 — Denúncias (Stories 9.1 e 9.2)
- US10 — Painel Administrativo (Stories 10.1 a 10.3)
- US11 — Segurança e LGPD (Stories 11.1 a 11.3)
- US12 — PWA, Testes e Entrega (Stories 12.1 a 12.4)

**Distribuição em alto nível**
- Guilherme: exclusão LGPD com anonimização + hardening de segurança (helmet, rate-limit) + CI/Docker
- Gustavo: endpoints `/admin/*` e `/reports`
- Pablo: telas Settings, Terms, Privacy + Swagger UI
- Vanessa: tela Admin (gestão usuários/categorias/skills/reports)
- Valeria: telas Trends e Ranking + PWA (manifest + SW)
- Geovane: testes E2E Playwright + revisão final da documentação

---

## 4. Calendário Visual

```
2026
Maio   |  S |  M |  T |  W |  T |  F |  S
       |    |    |    |    |    |  1 |  2
       |  3 |  4 |  5 |  6 |  7 |  8 |  9
       | 10 | 11 | 12 | 13 | 14 | 15 | 16   <- S0 começa ter 12/05
       | 17 | 18 | 19 | 20 | 21 | 22 | 23   <- S0 termina seg 18 | S1 começa ter 19
       | 24 | 25 | 26 | 27 | 28 | 29 | 30   <- S1 termina seg 25 | S2 começa ter 26
       | 31 |    |    |    |    |    |

Junho  |  S |  M |  T |  W |  T |  F |  S
       |    |  1 |  2 |  3 |  4 |  5 |  6   <- S2 termina seg 01 | S3 começa ter 02
       |  7 |  8 |  9 | 10 | 11 | 12 | 13   <- S3 termina seg 08 | S4 começa ter 09
       | 14 | 15 | 16 | 17 | 18 | 19 | 20   <- S4 termina seg 15 | S5 começa ter 16
       | 21 | 22 | 23 | 24 | 25 | 26 | 27   <- S5 termina seg 22 (até 14:00)
       | 28 | 29 | 30 |    |    |    |
```

---

## 5. Cerimônias por Sprint

| Cerimônia | Quando | Duração | Participantes |
|---|---|---|---|
| **Planning** | Terça-feira (início da sprint) | 1h | Equipe inteira |
| **Daily** | Segunda a sexta | 15min | Equipe inteira (assíncrono OK) |
| **Review** | Segunda (final da sprint) | 45min | Equipe + orientador |
| **Retrospectiva** | Segunda (após review) | 30min | Equipe |

---

## 6. Critérios de Encerramento da Sprint

Uma sprint é considerada **encerrada** quando:

1. Todas as tasks marcadas para a sprint estão com PR mergeado na `main`.
2. CI verde em todas as branches mergeadas.
3. Cobertura de testes mínima mantida (objetivo: 100% nos módulos novos do frontend; 80%+ no backend).
4. Review da sprint registrado em ata curta no documento `DOC_atas-de-review_vXX.md` (a ser criado a partir de S1).
5. Retrospectiva conduzida e ações registradas.
