#!/bin/bash
set -e

echo "启动 Celery Beat (定时任务调度器)..."
celery -A app.utils.celery_app.celery_app beat --loglevel=info
