import logging
from datetime import datetime

from celery_app import celery_app
from sync.warehouse import WarehouseSyncer
from sync.driver_track import DriverTrackSyncer
from sync.miniapp_order import MiniappOrderSyncer
from analysis.funnel import recalculate_funnel_metrics

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.sync_warehouse_outbound")
def sync_warehouse_outbound(self, batch_date=None, batch_no=None):
    logger.info(f"Task sync_warehouse_outbound started: date={batch_date}, batch={batch_no}")
    syncer = WarehouseSyncer()
    sync_batch_id, count = syncer.sync(batch_date=batch_date, batch_no=batch_no)
    return {"sync_batch_id": sync_batch_id, "record_count": count}


@celery_app.task(bind=True, name="tasks.sync_driver_track")
def sync_driver_track(self, batch_date=None, batch_no=None):
    logger.info(f"Task sync_driver_track started: date={batch_date}, batch={batch_no}")
    syncer = DriverTrackSyncer()
    sync_batch_id, count = syncer.sync(batch_date=batch_date, batch_no=batch_no)
    return {"sync_batch_id": sync_batch_id, "record_count": count}


@celery_app.task(bind=True, name="tasks.sync_miniapp_order")
def sync_miniapp_order(self, batch_date=None, batch_no=None):
    logger.info(f"Task sync_miniapp_order started: date={batch_date}, batch={batch_no}")
    syncer = MiniappOrderSyncer()
    sync_batch_id, count = syncer.sync(batch_date=batch_date, batch_no=batch_no)
    return {"sync_batch_id": sync_batch_id, "record_count": count}


@celery_app.task(bind=True, name="tasks.sync_full_pipeline")
def sync_full_pipeline(self, batch_date=None, batch_no=None):
    logger.info(f"Task sync_full_pipeline started: date={batch_date}, batch={batch_no}")

    wh_result = sync_warehouse_outbound.delay(batch_date=batch_date, batch_no=batch_no)
    dt_result = sync_driver_track.delay(batch_date=batch_date, batch_no=batch_no)
    mo_result = sync_miniapp_order.delay(batch_date=batch_date, batch_no=batch_no)

    wh_data = wh_result.get(timeout=300)
    dt_data = dt_result.get(timeout=300)
    mo_data = mo_result.get(timeout=300)

    return {
        "warehouse": wh_data,
        "driver_track": dt_data,
        "miniapp_order": mo_data,
    }


@celery_app.task(bind=True, name="tasks.recalculate_metrics")
def recalculate_metrics(self, batch_date=None):
    logger.info(f"Task recalculate_metrics started: date={batch_date}")
    count = recalculate_funnel_metrics(batch_date=batch_date)
    return {"recalculated_count": count}
