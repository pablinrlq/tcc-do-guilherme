# =============================================================================
#  SkillEx Frontend — Dockerfile (multi-stage)
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copia todos os arquivos fonte e compila com Vite
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ─── Stage 2: Servidor nginx (produção) ───────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração customizada (SPA fallback + proxy para a API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
