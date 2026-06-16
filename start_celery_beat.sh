#!/bin/bash

echo "⏰ 启动 Celery Beat 定时任务..."
celery -A tasks.celery_app beat --loglevel=info
