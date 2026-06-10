#!/bin/sh
set -e

wait_for_db() {
  echo ">> Aguardando Postgres em db:5432..."
  attempts=0
  max_attempts=30

  while [ "$attempts" -lt "$max_attempts" ]; do
    if nc -z db 5432 2>/dev/null; then
      echo ">> Banco acessível."
      return 0
    fi
    attempts=$((attempts + 1))
    echo ">> Tentativa ${attempts}/${max_attempts}..."
    sleep 2
  done
  return 1
}

wait_for_db

echo ">> Aplicando schema Prisma..."
npx prisma db push --accept-data-loss

echo ">> Gerando Prisma Client..."
npx prisma generate

if [ "${RUN_DB_IMPORT:-false}" = "true" ]; then
  echo ">> Importando dados do Excel..."
  npm run db:import
else
  echo ">> Seed (admin + dados demo)..."
  npm run db:seed
fi

echo ">> Iniciando aplicação..."
exec "$@"
