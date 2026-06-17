import os
from app.celery_app import celery
from app.batch_utils import create_batch, complete_batch
from app.processors.crm_processor import CRMProcessor
from app.processors.contract_processor import ContractProcessor
from app.processors.meter_repair_processor import MeterReadingProcessor, RepairProcessor
from app.config import config


@celery.task(bind=True, name='tasks.import_crm_properties')
def import_crm_properties_task(self, file_path, user_id=None):
    source_file = os.path.basename(file_path)
    batch_no = create_batch('crm_property', source_file=source_file, imported_by=user_id)
    try:
        processor = CRMProcessor(batch_no, user_id)
        result = processor.import_properties(file_path)
        return {'batch_no': batch_no, **result}
    except Exception as e:
        complete_batch(batch_no, error_message=str(e))
        raise


@celery.task(bind=True, name='tasks.import_crm_tenants')
def import_crm_tenants_task(self, file_path, user_id=None):
    source_file = os.path.basename(file_path)
    batch_no = create_batch('crm_tenant', source_file=source_file, imported_by=user_id)
    try:
        processor = CRMProcessor(batch_no, user_id)
        result = processor.import_tenants(file_path)
        return {'batch_no': batch_no, **result}
    except Exception as e:
        complete_batch(batch_no, error_message=str(e))
        raise


@celery.task(bind=True, name='tasks.import_contracts')
def import_contracts_task(self, file_path, user_id=None):
    source_file = os.path.basename(file_path)
    batch_no = create_batch('contract', source_file=source_file, imported_by=user_id)
    try:
        processor = ContractProcessor(batch_no, user_id)
        result = processor.import_contracts(file_path)
        processor.merge_with_crm()
        return {'batch_no': batch_no, **result}
    except Exception as e:
        complete_batch(batch_no, error_message=str(e))
        raise


@celery.task(bind=True, name='tasks.import_meter_readings')
def import_meter_readings_task(self, file_path, user_id=None):
    source_file = os.path.basename(file_path)
    batch_no = create_batch('meter', source_file=source_file, imported_by=user_id)
    try:
        processor = MeterReadingProcessor(batch_no, user_id)
        result = processor.import_readings(file_path)
        return {'batch_no': batch_no, **result}
    except Exception as e:
        complete_batch(batch_no, error_message=str(e))
        raise


@celery.task(bind=True, name='tasks.import_repair_records')
def import_repair_records_task(self, file_path, user_id=None):
    source_file = os.path.basename(file_path)
    batch_no = create_batch('repair', source_file=source_file, imported_by=user_id)
    try:
        processor = RepairProcessor(batch_no, user_id)
        result = processor.import_repairs(file_path)
        return {'batch_no': batch_no, **result}
    except Exception as e:
        complete_batch(batch_no, error_message=str(e))
        raise


@celery.task(bind=True, name='tasks.full_pipeline')
def full_pipeline_task(self, crm_property_file=None, crm_tenant_file=None,
                       contract_file=None, meter_file=None, repair_file=None,
                       user_id=None):
    results = {}
    batch_nos = []

    try:
        if crm_property_file and os.path.exists(crm_property_file):
            r = import_crm_properties_task.apply(
                args=[crm_property_file, user_id], throw=True
            )
            results['crm_property'] = r.result
            batch_nos.append(r.result.get('batch_no'))

        if crm_tenant_file and os.path.exists(crm_tenant_file):
            r = import_crm_tenants_task.apply(
                args=[crm_tenant_file, user_id], throw=True
            )
            results['crm_tenant'] = r.result
            batch_nos.append(r.result.get('batch_no'))

        if contract_file and os.path.exists(contract_file):
            r = import_contracts_task.apply(
                args=[contract_file, user_id], throw=True
            )
            results['contract'] = r.result
            batch_nos.append(r.result.get('batch_no'))

        if meter_file and os.path.exists(meter_file):
            r = import_meter_readings_task.apply(
                args=[meter_file, user_id], throw=True
            )
            results['meter'] = r.result
            batch_nos.append(r.result.get('batch_no'))

        if repair_file and os.path.exists(repair_file):
            r = import_repair_records_task.apply(
                args=[repair_file, user_id], throw=True
            )
            results['repair'] = r.result
            batch_nos.append(r.result.get('batch_no'))

        return {'status': 'completed', 'batches': batch_nos, 'results': results}
    except Exception as e:
        return {'status': 'failed', 'error': str(e), 'batches': batch_nos, 'results': results}
