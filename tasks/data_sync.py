from tasks.celery_app import celery
from models.database import SessionLocal, CashierRecord, CashierRecordItem, InsuranceRecord
import pandas as pd
from datetime import datetime, timedelta
import json


@celery.task(bind=True, max_retries=3)
def sync_cashier_data(self, store_id=None, days_back=1):
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days_back)

        cashier_records = fetch_cashier_records_from_api(store_id, start_time, end_time)
        db = SessionLocal()

        for record in cashier_records:
            existing = db.query(CashierRecord).filter(CashierRecord.receipt_no == record['receipt_no']).first()
            if not existing:
                cashier = CashierRecord(
                    receipt_no=record['receipt_no'],
                    store_id=record.get('store_id'),
                    member_id=record.get('member_id'),
                    cashier=record.get('cashier'),
                    sale_time=record.get('sale_time'),
                    total_amount=record.get('total_amount'),
                    payment_method=record.get('payment_method'),
                    insurance_amount=record.get('insurance_amount', 0),
                    self_pay_amount=record.get('self_pay_amount', 0),
                    is_insurance_settled=record.get('is_insurance_settled', False)
                )
                db.add(cashier)
                db.flush()

                for item in record.get('items', []):
                    cashier_item = CashierRecordItem(
                        cashier_record_id=cashier.id,
                        drug_id=item.get('drug_id'),
                        inventory_id=item.get('inventory_id'),
                        batch_no=item.get('batch_no'),
                        quantity=item.get('quantity'),
                        unit_price=item.get('unit_price'),
                        subtotal=item.get('subtotal'),
                        is_prescription=item.get('is_prescription', False),
                        prescription_id=item.get('prescription_id')
                    )
                    db.add(cashier_item)

        db.commit()
        db.close()
        return {'status': 'success', 'synced_records': len(cashier_records)}
    except Exception as e:
        self.retry(exc=e, countdown=300)


@celery.task(bind=True, max_retries=3)
def sync_insurance_data(self, store_id=None, days_back=1):
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days_back)

        insurance_records = fetch_insurance_records_from_api(store_id, start_time, end_time)
        db = SessionLocal()

        for record in insurance_records:
            existing = db.query(InsuranceRecord).filter(InsuranceRecord.insurance_no == record['insurance_no']).first()
            if not existing:
                insurance = InsuranceRecord(
                    insurance_no=record['insurance_no'],
                    cashier_record_id=record.get('cashier_record_id'),
                    store_id=record.get('store_id'),
                    member_id=record.get('member_id'),
                    settlement_time=record.get('settlement_time'),
                    insurance_type=record.get('insurance_type'),
                    policy_holder_name=record.get('policy_holder_name'),
                    policy_holder_id=record.get('policy_holder_id'),
                    total_amount=record.get('total_amount'),
                    insurance_pay=record.get('insurance_pay'),
                    self_pay=record.get('self_pay'),
                    reimbursement_ratio=record.get('reimbursement_ratio'),
                    status=record.get('status', '成功'),
                    error_message=record.get('error_message'),
                    response_data=json.dumps(record.get('response_data', {}))
                )
                db.add(insurance)

        db.commit()
        db.close()
        return {'status': 'success', 'synced_records': len(insurance_records)}
    except Exception as e:
        self.retry(exc=e, countdown=300)


def fetch_cashier_records_from_api(store_id=None, start_time=None, end_time=None):
    return []


def fetch_insurance_records_from_api(store_id=None, start_time=None, end_time=None):
    return []


@celery.task(bind=True)
def full_data_sync(self, days_back=7):
    cashier_result = sync_cashier_data.delay(store_id=None, days_back=days_back)
    insurance_result = sync_insurance_data.delay(store_id=None, days_back=days_back)
    return {
        'status': 'processing',
        'cashier_task_id': cashier_result.id,
        'insurance_task_id': insurance_result.id
    }


@celery.task(bind=True)
def check_sync_status(self, task_id):
    from celery.result import AsyncResult
    result = AsyncResult(task_id, app=celery)
    return {
        'task_id': task_id,
        'status': result.status,
        'result': result.result if result.ready() else None
    }
