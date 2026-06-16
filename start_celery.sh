#!/bin/bash

echo "🚀 启动 Celery Worker..."
celery -A tasks.celery_app worker --loglevel=info -Q audit,data_sync --concurrency=4
