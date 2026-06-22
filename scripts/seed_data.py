from datetime import datetime, timedelta, date
import random

from app.database import init_db, SessionLocal, Base, engine
from app.models import (
    User, UserRole, ChecklistItem, SamplingRecord, SamplingStatus,
    RiskLevel, RectificationPlan, RectificationStatus, RiskHistory,
    Comment, ImportBatch, EmailMaterial, PermissionLog, AuditWorkpaper,
    BatchStatus,
)


DEPARTMENTS = ["财务部", "人事部", "采购部", "技术部", "合规部", "运营部"]

CATEGORIES = ["审批流程", "资金管理", "人事管理", "采购管理", "合规风控"]

EMAIL_SUBJECTS = [
    "关于Q2季度预算审批的请示",
    "新员工入职审批流程",
    "采购合同签订审批单",
    "差旅费报销申请",
    "月度财务对账确认",
    "内部审计发现问题整改",
    "供应商资质审核申请",
    "系统权限变更申请",
    "项目费用支付审批",
    "员工调岗申请",
    "年终绩效考核结果确认",
    "合规风险评估报告",
    "付款申请-XX供应商",
    "请假审批流程",
    "合同盖章申请",
]


def init_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("数据库表已初始化")


def create_users(db):
    users_data = [
        {"username": "admin", "password": "admin123", "full_name": "系统管理员",
         "role": UserRole.ADMIN, "email": "admin@example.com", "department": "合规部"},
        {"username": "manager", "password": "manager123", "full_name": "张总监",
         "role": UserRole.MANAGEMENT, "email": "manager@example.com", "department": "合规部"},
        {"username": "auditor1", "password": "auditor123", "full_name": "李审计",
         "role": UserRole.FRONTLINE, "email": "auditor1@example.com", "department": "财务部"},
        {"username": "auditor2", "password": "auditor123", "full_name": "王审计",
         "role": UserRole.FRONTLINE, "email": "auditor2@example.com", "department": "采购部"},
        {"username": "auditor3", "password": "auditor123", "full_name": "赵审计",
         "role": UserRole.FRONTLINE, "email": "auditor3@example.com", "department": "人事部"},
    ]
    users = []
    for data in users_data:
        user = User(
            username=data["username"],
            email=data["email"],
            full_name=data["full_name"],
            role=data["role"],
            department=data["department"],
            is_active=True,
        )
        user.set_password(data["password"])
        db.add(user)
        users.append(user)
    db.commit()
    for u in users:
        db.refresh(u)
    print(f"已创建 {len(users)} 个用户")
    return users


def create_checklist_items(db):
    items = []
    for i, category in enumerate(CATEGORIES):
        for j in range(3):
            code = f"CHK-{category[:3].upper()}-{j+1:03d}"
            item = ChecklistItem(
                code=code,
                title=f"{category}检查项-{j+1}",
                category=category,
                description=f"{category}相关的合规检查项 {j+1}",
                default_risk_level=random.choice(list(RiskLevel)),
                is_active=True,
            )
            db.add(item)
            items.append(item)
    db.commit()
    for it in items:
        db.refresh(it)
    print(f"已创建 {len(items)} 个检查清单项")
    return items


def create_batches(db, users):
    admin = [u for u in users if u.username == "admin"][0]
    batches = []
    for source in ["email", "permission_log", "workpaper", "sampling_merge"]:
        batch = ImportBatch(
            batch_number=f"{source.upper()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}",
            source_type=source,
            description=f"示例{source}数据导入",
            status=BatchStatus.COMPLETED,
            total_records=random.randint(20, 100),
            success_records=random.randint(18, 100),
            failed_records=random.randint(0, 5),
            imported_by=admin.id,
            started_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
            completed_at=datetime.utcnow() - timedelta(hours=random.randint(0, 1)),
        )
        db.add(batch)
        batches.append(batch)
    db.commit()
    for b in batches:
        db.refresh(b)
    print(f"已创建 {len(batches)} 个导入批次")
    return batches


