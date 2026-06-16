"""
Celery Worker 启动入口
用法: celery -A worker.celery_app worker --loglevel=info -c 2
      celery -A worker.celery_app beat --loglevel=info
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.tasks import celery_app

if __name__ == "__main__":
    celery_app.start()
