#!/usr/bin/env bash
# =============================================================================
#  SkillEx — Bootstrap para Amazon Linux 2023 (EC2)
# -----------------------------------------------------------------------------
#  Faz TUDO numa instância nova:
#    1. Atualiza o sistema
#    2. Instala git, Docker, Docker Compose (plugin) e openssl
#    3. Habilita e inicia o Docker
#    4. Clona (ou atualiza) o repositório
#    5. Sobe a aplicação com ./deploy.sh
#
#  Como usar (instância EC2 recém-criada, Amazon Linux 2023):
#
#    # opção A — manual (após conectar via SSH):
#    curl -fsSL https://raw.githubusercontent.com/pablinrlq/tcc-do-guilherme/main/setup-aws.sh -o setup-aws.sh
#    sudo bash setup-aws.sh
#
#    # opção B — automático: cole o conteúdo deste arquivo no campo
#    #          "User data" ao criar a instância (roda no 1º boot).
#
#  Variáveis opcionais (override com VAR=valor antes do comando):
#    REPO_URL   repositório a clonar (padrão: este projeto)
#    APP_USER   usuário dono dos arquivos (padrão: ec2-user)
#    APP_DIR    pasta de instalação (padrão: /home/<APP_USER>/tcc-do-guilherme)
#    BRANCH     branch a usar (padrão: main)
# =============================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/pablinrlq/tcc-do-guilherme.git}"
APP_USER="${APP_USER:-ec2-user}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/tcc-do-guilherme}"
BRANCH="${BRANCH:-main}"

log() { printf "\n\033[1;34m▶ %s\033[0m\n" "$1"; }

# ─── Precisa rodar como root; se não for, re-executa com sudo ──────────────────
if [ "$(id -u)" -ne 0 ]; then
  log "Elevando privilégios com sudo..."
  exec sudo -E bash "$0" "$@"
fi

# ─── 1. Atualiza o sistema ────────────────────────────────────────────────────
log "Atualizando pacotes do sistema (dnf update)..."
dnf update -y

# ─── 2. Instala dependências base ─────────────────────────────────────────────
log "Instalando git, docker, openssl, tar..."
dnf install -y git docker openssl tar

# ─── 3. Habilita e inicia o Docker ────────────────────────────────────────────
log "Habilitando e iniciando o serviço Docker..."
systemctl enable --now docker

# Permite que o ec2-user use docker sem sudo (vale após reconectar via SSH)
usermod -aG docker "$APP_USER" 2>/dev/null || true

# ─── 3b. Garante o plugin Docker Buildx >= 0.17.0 ─────────────────────────────
# O 'docker compose build' (Compose v2) exige buildx >= 0.17.0. O pacote 'docker'
# do Amazon Linux 2023 pode trazer um buildx ANTIGO (ex.: 0.12.1) ou nenhum, o
# que faz o build falhar com: "compose build requires buildx 0.17.0 or later".
# Aqui checamos a VERSÃO (não só a existência) e instalamos um novo se preciso.
BUILDX_MIN="0.17.0"
buildx_ok=0
if docker buildx version >/dev/null 2>&1; then
  CUR_BUILDX="$(docker buildx version | grep -oP 'v?\K[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
  if [ -n "$CUR_BUILDX" ] && \
     [ "$(printf '%s\n%s\n' "$BUILDX_MIN" "$CUR_BUILDX" | sort -V | head -n1)" = "$BUILDX_MIN" ]; then
    buildx_ok=1
    log "Docker Buildx já atende ($CUR_BUILDX >= $BUILDX_MIN)."
  fi
fi

if [ "$buildx_ok" -ne 1 ]; then
  log "Instalando/atualizando o plugin Docker Buildx (atual: ${CUR_BUILDX:-nenhum})..."
  case "$(uname -m)" in
    x86_64)  BUILDX_ARCH="amd64" ;;
    aarch64) BUILDX_ARCH="arm64" ;;
    *)       BUILDX_ARCH="amd64" ;;
  esac
  BUILDX_VERSION="$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest \
    | grep -oP '"tag_name":\s*"\K[^"]+' || true)"
  [ -z "$BUILDX_VERSION" ] && BUILDX_VERSION="v0.17.1"   # fallback (>= 0.17.0)

  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL \
    "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-${BUILDX_ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-buildx
  chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
  log "Docker Buildx ${BUILDX_VERSION} instalado ($(docker buildx version | head -n1))."
fi

# ─── 4. Garante o Docker Compose v2 (plugin) ──────────────────────────────────
if docker compose version >/dev/null 2>&1; then
  log "Docker Compose já disponível ($(docker compose version | head -n1))."
else
  log "Instalando o plugin Docker Compose v2..."
  ARCH="$(uname -m)"   # x86_64 ou aarch64 (Graviton)
  COMPOSE_VERSION="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest \
    | grep -oP '"tag_name":\s*"\K[^"]+' || true)"
  [ -z "$COMPOSE_VERSION" ] && COMPOSE_VERSION="v2.39.1"   # fallback

  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  log "Docker Compose ${COMPOSE_VERSION} instalado."
fi

# ─── 5. Clona ou atualiza o repositório ───────────────────────────────────────
if [ -d "${APP_DIR}/.git" ]; then
  log "Repositório já existe — atualizando (git pull)..."
  git -C "${APP_DIR}" fetch origin "${BRANCH}"
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
else
  log "Clonando o repositório em ${APP_DIR}..."
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi

# Dono dos arquivos = usuário da aplicação
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

# ─── 6. Sobe a aplicação ──────────────────────────────────────────────────────
log "Subindo a aplicação com deploy.sh..."
cd "${APP_DIR}"
chmod +x deploy.sh
./deploy.sh up

# ─── 7. Mostra a URL pública (metadados do EC2 / IMDSv2) ──────────────────────
TOKEN="$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 120" 2>/dev/null || true)"
PUBIP="$(curl -fsS -H "X-aws-ec2-metadata-token: ${TOKEN}" \
  http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)"

echo
log "Deploy concluído! 🎉"
if [ -n "${PUBIP}" ]; then
  echo "   App:     http://${PUBIP}"
  echo "   API:     http://${PUBIP}:3333"
  echo "   Swagger: http://${PUBIP}:3333/api-docs"
else
  echo "   App em http://<IP-PUBLICO-DA-INSTANCIA>"
fi
echo
echo "   ⚠ Libere as portas 80 e 3333 (TCP) no Security Group da instância!"
echo "   ⚠ Para usar 'docker' sem sudo, reconecte o SSH (grupo docker recém-adicionado)."
