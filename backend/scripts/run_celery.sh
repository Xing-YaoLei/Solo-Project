#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== 启动Celery Worker (进度落后检测) ==="
echo "按 Ctrl+C 停止"
echo ""

exec celery -A app.core.celery_app.celery_app worker --loglevel=info --pool=solo
