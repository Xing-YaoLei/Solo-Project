import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
import pandas as pd
import numpy as np
from sqlalchemy import func

from app.database import init_db, SessionLocal
from app.models import (
    Department, Employee, PermissionLog, Supplier, ERPTransaction,
    ChecklistCategory, ChecklistItem, ChecklistSubitem, AuditIssue,
    SamplingRecord, NoteTask, RectificationPlan, Evidence, EmailRecord
)

DEPARTMENTS = [
    ('财务部', 'FIN'),
    ('采购部', 'PUR'),
    ('销售部', 'SAL'),
    ('人力资源部', 'HR'),
    ('信息技术部', 'IT'),
    ('行政部', 'ADM')
]

EMPLOYEES = [
    ('张三', 'EMP001', 1, 'zhangsan@company.com'),
    ('李四', 'EMP002', 1, 'lisi@company.com'),
    ('王五', 'EMP003', 2, 'wangwu@company.com'),
    ('赵六', 'EMP004', 2, 'zhaoliu@company.com'),
    ('钱七', 'EMP005', 3, 'qianqi@company.com'),
    ('孙八', 'EMP006', 3, 'sunba@company.com'),
    ('周九', 'EMP007', 4, 'zhoujiu@company.com'),
    ('吴十', 'EMP008', 5, 'wushi@company.com'),
    ('郑十一', 'EMP009', 5, 'zheng11@company.com'),
    ('冯十二', 'EMP010', 6, 'feng12@company.com'),
]

CATEGORIES = [
    ('财务管理制度', '财务核算、预算、资金管理等', 1),
    ('采购管理制度', '供应商管理、采购流程、合同管理等', 2),
    ('销售管理制度', '客户管理、销售流程、收款管理等', 3),
    ('人事管理制度', '招聘、考勤、薪酬、离职管理等', 4),
    ('信息安全制度', '权限管理、数据安全、系统访问等', 5),
]

CHECKLIST_ITEMS = [
    (1, 'FIN-001', '费用报销审批', '检查费用报销是否符合审批权限规定', 'high', 1),
    (1, 'FIN-002', '银行对账', '检查银行存款余额调节表编制是否及时', 'medium', 2),
    (1, 'FIN-003', '预算执行', '检查预算执行情况是否在合理范围内', 'medium', 3),
    (2, 'PUR-001', '供应商准入', '检查新增供应商是否经过资质审核', 'high', 1),
    (2, 'PUR-002', '采购询价', '检查大额采购是否执行三方询价', 'high', 2),
    (2, 'PUR-003', '合同管理', '检查采购合同是否按规定签署和归档', 'medium', 3),
    (3, 'SAL-001', '客户信用管理', '检查客户信用额度是否按规定执行', 'medium', 1),
    (3, 'SAL-002', '销售回款', '检查应收账款回收是否及时', 'high', 2),
    (4, 'HR-001', '招聘流程', '检查招聘流程是否符合规定', 'medium', 1),
    (4, 'HR-002', '考勤管理', '检查考勤记录是否真实准确', 'low', 2),
    (4, 'HR-003', '薪酬发放', '检查薪酬计算和发放是否准确', 'high', 3),
    (5, 'IT-001', '权限变更', '检查系统权限变更是否有审批记录', 'high', 1),
    (5, 'IT-002', '离职权限回收', '检查员工离职后系统权限是否及时回收', 'critical', 2),
    (5, 'IT-003', '数据备份', '检查数据备份是否按规定执行', 'high', 3),
]

CHECKLIST_SUBITEMS = [
    (1, '单张超过5000元的报销单审批', '检查审批人是否在权限范围内', '报销单+审批记录'),
    (1, '差旅费标准执行', '检查是否符合公司差旅费标准', '报销单+差旅标准'),
    (2, '月末银行对账', '检查银行余额调节表是否在次月5日前完成', '银行对账单+调节表'),
    (4, '供应商资质审核', '检查营业执照、税务登记证等是否齐全', '供应商档案+资质文件'),
    (4, '供应商现场考察', '检查新增供应商是否进行现场考察', '考察报告+照片'),
    (5, '10万元以上采购询价', '检查是否有至少三家供应商报价', '询价单+报价单'),
    (5, '中标结果公示', '检查中标结果是否按规定公示', '公示截图'),
    (12, '权限变更申请表', '检查是否有完整的审批流程', '权限变更申请表'),
    (12, '权限变更日志', '检查系统日志与申请是否一致', '系统权限日志'),
    (13, '离职员工权限清单', '检查离职当日权限是否全部回收', '离职交接单+权限清单'),
    (13, '特殊权限回收', '检查财务、采购等关键权限是否及时回收', '系统权限日志'),
]

