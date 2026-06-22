# 🔌 Referência da API — SkillEx

- **Base URL:** `http://localhost:3333/api`
- **Autenticação:** `Authorization: Bearer <token>` (JWT obtido no login/cadastro)
- **Formato:** JSON

---

## Verificação de saúde (`/health`)

`GET /health` (fora do prefixo `/api`, sem autenticação) verifica a API e a
conexão com o banco de dados (`SELECT 1` via Prisma):

```json
{ "status": "ok", "service": "skillex-api", "db": "up" }
```

Quando o banco está indisponível, responde `503`:

```json
{ "status": "unavailable", "service": "skillex-api", "db": "down" }
```

## Autenticação (`/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/auth/register` | — | Cria conta e retorna usuário + token |
| POST | `/auth/login` | — | Autentica e retorna usuário + token |
| GET | `/auth/me` | ✓ | Dados do usuário autenticado |
| POST | `/auth/change-password` | ✓ | Altera a senha (exige a senha atual) |
| POST | `/auth/forgot-password` | — | Inicia a recuperação de senha |
| POST | `/auth/reset-password` | — | Redefine a senha com o token de recuperação |

**Exemplo — login:**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "bruno@skillex.com", "password": "senha123" }
```

```json
{
  "user": { "id": "...", "name": "Bruno Carvalho", "wallet": { "balance": 100 } },
  "token": "eyJhbGciOi..."
}
```

**Alteração e recuperação de senha:**

- `POST /auth/change-password` — body `{ "currentPassword", "newPassword" }`
  (nova senha com no mínimo 6 caracteres). Retorna `{ "success": true }`;
  `401` se a senha atual estiver incorreta.
- `POST /auth/forgot-password` — body `{ "email" }`. A resposta é **sempre**
  genérica (`{ "success": true, "message": "Se o e-mail existir..." }`) para
  evitar enumeração de e-mails cadastrados. Fora de produção, a resposta inclui
  também `resetToken` e `resetLink`
  (ex.: `http://localhost:5173/reset-password?token=...`), permitindo
  demonstrar o fluxo sem servidor de e-mail. Apenas o hash SHA-256 do token é
  persistido; ele expira em 1 hora, é de uso único e gerar um novo invalida os
  anteriores.
- `POST /auth/reset-password` — body `{ "token", "password" }`. Retorna
  `{ "success": true }`; `400` se o token for inválido, expirado, já utilizado
  ou se a conta estiver desativada.

## Usuários (`/users`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/users` | Busca avançada (filtros via *query string*) |
| GET | `/users/:id` | Perfil público (com match, avaliações, favorito) |
| PATCH | `/users/me` | Atualiza dados básicos |
| PATCH | `/users/me/profile` | Atualiza dados complementares |
| POST | `/users/me/onboarding` | Conclui o onboarding (perfil + habilidades) |
| POST | `/users/me/avatar` | Envia foto de perfil (*multipart*) |
| GET | `/users/me/favorites` | Lista favoritos |
| DELETE | `/users/me` | Exclui a própria conta (LGPD — anonimização) |
| POST | `/users/:id/favorite` | Adiciona favorito |
| DELETE | `/users/:id/favorite` | Remove favorito |

**Filtros da busca:** `q`, `skillId`, `categoryId`, `modality`, `level`, `city`,
`state`, `language`, `nationality`, `gender`, `minAge`, `maxAge`, `acceptsCoins`,
`acceptsExchange`, `availability`, `page`, `limit`.

**Perfil público (`GET /users/:id`):** além dos dados do perfil, retorna
`activeRequest: { "id", "status" } | null` — a solicitação `PENDING` ou
`ACCEPTED` existente entre o usuário autenticado e o dono do perfil (em
qualquer direção), usada pelo frontend para evitar solicitações duplicadas.

