from datetime import datetime
from celery import Task
import logging

from app.models import db, DataRefreshLog
from celery_app import celery_app

logger = logging.getLogger(__name__)


class DBTask(Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        from flask import Flask
        from config import config
        import os

        config_name = os.environ.get('FLASK_ENV', 'default')
        flask_app = Flask(__name__)
        flask_app.config.from_object(config[config_name])
        flask_app.config['SQLALCHEMY_DATABASE_URI'] = config[config_name].SQLALCHEMY_DATABASE_URI
        flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        db.init_app(flask_app)
        with flask_app.app_context():
            return super().__call__(*args, **kwargs)


def _create_refresh_log(refresh_type: str, source: str = None,
                        triggered_by: str = None) -> DataRefreshLog:
    log = DataRefreshLog(
        refresh_type=refresh_type,
        source=source,
        status='running',
        triggered_by=triggered_by,
        started_at=datetime.utcnow()
    )
    db.session.add(log)
    db.session.commit()
    return log


def _update_refresh_log(log: DataRefreshLog, status: str,
                        processed: int = 0, added: int = 0,
                        updated: int = 0, failed: int = 0,
                        error: str = None):
    log.status = status
    log.records_processed = processed
    log.records_added = added
    log.records_updated = updated
    log.records_failed = failed
    log.finished_at = datetime.utcnow()
    log.error_message = error
    db.session.commit()


@celery_app.task(base=DBTask, bind=True, name='app.tasks.data_sync.fetch_email_attachments',
                 max_retries=3, default_retry_delay=300)
def fetch_email_attachments(self, triggered_by: str = None):
    log = _create_refresh_log('email', 'imap', triggered_by)
    try:
        from app.connectors.email_connector import EmailConnector
        connector = EmailConnector()
        parsed = connector.fetch_unread_emails(limit=200)
        stats = connector.save_to_db(parsed)
        connector.disconnect()

        _update_refresh_log(
            log, 'success',
            processed=stats['processed'],
            added=stats['added'],
            updated=stats['updated'],
            failed=stats['failed']
        )
        logger.info(f"Email sync completed: {stats}")
        return stats
    except Exception as exc:
        _update_refresh_log(log, 'failed', error=str(exc))
        logger.error(f"Email sync failed: {exc}")
        raise self.retry(exc=exc, countdown=300)


@celery_app.task(base=DBTask, bind=True, name='app.tasks.data_sync.sync_calendar_events',
                 max_retries=3, default_retry_delay=600)
def sync_calendar_events(self, triggered_by: str = None):
    log = _create_refresh_log('calendar', 'ics+webdav', triggered_by)
    try:
        from app.connectors.calendar_connector import CalendarConnector
        connector = CalendarConnector()
        total_events = []
        total_events.extend(connector.sync_ics_url())
        total_events.extend(connector.sync_webdav())
        stats = connector.save_to_db(total_events)

        _update_refresh_log(
            log, 'success',
            processed=stats['processed'],
            added=stats['added'],
            updated=stats['updated'],
            failed=stats['failed']
        )
        logger.info(f"Calendar sync completed: {stats}")
        return stats
    except Exception as exc:
        _update_refresh_log(log, 'failed', error=str(exc))
        logger.error(f"Calendar sync failed: {exc}")
        raise self.retry(exc=exc, countdown=600)


@celery_app.task(base=DBTask, bind=True, name='app.tasks.data_sync.import_payment_transactions',
                 max_retries=2, default_retry_delay=1800)
def import_payment_transactions(self, triggered_by: str = None):
    log = _create_refresh_log('payment', 'bank+alipay+wechat', triggered_by)
    try:
        from app.connectors.payment_connector import PaymentStatementParser
        parser = PaymentStatementParser()
        records = parser.parse_all_sources()
        stats = parser.save_to_db(records)

        _update_refresh_log(
            log, 'success',
            processed=stats['processed'],
            added=stats['added'],
            updated=stats['updated'],
            failed=stats['failed']
        )
        logger.info(f"Payment import completed: {stats}")
        return stats
    except Exception as exc:
        _update_refresh_log(log, 'failed', error=str(exc))
        logger.error(f"Payment import failed: {exc}")
        raise self.retry(exc=exc, countdown=1800)


@celery_app.task(base=DBTask, bind=True, name='app.tasks.anomaly_detect.detect_hearing_anomalies',
                 max_retries=2, default_retry_delay=900)
def detect_hearing_anomalies(self, triggered_by: str = None):
    log = _create_refresh_log('anomaly_detect', 'hearing', triggered_by)
    try:
        from app.connectors.calendar_connector import AnomalyDetector
        detector = AnomalyDetector()
        anomalies = detector.detect_all()
        db.session.commit()

        _update_refresh_log(
            log, 'success',
            processed=len(anomalies),
            added=len(anomalies)
        )
        logger.info(f"Anomaly detection completed: {len(anomalies)} anomalies")
        return {'anomalies': len(anomalies), 'details': anomalies}
    except Exception as exc:
        _update_refresh_log(log, 'failed', error=str(exc))
        logger.error(f"Anomaly detection failed: {exc}")
        raise self.retry(exc=exc, countdown=900)


@celery_app.task(base=DBTask, bind=True, name='app.tasks.data_sync.refresh_materialized_views',
                 max_retries=2, default_retry_delay=60)
def refresh_materialized_views(self, triggered_by: str = None):
    log = _create_refresh_log('mv', 'dashboard', triggered_by)
    try:
        from app.services.data_service import QueryService, TrendService, FinanceService
        from app.models import User, DashboardMaterializedView
        import pandas as pd
        import json
        import time

        start_ts = time.time()

        config_dict = {
            'ROLE_PERMISSIONS': __import__('config').Config.ROLE_PERMISSIONS
        }

        admin_users = User.query.filter_by(role='admin').all()
        admin_user = admin_users[0] if admin_users else User.query.first()

        views_to_refresh = {
            'client_trend': lambda: TrendService.get_client_trend_df(
                QueryService.get_clients_df(admin_user, config_dict)
            ).to_dict(orient='records') if admin_user else [],
            'case_stage_dist': lambda: TrendService.get_case_stage_distribution(
                QueryService.get_cases_df(admin_user, config_dict, include_finance=True)
            ).to_dict(orient='records') if admin_user else [],
            'evidence_detail': lambda: TrendService.get_evidence_detail_df(
                QueryService.get_evidences_df(admin_user, config_dict),
                QueryService.get_cases_df(admin_user, config_dict, include_finance=False)
            ).to_dict(orient='records') if admin_user else [],
            'hearing_anomalies': lambda: TrendService.get_hearing_anomaly_df(
                QueryService.get_hearings_df(admin_user, config_dict),
                QueryService.get_cases_df(admin_user, config_dict, include_finance=False)
            ).to_dict(orient='records') if admin_user else [],
            'payment_summary': lambda: FinanceService.get_payment_summary_df(
                QueryService.get_payments_df(admin_user, config_dict, include_finance=True),
                QueryService.get_cases_df(admin_user, config_dict, include_finance=True)
            ).to_dict(orient='records') if admin_user else [],
        }

        total_rows = 0
        for view_name, data_func in views_to_refresh.items():
            try:
                data = data_func()
                row_count = len(data) if isinstance(data, list) else 0
                total_rows += row_count
                duration = int((time.time() - start_ts) * 1000)

                mv = DashboardMaterializedView.query.filter_by(view_name=view_name).first()
                if mv:
                    mv.data_json = json.dumps(data, ensure_ascii=False, default=str)
                    mv.row_count = row_count
                    mv.last_refreshed = datetime.utcnow()
                    mv.refresh_duration_ms = duration
                else:
                    mv = DashboardMaterializedView(
                        view_name=view_name,
                        data_json=json.dumps(data, ensure_ascii=False, default=str),
                        row_count=row_count,
                        refresh_duration_ms=duration
                    )
                    db.session.add(mv)
            except Exception as e:
                logger.warning(f"Refresh MV {view_name} failed: {e}")

        db.session.commit()
        total_duration = int((time.time() - start_ts) * 1000)

        _update_refresh_log(
            log, 'success',
            processed=len(views_to_refresh),
            added=total_rows
        )
        logger.info(f"MV refresh completed: {len(views_to_refresh)} views, {total_rows} rows, {total_duration}ms")
        return {'views': len(views_to_refresh), 'rows': total_rows, 'duration_ms': total_duration}
    except Exception as exc:
        _update_refresh_log(log, 'failed', error=str(exc))
        logger.error(f"MV refresh failed: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(base=DBTask, bind=True, name='app.tasks.data_sync.full_sync_pipeline')
def full_sync_pipeline(self, triggered_by: str = None):
    logger.info("Starting full sync pipeline...")
    results = {}

    try:
        email_result = fetch_email_attachments.apply(args=[triggered_by])
        results['email'] = email_result.get(timeout=600) if email_result.state == 'SUCCESS' else None
    except Exception as e:
        results['email'] = f"error: {e}"

    try:
        cal_result = sync_calendar_events.apply(args=[triggered_by])
        results['calendar'] = cal_result.get(timeout=600) if cal_result.state == 'SUCCESS' else None
    except Exception as e:
        results['calendar'] = f"error: {e}"

    try:
        pay_result = import_payment_transactions.apply(args=[triggered_by])
        results['payment'] = pay_result.get(timeout=1200) if pay_result.state == 'SUCCESS' else None
    except Exception as e:
        results['payment'] = f"error: {e}"

    try:
        anom_result = detect_hearing_anomalies.apply(args=[triggered_by])
        results['anomaly'] = anom_result.get(timeout=600) if anom_result.state == 'SUCCESS' else None
    except Exception as e:
        results['anomaly'] = f"error: {e}"

    try:
        mv_result = refresh_materialized_views.apply(args=[triggered_by])
        results['mv'] = mv_result.get(timeout=600) if mv_result.state == 'SUCCESS' else None
    except Exception as e:
        results['mv'] = f"error: {e}"

    logger.info(f"Full pipeline completed: {results}")
    return results
