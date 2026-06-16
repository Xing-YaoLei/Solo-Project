import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from celery_tasks.beat_config import celery_app

if __name__ == "__main__":
    celery_app.start()
