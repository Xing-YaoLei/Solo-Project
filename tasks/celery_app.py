from celery import Celery
import pandas as pd
from datetime import datetime
import os

from app.config import Config
from app.database import SessionLocal
from app.models import CeleryTask, PermissionLog, ERPTransaction

celery = Celery(
    'audit_compliance',
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,
)


def _update_task_status(task_id: str, status: str, result: dict = None, error: str = None):
    db = SessionLocal()
    try:
        task = db.query(CeleryTask).filter(CeleryTask.task_id == task_id).first()
        if task:
            task.status = status
            task.result = result
            task.error_message = error
            if status in ['success', 'failure']:
                task.completed_at = datetime.now()
        db.commit()
    finally:
        db.close()


@celery.task(bind=True)
def import_permission_log(self, file_path: str):
    task_id = self.request.id
    
    db = SessionLocal()
    try:
        db_task = CeleryTask(
            task_id=task_id,
            task_type='import_permission_log',
            status='pending'
        )
        db.add(db_task)
        db.commit()
        
        _update_task_status(task_id, 'in_progress')
        
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        imported_count = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                log = PermissionLog(
                    employee_id=row.get('employee_id'),
                    action=str(row.get('action', '')),
                    resource=str(row.get('resource', '')),
                    ip_address=str(row.get('ip_address', '')),
                    log_time=pd.to_datetime(row.get('log_time')),
                    raw_data=row.to_dict()
                )
                db.add(log)
                imported_count += 1
                
                if idx % 100 == 0:
                    db.commit()
                    self.update_state(state='PROGRESS', meta={
                        'current': idx,
                        'total': len(df),
                        'imported': imported_count
                    })
            except Exception as e:
                errors.append(f'Row {idx+1}: {str(e)}')
        
        db.commit()
        
        result = {
            'imported_count': imported_count,
            'total_rows': len(df),
            'errors': errors[:10]
        }
        
        _update_task_status(task_id, 'success', result=result)
        return result
        
    except Exception as e:
        _update_task_status(task_id, 'failure', error=str(e))
        raise
    finally:
        db.close()


@celery.task(bind=True)
def import_erp_data(self, file_path: str):
    task_id = self.request.id
    
    db = SessionLocal()
    try:
        db_task = CeleryTask(
            task_id=task_id,
            task_type='import_erp_data',
            status='pending'
        )
        db.add(db_task)
        db.commit()
        
        _update_task_status(task_id, 'in_progress')
        
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        imported_count = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                trans = ERPTransaction(
                    transaction_no=str(row.get('transaction_no', f'TEMP{idx}')),
                    supplier_id=row.get('supplier_id'),
                    amount=float(row.get('amount', 0)),
                    transaction_date=pd.to_datetime(row.get('transaction_date')).date(),
                    transaction_type=str(row.get('transaction_type', '')),
                    department_id=row.get('department_id'),
                    raw_data=row.to_dict()
                )
                db.add(trans)
                imported_count += 1
                
                if idx % 100 == 0:
                    db.commit()
                    self.update_state(state='PROGRESS', meta={
                        'current': idx,
                        'total': len(df),
                        'imported': imported_count
                    })
            except Exception as e:
                errors.append(f'Row {idx+1}: {str(e)}')
        
        db.commit()
        
        result = {
            'imported_count': imported_count,
            'total_rows': len(df),
            'errors': errors[:10]
        }
        
        _update_task_status(task_id, 'success', result=result)
        return result
        
    except Exception as e:
        _update_task_status(task_id, 'failure', error=str(e))
        raise
    finally:
        db.close()


@celery.task(bind=True)
def run_risk_analysis(self, analysis_type: str = 'full'):
    task_id = self.request.id
    
    db = SessionLocal()
    try:
        db_task = CeleryTask(
            task_id=task_id,
            task_type='risk_analysis',
            status='pending'
        )
        db.add(db_task)
        db.commit()
        
        _update_task_status(task_id, 'in_progress')
        
        from utils.data_service import get_risk_summary
        
        end_date = datetime.now()
        start_date = end_date.replace(day=1)
        
        summary = get_risk_summary((start_date, end_date))
        
        result = {
            'analysis_type': analysis_type,
            'analysis_date': end_date.strftime('%Y-%m-%d %H:%M:%S'),
            'summary': summary
        }
        
        _update_task_status(task_id, 'success', result=result)
        return result
        
    except Exception as e:
        _update_task_status(task_id, 'failure', error=str(e))
        raise
    finally:
        db.close()


@celery.task(bind=True)
def generate_audit_report(self, report_type: str, params: dict = None):
    task_id = self.request.id
    
    db = SessionLocal()
    try:
        db_task = CeleryTask(
            task_id=task_id,
            task_type=f'generate_{report_type}_report',
            status='pending'
        )
        db.add(db_task)
        db.commit()
        
        _update_task_status(task_id, 'in_progress')
        
        from utils.data_service import (
            get_risk_summary, get_rectification_plans,
            get_sampling_data, get_supplier_ranking
        )
        
        params = params or {}
        
        report_data = {
            'report_type': report_type,
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'risk_summary': get_risk_summary(),
            'rectification_plans': get_rectification_plans(),
            'sampling_data': get_sampling_data(),
            'supplier_ranking': get_supplier_ranking(limit=10)
        }
        
        _update_task_status(task_id, 'success', result=report_data)
        return report_data
        
    except Exception as e:
        _update_task_status(task_id, 'failure', error=str(e))
        raise
    finally:
        db.close()


def get_task_status(task_id: str) -> dict:
    db = SessionLocal()
    try:
        task = db.query(CeleryTask).filter(CeleryTask.task_id == task_id).first()
        if not task:
            return {'status': 'not_found'}
        
        return {
            'task_id': task.task_id,
            'task_type': task.task_type,
            'status': task.status,
            'result': task.result,
            'error_message': task.error_message,
            'created_at': task.created_at.strftime('%Y-%m-%d %H:%M:%S') if task.created_at else None,
            'completed_at': task.completed_at.strftime('%Y-%m-%d %H:%M:%S') if task.completed_at else None
        }
    finally:
        db.close()
