import pandas as pd
from datetime import date, datetime
from sqlalchemy import text
from tasks.celery_app import celery_app
from data.database import SessionLocal, engine
from data.models import (
    Vehicle, RepairOrder, DiagnosisResult, OrderItem,
    InsuranceMaterial, PartsInventory, PartsUsage,
    ReworkRecord, ETLLog
)
from data.pipeline import DataPipeline

pipeline = DataPipeline()


def log_etl_start(task_name: str, source_system: str, run_date: date) -> int:
    db = SessionLocal()
    try:
        log = ETLLog(
            task_name=task_name,
            source_system=source_system,
            run_date=run_date,
            status="running"
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log.id
    finally:
        db.close()


def log_etl_finish(log_id: int, status: str, stats: dict, error_msg: str = None):
    db = SessionLocal()
    try:
        log = db.query(ETLLog).filter(ETLLog.id == log_id).first()
        if log:
            log.status = status
            log.records_input = stats.get('input', 0)
            log.records_output = stats.get('output', 0)
            log.records_deduplicated = stats.get('deduplicated', 0)
            log.records_invalid = stats.get('invalid', 0)
            log.error_message = error_msg
            log.finished_at = datetime.now()
            db.commit()
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def etl_vehicles_task(self, source_system: str, source_data: list = None):
    log_id = log_etl_start("etl_vehicles", source_system, date.today())
    stats = {'input': 0, 'output': 0, 'deduplicated': 0, 'invalid': 0}

    try:
        if source_data:
            df = pd.DataFrame(source_data)
        else:
            df = pd.DataFrame()

        stats['input'] = len(df)

        if df.empty:
            log_etl_finish(log_id, "success", stats)
            return stats

        processed_df, proc_stats = pipeline.process_vehicles(df, source_system)
        stats.update(proc_stats)

        db = SessionLocal()
        try:
            for _, row in processed_df.iterrows():
                existing = db.query(Vehicle).filter(Vehicle.vin == row['vin']).first()
                if existing:
                    for col in processed_df.columns:
                        if col in row and row[col] is not None and hasattr(existing, col):
                            setattr(existing, col, row[col])
                else:
                    vehicle = Vehicle(**{k: v for k, v in row.items() if k in Vehicle.__table__.columns})
                    db.add(vehicle)
            db.commit()
        finally:
            db.close()

        log_etl_finish(log_id, "success", stats)
        return stats

    except Exception as e:
        log_etl_finish(log_id, "failed", stats, str(e))
        raise self.retry(exc=e, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def etl_repair_orders_task(self, source_system: str, source_data: list = None):
    log_id = log_etl_start("etl_repair_orders", source_system, date.today())
    stats = {'input': 0, 'output': 0, 'deduplicated': 0, 'invalid': 0}

    try:
        if source_data:
            df = pd.DataFrame(source_data)
        else:
            df = pd.DataFrame()

        stats['input'] = len(df)

        if df.empty:
            log_etl_finish(log_id, "success", stats)
            return stats

        processed_df, proc_stats = pipeline.process_repair_orders(df, source_system)
        stats.update(proc_stats)

        db = SessionLocal()
        try:
            for _, row in processed_df.iterrows():
                existing = db.query(RepairOrder).filter(
                    RepairOrder.source_system == source_system,
                    RepairOrder.source_id == str(row.get('source_id', ''))
                ).first()

                if 'vin' in row and row['vin']:
                    vehicle = db.query(Vehicle).filter(Vehicle.vin == row['vin']).first()
                    if vehicle:
                        row['vehicle_id'] = vehicle.id

                if existing:
                    for col in processed_df.columns:
                        if col in row and row[col] is not None and hasattr(existing, col) and col != 'id':
                            setattr(existing, col, row[col])
                else:
                    order_data = {k: v for k, v in row.items()
                                  if k in RepairOrder.__table__.columns and k != 'id'}
                    order = RepairOrder(**order_data)
                    db.add(order)
            db.commit()
        finally:
            db.close()

        log_etl_finish(log_id, "success", stats)
        return stats

    except Exception as e:
        log_etl_finish(log_id, "failed", stats, str(e))
        raise self.retry(exc=e, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def etl_diagnosis_task(self, source_system: str, source_data: list = None):
    log_id = log_etl_start("etl_diagnosis", source_system, date.today())
    stats = {'input': 0, 'output': 0, 'deduplicated': 0, 'invalid': 0}

    try:
        if source_data:
            df = pd.DataFrame(source_data)
        else:
            df = pd.DataFrame()

        stats['input'] = len(df)

        if df.empty:
            log_etl_finish(log_id, "success", stats)
            return stats

        processed_df, proc_stats = pipeline.process_diagnosis(df, source_system)
        stats.update(proc_stats)

        db = SessionLocal()
        try:
            for _, row in processed_df.iterrows():
                diag_data = {k: v for k, v in row.items()
                             if k in DiagnosisResult.__table__.columns and k != 'id'}
                diag = DiagnosisResult(**diag_data)
                db.add(diag)
            db.commit()
        finally:
            db.close()

        log_etl_finish(log_id, "success", stats)
        return stats

    except Exception as e:
        log_etl_finish(log_id, "failed", stats, str(e))
        raise self.retry(exc=e, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def etl_parts_inventory_task(self, source_system: str, source_data: list = None):
    log_id = log_etl_start("etl_parts_inventory", source_system, date.today())
    stats = {'input': 0, 'output': 0, 'deduplicated': 0, 'invalid': 0}

    try:
        if source_data:
            df = pd.DataFrame(source_data)
        else:
            df = pd.DataFrame()

        stats['input'] = len(df)

        if df.empty:
            log_etl_finish(log_id, "success", stats)
            return stats

        processed_df, proc_stats = pipeline.process_parts(df, source_system)
        stats.update(proc_stats)

        db = SessionLocal()
        try:
            for _, row in processed_df.iterrows():
                existing = db.query(PartsInventory).filter(
                    PartsInventory.part_code == row['part_code']
                ).first()
                if existing:
                    for col in processed_df.columns:
                        if col in row and row[col] is not None and hasattr(existing, col) and col != 'id':
                            setattr(existing, col, row[col])
                else:
                    part_data = {k: v for k, v in row.items()
                                 if k in PartsInventory.__table__.columns and k != 'id'}
                    part = PartsInventory(**part_data)
                    db.add(part)
            db.commit()
        finally:
            db.close()

        log_etl_finish(log_id, "success", stats)
        return stats

    except Exception as e:
        log_etl_finish(log_id, "failed", stats, str(e))
        raise self.retry(exc=e, countdown=60)


@celery_app.task(bind=True)
def etl_full_pipeline_task(self, source_systems: list = None):
    if source_systems is None:
        source_systems = ['dms', 'insurance', 'parts']

    results = {}
    for system in source_systems:
        try:
            vehicle_result = etl_vehicles_task.apply_async(args=[system, None])
            order_result = etl_repair_orders_task.apply_async(args=[system, None])
            results[system] = {
                'vehicles_task_id': vehicle_result.id,
                'orders_task_id': order_result.id,
            }
        except Exception as e:
            results[system] = {'error': str(e)}

    return results


@celery_app.task
def detect_rework_task(caliber_version: str = "v1.0"):
    db = SessionLocal()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT get_rework_rate(:caliber_version)
            """), {"caliber_version": caliber_version})
            rate = result.scalar()
        return {"caliber_version": caliber_version, "rework_rate": rate}
    finally:
        db.close()
