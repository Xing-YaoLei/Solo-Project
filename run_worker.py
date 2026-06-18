import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.celery_app import celery_app

if __name__ == "__main__":
    celery_app.worker_main(["worker", "--loglevel=info", "-P", "solo", "-c", "2"])
