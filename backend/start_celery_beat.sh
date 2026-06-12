#!/bin/bash

echo "=== 启动 Celery Beat ==="

cd "$(dirname "$0")" || exit 1

source venv/bin/activate || source venv/Scripts/activate

echo "启动 Celery Beat..."
celery -A app.celery_app.celery_app beat --loglevel=info
