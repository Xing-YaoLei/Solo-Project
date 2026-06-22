import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import func, case, and_, or_
from typing import Optional, Tuple, List, Dict, Any

from app.database import SessionLocal
from app.models import (
    Department, Employee, PermissionLog, Supplier, ERPTransaction,
    ChecklistCategory, ChecklistItem, ChecklistSubitem, AuditIssue,
    SamplingRecord, NoteTask, RectificationPlan, Evidence, EmailRecord
)


def get_risk_summary(date_range: Optional[Tuple[datetime, datetime]] = None,
                     department_id: Optional[int] = None) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        query = db.query(AuditIssue)
        
        if date_range:
            query = query.filter(AuditIssue.discovered_date.between(
                date_range[0].date(), date_range[1].date()
            ))
        
        if department_id:
            query = query.filter(AuditIssue.department_id == department_id)
        
        total_issues = query.count()
        
        risk_counts = db.query(
            AuditIssue.risk_level, func.count(AuditIssue.id)
        ).filter(
            AuditIssue.id.in_([i.id for i in query.all()]) if date_range or department_id else True
        ).group_by(AuditIssue.risk_level).all()
        
        risk_dist = {level: 0 for level in ['critical', 'high', 'medium', 'low']}
        for level, count in risk_counts:
            risk_dist[level] = count
        
        status_counts = db.query(
            AuditIssue.status, func.count(AuditIssue.id)
        ).filter(
            AuditIssue.id.in_([i.id for i in query.all()]) if date_range or department_id else True
        ).group_by(AuditIssue.status).all()
        
        status_dist = {status: 0 for status in ['pending', 'in_progress', 'verified', 'resolved', 'closed']}
        for status, count in status_counts:
            status_dist[status] = count
        
        pending_rectification = db.query(AuditIssue).filter(
            AuditIssue.status.in_(['pending', 'in_progress']),
            AuditIssue.id.in_([i.id for i in query.all()]) if date_range or department_id else True
        ).count()
        
        overdue_plans = db.query(RectificationPlan).filter(
            RectificationPlan.status != 'closed',
            RectificationPlan.end_date < datetime.now().date(),
            RectificationPlan.issue_id.in_([i.id for i in query.all()]) if date_range or department_id else True
        ).count()
        
        missing_evidence = db.query(AuditIssue).filter(
            AuditIssue.has_evidence == False,
            AuditIssue.id.in_([i.id for i in query.all()]) if date_range or department_id else True
        ).count()
        
        total_population = db.query(ERPTransaction).count()
        sampled_count = db.query(SamplingRecord).filter(
            SamplingRecord.issue_id.in_([i.id for i in query.all()]) if date_range or department_id else True
        ).count()
        sampling_coverage = round((sampled_count / total_population * 100), 1) if total_population > 0 else 0
        
        departments = db.query(Department).all()
        dept_risks = []
        for dept in departments:
            dept_query = query.filter(AuditIssue.department_id == dept.id)
            dept_count = dept_query.count()
            
            dept_risk = {
                'critical': dept_query.filter(AuditIssue.risk_level == 'critical').count(),
                'high': dept_query.filter(AuditIssue.risk_level == 'high').count(),
                'medium': dept_query.filter(AuditIssue.risk_level == 'medium').count(),
                'low': dept_query.filter(AuditIssue.risk_level == 'low').count(),
            }
            dept_risks.append({
                'department': dept.name,
                'department_id': dept.id,
                'total': dept_count,
                **dept_risk
            })
        
        return {
            'total_issues': total_issues,
            'risk_distribution': risk_dist,
            'status_distribution': status_dist,
            'pending_rectification': pending_rectification,
            'overdue_plans': overdue_plans,
            'missing_evidence': missing_evidence,
            'sampling_coverage': sampling_coverage,
            'department_risks': dept_risks
        }
    finally:
        db.close()


