#!/bin/bash
set -e

echo "启动 Celery Worker..."
celery -A app.utils.celery_app.celery_app worker --loglevel=info -Q celery -c 2
