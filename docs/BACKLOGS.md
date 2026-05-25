# Refinamento do Backlog — SkillEx

> **Documento:** `BACKLOGS.md`
> **Projeto:** SkillEx — Rede social colaborativa de troca de habilidades
> **Versão:** 1.0
> **Última atualização:** 12/05/2026

---

## 1. Introdução

O presente documento realiza o refinamento do backlog do projeto **SkillEx**, transformando o escopo definido no Termo de Abertura do Projeto (TAP) em **User Stories** organizadas em **EPICs**, com critérios de aceitação claros e prioridade definida.

O SkillEx é uma plataforma web (com suporte PWA mobile) que conecta pessoas que querem **ensinar** uma habilidade a pessoas que querem **aprender** essa mesma habilidade. Diferente de marketplaces tradicionais, o SkillEx incentiva a **troca direta de conhecimento** entre usuários, complementada por uma **moeda interna (SkillCoins)** para casos em que a troca direta não é possível. A descoberta entre usuários é guiada por um **algoritmo de match** que avalia reciprocidade, compatibilidade de habilidades, localização, idioma, modalidade, disponibilidade e atividade recente.

O refinamento permite:
- Detalhar funcionalidades de forma incremental e orientada ao usuário.
- Priorizar entregas com base em valor para o usuário final.
- Distribuir as histórias entre as 6 sprints semanais do cronograma (S0 a S5).

---

## 2. Requisitos Funcionais

| Código | Requisito Funcional |
|---|---|
| **RF01** | O sistema deve permitir o cadastro de usuários com nome, e-mail, senha forte e validação de localização (IBGE) |
| **RF02** | O sistema deve permitir o login de usuários com e-mail e senha, retornando token JWT |
| **RF03** | O sistema deve permitir a recuperação de senha via token de uso único |
| **RF04** | O sistema deve permitir a alteração de senha pelo usuário autenticado |
| **RF05** | O sistema deve guiar o novo usuário em um onboarding com dados complementares (gênero, idiomas, disponibilidade, modalidade preferida) |
| **RF06** | O sistema deve permitir a edição do perfil pessoal e o upload/crop de avatar |
| **RF07** | O sistema deve disponibilizar um catálogo de categorias e habilidades |
| **RF08** | O sistema deve permitir que o usuário cadastre habilidades que **sabe ensinar** (com nível, modalidade, preço opcional em moedas) |
| **RF09** | O sistema deve permitir que o usuário cadastre habilidades que **deseja aprender** (com nível atual, objetivo, preferências) |
| **RF10** | O sistema deve calcular automaticamente a compatibilidade (score 0–100) entre dois usuários |
| **RF11** | O sistema deve exibir um feed priorizado por compatibilidade de match |
| **RF12** | O sistema deve oferecer busca avançada com filtros por habilidade, categoria, cidade, modalidade |
| **RF13** | O sistema deve permitir favoritar usuários e salvar habilidades de interesse |
| **RF14** | O sistema deve permitir criar solicitações de troca (EXCHANGE) ou aula paga (COIN) entre usuários |
| **RF15** | O sistema deve gerenciar o ciclo da solicitação: `PENDING → ACCEPTED → COMPLETED` (com possibilidade de `REJECTED` ou `CANCELLED`) |
| **RF16** | O sistema deve registrar histórico de eventos de mudança de status da solicitação |
| **RF17** | O sistema deve oferecer chat em tempo real entre usuários após aceite da solicitação |
| **RF18** | O sistema deve manter uma carteira individual com saldo disponível e saldo bloqueado em SkillCoins |
| **RF19** | O sistema deve registrar transações da carteira (PURCHASE, EARNING, SPEND, LOCK, UNLOCK, REFUND, BONUS) |
| **RF20** | O sistema deve bloquear o saldo ao aceitar uma solicitação do tipo COIN e liberá-lo apenas na conclusão |
| **RF21** | O sistema deve permitir avaliações 1–5 estrelas (com comentário) ao final de uma troca/aula |
| **RF22** | O sistema deve enviar notificações em tempo real (socket.io) para eventos relevantes |
| **RF23** | O sistema deve permitir que usuários denunciem comportamento inadequado (assédio, golpe, perfil falso, spam) |
| **RF24** | O sistema deve oferecer painel administrativo para gestão de usuários, categorias, habilidades e denúncias |
| **RF25** | O sistema deve permitir a exclusão de conta com anonimização de dados pessoais, conforme LGPD |
| **RF26** | O sistema deve ser uma PWA instalável em dispositivos móveis |
| **RF27** | O sistema deve possuir interface responsiva, com boa usabilidade em desktop e mobile |
| **RF28** | O sistema deve aplicar boas práticas de segurança: helmet, rate limiting, validação Zod, bcrypt, JWT |
| **RF29** | O sistema deve expor documentação interativa da API via Swagger UI |
| **RF30** | O sistema deve possuir cobertura de testes (unitário + integração + E2E) |