def get_trend_data(months: int = 6) -> pd.DataFrame:
    db = SessionLocal()
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        data = []
        for i in range(months):
            month_start = end_date - timedelta(days=(months - i) * 30)
            month_end = end_date - timedelta(days=(months - i - 1) * 30)
            
            for risk in ['critical', 'high', 'medium', 'low']:
                count = db.query(AuditIssue).filter(
                    AuditIssue.discovered_date.between(month_start.date(), month_end.date()),
                    AuditIssue.risk_level == risk
                ).count()
                
                data.append({
                    'month': month_start.strftime('%Y-%m'),
                    'risk_level': risk,
                    'count': count
                })
        
        return pd.DataFrame(data)
    finally:
        db.close()


def get_checklist_tree(category_id: Optional[int] = None) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        query = db.query(ChecklistCategory)
        if category_id:
            query = query.filter(ChecklistCategory.id == category_id)
        
        categories = query.order_by(ChecklistCategory.sort_order).all()
        
        result = []
        for cat in categories:
            items = db.query(ChecklistItem).filter(
                ChecklistItem.category_id == cat.id
            ).order_by(ChecklistItem.sort_order).all()
            
            items_data = []
            for item in items:
                subitems = db.query(ChecklistSubitem).filter(
                    ChecklistSubitem.item_id == item.id
                ).order_by(ChecklistSubitem.sort_order).all()
                
                issue_count = db.query(AuditIssue).filter(
                    AuditIssue.checklist_item_id == item.id
                ).count()
                
                completed_count = db.query(AuditIssue).filter(
                    AuditIssue.checklist_item_id == item.id,
                    AuditIssue.status.in_(['verified', 'resolved', 'closed'])
                ).count()
                
                completion_rate = round(completed_count / issue_count * 100, 1) if issue_count > 0 else 100
                
                items_data.append({
                    'id': item.id,
                    'item_code': item.item_code,
                    'title': item.title,
                    'description': item.description,
                    'risk_level': item.risk_level,
                    'issue_count': issue_count,
                    'completion_rate': completion_rate,
                    'subitems': [{
                        'id': s.id,
                        'title': s.title,
                        'check_method': s.check_method,
                        'evidence_requirement': s.evidence_requirement
                    } for s in subitems]
                })
            
            result.append({
                'id': cat.id,
                'name': cat.name,
                'description': cat.description,
                'items': items_data,
                'total_issues': sum(i['issue_count'] for i in items_data),
                'completion_rate': round(
                    sum(i['completion_rate'] * i['issue_count'] for i in items_data) / sum(i['issue_count'] for i in items_data)
                    if sum(i['issue_count'] for i in items_data) > 0 else 100, 1
                )
            })
        
        return result
    finally:
        db.close()


def get_sampling_data() -> Dict[str, Any]:
    db = SessionLocal()
    try:
        departments = db.query(Department).all()
        sampling_coverage = []
        
        for dept in departments:
            total_transactions = db.query(ERPTransaction).filter(
                ERPTransaction.department_id == dept.id
            ).count()
            
            sampled_transactions = db.query(SamplingRecord).join(AuditIssue).filter(
                AuditIssue.department_id == dept.id,
                SamplingRecord.transaction_id.isnot(None)
            ).distinct(SamplingRecord.transaction_id).count()
            
            coverage = round(sampled_transactions / total_transactions * 100, 1) if total_transactions > 0 else 0
            
            sampling_coverage.append({
                'department': dept.name,
                'department_id': dept.id,
                'total_transactions': total_transactions,
                'sampled_count': sampled_transactions,
                'coverage': coverage,
                'target': 30.0
            })
        
        sampling_records = db.query(
            SamplingRecord, AuditIssue, Department, Employee, ERPTransaction, PermissionLog
        ).join(AuditIssue, SamplingRecord.issue_id == AuditIssue.id
        ).join(Department, AuditIssue.department_id == Department.id
        ).join(Employee, SamplingRecord.sampled_by == Employee.id
        ).outerjoin(ERPTransaction, SamplingRecord.transaction_id == ERPTransaction.id
        ).outerjoin(PermissionLog, SamplingRecord.permission_log_id == PermissionLog.id
        ).order_by(SamplingRecord.sampled_at.desc()
        ).limit(100).all()
        
        records_data = []
        for sr, issue, dept, emp, trans, perm in sampling_records:
            records_data.append({
                'sample_no': sr.sample_no,
                'issue_title': issue.title,
                'department': dept.name,
                'risk_level': issue.risk_level if issue.risk_level else 'medium',
                'sampled_by': emp.name,
                'sampled_at': sr.sampled_at.strftime('%Y-%m-%d %H:%M'),
                'result': sr.result if sr.result else '待核实',
                'notes': sr.notes if sr.notes else '',
                'transaction_no': trans.transaction_no if trans else '-',
                'transaction_amount': float(trans.amount) if trans and trans.amount else 0.0,
                'permission_action': perm.action if perm else '',
                'permission_resource': perm.resource if perm else '',
                'issue_id': issue.id
            })
        
        return {
            'coverage_by_department': sampling_coverage,
            'sampling_records': records_data
        }
    finally:
        db.close()


