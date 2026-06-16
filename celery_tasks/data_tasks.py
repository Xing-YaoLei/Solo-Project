import logging
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict, List

from celery import Task

from celery_tasks.celery_app import celery_app
from database import (
    SessionLocal,
    RefreshLog,
    AnomalyMarker,
    AnomalyType,
)
from etl import DataQuerier, DataTransformer, AnomalyDetector
from config import settings

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="refresh_data")
def refresh_data(
    self,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    data_source: str = "manual",
) -> Dict[str, any]:
    log_id = None
    try:
        refresh_log = RefreshLog(
            refresh_type="data_refresh",
            status="running",
            data_source=data_source,
        )
        self.db.add(refresh_log)
        self.db.commit()
        self.db.refresh(refresh_log)
        log_id = refresh_log.id

        start_dt = (
            datetime.strptime(start_date, "%Y-%m-%d")
            if start_date
            else datetime.now() - timedelta(days=90)
        )
        end_dt = (
            datetime.strptime(end_date, "%Y-%m-%d")
            if end_date
            else datetime.now() + timedelta(days=30)
        )

        with DataQuerier(self.db) as querier:
            appointments_df = querier.get_cleaning_appointments(start_dt, end_dt)
            payments_df = querier.get_payment_details(start_dt, end_dt, cleaning_only=True)

            transformer = DataTransformer()
            appointments_clean = transformer.clean_appointments(appointments_df)
            payments_clean = transformer.clean_payments(payments_df)

            records_processed = len(appointments_clean) + len(payments_clean)

            refresh_log.records_processed = records_processed
            refresh_log.status = "completed"
            refresh_log.end_time = datetime.now()
            self.db.commit()

            logger.info(f"数据刷新完成，处理记录数: {records_processed}")

            return {
                "status": "success",
                "records_processed": records_processed,
                "appointments_count": len(appointments_clean),
                "payments_count": len(payments_clean),
                "start_date": start_dt.strftime("%Y-%m-%d"),
                "end_date": end_dt.strftime("%Y-%m-%d"),
                "refresh_log_id": log_id,
            }

    except Exception as e:
        logger.error(f"数据刷新失败: {str(e)}", exc_info=True)
        if log_id:
            refresh_log = self.db.query(RefreshLog).filter(RefreshLog.id == log_id).first()
            if refresh_log:
                refresh_log.status = "failed"
                refresh_log.end_time = datetime.now()
                refresh_log.error_message = str(e)
                self.db.commit()
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="detect_anomalies")
def detect_anomalies(
    self,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, any]:
    log_id = None
    try:
        refresh_log = RefreshLog(
            refresh_type="anomaly_detection",
            status="running",
            data_source=settings.HIS_DATA_SOURCE,
        )
        self.db.add(refresh_log)
        self.db.commit()
        self.db.refresh(refresh_log)
        log_id = refresh_log.id

        start_dt = (
            datetime.strptime(start_date, "%Y-%m-%d")
            if start_date
            else datetime.now() - timedelta(days=90)
        )
        end_dt = (
            datetime.strptime(end_date, "%Y-%m-%d")
            if end_date
            else datetime.now()
        )

        with DataQuerier(self.db) as querier:
            appointments_df = querier.get_cleaning_appointments(start_dt, end_dt)
            payments_df = querier.get_payment_details(start_dt, end_dt, cleaning_only=True)

            transformer = DataTransformer()
            appointments_clean = transformer.clean_appointments(appointments_df)
            payments_clean = transformer.clean_payments(payments_df)

            detector = AnomalyDetector(self.db)
            anomalies = detector.detect_all_anomalies(appointments_clean, payments_clean)

            saved_count = 0
            for anomaly_data in anomalies:
                existing = (
                    self.db.query(AnomalyMarker)
                    .filter(
                        AnomalyMarker.anomaly_type == anomaly_data["anomaly_type"],
                        AnomalyMarker.description == anomaly_data["description"],
                        AnomalyMarker.is_resolved == False,
                    )
                    .first()
                )

                if not existing:
                    anomaly = AnomalyMarker(
                        anomaly_type=anomaly_data["anomaly_type"],
                        severity=anomaly_data["severity"],
                        appointment_no=anomaly_data.get("appointment_no"),
                        payment_id=anomaly_data.get("payment_id"),
                        description=anomaly_data["description"],
                        data_snapshot=anomaly_data.get("data_snapshot"),
                    )
                    self.db.add(anomaly)
                    saved_count += 1

            self.db.commit()

            refresh_log.records_processed = len(appointments_clean) + len(payments_clean)
            refresh_log.anomalies_detected = saved_count
            refresh_log.status = "completed"
            refresh_log.end_time = datetime.now()
            self.db.commit()

            anomaly_summary = {}
            for a in anomalies:
                atype = a["anomaly_type"].value
                anomaly_summary[atype] = anomaly_summary.get(atype, 0) + 1

            logger.info(f"异常检测完成，发现 {len(anomalies)} 条异常，新增 {saved_count} 条记录")

            return {
                "status": "success",
                "total_anomalies_found": len(anomalies),
                "new_anomalies_saved": saved_count,
                "anomaly_summary": anomaly_summary,
                "refresh_log_id": log_id,
            }

    except Exception as e:
        logger.error(f"异常检测失败: {str(e)}", exc_info=True)
        if log_id:
            refresh_log = self.db.query(RefreshLog).filter(RefreshLog.id == log_id).first()
            if refresh_log:
                refresh_log.status = "failed"
                refresh_log.end_time = datetime.now()
                refresh_log.error_message = str(e)
                self.db.commit()
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="full_refresh")
def full_refresh(
    self,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, any]:
    logger.info("开始执行完整刷新流程")

    refresh_result = refresh_data.apply(
        args=[start_date, end_date, "full_refresh"],
        throw=True,
    )

    anomaly_result = detect_anomalies.apply(
        args=[start_date, end_date],
        throw=True,
    )

    return {
        "status": "success",
        "data_refresh": refresh_result.result,
        "anomaly_detection": anomaly_result.result,
    }


