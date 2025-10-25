#!/bin/sh

set -euo pipefail

log() {
  printf '%s\n' "$1"
}

run_with_auto_confirm() {
  cmd="$1"
  # `script` ensures the command thinks it has a TTY while `yes` feeds confirmations.
  yes | script -q -c "$cmd" /dev/null
}

log "➡  Running database migrations"
run_with_auto_confirm "pnpm db:migrate"

log "➡  Seeding database"
run_with_auto_confirm "pnpm db:seed"

log "🚀 Starting application server"
exec env HOSTNAME="0.0.0.0" PORT="${PORT:-3000}" node server.js
