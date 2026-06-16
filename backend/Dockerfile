# =============================================================================
#  SkillEx Backend — Dockerfile (multi-stage)
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências (incluindo devDeps para compilar e gerar o Prisma Client)
COPY package*.json ./
RUN npm ci

# Copia schema e gera o Prisma Client (binários nativos para a plataforma)
COPY prisma ./prisma
RUN npx prisma generate

# Compila TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: Runner (produção) ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# openssl é exigido pelos engines do Prisma em tempo de execução
RUN apk add --no-cache openssl

# Copiamos o node_modules COMPLETO do builder. Motivo:
#   - `prisma migrate deploy` (rodado no startup) depende do CLI `prisma` e do
#     pacote `@prisma/engines`, que são devDependencies. Um `npm ci --omit=dev`
#     deixaria esses módulos de fora e o container quebraria ao subir.
#   - Reaproveitar o node_modules já resolvido também habilita o `tsx` usado
#     pelo seed opcional de dados de demonstração.
COPY --from=builder /app/node_modules ./node_modules

# Manifesto, código compilado e schema/migrations do Prisma + seed
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Script de inicialização (migrations + seed opcional + start)
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Diretórios persistidos via volume
RUN mkdir -p /app/data /app/uploads

EXPOSE 3333

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