def create_emails(db, batches):
    email_batch = [b for b in batches if b.source_type == "email"][0]
    emails = []
    for i in range(60):
        dept = random.choice(DEPARTMENTS)
        category = random.choice(CATEGORIES)
        days_ago = random.randint(0, 60)
        sent_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))
        email = EmailMaterial(
            batch_id=email_batch.id,
            message_id=f"MSG-{random.randint(100000, 999999)}",
            subject=random.choice(EMAIL_SUBJECTS),
            sender=f"user{i}@example.com",
            recipients=f"manager@example.com, auditor@example.com",
            sent_at=sent_at,
            received_at=sent_at + timedelta(minutes=random.randint(1, 30)),
            body=f"这是一封关于{category}的业务邮件，涉及{dept}的相关流程处理。请审批相关事项。",
            attachments_count=random.randint(0, 3),
            attachment_names=[f"附件{i}-{k}.pdf" for k in range(random.randint(0, 2))] or None,
            keywords=[category] if random.random() > 0.3 else [],
            department=dept,
            category=category,
        )
        db.add(email)
        emails.append(email)
    db.commit()
    for e in emails:
        db.refresh(e)
    print(f"已创建 {len(emails)} 封邮件材料")
    return emails


def create_permission_logs(db, batches):
    perm_batch = [b for b in batches if b.source_type == "permission_log"][0]
    actions = ["登录", "查看", "编辑", "审批", "下载", "导出"]
    logs = []
    for i in range(80):
        dept = random.choice(DEPARTMENTS)
        days_ago = random.randint(0, 60)
        log = PermissionLog(
            batch_id=perm_batch.id,
            user_identifier=f"U{random.randint(1000, 9999)}",
            user_name=f"用户{i}",
            department=dept,
            action=random.choice(actions),
            resource=f"/api/{random.choice(['finance', 'hr', 'purchase', 'report'])}/{random.randint(1, 100)}",
            permission_level=random.choice(["只读", "读写", "管理员"]),
            ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
            action_time=datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
            status=random.choice(["success", "success", "success", "denied"]),
        )
        db.add(log)
        logs.append(log)
    db.commit()
    for l in logs:
        db.refresh(l)
    print(f"已创建 {len(logs)} 条权限日志")
    return logs


def create_workpapers(db, batches):
    wp_batch = [b for b in batches if b.source_type == "workpaper"][0]
    conclusions = ["合规", "基本合规", "需整改", "不合规"]
    wps = []
    for i in range(40):
        dept = random.choice(DEPARTMENTS)
        category = random.choice(CATEGORIES)
        days_ago = random.randint(0, 60)
        wp = AuditWorkpaper(
            batch_id=wp_batch.id,
            workpaper_id=f"WP-{datetime.utcnow().strftime('%Y%m')}-{i+1:04d}",
            title=f"{dept}-{category}审计工作底稿",
            audit_period=f"2024-Q{(datetime.utcnow().month-1)//3 + 1}",
            department=dept,
            auditor=f"审计员{random.randint(1, 10)}",
            checklist_item=f"{category}检查项-{random.randint(1, 5)}",
            finding=f"审计发现：在{category}流程中发现{random.choice(['轻微', '一般', '较严重'])}问题",
            conclusion=random.choice(conclusions),
            workpaper_date=date.today() - timedelta(days=days_ago),
        )
        db.add(wp)
        wps.append(wp)
    db.commit()
    for w in wps:
        db.refresh(w)
    print(f"已创建 {len(wps)} 份审计底稿")
    return wps


