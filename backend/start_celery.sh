#!/bin/bash

echo "=== 启动 Celery Worker ==="

cd "$(dirname "$0")" || exit 1

source venv/bin/activate || source venv/Scripts/activate

echo "启动 Celery Worker..."
celery -A app.celery_app.celery_app worker --loglevel=info --pool=solo