---

## 3. Refinamento do Backlog (EPICs e Stories)

### EPIC 1 — Fundação e Autenticação (US01)

> **Objetivo:** Estabelecer a base do sistema — projeto, banco, autenticação segura e cadastro completo.

#### Story 1.1 — Cadastro de novo usuário
Como visitante, quero me cadastrar com nome, e-mail e senha, para criar minha conta na plataforma.

**Critérios de Aceitação**
- Nome, e-mail e senha são obrigatórios.
- Senha deve atender critério forte (8+ caracteres, maiúscula, minúscula, número, caractere especial).
- E-mail deve ser único na base.
- Senha é armazenada apenas como hash (bcrypt).
- Cadastro inclui seleção de estado e cidade via API IBGE.
- Cadastro inclui upload e crop de avatar antes de submissão.
- Sistema retorna mensagem clara em caso de erro de validação.

**Prioridade:** Alta

#### Story 1.2 — Login de usuário
Como usuário cadastrado, quero fazer login com e-mail e senha, para acessar minha conta.

**Critérios de Aceitação**
- Login valida credenciais via bcrypt.
- Em caso de sucesso, retorna token JWT válido por tempo configurável.
- Em caso de falha, retorna mensagem genérica ("Credenciais inválidas") sem expor se o e-mail existe.
- Token JWT é armazenado no frontend e enviado nas requisições subsequentes.

**Prioridade:** Alta

#### Story 1.3 — Recuperação de senha
Como usuário, quero recuperar minha senha esquecida, para retomar o acesso à conta.

**Critérios de Aceitação**
- Usuário informa e-mail e recebe um token único (em ambiente dev exibido na resposta; em produção iria por e-mail).
- Token é armazenado apenas como hash SHA-256 no banco.
- Token expira em 1 hora e pode ser usado apenas 1 vez.
- Tela de redefinição valida o token e exige nova senha forte.

**Prioridade:** Alta

#### Story 1.4 — Alteração de senha
Como usuário autenticado, quero alterar minha senha, para manter minha conta segura.

**Critérios de Aceitação**
- Usuário informa senha atual e nova senha.
- Senha atual é validada antes da troca.
- Nova senha deve atender critério forte.

**Prioridade:** Média

---

### EPIC 2 — Perfil e Onboarding (US02)

> **Objetivo:** Coletar dados complementares do usuário e permitir manutenção do perfil público.

#### Story 2.1 — Onboarding guiado
Como novo usuário, quero ser guiado em etapas após o cadastro, para preencher dados que melhoram minhas conexões.

**Critérios de Aceitação**
- Onboarding solicita: gênero, data de nascimento, nacionalidade, idiomas, preferências de aprendizado, disponibilidade (manhã/tarde/noite/fim de semana) e modalidade preferida (online/presencial/ambas).
- Cada etapa pode ser pulada, mas o estado `onboardingCompleted` só vira `true` ao final.
- Listas (idiomas, disponibilidade) são persistidas como JSON em texto.

**Prioridade:** Alta

#### Story 2.2 — Edição de perfil
Como usuário, quero editar meu perfil, para manter minhas informações atualizadas.

**Critérios de Aceitação**
- Editáveis: avatar (com crop), bio, cidade/estado (via IBGE), idiomas, disponibilidade, modalidade.
- Alterações são persistidas e refletem imediatamente no perfil público.

**Prioridade:** Alta

#### Story 2.3 — Visualização de perfil público
Como visitante autenticado, quero ver o perfil de outro usuário, para avaliar se quero solicitar uma troca.