@celery_app.task(base=DatabaseTask, bind=True, name="check_delayed_appointments")
def check_delayed_appointments(self) -> Dict[str, any]:
    try:
        with DataQuerier(self.db) as querier:
            delayed_df = querier.get_delayed_appointments(
                threshold_hours=settings.APPOINTMENT_DELAY_THRESHOLD_HOURS
            )

            saved_count = 0
            for _, row in delayed_df.iterrows():
                delay_hours = (
                    datetime.now() - pd.to_datetime(row["his_sync_time"])
                ).total_seconds() / 3600

                existing = (
                    self.db.query(AnomalyMarker)
                    .filter(
                        AnomalyMarker.anomaly_type == AnomalyType.APPOINTMENT_DELAY,
                        AnomalyMarker.appointment_no == row["appointment_no"],
                        AnomalyMarker.is_resolved == False,
                    )
                    .first()
                )

                if not existing:
                    anomaly = AnomalyMarker(
                        anomaly_type=AnomalyType.APPOINTMENT_DELAY,
                        severity="warning" if delay_hours < 48 else "error",
                        appointment_no=row["appointment_no"],
                        description=(
                            f"预约【{row['appointment_no']}】HIS同步延迟 {delay_hours:.1f} 小时"
                        ),
                        data_snapshot={
                            "delay_hours": round(delay_hours, 1),
                            "his_sync_time": str(row["his_sync_time"]),
                        },
                    )
                    self.db.add(anomaly)
                    saved_count += 1

            self.db.commit()

            logger.info(f"延迟预约检查完成，新增 {saved_count} 条延迟记录")

            return {
                "status": "success",
                "delayed_count": len(delayed_df),
                "new_anomalies": saved_count,
            }

    except Exception as e:
        logger.error(f"延迟预约检查失败: {str(e)}", exc_info=True)
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="check_missing_payments")
def check_missing_payments(self) -> Dict[str, any]:
    try:
        with DataQuerier(self.db) as querier:
            missing_df = querier.get_missing_payments(
                window_days=settings.MISSING_PAYMENT_WINDOW_DAYS
            )

            saved_count = 0
            for _, row in missing_df.iterrows():
                days_passed = (
                    datetime.now().date() - pd.to_datetime(row["appointment_date"]).date()
                ).days

                existing = (
                    self.db.query(AnomalyMarker)
                    .filter(
                        AnomalyMarker.anomaly_type == AnomalyType.MISSING_PAYMENT,
                        AnomalyMarker.appointment_no == row["appointment_no"],
                        AnomalyMarker.is_resolved == False,
                    )
                    .first()
                )

                if not existing:
                    anomaly = AnomalyMarker(
                        anomaly_type=AnomalyType.MISSING_PAYMENT,
                        severity="warning" if days_passed < 14 else "error",
                        appointment_no=row["appointment_no"],
                        description=(
                            f"预约【{row['appointment_no']}】已完成 {days_passed} 天但无收费记录"
                        ),
                        data_snapshot={
                            "days_passed": days_passed,
                            "appointment_date": str(row["appointment_date"]),
                            "amount": float(row.get("amount", 0)),
                        },
                    )
                    self.db.add(anomaly)
                    saved_count += 1

            self.db.commit()

            logger.info(f"缺失收费检查完成，新增 {saved_count} 条缺失记录")

            return {
                "status": "success",
                "missing_count": len(missing_df),
                "new_anomalies": saved_count,
            }

    except Exception as e:
        logger.error(f"缺失收费检查失败: {str(e)}", exc_info=True)
        raise
