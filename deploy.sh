#!/usr/bin/env bash
# =============================================================================
#  SkillEx — Script de deploy via Docker
# -----------------------------------------------------------------------------
#  Uso:
#    ./deploy.sh            # build + sobe em segundo plano (cria .env se faltar)
#    ./deploy.sh up         # idem
#    ./deploy.sh logs       # acompanha os logs
#    ./deploy.sh down       # para os containers (mantém os dados)
#    ./deploy.sh reset      # para e APAGA os volumes (banco + uploads)
#    ./deploy.sh rebuild    # rebuild sem cache e sobe
#    ./deploy.sh status     # mostra o estado dos containers
# =============================================================================
set -euo pipefail

# Vai para a pasta do script (raiz do projeto), independente de onde foi chamado
cd "$(dirname "$0")"

# ─── Cores ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { printf "${BLUE}▶ %s${NC}\n" "$1"; }
ok()    { printf "${GREEN}✔ %s${NC}\n" "$1"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$1"; }
err()   { printf "${RED}✘ %s${NC}\n" "$1" >&2; }

# ─── Detecta docker e o comando de compose ────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  err "Docker não encontrado. Instale o Docker Desktop / Docker Engine primeiro."
  exit 1
fi
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  err "Docker Compose não encontrado (nem 'docker compose' nem 'docker-compose')."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  err "O daemon do Docker não está rodando. Abra o Docker Desktop e tente de novo."
  exit 1
fi

# ─── Garante o arquivo .env (gera JWT_SECRET forte) ───────────────────────────
ensure_env() {
  if [ -f .env ]; then
    return
  fi
  info "Criando .env a partir de .env.docker..."
  cp .env.docker .env

  # Gera um JWT_SECRET aleatório e substitui o placeholder
  SECRET=""
  if command -v openssl >/dev/null 2>&1; then
    SECRET="$(openssl rand -hex 32)"
  elif command -v node >/dev/null 2>&1; then
    SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  fi

  if [ -n "$SECRET" ]; then
    # Funciona com o sed do GNU (Linux) e do BSD (macOS)
    if sed --version >/dev/null 2>&1; then
      sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$SECRET|" .env
    else
      sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$SECRET|" .env
    fi
    ok "JWT_SECRET aleatório gerado no .env"
  else
    warn "Não consegui gerar JWT_SECRET automaticamente. Edite o .env manualmente!"
  fi
}

# ─── Espera o backend ficar saudável ──────────────────────────────────────────
wait_healthy() {
  info "Aguardando o backend ficar saudável..."
  for _ in $(seq 1 30); do
    if curl -fsS http://localhost:3333/health >/dev/null 2>&1; then
      ok "Backend respondendo em http://localhost:3333/health"
      return 0
    fi
    sleep 3
  done
  warn "Backend ainda não respondeu. Veja os logs com: ./deploy.sh logs"
}

cmd="${1:-up}"

case "$cmd" in
  up)
    ensure_env
    info "Buildando e subindo os containers..."
    $DC up -d --build
    wait_healthy
    echo
    ok "SkillEx no ar!"
    printf "   ${GREEN}App (frontend):${NC} http://localhost\n"
    printf "   ${GREEN}API:${NC}            http://localhost:3333\n"
    printf "   ${GREEN}Healthcheck:${NC}    http://localhost:3333/health\n"
    printf "   ${GREEN}Swagger docs:${NC}   http://localhost:3333/api-docs\n"
    echo
    printf "   ${YELLOW}Conta de teste (se SEED_ON_START=true):${NC} ana@skillex.com / senha123\n"
    echo
    printf "   Logs:  ./deploy.sh logs   |   Parar:  ./deploy.sh down\n"
    ;;

  rebuild)
    ensure_env
    info "Rebuild sem cache..."
    $DC build --no-cache
    $DC up -d
    wait_healthy
    ok "Rebuild concluído."
    ;;

  logs)
    $DC logs -f
    ;;

  down)
    info "Parando containers (dados preservados)..."
    $DC down
    ok "Parado."
    ;;

  reset)
    warn "Isto vai APAGAR o banco e os uploads (volumes)."
    printf "Tem certeza? [y/N] "
    read -r ans
    case "$ans" in
      y|Y)
        $DC down -v
        ok "Containers e volumes removidos."
        ;;
      *) info "Cancelado." ;;
    esac
    ;;

  status)
    $DC ps
    ;;

  *)
    err "Comando desconhecido: $cmd"
    echo "Use: ./deploy.sh [up|rebuild|logs|down|reset|status]"
    exit 1
    ;;
esac
