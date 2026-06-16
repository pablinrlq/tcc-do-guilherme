#!/usr/bin/env bash
# =============================================================
#  SkillEx — Plataforma de Troca de Habilidades (TCC)
#  Script TOTAL: Provisionamento + Build + Deploy (Docker)
#  Ambiente   : Amazon Linux 2023 (EC2)
#  Stack      : React/Vite (nginx) + Express/Prisma + Docker Compose
# =============================================================

set -euo pipefail

# =============================================================
#  CONFIGURAÇÕES GERAIS
# =============================================================
GIT_REPO="${GIT_REPO:-https://github.com/pablinrlq/tcc-do-guilherme.git}"
APP_USER="${APP_USER:-ec2-user}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/tcc-do-guilherme}"
BRANCH="${BRANCH:-main}"

FRONTEND_PORT="${FRONTEND_PORT:-80}"     # SPA (nginx) — porta principal
API_PORT="${API_PORT:-3333}"             # API/Swagger — acesso direto (opcional)
SWAP_SIZE="${SWAP_SIZE:-2G}"             # evita OOM no build do Vite/npm em t2/t3.micro

BUILDX_MIN="0.17.0"                       # 'docker compose build' exige buildx >= 0.17.0
BUILDX_FALLBACK="v0.17.1"
COMPOSE_FALLBACK="v2.39.1"

# Cores para o terminal
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

banner() {
  echo -e "\n${CYAN}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
  printf "${CYAN}${BOLD}  %-52s${RESET}\n" "$1"
  echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}\n"
}

info() { echo -e "${YELLOW}  ➜ $1${RESET}"; }
ok()   { echo -e "${GREEN}${BOLD}  ✔ $1${RESET}"; }
err()  { echo -e "${RED}${BOLD}  ✘ $1${RESET}" >&2; }

if [[ $EUID -ne 0 ]]; then
  echo "ERRO: Execute como root (sudo bash setup.sh)"
  exit 1
fi

# Descobre o IP público (IMDSv2 → fallback ifconfig.me)
get_public_ip() {
  local token ip
  token="$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 120" 2>/dev/null || true)"
  ip="$(curl -fsS -H "X-aws-ec2-metadata-token: ${token}" \
    http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)"
  [ -z "$ip" ] && ip="$(curl -fsS ifconfig.me 2>/dev/null || true)"
  echo "$ip"
}

# =============================================================
#  ETAPA 00 — OTIMIZAÇÃO DE MEMÓRIA (SWAP)
# =============================================================
banner "ETAPA 00 — Otimização de Memória (Swap)"
if [ ! -f /swapfile ]; then
    info "Criando arquivo Swap de ${SWAP_SIZE} (evita OOM no build do Vite/npm)..."
    fallocate -l "${SWAP_SIZE}" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "Swap ativado com sucesso."
else
    swapon /swapfile 2>/dev/null || true
    ok "Swap já configurado."
fi

# =============================================================
#  ETAPA 01 — ATUALIZAÇÃO DO SISTEMA
# =============================================================
banner "ETAPA 01 — Atualização do Sistema"
dnf update -y --quiet
ok "Sistema atualizado."

# =============================================================
#  ETAPA 02 — DEPENDÊNCIAS BASE (git, docker, openssl, tar)
# =============================================================
banner "ETAPA 02 — Instalação de Dependências Base"
dnf install -y git docker openssl tar --quiet
ok "git, docker, openssl e tar instalados."

# =============================================================
#  ETAPA 03 — SERVIÇO DOCKER
# =============================================================
banner "ETAPA 03 — Configuração do Serviço Docker"
systemctl enable --now docker
usermod -aG docker "${APP_USER}" 2>/dev/null || true
ok "Docker ativo e habilitado no boot."

