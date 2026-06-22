# =============================================================================
#  SkillEx Backend — Dockerfile (multi-stage)
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências (incluindo devDeps para compilar)
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

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o Prisma Client gerado (contém binários nativos para esta plataforma)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copia o CLI do Prisma (necessário para `prisma migrate deploy` no startup)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copia o output compilado e o schema/migrations do Prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Cria diretórios persistidos via volume
RUN mkdir -p /app/data /app/uploads

EXPOSE 3333

# Aplica migrations pendentes e inicia o servidor
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