**Exclusão de conta (`DELETE /users/me`):** body `{ "password" }` →
`{ "success": true }`; `401` se a senha estiver incorreta. A exclusão usa
**anonimização** (não remoção física): avaliações, solicitações históricas e
mensagens de chat são preservadas exibindo "Usuário removido". Solicitações
`PENDING`/`ACCEPTED` são canceladas com devolução das moedas reservadas ao
solicitante, e o outro participante é notificado. Perfil, habilidades,
favoritos, notificações, carteira, tokens de recuperação e o arquivo do avatar
são removidos, e a conta fica desativada.

## Habilidades (`/skills`, `/categories`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Lista categorias |
| GET | `/skills?q=&categoryId=` | Catálogo de habilidades |
| GET | `/skills/me` | Minhas habilidades (ensina + aprende) |
| GET | `/skills/me/saved` | Habilidades salvas (bookmarks de interesse) |
| GET | `/skills/suggestions` | Sugestões de habilidades similares |
| POST | `/skills/:id/save` | Salva uma habilidade de interesse |
| DELETE | `/skills/:id/save` | Remove uma habilidade salva |
| POST | `/skills/teaching` | Adiciona habilidade que ensina |
| PATCH | `/skills/teaching/:id` | Edita habilidade que ensina |
| DELETE | `/skills/teaching/:id` | Remove habilidade que ensina |
| POST | `/skills/learning` | Adiciona habilidade que deseja aprender |
| PATCH | `/skills/learning/:id` | Edita habilidade que deseja aprender |
| DELETE | `/skills/learning/:id` | Remove habilidade que deseja aprender |

## Feed e Match

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/feed?page=&limit=&onlyMatches=` | Feed ordenado por compatibilidade |
| GET | `/feed/suggestions` | Melhores sugestões (top matches) |
| GET | `/match/:userId` | Detalhe da compatibilidade com um usuário |

## Solicitações (`/requests`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/requests` | Cria solicitação (troca ou aula paga) |
| GET | `/requests?box=sent\|received\|all&status=` | Lista solicitações |
| GET | `/requests/:id` | Detalhe da solicitação |
| POST | `/requests/:id/accept` | Aceita (destinatário) |
| POST | `/requests/:id/reject` | Recusa (destinatário) |
| POST | `/requests/:id/cancel` | Cancela (solicitante) |
| POST | `/requests/:id/complete` | Conclui (qualquer participante) |
| GET | `/requests/:id/messages` | Lista mensagens do chat |
| POST | `/requests/:id/messages` | Envia mensagem |

## Carteira (`/wallet`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/wallet` | Saldo (disponível e bloqueado) |
| GET | `/wallet/history` | Histórico de transações |
| POST | `/wallet/purchase` | Adiciona moedas (simulado) |

## Avaliações, Notificações e Estatísticas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/reviews` | Cria avaliação (após conclusão) |
| GET | `/reviews/user/:userId` | Avaliações de um usuário |
| GET | `/notifications` | Lista notificações |
| GET | `/notifications/unread-count` | Quantidade não lida |
| POST | `/notifications/:id/read` | Marca como lida |
| POST | `/notifications/read-all` | Marca todas como lidas |
| GET | `/stats/trends` | Habilidades em alta |
| GET | `/stats/ranking` | Ranking de reputação dos usuários |
| GET | `/stats/overview` | Estatísticas gerais (somente admin) |

## Administração (`/admin`)

Todas as rotas exigem token JWT de um usuário com papel `ADMIN`
(`401` sem token válido; `403` para usuários comuns).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/users?q=&page=&limit=` | Lista usuários (busca por nome/e-mail) |
| PATCH | `/admin/users/:id/status` | Ativa/desativa uma conta |
| POST | `/admin/categories` | Cria categoria |
| PATCH | `/admin/categories/:id` | Edita categoria (parcial) |
| DELETE | `/admin/categories/:id` | Remove categoria |
| POST | `/admin/skills` | Cria habilidade |
| PATCH | `/admin/skills/:id` | Edita habilidade (parcial) |
| DELETE | `/admin/skills/:id` | Remove habilidade |

**Usuários:**

- `GET /admin/users` retorna `{ "items": [...], "total", "page", "limit",
  "hasMore" }`; cada item traz `id`, `name`, `email`, `role`, `city`, `state`,
  `avatarUrl`, `isActive`, `onboardingCompleted` e `createdAt`.
- `PATCH /admin/users/:id/status` — body `{ "isActive": boolean }` →
  `{ "user" }`; `400` ao tentar desativar a própria conta; `404` se o usuário
  não existir. Contas desativadas não conseguem logar (`403`) e somem do feed,
  da busca, do perfil público, dos favoritos e do ranking.

**Categorias:**

- `POST /admin/categories` — body `{ "name" (2–40), "icon"?, "color"? }`
  (cor no formato `#RRGGBB`) → `201 { "category" }`; `409` se já existir
  categoria com o mesmo nome/slug.