# =============================================================
#  ETAPA 04 — PLUGIN DOCKER BUILDX (>= 0.17.0)
# =============================================================
banner "ETAPA 04 — Docker Buildx (Fix do build do Compose)"
# O pacote 'docker' do AL2023 pode trazer um buildx ANTIGO (ex.: 0.12.1) e o
# 'docker compose build' exige >= 0.17.0, falhando com:
#   "compose build requires buildx 0.17.0 or later".
# Checamos a VERSÃO (não só a existência) e atualizamos quando preciso.
buildx_ok=0
CUR_BUILDX=""
if docker buildx version >/dev/null 2>&1; then
  CUR_BUILDX="$(docker buildx version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
  if [ -n "$CUR_BUILDX" ] && \
     [ "$(printf '%s\n%s\n' "$BUILDX_MIN" "$CUR_BUILDX" | sort -V | head -n1)" = "$BUILDX_MIN" ]; then
    buildx_ok=1
    ok "Buildx já atende (${CUR_BUILDX} >= ${BUILDX_MIN})."
  fi
fi
if [ "$buildx_ok" -ne 1 ]; then
  info "Instalando/atualizando o buildx (atual: ${CUR_BUILDX:-nenhum})..."
  case "$(uname -m)" in
    x86_64)  BX_ARCH="amd64" ;;
    aarch64) BX_ARCH="arm64" ;;
    *)       BX_ARCH="amd64" ;;
  esac
  BX_VER="$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest \
    | grep -oE '"tag_name":\s*"[^"]+"' | grep -oE 'v[0-9.]+' | head -n1 || true)"
  [ -z "$BX_VER" ] && BX_VER="$BUILDX_FALLBACK"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL \
    "https://github.com/docker/buildx/releases/download/${BX_VER}/buildx-${BX_VER}.linux-${BX_ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-buildx
  chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
  ok "Buildx ${BX_VER} instalado ($(docker buildx version | head -n1))."
fi

# =============================================================
#  ETAPA 05 — DOCKER COMPOSE V2 (PLUGIN)
# =============================================================
banner "ETAPA 05 — Docker Compose v2"
if docker compose version >/dev/null 2>&1; then
  ok "Compose já disponível ($(docker compose version | head -n1))."
else
  info "Instalando o plugin Docker Compose v2..."
  case "$(uname -m)" in
    x86_64)  CMP_ARCH="x86_64" ;;
    aarch64) CMP_ARCH="aarch64" ;;
    *)       CMP_ARCH="x86_64" ;;
  esac
  CMP_VER="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest \
    | grep -oE '"tag_name":\s*"[^"]+"' | grep -oE 'v[0-9.]+' | head -n1 || true)"
  [ -z "$CMP_VER" ] && CMP_VER="$COMPOSE_FALLBACK"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL \
    "https://github.com/docker/compose/releases/download/${CMP_VER}/docker-compose-linux-${CMP_ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  ok "Compose ${CMP_VER} instalado."
fi

# =============================================================
#  ETAPA 06 — DOWNLOAD DO PROJETO (GitHub)
# =============================================================
banner "ETAPA 06 — Download do Projeto"
if [ -d "${APP_DIR}/.git" ]; then
  info "Repositório já existe — atualizando (git pull)..."
  git -C "${APP_DIR}" fetch origin "${BRANCH}"
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
else
  info "Clonando ${GIT_REPO}..."
  git clone --branch "${BRANCH}" "${GIT_REPO}" "${APP_DIR}"
fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
ok "Projeto pronto em ${APP_DIR}."

# =============================================================
#  ETAPA 07 — VARIÁVEIS DE AMBIENTE (.env + JWT)
# =============================================================
banner "ETAPA 07 — Configuração do .env"
cd "${APP_DIR}"
PUBLIC_IP="$(get_public_ip)"
if [ -f .env ]; then
  ok ".env já existe — mantendo o atual."
else
  cp .env.docker .env
  # JWT_SECRET aleatório e forte
  SECRET="$(openssl rand -hex 32)"
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" .env
  # CORS: aponta o CLIENT_URL para o IP público (se houver), senão localhost
  if [ -n "${PUBLIC_IP}" ]; then
    sed -i "s|^CLIENT_URL=.*|CLIENT_URL=http://${PUBLIC_IP}|" .env
  fi
  chown "${APP_USER}:${APP_USER}" .env
  ok "JWT_SECRET aleatório gerado e CLIENT_URL configurado."
fi

# =============================================================
#  ETAPA 08 — BUILD E SUBIDA DOS CONTAINERS
# =============================================================
banner "ETAPA 08 — Build e Deploy (Docker Compose)"
if ! docker info >/dev/null 2>&1; then
  err "O daemon do Docker não está rodando."
  exit 1
fi
info "Buildando imagens e subindo os containers (pode levar alguns minutos)..."
docker compose up -d --build
ok "Containers no ar."

# =============================================================
#  ETAPA 09 — HEALTHCHECK DO BACKEND
# =============================================================
banner "ETAPA 09 — Validação (Backend Healthcheck)"
info "Aguardando o backend responder em /health..."
COUNT=0
until curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; do
  if [ "$COUNT" -ge 40 ]; then
    err "Backend não respondeu a tempo. Veja os logs:"
    echo "    docker compose -f ${APP_DIR}/docker-compose.yml logs --tail=80"
    exit 1
  fi
  echo -n "."
  sleep 3
  COUNT=$((COUNT+1))
done
echo
ok "Backend ONLINE em /health!"

# =============================================================
#  ETAPA 10 — FIREWALL (LOCAL) / SECURITY GROUP
# =============================================================
banner "ETAPA 10 — Acesso de Rede"
if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-port="${FRONTEND_PORT}/tcp" &>/dev/null || true
  firewall-cmd --permanent --add-port="${API_PORT}/tcp" &>/dev/null || true
  firewall-cmd --reload &>/dev/null || true
  ok "Portas ${FRONTEND_PORT} e ${API_PORT} liberadas no firewall local."
else
  info "Firewall local (firewalld) inativo — libere as portas no Security Group da AWS."
fi

# =============================================================
#  RESUMO FINAL
# =============================================================
banner "RESUMO DA OPERAÇÃO — SkillEx"
[ -z "${PUBLIC_IP}" ] && PUBLIC_IP="<IP-PUBLICO-DA-INSTANCIA>"
echo -e "${GREEN}${BOLD}------------------------------------------------------------"
echo -e "  DEPLOY FINALIZADO COM SUCESSO"
echo -e "------------------------------------------------------------${RESET}"
echo -e "  APP (frontend) : ${CYAN}http://${PUBLIC_IP}${RESET}"
echo -e "  API            : ${CYAN}http://${PUBLIC_IP}:${API_PORT}${RESET}"
echo -e "  HEALTHCHECK    : ${CYAN}http://${PUBLIC_IP}:${API_PORT}/health${RESET}"
echo -e "  SWAGGER DOCS   : ${CYAN}http://${PUBLIC_IP}:${API_PORT}/api-docs${RESET}"
echo -e "  CONTA DE TESTE : ana@skillex.com / senha123  (se SEED_ON_START=true)"
echo -e "  VER LOGS       : cd ${APP_DIR} && docker compose logs -f"
echo -e "  PARAR          : cd ${APP_DIR} && docker compose down"
echo -e "${GREEN}${BOLD}------------------------------------------------------------${RESET}"
echo -e "${YELLOW}  ⚠ Libere a porta ${FRONTEND_PORT} (TCP) no Security Group — obrigatória."
echo -e "  ⚠ A porta ${API_PORT} (TCP) é opcional: só p/ acessar API/Swagger direto."
echo -e "  ⚠ Para usar 'docker' sem sudo, reconecte o SSH (grupo docker).${RESET}\n"