**Critérios de Aceitação**
- Exibe avatar, nome, bio, cidade, habilidades que ensina (com nível) e que deseja aprender.
- Exibe média de avaliação recebida (estrelas) e quantidade de reviews.
- Mostra botão "Favoritar" e "Solicitar troca".

**Prioridade:** Alta

---

### EPIC 3 — Habilidades (US03)

> **Objetivo:** Catálogo de habilidades e CRUD individual de teach/learn skills.

#### Story 3.1 — Catálogo de categorias e habilidades
Como sistema, quero disponibilizar um catálogo global de categorias e habilidades, para padronizar a oferta da plataforma.

**Critérios de Aceitação**
- Categorias têm nome, slug, ícone e cor.
- Habilidades pertencem a uma categoria e têm nome e slug únicos.
- Catálogo é populado via seed inicial.

**Prioridade:** Alta

#### Story 3.2 — Cadastro de habilidades que sei ensinar
Como usuário, quero registrar habilidades que sei ensinar, para que outros me encontrem.

**Critérios de Aceitação**
- Usuário escolhe uma skill do catálogo (não duplicada para ele).
- Informa nível (BEGINNER / INTERMEDIATE / ADVANCED / EXPERT), descrição, anos de experiência.
- Informa modalidade (ONLINE / IN_PERSON / BOTH), se aceita moedas e se aceita troca.
- Pode definir preço em SkillCoins por aula.
- Pode informar disponibilidade específica para essa skill.

**Prioridade:** Alta

#### Story 3.3 — Cadastro de habilidades que quero aprender
Como usuário, quero registrar habilidades que quero aprender, para que o algoritmo de match me sugira professores compatíveis.

**Critérios de Aceitação**
- Usuário escolhe uma skill do catálogo.
- Informa nível atual, objetivo, preferências (gênero, idioma, faixa etária, modalidade).
- Mesma skill não pode estar simultaneamente em teach e learn.

**Prioridade:** Alta

---

### EPIC 4 — Feed, Match e Descoberta (US04)

> **Objetivo:** Conectar usuários compatíveis via algoritmo de match e busca.

#### Story 4.1 — Algoritmo de match
Como sistema, quero calcular um score de compatibilidade (0–100) entre dois usuários, para priorizar matches relevantes.

**Critérios de Aceitação**
- Score combina 7 critérios ponderados (pesos somam 100): **reciprocidade (50)**, compatibilidade de habilidade (20), localização (8), idioma (7), modalidade (7), disponibilidade (5), atividade recente (3).
- Tipo do match é `PERFECT` (reciprocidade), `PARTIAL` (compatibilidade parcial) ou `COIN_ONLY` (sem reciprocidade).
- Função é **pura** (não acessa banco) e tem cobertura de testes.

**Prioridade:** Alta

#### Story 4.2 — Feed priorizado
Como usuário, quero ver no feed os usuários mais compatíveis comigo, para encontrar trocas rapidamente.

**Critérios de Aceitação**
- Feed retorna lista ordenada pelo score de match decrescente.
- Cada card exibe avatar, nome, cidade, habilidades em comum e o score (badge).
- Paginação ou scroll infinito.

**Prioridade:** Alta

#### Story 4.3 — Busca avançada
Como usuário, quero buscar usuários por habilidade, categoria, cidade e modalidade, para encontrar pessoas específicas.

**Critérios de Aceitação**
- Filtros funcionam isoladamente ou combinados.
- Filtros refletem na URL (parâmetros) para permitir compartilhamento.
- Resultado é paginado.

**Prioridade:** Média

#### Story 4.4 — Favoritar usuários e salvar habilidades
Como usuário, quero marcar usuários e habilidades como favoritos, para voltar a eles depois.

**Critérios de Aceitação**
- Favoritar/desfavoritar é uma ação reversível com 1 clique.
- Lista de favoritos é privada (só o próprio usuário vê).
- Restrição: não duplicar favoritos (chave única).

**Prioridade:** Média

---

### EPIC 5 — Solicitações de Troca (US05)

> **Objetivo:** Permitir que usuários iniciem, negociem e concluam trocas/aulas.

#### Story 5.1 — Criar solicitação
Como usuário, quero criar uma solicitação para um outro usuário, para iniciar uma troca ou contratar uma aula.

