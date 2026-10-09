#!/bin/sh
# Production entrypoint: apply pending migrations, then start (PRD §37).
set -e
echo "[entrypoint] applying database migrations…"
node node_modules/prisma/build/index.js migrate deploy
echo "[entrypoint] starting server…"
exec node server.js