def get_rectification_plans(status: Optional[str] = None) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        query = db.query(
            RectificationPlan, AuditIssue, Department, Employee
        ).join(AuditIssue, RectificationPlan.issue_id == AuditIssue.id
        ).join(Department, AuditIssue.department_id == Department.id
        ).join(Employee, RectificationPlan.owner_id == Employee.id)
        
        if status:
            query = query.filter(RectificationPlan.status == status)
        
        plans = query.order_by(RectificationPlan.created_at.desc()).all()
        
        result = []
        for plan, issue, dept, owner in plans:
            is_overdue = plan.status != 'closed' and plan.end_date and plan.end_date < datetime.now().date()
            
            result.append({
                'id': plan.id,
                'title': plan.title,
                'issue_title': issue.title,
                'risk_level': issue.risk_level if issue.risk_level else 'medium',
                'department': dept.name,
                'owner': owner.name,
                'start_date': plan.start_date.strftime('%Y-%m-%d') if plan.start_date else '',
                'end_date': plan.end_date.strftime('%Y-%m-%d') if plan.end_date else '',
                'actual_end_date': plan.actual_end_date.strftime('%Y-%m-%d') if plan.actual_end_date else '',
                'progress': plan.progress if plan.progress is not None else 0,
                'status': plan.status if plan.status else 'pending',
                'is_overdue': is_overdue,
                'issue_id': issue.id,
                'description': plan.description if plan.description else ''
            })
        
        return result
    finally:
        db.close()


def get_note_tasks(status: Optional[str] = None) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        query = db.query(
            NoteTask, AuditIssue, Employee, Department
        ).join(AuditIssue, NoteTask.issue_id == AuditIssue.id
        ).join(Employee, NoteTask.assignee_id == Employee.id
        ).join(Department, AuditIssue.department_id == Department.id)
        
        if status:
            query = query.filter(NoteTask.status == status)
        
        tasks = query.order_by(NoteTask.due_date.asc()).all()
        
        result = []
        for task, issue, assignee, dept in tasks:
            is_overdue = task.status != 'closed' and task.due_date and task.due_date < datetime.now().date()
            
            result.append({
                'id': task.id,
                'title': task.title,
                'description': task.description if task.description else '',
                'issue_title': issue.title,
                'risk_level': issue.risk_level if issue.risk_level else 'medium',
                'department': dept.name,
                'assignee': assignee.name,
                'due_date': task.due_date.strftime('%Y-%m-%d') if task.due_date else '',
                'status': task.status if task.status else 'pending',
                'is_overdue': is_overdue,
                'issue_id': issue.id
            })
        
        return result
    finally:
        db.close()