**Critérios de Aceitação**
- Solicitação tem tipo `EXCHANGE` (troca direta — exige skill ofertada) ou `COIN` (aula paga — exige valor em moedas).
- Inclui skill solicitada, skill ofertada (se EXCHANGE), valor em moedas (se COIN), mensagem opcional, data sugerida.
- Status inicial é `PENDING`.
- Cria evento de status no histórico.
- Dispara notificação ao destinatário.

**Prioridade:** Alta

#### Story 5.2 — Aceitar ou rejeitar solicitação
Como destinatário, quero aceitar ou rejeitar uma solicitação recebida, para controlar com quem interajo.

**Critérios de Aceitação**
- Botões aceitar/rejeitar visíveis enquanto status é `PENDING`.
- Aceite muda status para `ACCEPTED` e habilita o chat.
- Aceite em solicitação `COIN` bloqueia o saldo do requester (transação `LOCK`).
- Rejeição muda status para `REJECTED` e dispara notificação ao requester.

**Prioridade:** Alta

#### Story 5.3 — Concluir solicitação
Como participante de uma solicitação aceita, quero marcá-la como concluída, para encerrar o ciclo e habilitar avaliação.

**Critérios de Aceitação**
- Apenas solicitações `ACCEPTED` podem ser concluídas.
- Status passa para `COMPLETED`.
- Em solicitações `COIN`, saldo bloqueado é transferido ao recipient (transações `UNLOCK` + `SPEND` no requester e `EARNING` no recipient).
- Ambos os usuários recebem notificação solicitando avaliação.

**Prioridade:** Alta

#### Story 5.4 — Cancelar solicitação
Como requester, quero cancelar uma solicitação pendente ou aceita, caso eu desista.

**Critérios de Aceitação**
- Status passa para `CANCELLED`.
- Se já estava `ACCEPTED` em modalidade `COIN`, saldo bloqueado é devolvido (transação `REFUND`).

**Prioridade:** Média

#### Story 5.5 — Histórico de eventos
Como participante, quero ver o histórico de mudanças de status da solicitação, para entender o que aconteceu.

**Critérios de Aceitação**
- Cada mudança de status grava um `ExchangeRequestEvent` com status, nota opcional e timestamp.
- Tela de detalhe exibe linha do tempo dos eventos.

**Prioridade:** Baixa

---

### EPIC 6 — Carteira SkillCoins (US06)

> **Objetivo:** Suportar a economia interna de moedas para pagamentos de aulas.

#### Story 6.1 — Carteira individual
Como usuário cadastrado, quero ter uma carteira automática, para participar de aulas pagas.

**Critérios de Aceitação**
- Cada usuário tem 1 carteira (1:1) criada no cadastro.
- Carteira possui `balance` e `lockedBalance` (ambos inteiros não-negativos).
- Saldo inicial pode incluir bônus (transação `BONUS`).

**Prioridade:** Alta

#### Story 6.2 — Histórico de transações
Como usuário, quero ver todas as movimentações da minha carteira, para entender meu saldo.

**Critérios de Aceitação**
- Cada transação tem tipo (`PURCHASE | EARNING | SPEND | LOCK | UNLOCK | REFUND | BONUS`), valor (positivo ou negativo), descrição e `balanceAfter`.
- Listagem é ordenada do mais recente para o mais antigo, com paginação.
- Transações relacionadas a uma request mostram link para a solicitação.

**Prioridade:** Média

#### Story 6.3 — Bloqueio e liberação de saldo
Como sistema, quero garantir que moedas envolvidas em uma aula paga fiquem bloqueadas até a conclusão, para evitar gastos duplicados.

**Critérios de Aceitação**
- Ao aceitar request `COIN`: `LOCK` move o valor de `balance` para `lockedBalance`.
- Ao concluir: `UNLOCK` + `SPEND` no requester, `EARNING` no recipient.
- Ao cancelar após aceite: `REFUND` devolve o valor ao `balance`.
- Toda operação é atômica (transação de banco).

**Prioridade:** Alta

---

### EPIC 7 — Avaliações (US07)

> **Objetivo:** Construir reputação na plataforma a partir de feedback pós-troca.

#### Story 7.1 — Avaliar após conclusão
Como participante de uma solicitação concluída, quero avaliar a outra parte, para construir reputação na plataforma.

