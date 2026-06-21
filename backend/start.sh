#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Solo Management System - Backend Start"
echo "=========================================="

if [ ! -f .env ]; then
    echo "⚠️  .env file not found, copying from .env.example..."
    cp .env.example .env
    echo "✅  .env file created. Please update it with your configuration."
fi

echo "📁  Creating necessary directories..."
mkdir -p data uploads exports

if [ -z "$VIRTUAL_ENV" ] && [ -d "venv" ]; then
    echo "🐍  Activating virtual environment..."
    source venv/bin/activate
elif [ -z "$VIRTUAL_ENV" ] && [ -d ".venv" ]; then
    echo "🐍  Activating virtual environment..."
    source .venv/bin/activate
fi

export APP_ENV=development
export DEBUG=true
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
WORKERS=${WORKERS:-1}
RELOAD=${RELOAD:-true}

echo "🚀  Starting Uvicorn server on $HOST:$PORT..."
echo "🔧  API Documentation: http://$HOST:$PORT/docs"
echo "🔧  Alternative Docs: http://$HOST:$PORT/redoc"
echo ""

if [ "$RELOAD" = "true" ]; then
    exec uvicorn main:app --host "$HOST" --port "$PORT" --workers "$WORKERS" --reload
else
    exec uvicorn main:app --host "$HOST" --port "$PORT" --workers "$WORKERS"
fi