SUPPLIERS = [
    ('北京科技有限公司', '91110105MA00ABCD12', '张经理', 'low'),
    ('上海贸易有限公司', '91310115MA1G34EF56', '李总', 'medium'),
    ('广州电子科技有限公司', '91440101MA5978GH90', '王经理', 'high'),
    ('深圳信息技术有限公司', '91440300MA5D89IJ01', '赵总', 'medium'),
    ('杭州网络科技有限公司', '91330106MA2723KL45', '孙经理', 'low'),
    ('成都软件开发有限公司', '91510100MA6156MN67', '周总', 'high'),
    ('武汉制造有限公司', '91420100MA4K89OP09', '吴经理', 'medium'),
    ('南京物流有限公司', '91320100MA1X23QR45', '郑经理', 'low'),
    ('西安咨询有限公司', '91610100MA6U56ST78', '钱总', 'medium'),
    ('天津建材有限公司', '91120100MA06J78UV90', '冯经理', 'high'),
]

RISK_LEVELS = ['critical', 'high', 'medium', 'low']
STATUS_LIST = ['pending', 'in_progress', 'verified', 'resolved', 'closed']


def init_reference_data():
    db = SessionLocal()
    
    try:
        if db.query(Department).count() == 0:
            for name, code in DEPARTMENTS:
                db.add(Department(name=name, code=code))
            db.commit()
        
        if db.query(Employee).count() == 0:
            for name, emp_no, dept_id, email in EMPLOYEES:
                db.add(Employee(
                    name=name, employee_no=emp_no,
                    department_id=dept_id, email=email
                ))
            db.commit()
        
        if db.query(ChecklistCategory).count() == 0:
            for name, desc, sort in CATEGORIES:
                db.add(ChecklistCategory(
                    name=name, description=desc, sort_order=sort
                ))
            db.commit()
        
        if db.query(ChecklistItem).count() == 0:
            for cat_id, code, title, desc, risk, sort in CHECKLIST_ITEMS:
                db.add(ChecklistItem(
                    category_id=cat_id, item_code=code,
                    title=title, description=desc,
                    risk_level=risk, sort_order=sort
                ))
            db.commit()
        
        if db.query(ChecklistSubitem).count() == 0:
            for item_id, title, method, req in CHECKLIST_SUBITEMS:
                db.add(ChecklistSubitem(
                    item_id=item_id, title=title,
                    check_method=method, evidence_requirement=req
                ))
            db.commit()
        
        if db.query(Supplier).count() == 0:
            for name, tax_no, contact, risk in SUPPLIERS:
                db.add(Supplier(
                    name=name, tax_no=tax_no,
                    contact_person=contact, risk_level=risk
                ))
            db.commit()
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def generate_mock_data():
    db = SessionLocal()
    
    try:
        departments = db.query(Department).all()
        employees = db.query(Employee).all()
        suppliers = db.query(Supplier).all()
        checklist_items = db.query(ChecklistItem).all()
        
        if db.query(PermissionLog).count() == 0:
            actions = ['LOGIN', 'LOGOUT', 'VIEW_REPORT', 'EXPORT_DATA',
                      'CHANGE_PERMISSION', 'APPROVE', 'REJECT', 'UPLOAD']
            resources = ['财务系统', 'ERP系统', 'HR系统', 'OA系统',
                        '客户管理系统', '采购管理系统', '数据报表']
            
            for i in range(500):
                emp = random.choice(employees)
                log_time = datetime.now() - timedelta(
                    days=random.randint(0, 180),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                db.add(PermissionLog(
                    employee_id=emp.id,
                    action=random.choice(actions),
                    resource=random.choice(resources),
                    ip_address=f'192.168.{random.randint(1, 255)}.{random.randint(1, 255)}',
                    log_time=log_time,
                    raw_data={'session_id': f'SESSION{random.randint(10000, 99999)}'}
                ))
            db.commit()
        
        if db.query(ERPTransaction).count() == 0:
            transaction_types = ['原材料采购', '办公用品采购', '服务采购',
                                '固定资产采购', '咨询服务费', '物流运输费']
            
            for i in range(300):
                supplier = random.choice(suppliers)
                dept = random.choice(departments)
                trans_date = datetime.now() - timedelta(
                    days=random.randint(0, 180)
                )
                db.add(ERPTransaction(
                    transaction_no=f'TRN{2024:04d}{i+1:06d}',
                    supplier_id=supplier.id,
                    amount=round(random.uniform(1000, 500000), 2),
                    transaction_date=trans_date.date(),
                    transaction_type=random.choice(transaction_types),
                    department_id=dept.id,
                    raw_data={'invoice_no': f'INV{random.randint(100000, 999999)}'}
                ))
            db.commit()
        
        if db.query(AuditIssue).count() == 0:
            issue_titles = {
                'FIN-001': ['费用报销单缺少审批签字', '报销金额超标准未说明', '私人费用公款报销'],
                'FIN-002': ['银行对账延迟3天', '余额调节表存在未达账项'],
                'FIN-003': ['部门预算超支15%', '预算调整未走审批流程'],
                'PUR-001': ['新增供应商资质文件不全', '供应商未经过现场考察'],
                'PUR-002': ['20万采购仅一家报价', '询价过程无书面记录'],
                'PUR-003': ['采购合同未按规定盖章', '合同档案缺失'],
                'SAL-001': ['客户信用额度超额未审批', '逾期应收账款未预警'],
                'SAL-002': ['3笔货款逾期超90天', '客户回款率低于80%'],
                'HR-001': ['社招人员未做背景调查', '试用期考核记录缺失'],
                'HR-002': ['考勤异常未说明原因', '加班记录未经审批'],
                'HR-003': ['工资计算错误3人次', '年终奖发放标准不透明'],
                'IT-001': ['权限变更无审批记录', '临时权限未及时回收'],
                'IT-002': ['离职员工第3天仍能登录系统', '财务权限离职1周后才回收'],
                'IT-003': ['数据备份最近一次失败', '备份恢复测试未定期进行'],
            }
            
            for idx, item in enumerate(checklist_items):
                num_issues = random.randint(1, 4)
                for i in range(num_issues):
                    dept = random.choice(departments)
                    assignee = random.choice(employees)
                    disc_date = datetime.now() - timedelta(
                        days=random.randint(10, 120)
                    )
                    has_evidence = random.random() > 0.25
                    risk = item.risk_level
                    status = random.choices(
                        STATUS_LIST, weights=[0.2, 0.25, 0.2, 0.25, 0.1]
                    )[0]
                    
                    titles = issue_titles.get(item.item_code, [f'{item.title}问题{i+1}'])
                    title = random.choice(titles)
                    
                    issue = AuditIssue(
                        checklist_item_id=item.id,
                        title=title,
                        description=f'经抽查发现{item.description}，涉及金额{random.randint(1, 50)}万元，需要进一步核实。',
                        risk_level=risk,
                        status=status,
                        department_id=dept.id,
                        discovered_date=disc_date.date(),
                        assignee_id=assignee.id,
                        conclusion=f'已核实，问题属实，正在整改中。' if status in ['verified', 'resolved', 'closed'] else None,
                        has_evidence=has_evidence
                    )
                    db.add(issue)
                    db.flush()
                    
                    if not has_evidence:
                        task_assignee = random.choice(employees)
                        db.add(NoteTask(
                            issue_id=issue.id,
                            title=f'补充证据：{title}',
                            description=f'请在3个工作日内补充相关证据材料，包括审批记录、原始凭证等。',
                            assignee_id=task_assignee.id,
                            due_date=(datetime.now() + timedelta(days=3)).date(),
                            status=random.choice(['pending', 'in_progress']),
                            created_by=random.choice(employees).id
                        ))
                    
                    if random.random() > 0.3:
                        start_date = disc_date + timedelta(days=random.randint(5, 15))
                        end_date = start_date + timedelta(days=random.randint(15, 60))
                        progress = random.randint(0, 100)
                        actual_end = end_date + timedelta(days=random.randint(-5, 10)) if progress == 100 else None
                        
                        db.add(RectificationPlan(
                            issue_id=issue.id,
                            title=f'整改计划：{title}',
                            description=f'针对发现的问题制定以下整改措施：1. 完善相关制度流程；2. 对相关人员进行培训；3. 建立监督机制。',
                            start_date=start_date.date(),
                            end_date=end_date.date(),
                            actual_end_date=actual_end.date() if actual_end else None,
                            progress=progress,
                            owner_id=random.choice(employees).id,
                            status='closed' if progress == 100 else ('in_progress' if progress > 0 else 'pending')
                        ))
                    
                    num_samples = random.randint(1, 5)
                    all_transactions = db.query(ERPTransaction).all()
                    all_permission_logs = db.query(PermissionLog).all()
                    transactions = random.sample(all_transactions, min(num_samples, len(all_transactions))) if all_transactions else []
                    permission_logs = random.sample(all_permission_logs, min(num_samples, len(all_permission_logs))) if all_permission_logs else []
                    
                    for j in range(num_samples):
                        trans = transactions[j] if j < len(transactions) else None
                        perm = permission_logs[j] if j < len(permission_logs) else None
                        
                        db.add(SamplingRecord(
                            issue_id=issue.id,
                            sample_no=f'SMP{item.item_code}-{idx+1:03d}-{issue.id:04d}-{j+1:02d}',
                            transaction_id=trans.id if trans else None,
                            permission_log_id=perm.id if perm else None,
                            sampled_by=random.choice(employees).id,
                            result=random.choice(['符合', '不符合', '待核实']),
                            notes=f'抽样检查结果：{random.choice(["存在异常", "手续不全", "流程合规", "需要补充材料"])}'
                        ))
                    
                    if has_evidence:
                        ev_types = ['email', 'erp_transaction', 'permission_log', 'document']
                        num_evidences = random.randint(1, 3)
                        for j in range(num_evidences):
                            ev_type = random.choice(ev_types)
                            evidence = Evidence(
                                issue_id=issue.id,
                                type=ev_type,
                                description=f'{ev_type}证据{j+1}',
                                file_path=f'/data/evidences/{issue.id}/{ev_type}_{j+1}.pdf',
                                uploaded_by=random.choice(employees).id
                            )
                            db.add(evidence)
                            db.flush()
                            
                            if ev_type == 'email':
                                subjects = [
                                    f'关于{title}的说明',
                                    f'回复：{item.title}相关问题',
                                    f'审批通过：{title}',
                                    f'Re: {item.description[:30]}...'
                                ]
                                bodies = [
                                    f'经过核实，该问题确实存在，我们已经采取措施进行整改。具体情况如下：...',
                                    f'您好，关于您提到的问题，现说明如下：该笔业务经过正常审批流程，相关附件已上传。',
                                    f'同意，按规定办理。',
                                    f'根据公司制度第X条规定，该情况符合要求，请予以放行。'
                                ]
                                senders = [e.email for e in employees]
                                recipients = ';'.join([random.choice(senders) for _ in range(random.randint(2, 4))])
                                
                                db.add(EmailRecord(
                                    evidence_id=evidence.id,
                                    message_id=f'<MSG{random.randint(1000000, 9999999)}@company.com>',
                                    sender=random.choice(senders),
                                    recipients=recipients,
                                    subject=random.choice(subjects),
                                    body=random.choice(bodies),
                                    sent_at=disc_date + timedelta(days=random.randint(-5, 5))
                                ))
                
                db.commit()
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def initialize_all():
    print('正在初始化数据库...')
    init_db()
    print('数据库表创建完成。')
    
    print('正在初始化基础数据...')
    init_reference_data()
    print('基础数据初始化完成。')
    
    print('正在生成模拟业务数据...')
    generate_mock_data()
    print('模拟数据生成完成。')
    
    print('数据初始化完成！')


if __name__ == '__main__':
    initialize_all()