**Critérios de Aceitação**
- Avaliação só é permitida após `COMPLETED`.
- Inclui nota 1–5 estrelas, comentário opcional, skill avaliada.
- Cada participante pode avaliar uma única vez por request (chave única `[requestId, authorId]`).

**Prioridade:** Alta

#### Story 7.2 — Visualização de reputação
Como visitante, quero ver a média de estrelas e os comentários do usuário, para confiar na escolha.

**Critérios de Aceitação**
- Perfil exibe média de notas, total de avaliações e últimos comentários.
- Comentários podem ser filtrados por skill avaliada.

**Prioridade:** Média

---

### EPIC 8 — Notificações e Realtime (US08)

> **Objetivo:** Manter o usuário informado em tempo real sobre eventos relevantes.

#### Story 8.1 — Notificações em tempo real
Como usuário autenticado, quero receber notificações instantâneas sobre eventos da minha conta, sem precisar recarregar a página.

**Critérios de Aceitação**
- Conexão socket.io autenticada por JWT (middleware no handshake).
- Tipos cobertos: `REQUEST_RECEIVED`, `REQUEST_ACCEPTED`, `REQUEST_REJECTED`, `REQUEST_COMPLETED`, `NEW_MESSAGE`, `NEW_MATCH`, `REVIEW_RECEIVED`, `COINS_RECEIVED`.
- Badge na sidebar exibe contagem de não lidas em tempo real.

**Prioridade:** Alta

#### Story 8.2 — Listagem de notificações
Como usuário, quero ver minhas notificações em uma página dedicada, para revisitá-las.

**Critérios de Aceitação**
- Listagem ordenada do mais recente.
- Notificação tem título, mensagem, link opcional e flag `read`.
- Clicar marca como lida e navega para o link.

**Prioridade:** Média

#### Story 8.3 — Chat em tempo real
Como participante de uma solicitação aceita, quero conversar com a outra parte em tempo real, para combinar detalhes.

**Critérios de Aceitação**
- Chat só fica habilitado quando status é `ACCEPTED`.
- Mensagens são entregues em tempo real via socket.io (room por requestId).
- Mensagens persistidas em `ChatMessage` com flag `read`.

**Prioridade:** Alta

---

### EPIC 9 — Denúncias (US09)

> **Objetivo:** Permitir que a comunidade reporte comportamentos inadequados.

#### Story 9.1 — Reportar usuário ou solicitação
Como usuário, quero denunciar comportamento inadequado, para que a equipe modere.

**Critérios de Aceitação**
- Tipos disponíveis: `INAPPROPRIATE_CONTENT`, `HARASSMENT`, `SCAM`, `FAKE_PROFILE`, `SPAM`, `OTHER`.
- Denúncia exige descrição textual.
- Denúncia pode ser sobre usuário e/ou solicitação específica.
- Status inicial é `PENDING`.

**Prioridade:** Alta

#### Story 9.2 — Gestão de denúncias pelo admin
Como administrador, quero analisar denúncias e marcar a resolução, para manter a plataforma saudável.

**Critérios de Aceitação**
- Admin pode mover denúncia entre `PENDING → UNDER_REVIEW → RESOLVED | DISMISSED`.
- Admin pode adicionar nota interna (`adminNote`).
- Sistema registra `resolvedById` e `resolvedAt` ao concluir.

**Prioridade:** Alta

---

### EPIC 10 — Painel Administrativo (US10)

> **Objetivo:** Oferecer ferramentas de gestão completa da plataforma.

#### Story 10.1 — Gestão de usuários
Como administrador, quero ativar, desativar e excluir usuários, para manter a base limpa.

**Critérios de Aceitação**
- Lista todos os usuários com filtro por status e papel.
- Permite alterar `role` (USER ↔ ADMIN) e `isActive`.

**Prioridade:** Alta

#### Story 10.2 — Gestão de categorias e habilidades
Como administrador, quero adicionar e editar categorias e habilidades do catálogo, para manter o vocabulário atualizado.

**Critérios de Aceitação**
- CRUD completo de categorias (nome, slug, ícone, cor).
- CRUD completo de skills (nome, slug, categoria).
- Não permite excluir skill em uso (com vínculos em teaching/learning).

**Prioridade:** Média

#### Story 10.3 — Estatísticas globais
Como administrador, quero ver métricas da plataforma, para acompanhar o crescimento.

