#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}"

cd "${SCRIPT_DIR}"

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-1}"

echo "Starting Material Tracking Backend..."
echo "PYTHONPATH: ${PYTHONPATH}"
echo "Host: ${HOST}"
echo "Port: ${PORT}"
echo "Workers: ${WORKERS}"

exec uvicorn app.main:app \
    --host "${HOST}" \
    --port "${PORT}" \
    --workers "${WORKERS}" \
    --reload