- `PATCH /admin/categories/:id` — atualização parcial → `{ "category" }`
  (renomear gera novo *slug*); `404` se não existir.
- `DELETE /admin/categories/:id` → `{ "success": true }`; `409` se a categoria
  possuir habilidades.

**Habilidades:**

- `POST /admin/skills` — body `{ "name" (2–60), "categoryId" }` →
  `201 { "skill" }` (com a categoria); `404` se a categoria não existir;
  `409` se já existir habilidade com o mesmo nome/slug.
- `PATCH /admin/skills/:id` — atualização parcial → `{ "skill" }`.
- `DELETE /admin/skills/:id` → `{ "success": true }`; `409` se a habilidade
  estiver em uso (ensino, aprendizado, solicitações ou avaliações).

---

## Limite de requisições (*rate limiting*)

| Escopo | Limite |
|--------|--------|
| Global (`/api/*`) | 300 requisições por IP a cada 1 minuto |
| `POST /auth/login`, `/auth/register` e `/auth/forgot-password` | 10 requisições por IP a cada 15 minutos |

Ao exceder o limite, a API responde `429`:

```json
{ "error": "Muitas requisições. Tente novamente em instantes." }
```

O limite é desativado quando `NODE_ENV=test` (os testes de integração e o E2E
disparam dezenas de requisições em sequência).

## Códigos de status

| Código | Significado |
|--------|-------------|
| 200 / 201 | Sucesso |
| 401 | Não autenticado (token ausente/inválido) |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (ex.: e-mail já cadastrado) |
| 422 | Dados inválidos (erro de validação Zod) |
| 429 | Muitas requisições (*rate limit* excedido) |
| 500 | Erro interno |

---

## WebSocket (tempo real)

O servidor socket.io roda sobre o mesmo servidor HTTP da API
(`ws://localhost:3333`, path `/socket.io`).

**Handshake:** o cliente envia o mesmo JWT da API REST em `auth.token`.
Conexões sem token, com token inválido, de usuário inexistente ou de conta
desativada são recusadas.

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3333', { auth: { token } });
```

**Rooms:**

- `user:<id>` — cada usuário entra automaticamente ao conectar; recebe
  notificações e atualizações de status das suas solicitações.
- `request:<id>` — chat de uma solicitação. O cliente emite `request:join` e o
  servidor só permite a entrada de participantes da solicitação, confirmando
  com o evento `request:joined`. Ao recebê-lo, o cliente ressincroniza o chat
  via REST (cobre mensagens enviadas antes do join efetivo). `request:leave`
  sai da room.

**Eventos servidor → cliente:**

| Evento | Payload | Quando |
|--------|---------|--------|
| `notification:new` | `{ "link" }` | Nova notificação (solicitação, mensagem, avaliação) |
| `request:updated` | `{ "requestId", "status" }` | Mudança de status de uma solicitação |
| `chat:message` | `{ "id", "content", "createdAt", "sender": { "id", "name", "avatarUrl" } }` | Nova mensagem na room da solicitação |
| `request:joined` | `"<requestId>"` | Confirmação de entrada na room do chat |

**Eventos cliente → servidor:**

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `request:join` | `"<requestId>"` | Entra na room do chat (apenas participantes) |
| `request:leave` | `"<requestId>"` | Sai da room do chat |

As emissões ocorrem sempre **após** o commit das transações (criação, aceite,
recusa, cancelamento e conclusão de solicitação, mensagem de chat, avaliação
recebida e exclusão de conta).
