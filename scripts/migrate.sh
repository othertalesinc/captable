#!/bin/sh

set -euo pipefail

log() {
  printf '%s\n' "$1"
}

# Ensure seeding never blocks waiting for confirmation inside containers.
export SEED_SKIP_CONFIRM="${SEED_SKIP_CONFIRM:-true}"

log "➡  Running database migrations"
pnpm db:migrate

log "➡  Seeding database"
pnpm db:seed

log "🚀 Starting application server"
exec env HOSTNAME="0.0.0.0" PORT="${PORT:-3000}" node server.js
