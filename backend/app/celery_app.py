from celery import Celery
from kombu import Exchange, Queue
from .core.config import get_settings

settings = get_settings()


def _get_broker_url():
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        sock.connect((settings.REDIS_HOST, settings.REDIS_PORT))
        sock.close()
        return settings.CELERY_BROKER_URL, settings.CELERY_RESULT_BACKEND
    except Exception:
        import os
        base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "celery_data")
        return (
            f"filesystem://{base}/broker",
            f"file://{base}/results"
        )


broker_url, result_backend = _get_broker_url()
is_redis = broker_url.startswith("redis")

broker_transport_options = {}
result_backend_transport_options = {}
if not is_redis:
    import os
    base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "celery_data")
    for p in [f"{base}/broker/out", f"{base}/broker/control", f"{base}/results"]:
        try:
            os.makedirs(p, exist_ok=True)
        except Exception:
            pass
    broker_transport_options = {
        "data_folder_in": f"{base}/broker/out",
        "data_folder_out": f"{base}/broker/out",
        "control_folder": f"{base}/broker/control",
    }
    result_backend_transport_options = {
        "data_folder_in": f"{base}/results",
        "data_folder_out": f"{base}/results",
    }

celery_app = Celery(
    "homestay_tasks",
    broker=broker_url,
    backend=result_backend,
    broker_transport_options=broker_transport_options,
    include=[
        "app.tasks.oversold",
        "app.tasks.export_task",
    ]
)

if is_redis:
    task_default_queue = "homestay_default"
    task_queues = (
        Queue("homestay_default", Exchange("homestay_default"), routing_key="homestay_default"),
        Queue("homestay_anomaly", Exchange("homestay_anomaly"), routing_key="homestay_anomaly"),
        Queue("homestay_export", Exchange("homestay_export"), routing_key="homestay_export"),
    )
    celery_app.conf.update(
        task_default_queue="homestay_default",
        task_queues=task_queues,
        task_routes={
            "app.tasks.oversold.*": {"queue": "homestay_anomaly"},
            "app.tasks.export.*": {"queue": "homestay_export"},
        },
    )

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    task_time_limit=3600,
    result_expires=86400,
)

if not is_redis:
    print("⚠️  Redis 不可用，Celery 使用文件系统作为临时 broker/backend（请勿用于生产）")
else:
    print(f"✅ Celery 连接 Redis 成功: {settings.REDIS_HOST}:{settings.REDIS_PORT}")


if __name__ == "__main__":
    celery_app.start()
