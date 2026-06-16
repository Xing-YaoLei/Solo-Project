from tasks.celery_app import celery
from models.database import SessionLocal, AuditTask, Prescription, FollowupRecord
from datetime import datetime, timedelta
import uuid


@celery.task(bind=True, max_retries=3)
def check_unclear_prescriptions(self):
    try:
        db = SessionLocal()
        unclear_prescriptions = db.query(Prescription).filter(
            Prescription.is_clear == False,
            Prescription.created_at >= datetime.now() - timedelta(hours=24)
        ).all()

        created_count = 0
        for rx in unclear_prescriptions:
            existing_task = db.query(AuditTask).filter(
                AuditTask.prescription_id == rx.id,
                AuditTask.task_type == '处方不清'
            ).first()

            if not existing_task:
                task = AuditTask(
                    task_no=f'TASK{datetime.now().strftime("%Y%m%d")}{uuid.uuid4().hex[:6].upper()}',
                    prescription_id=rx.id,
                    store_id=rx.store_id,
                    task_type='处方不清',
                    task_reason=rx.unclear_reason or '处方信息不清晰',
                    task_status='待处理',
                    priority='高' if rx.urgent else '中',
                    assigned_time=datetime.now(),
                    followup_needed=True,
                    followup_status='待回访'
                )
                db.add(task)
                created_count += 1

        db.commit()
        db.close()
        return {'status': 'success', 'created_tasks': created_count}
    except Exception as e:
        self.retry(exc=e, countdown=60)


@celery.task(bind=True, max_retries=3)
def send_followup_reminders(self):
    try:
        db = SessionLocal()
        pending_followups = db.query(AuditTask).filter(
            AuditTask.followup_needed == True,
            AuditTask.followup_status == '待回访',
            AuditTask.task_status == '已完成'
        ).all()

        reminded = []
        for task in pending_followups:
            if task.completed_time and (datetime.now() - task.completed_time).days >= 1:
                task.followup_status = '待处理'
                reminded.append(task.task_no)

        db.commit()
        db.close()
        return {'status': 'success', 'reminded_tasks': reminded}
    except Exception as e:
        self.retry(exc=e, countdown=300)


@celery.task(bind=True)
def create_audit_task(self, prescription_id, task_type, task_reason, priority='中'):
    try:
        db = SessionLocal()
        prescription = db.query(Prescription).get(prescription_id)
        if not prescription:
            return {'status': 'error', 'message': 'Prescription not found'}

        task = AuditTask(
            task_no=f'TASK{datetime.now().strftime("%Y%m%d")}{uuid.uuid4().hex[:6].upper()}',
            prescription_id=prescription_id,
            store_id=prescription.store_id,
            task_type=task_type,
            task_reason=task_reason,
            task_status='待处理',
            priority=priority,
            assigned_time=datetime.now(),
            followup_needed=task_type == '处方不清'
        )
        db.add(task)
        db.commit()
        db.close()
        return {'status': 'success', 'task_no': task.task_no}
    except Exception as e:
        self.retry(exc=e, countdown=30)


@celery.task(bind=True)
def complete_audit_task(self, task_id, handling_conclusion, completed_by, followup_needed=False):
    try:
        db = SessionLocal()
        task = db.query(AuditTask).get(task_id)
        if not task:
            return {'status': 'error', 'message': 'Task not found'}

        task.task_status = '已完成'
        task.completed_time = datetime.now()
        task.completed_by = completed_by
        task.handling_conclusion = handling_conclusion
        task.followup_needed = followup_needed
        task.followup_status = '待回访' if followup_needed else '无需回访'

        db.commit()
        db.close()
        return {'status': 'success', 'task_id': task_id}
    except Exception as e:
        self.retry(exc=e, countdown=30)


@celery.task(bind=True)
def record_followup(self, task_id, followup_type, followup_channel, followup_content,
                    contact_result, member_feedback, followup_operator, followup_status='已完成'):
    try:
        db = SessionLocal()
        task = db.query(AuditTask).get(task_id)
        if not task:
            return {'status': 'error', 'message': 'Task not found'}

        followup = FollowupRecord(
            task_id=task_id,
            prescription_id=task.prescription_id,
            member_id=task.prescription.member_id if task.prescription else None,
            store_id=task.store_id,
            followup_type=followup_type,
            followup_channel=followup_channel,
            followup_time=datetime.now(),
            followup_operator=followup_operator,
            contact_result=contact_result,
            followup_content=followup_content,
            member_feedback=member_feedback,
            followup_status=followup_status
        )
        db.add(followup)

        task.followup_status = followup_status
        task.followup_time = datetime.now()
        task.followup_operator = followup_operator
        task.followup_result = member_feedback

        db.commit()
        db.close()
        return {'status': 'success', 'followup_id': followup.id}
    except Exception as e:
        self.retry(exc=e, countdown=30)


@celery.task(bind=True)
def batch_process_unclear_prescriptions(self, prescription_ids):
    results = []
    for rx_id in prescription_ids:
        result = create_audit_task.delay(rx_id, '处方不清', '处方信息不清晰，需人工核实', '高')
        results.append(result.id)
    return {'status': 'processing', 'task_ids': results}