def get_supplier_ranking(mode: str = 'absolute', limit: int = 20) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        suppliers = db.query(Supplier).all()
        
        supplier_data = []
        total_amount = 0
        
        for supplier in suppliers:
            transactions = db.query(ERPTransaction).filter(
                ERPTransaction.supplier_id == supplier.id
            ).all()
            
            total = sum(float(t.amount) for t in transactions)
            total_amount += total
            
            issue_count = db.query(AuditIssue).join(SamplingRecord).join(ERPTransaction).filter(
                ERPTransaction.supplier_id == supplier.id
            ).distinct(AuditIssue.id).count()
            
            supplier_data.append({
                'supplier_id': supplier.id,
                'supplier_name': supplier.name,
                'risk_level': supplier.risk_level if supplier.risk_level else 'medium',
                'transaction_count': len(transactions),
                'total_amount': total,
                'issue_count': issue_count,
                'percentage': 0.0
            })
        
        if mode == 'percentage':
            for s in supplier_data:
                s['percentage'] = round(s['total_amount'] / total_amount * 100, 2) if total_amount > 0 else 0
            supplier_data.sort(key=lambda x: x['percentage'], reverse=True)
        else:
            supplier_data.sort(key=lambda x: x['total_amount'], reverse=True)
        
        return supplier_data[:limit]
    finally:
        db.close()


