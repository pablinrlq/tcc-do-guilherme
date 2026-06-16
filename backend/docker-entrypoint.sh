#!/bin/sh
# =============================================================================
#  SkillEx Backend — entrypoint do container
#  1. Aplica as migrations pendentes (prisma migrate deploy)
#  2. (Opcional) Popula o banco com dados de demonstração — só na 1ª vez
#  3. Inicia a API
# =============================================================================
set -e

echo "▶ Aplicando migrations do banco..."
node_modules/.bin/prisma migrate deploy

# Seed de demonstração: roda apenas se SEED_ON_START=true e ainda não rodou.
# O marcador fica no volume de dados, então persiste entre reinícios.
if [ "${SEED_ON_START}" = "true" ] && [ ! -f /app/data/.seeded ]; then
  echo "▶ Populando banco com dados de demonstração (seed)..."
  if node_modules/.bin/tsx prisma/seed.ts; then
    touch /app/data/.seeded
    echo "✔ Seed concluído (login de teste: ana@skillex.com / senha123)."
  else
    echo "⚠ Seed falhou — a API vai subir mesmo assim, sem dados de exemplo."
  fi
fi

echo "▶ Iniciando API SkillEx..."
exec node dist/server.js