**Critérios de Aceitação**
- Painel exibe: total de usuários ativos, solicitações por status, denúncias pendentes, top habilidades.
- Endpoint `/stats` retorna dados agregados.

**Prioridade:** Baixa

---

### EPIC 11 — Segurança e LGPD (US11)

> **Objetivo:** Garantir conformidade legal e proteção contra ataques comuns.

#### Story 11.1 — Hardening de segurança
Como sistema, quero aplicar boas práticas de segurança, para proteger usuários contra ataques comuns.

**Critérios de Aceitação**
- `helmet` ativo para headers HTTP seguros.
- Rate limiting por IP em rotas sensíveis (`/auth/*`, `/reports`).
- Toda entrada validada com Zod nas camadas de rota.
- Senhas armazenadas apenas como hash bcrypt.
- JWT com segredo via variável de ambiente.

**Prioridade:** Alta

#### Story 11.2 — Exclusão de conta com anonimização (LGPD)
Como usuário, quero excluir minha conta, para exercer meu direito sob a LGPD.

**Critérios de Aceitação**
- Conta é marcada como `isActive = false`.
- Dados pessoais (nome, e-mail, avatar, bio, cidade) são substituídos por valores anonimizados.
- Conteúdo gerado (reviews, mensagens) é preservado mas atribuído a "Usuário removido".
- Senha é invalidada (não permite login).

**Prioridade:** Alta

#### Story 11.3 — Páginas legais
Como visitante, quero acessar termos de uso e política de privacidade, para conhecer meus direitos.

**Critérios de Aceitação**
- Páginas `/terms` e `/privacy` acessíveis sem autenticação.
- Links visíveis no rodapé e no cadastro.

**Prioridade:** Média

---

### EPIC 12 — PWA, Testes e Entrega (US12)

> **Objetivo:** Finalizar o MVP com qualidade, instalabilidade mobile e documentação.

#### Story 12.1 — PWA instalável
Como usuário mobile, quero instalar o SkillEx como app no meu celular, para acesso rápido.

**Critérios de Aceitação**
- `manifest.json` válido com ícones em múltiplas resoluções.
- Service worker registrado para cache de assets.
- Browser exibe prompt de instalação automaticamente.

**Prioridade:** Média

#### Story 12.2 — Suíte de testes
Como equipe técnica, queremos cobertura de testes elevada, para garantir confiabilidade.

**Critérios de Aceitação**
- Backend com Vitest unitário + Supertest integração (banco SQLite real).
- Frontend com Vitest + React Testing Library (utils, hooks e componentes UI 100% cobertos).
- E2E com Playwright cobrindo fluxos críticos: cadastro, login, criação de solicitação, chat, wallet, admin.

**Prioridade:** Alta

#### Story 12.3 — Documentação interativa da API
Como desenvolvedor, quero acessar documentação interativa da API, para entender e testar endpoints.

**Critérios de Aceitação**
- Swagger UI exposto em `/api/docs`.
- Todas as rotas documentadas com schemas Zod convertidos.

**Prioridade:** Média

#### Story 12.4 — Documentação final do TCC
Como banca avaliadora, queremos documentação acadêmica completa, para entender o projeto.

**Critérios de Aceitação**
- `/docs` contém: backlog, DER, cronograma, tasks, governança, documentação acadêmica e roteiro de apresentação.
- README principal atualizado com setup, stack e links para `/docs`.

**Prioridade:** Alta

---

## 4. Resumo Visual do Backlog

| US | EPIC | Stories | Prioridade Predominante |
|---|---|---|---|
| US01 | Fundação e Autenticação | 4 | Alta |
| US02 | Perfil e Onboarding | 3 | Alta |
| US03 | Habilidades | 3 | Alta |
| US04 | Feed, Match e Descoberta | 4 | Alta |
| US05 | Solicitações de Troca | 5 | Alta |
| US06 | Carteira SkillCoins | 3 | Alta |
| US07 | Avaliações | 2 | Alta |
| US08 | Notificações e Realtime | 3 | Alta |
| US09 | Denúncias | 2 | Alta |
| US10 | Painel Administrativo | 3 | Média |
| US11 | Segurança e LGPD | 3 | Alta |
| US12 | PWA, Testes e Entrega | 4 | Alta |
| **Total** | **12 EPICs** | **39 Stories** | — |