def get_supplier_risk_distribution(supplier_id: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        issue_types = db.query(
            ChecklistCategory.name, func.count(AuditIssue.id)
        ).join(AuditIssue, ChecklistItem.category_id == ChecklistCategory.id
        ).join(SamplingRecord, SamplingRecord.issue_id == AuditIssue.id
        ).join(ERPTransaction, SamplingRecord.transaction_id == ERPTransaction.id
        ).filter(ERPTransaction.supplier_id == supplier_id
        ).group_by(ChecklistCategory.name).all()
        
        categories = ['财务管理制度', '采购管理制度', '销售管理制度', '人事管理制度', '信息安全制度']
        distribution = {cat: 0 for cat in categories}
        
        for name, count in issue_types:
            if name in distribution:
                distribution[name] = count
        
        return {
            'supplier_id': supplier_id,
            'risk_distribution': distribution
        }
    finally:
        db.close()


def get_issue_detail(issue_id: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        issue = db.query(AuditIssue, Department, Employee, ChecklistItem
        ).join(Department, AuditIssue.department_id == Department.id
        ).join(Employee, AuditIssue.assignee_id == Employee.id
        ).join(ChecklistItem, AuditIssue.checklist_item_id == ChecklistItem.id
        ).filter(AuditIssue.id == issue_id).first()
        
        if not issue:
            return None
        
        issue_obj, dept, assignee, checklist_item = issue
        
        sampling_records = db.query(
            SamplingRecord, ERPTransaction, PermissionLog, Employee
        ).join(ERPTransaction, SamplingRecord.transaction_id == ERPTransaction.id, isouter=True
        ).join(PermissionLog, SamplingRecord.permission_log_id == PermissionLog.id, isouter=True
        ).join(Employee, SamplingRecord.sampled_by == Employee.id
        ).filter(SamplingRecord.issue_id == issue_id).all()
        
        evidences = db.query(
            Evidence, EmailRecord
        ).join(EmailRecord, Evidence.id == EmailRecord.evidence_id, isouter=True
        ).filter(Evidence.issue_id == issue_id).all()
        
        note_tasks = db.query(
            NoteTask, Employee
        ).join(Employee, NoteTask.assignee_id == Employee.id
        ).filter(NoteTask.issue_id == issue_id).all()
        
        rectification_result = db.query(
            RectificationPlan, Employee
        ).join(Employee, RectificationPlan.owner_id == Employee.id
        ).filter(RectificationPlan.issue_id == issue_id).first()
        
        plan_obj = None
        owner_emp = None
        if rectification_result:
            plan_obj, owner_emp = rectification_result
        
        return {
            'id': issue_obj.id,
            'title': issue_obj.title,
            'description': issue_obj.description if issue_obj.description else '',
            'risk_level': issue_obj.risk_level if issue_obj.risk_level else 'medium',
            'status': issue_obj.status if issue_obj.status else 'pending',
            'department': dept.name,
            'assignee': assignee.name,
            'assignee_email': assignee.email if assignee.email else '',
            'discovered_date': issue_obj.discovered_date.strftime('%Y-%m-%d'),
            'conclusion': issue_obj.conclusion if issue_obj.conclusion else '',
            'has_evidence': bool(issue_obj.has_evidence),
            'checklist_item': {
                'code': checklist_item.item_code,
                'title': checklist_item.title,
                'description': checklist_item.description if checklist_item.description else ''
            },
            'sampling_records': [{
                'sample_no': sr.sample_no,
                'sampled_by': emp.name,
                'sampled_at': sr.sampled_at.strftime('%Y-%m-%d %H:%M'),
                'result': sr.result if sr.result else '待核实',
                'notes': sr.notes if sr.notes else '',
                'transaction_no': trans.transaction_no if trans else '-',
                'transaction_amount': float(trans.amount) if trans and trans.amount else 0.0,
                'transaction_date': trans.transaction_date.strftime('%Y-%m-%d') if trans and trans.transaction_date else '',
                'permission_action': perm.action if perm else '',
                'permission_resource': perm.resource if perm else '',
                'permission_time': perm.log_time.strftime('%Y-%m-%d %H:%M') if perm and perm.log_time else ''
            } for sr, trans, perm, emp in sampling_records],
            'evidences': [{
                'id': ev.id,
                'type': ev.type if ev.type else '',
                'description': ev.description if ev.description else '',
                'file_path': ev.file_path if ev.file_path else '',
                'email_sender': email.sender if email else '',
                'email_subject': email.subject if email else '',
                'email_body': email.body if email else '',
                'email_sent_at': email.sent_at.strftime('%Y-%m-%d %H:%M') if email and email.sent_at else ''
            } for ev, email in evidences],
            'note_tasks': [{
                'id': task.id,
                'title': task.title,
                'description': task.description if task.description else '',
                'assignee': emp.name,
                'due_date': task.due_date.strftime('%Y-%m-%d') if task.due_date else '',
                'status': task.status if task.status else 'pending'
            } for task, emp in note_tasks],
            'rectification_plan': {
                'id': plan_obj.id,
                'title': plan_obj.title,
                'description': plan_obj.description if plan_obj.description else '',
                'start_date': plan_obj.start_date.strftime('%Y-%m-%d') if plan_obj.start_date else '',
                'end_date': plan_obj.end_date.strftime('%Y-%m-%d') if plan_obj.end_date else '',
                'actual_end_date': plan_obj.actual_end_date.strftime('%Y-%m-%d') if plan_obj.actual_end_date else '',
                'progress': plan_obj.progress if plan_obj.progress is not None else 0,
                'status': plan_obj.status if plan_obj.status else 'pending',
                'owner': owner_emp.name if owner_emp else ''
            } if plan_obj else None
        }
    finally:
        db.close()


def update_issue_status(issue_id: int, status: str, conclusion: Optional[str] = None) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        issue = db.query(AuditIssue).filter(AuditIssue.id == issue_id).first()
        if not issue:
            return {'success': False, 'message': '问题不存在'}
        
        issue.status = status
        if conclusion:
            issue.conclusion = conclusion
        
        db.commit()
        return {'success': True, 'message': '状态更新成功'}
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}
    finally:
        db.close()


def create_note_task(issue_id: int, title: str, description: str,
                     assignee_id: int, due_date: datetime, created_by: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        task = NoteTask(
            issue_id=issue_id,
            title=title,
            description=description,
            assignee_id=assignee_id,
            due_date=due_date.date(),
            created_by=created_by
        )
        db.add(task)
        
        issue = db.query(AuditIssue).filter(AuditIssue.id == issue_id).first()
        if issue:
            issue.has_evidence = False
        
        db.commit()
        return {'success': True, 'task_id': task.id}
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}
    finally:
        db.close()
