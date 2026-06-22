# 🧪 Estratégia de Testes — SkillEx

Cobertura completa em três camadas (pirâmide de testes): **unitários**, **integração** e **end-to-end (E2E)**.

| Camada | Ferramenta | Onde | O que cobre |
|--------|-----------|------|-------------|
| Unitário | **Vitest** | `backend/tests/unit`, `frontend/tests` | Funções puras: algoritmo de match, utils, schemas Zod, presenters, middlewares, formatação, contexts, hooks, componentes de UI |
| Integração | **Vitest + Supertest** | `backend/tests/integration` | Rotas HTTP `/api/*` + services contra um SQLite de teste real (Prisma); tempo real com socket.io-client de verdade |
| E2E | **Playwright** | `e2e/specs` | Fluxos reais do usuário pela SPA contra a API (auth, navegação, carteira, recuperação de senha, configurações, admin, chat em tempo real) |

## Cobertura

- **Backend:** 100% de statements, branches, functions e lines (gate no `vitest.config.ts`). Banco de teste isolado em `backend/prisma/test.db` (nunca toca o `dev.db`).
- **Frontend:** 100% na camada de **lógica + componentes reutilizáveis** (`utils`, `services`, `contexts`, `hooks`, `components`). As **páginas (view)** são validadas pelos testes **E2E**.
- Os poucos ramos marcados com `/* v8 ignore */` são guardas defensivos comprovadamente inalcançáveis (campos sempre presentes via `include` do Prisma, usuário autenticado garantido). Cada um traz uma justificativa no código.

## Tempo real (socket.io)

O socket.io é testado nas três camadas:

- **Backend (integração)** — `tests/integration/realtime.spec.ts` sobe um servidor HTTP **efêmero** (`server.listen(0)`, porta livre escolhida pelo SO) com `initRealtime` e conecta um **socket.io-client real** dentro do Vitest. Cobre o handshake (token válido, sem token, token inválido, conta desativada, usuário excluído), as rooms (participante recebe `chat:message`, intruso não recebe, ack de `request:joined`, `request:leave`) e os eventos emitidos pelos services ao aceitar solicitação e enviar mensagem.
- **Facade no-op** — os services emitem eventos apenas pela facade `src/realtime/realtime.ts`; quando `setIO` não foi chamado, as emissões viram no-ops. É isso que permite todas as demais specs de integração HTTP rodarem sem servidor de socket. A facade em si é coberta pelo unitário `realtime.spec` com um `io` falso e com `io` nulo.
- **Frontend (unitário)** — `tests/unit/realtime.spec.ts` testa o `services/realtime.ts` com `vi.mock('socket.io-client')` e um socket falso (nenhuma conexão de rede): conexão com o JWT no handshake, registry multi-subscriber (`subscribeRealtime` / `Map<Event, Set<handler>>`), join/leave de rooms, rejoin automático na reconexão e limpeza no disconnect.
- **E2E** — `realtime-chat.e2e.ts` abre **dois contextos de navegador** (dois usuários logados ao mesmo tempo) e verifica que a mensagem de chat aparece sem reload e que o badge de notificações incrementa ao vivo.

## Como rodar

### Backend (unitário + integração)
```bash
cd backend
npm install
npm run test          # roda os testes
npm run test:cov      # com relatório de cobertura (gate 100%)
```
> O `globalSetup` cria/zera o schema no `test.db` automaticamente; cada teste roda com as tabelas limpas. O rate limiting é desativado quando `NODE_ENV=test` — os testes de integração e o E2E disparam dezenas de requisições em sequência e estourariam o limite; o comportamento do limitador é coberto à parte no unitário `rate-limit.spec`.

### Frontend (unitário + componentes)
```bash
cd frontend
npm install
npm run test:cov
```

### E2E (Playwright)
```bash
# na raiz do projeto
npm install
npx playwright install chromium
npm run test:e2e          # sobe backend (semeado) + frontend automaticamente
npm run test:e2e:report   # abre o relatório HTML
```
> O Playwright sobe sozinho o backend (banco `e2e.db` resetado + `seed`) e o frontend (Vite) via `webServer`. Conta de teste: `ana@skillex.com` / `senha123` (admin).

## CI

`.github/workflows/ci.yml` roda os três conjuntos em paralelo a cada push/PR:
- **backend** — `npm run test:cov` (gate de cobertura 100%);
- **frontend** — `npm run test:cov` (gate 100%);
- **e2e** — instala navegadores, sobe a stack e roda o Playwright, publicando o relatório como artefato.

## Estrutura dos testes

```
backend/
  tests/
    global-setup.ts        # prisma db push no banco de teste
    setup.ts               # resetDb() antes de cada teste
    helpers/               # db, factories, supertest app
    unit/                  # funções puras, schemas, middlewares, rate-limit, reset-token, facade realtime
    integration/           # uma spec por módulo (auth, auth-password, users, requests, wallet, admin, account-deletion, inactive-users, realtime, ...)
frontend/
  tests/
    setup.ts               # jsdom, mocks, jest-dom, scrollTo stub
    unit/                  # format, api, realtime, files
    contexts/              # AuthContext, ToastContext (renderHook + wrapper)
    hooks/                 # useRealtime, useTheme
    components/            # guards, AppLayout, ScrollToTop, UserCard, ui
e2e/
  support/auth.ts          # helper de login
  specs/                   # auth, navigation, wallet, password-reset, settings, admin, realtime-chat (.e2e.ts)
```