def create_sampling_records(db, checklists, emails, logs, wps, users):
    frontline_users = [u for u in users if u.role == UserRole.FRONTLINE]
    samples = []
    for i in range(100):
        dept = random.choice(DEPARTMENTS)
        checklist = random.choice(checklists)
        assigned_user = random.choice(frontline_users) if frontline_users else None
        days_ago = random.randint(0, 60)
        sample = SamplingRecord(
            sample_code=f"SMP-{datetime.utcnow().strftime('%Y%m%d')}-{i+1:05d}",
            checklist_id=checklist.id,
            email_id=random.choice(emails).id if random.random() > 0.3 else None,
            permission_log_id=random.choice(logs).id if random.random() > 0.4 else None,
            workpaper_id=random.choice(wps).id if random.random() > 0.5 else None,
            assigned_user_id=assigned_user.id if assigned_user else None,
            department=dept,
            status=random.choice(list(SamplingStatus)),
            risk_level=random.choice(list(RiskLevel)),
            has_evidence=random.random() > 0.2,
            evidence_description="已有相关邮件和底稿佐证" if random.random() > 0.3 else None,
            audit_note="经核查，情况属实" if random.random() > 0.4 else None,
            sampled_at=datetime.utcnow() - timedelta(days=days_ago),
            reviewed_at=datetime.utcnow() - timedelta(days=days_ago - random.randint(0, 3)) if random.random() > 0.5 else None,
            audit_date=date.today() - timedelta(days=days_ago),
        )
        db.add(sample)
        samples.append(sample)
    db.commit()
    for s in samples:
        db.refresh(s)
    print(f"已创建 {len(samples)} 条抽样记录")
    return samples


def create_rectification_plans(db, samples):
    high_risk_samples = [s for s in samples if s.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)]
    plans = []
    for i, sample in enumerate(high_risk_samples[:20]):
        due_date = date.today() + timedelta(days=random.randint(5, 60))
        plan = RectificationPlan(
            sampling_record_id=sample.id,
            title=f"整改计划-{i+1}: {sample.department}合规问题整改",
            description="针对审计发现的问题，制定整改措施，明确责任人与完成时限。",
            responsible_person=f"负责人{random.randint(1, 20)}",
            department=sample.department,
            status=random.choice(list(RectificationStatus)),
            priority=random.randint(1, 5),
            due_date=due_date,
            completed_date=due_date - timedelta(days=random.randint(1, 10)) if random.random() > 0.5 else None,
        )
        db.add(plan)
        plans.append(plan)
    db.commit()
    for p in plans:
        db.refresh(p)
    print(f"已创建 {len(plans)} 个整改计划")
    return plans


def create_risk_histories(db, samples):
    histories = []
    for sample in random.sample(samples, min(30, len(samples))):
        levels = list(RiskLevel)
        prev = random.choice(levels)
        new = random.choice(levels)
        history = RiskHistory(
            sampling_record_id=sample.id,
            previous_level=prev,
            new_level=new,
            changed_by=None,
            reason=f"基于{random.choice(['新增证据', '重新评估', '整改后复核'])}调整风险等级",
            changed_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
        )
        db.add(history)
        histories.append(history)
    db.commit()
    print(f"已创建 {len(histories)} 条风险变更记录")
    return histories


def create_comments(db, samples, users):
    admin = [u for u in users if u.username == "admin"][0]
    comments = []
    evidence_missing_samples = [s for s in samples if s.status == SamplingStatus.EVIDENCE_MISSING]
    for sample in evidence_missing_samples[:10]:
        comment = Comment(
            sampling_record_id=sample.id,
            user_id=admin.id,
            content=f"当前缺少该抽样记录的支撑证据材料，请相关业务部门补充提供。",
            comment_type="evidence_request",
            is_evidence_missing=True,
        )
        db.add(comment)
        comments.append(comment)
    for sample in random.sample(samples, min(10, len(samples))):
        comment = Comment(
            sampling_record_id=sample.id,
            user_id=random.choice(users).id,
            content="已审核相关材料，情况属实。",
            comment_type="review_note",
            is_evidence_missing=False,
        )
        db.add(comment)
        comments.append(comment)
    db.commit()
    print(f"已创建 {len(comments)} 条注释")
    return comments


def seed_all():
    init_database()
    db = SessionLocal()
    try:
        users = create_users(db)
        checklists = create_checklist_items(db)
        batches = create_batches(db, users)
        emails = create_emails(db, batches)
        logs = create_permission_logs(db, batches)
        wps = create_workpapers(db, batches)
        samples = create_sampling_records(db, checklists, emails, logs, wps, users)
        create_rectification_plans(db, samples)
        create_risk_histories(db, samples)
        create_comments(db, samples, users)
        print("\n示例数据初始化完成！")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
