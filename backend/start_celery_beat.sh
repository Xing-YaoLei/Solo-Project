#!/bin/bash

echo "=== 启动 Celery Beat ==="

cd "$(dirname "$0")"

source venv/bin/activate

echo "启动 Celery Beat..."
celery -A app.celery_app.celery_app beat --loglevel=info
