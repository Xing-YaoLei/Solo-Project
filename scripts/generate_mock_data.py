"""
模拟测试数据生成脚本
生成审计底稿、权限日志、邮件材料等模拟数据
"""
import uuid
import random
from datetime import datetime, timedelta
import duckdb
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data.database import init_database, get_connection
from src.data.sync_pipeline import DataSyncPipeline
from models.schemas import SyncNodeType, EvidenceType, IssueSeverity, IssueStatus
from src.utils.config import get_duckdb_path

random.seed(42)

REGIONS = [
    ("CN-BJ", "北京区域", "北京市", "北京市"),
    ("CN-SH", "上海区域", "上海市", "上海市"),
    ("CN-GZ", "广州区域", "广东省", "广州市"),
    ("CN-SZ", "深圳区域", "广东省", "深圳市"),
    ("CN-HZ", "杭州区域", "浙江省", "杭州市"),
    ("CN-NJ", "南京区域", "江苏省", "南京市"),
    ("CN-CD", "成都区域", "四川省", "成都市"),
    ("CN-WH", "武汉区域", "湖北省", "武汉市"),
    ("CN-XA", "西安区域", "陕西省", "西安市"),
    ("CN-SY", "沈阳区域", "辽宁省", "沈阳市"),
]

DEPARTMENTS = [
    "信息技术部", "财务部", "人力资源部", "市场部", "运营部",
    "合规部", "风险管理部", "审计部", "客户服务部", "产品研发部"
]

AUDITORS = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"]

OPERATORS = ["系统管理员", "数据管理员", "合规专员", "审计专员", "运维工程师"]

PERMISSIONS = [
    ("P001", "系统登录", "login", "/api/auth/login"),
    ("P002", "数据查询", "query", "/api/data/query"),
    ("P003", "数据导出", "export", "/api/data/export"),
    ("P004", "用户管理", "user_manage", "/api/user/manage"),
    ("P005", "权限配置", "perm_config", "/api/permission/config"),
    ("P006", "系统配置", "sys_config", "/api/system/config"),
    ("P007", "财务审批", "finance_approve", "/api/finance/approve"),
    ("P008", "合同查看", "contract_view", "/api/contract/view"),
    ("P009", "合同修改", "contract_edit", "/api/contract/edit"),
    ("P010", "敏感数据访问", "sensitive_access", "/api/data/sensitive"),
]

VIOLATION_REASONS = [
    "越权访问敏感数据",
    "未授权导出数据",
    "超出权限范围的用户管理操作",
    "非法修改系统配置",
    "越级审批操作",
    "非工作时间异常访问",
    "异地登录未验证",
    "高频访问疑似数据爬取",
]

MAIL_SUBJECTS = [
    "关于2024年Q2合规审计工作安排",
    "权限申请审批通知",
    "月度合规检查报告",
    "风险预警通报",
    "审计发现问题整改要求",
    "系统升级维护通知",
    "年度合规培训安排",
    "数据安全专项检查通知",
    "内部审计工作底稿确认",
    "违规行为处理通报",
]

MAIL_SENDERS = [
    "compliance@company.com",
    "audit@company.com",
    "hr@company.com",
    "it@company.com",
    "finance@company.com",
    "admin@company.com",
]

MAIL_RECIPIENTS = [
    "manager@company.com",
    "director@company.com",
    "supervisor@company.com",
    "teamlead@company.com",
    "officer@company.com",
]

WORKPAPER_TITLES = [
    "2024年Q2信息系统一般控制审计",
    "财务报表审计-货币资金科目",
    "销售与收款循环内部控制审计",
    "采购与付款循环专项审计",
    "信息安全管理体系审计",
    "人力资源管理审计",
    "固定资产管理审计",
    "预算执行情况审计",
    "合同管理专项审计",
    "数据安全合规审计",
]

ISSUE_TITLES = [
    "系统权限分配不合理",
    "敏感数据访问日志缺失",
    "财务审批流程不规范",
    "合同归档不及时",
    "用户权限未及时清理",
    "数据导出未留痕",
    "密码策略不符合要求",
    "异地登录未启用双因素认证",
    "应急响应流程不完善",
    "日志保留期限不足",
]

CHECKLIST_CATEGORIES = [
    "数据完整性检查",
    "权限合规检查",
    "日志审计检查",
    "安全配置检查",
    "流程合规检查",
    "文档归档检查",
]

CHECKLIST_ITEMS = [
    "数据备份是否完整可用",
    "权限分配是否符合最小权限原则",
    "操作日志是否完整记录",
    "敏感数据是否加密存储",
    "审批流程是否规范执行",
    "审计文档是否完整归档",
    "系统补丁是否及时更新",
    "用户离职权限是否及时清理",
    "数据导出是否经过审批",
    "应急预案是否定期演练",
    "访问控制是否有效",
    "变更管理是否规范",
    "密码策略是否符合要求",
    "网络隔离是否有效",
    "数据传输是否加密",
]

SAMPLING_METHODS = ["random", "stratified", "systematic", "cluster", "weighted", "filtered"]

TEMPLATE_TYPES = ["违规通报", "整改通知", "风险预警", "审计报告", "合规培训", "检查通知"]

TEMPLATE_SUBJECTS = {
    "违规通报": "关于{issue}的违规通报",
    "整改通知": "关于{issue}问题的整改通知",
    "风险预警": "关于{issue}的风险预警",
    "审计报告": "关于{issue}的审计报告",
    "合规培训": "关于{issue}的合规培训通知",
    "检查通知": "关于开展{issue}专项检查的通知",
}

TEMPLATE_CONTENTS = {
    "违规通报": "经查，发现{issue}问题，违反了公司{regulation}规定。现予以通报，请各部门引以为戒，严格遵守相关规定。",
    "整改通知": "根据合规审计发现，{issue}问题需要立即整改。请于{deadline}前完成整改并提交整改报告。",
    "风险预警": "监测到{issue}风险，可能导致{impact}。请相关部门立即采取防控措施，防范风险发生。",
    "审计报告": "根据审计计划，对{area}进行了审计，发现{issue}问题。现将审计报告印发，请遵照执行。",
    "合规培训": "为加强合规管理，定于{date}开展{topic}培训，请相关人员准时参加。",
    "检查通知": "根据工作安排，定于{date}开展{topic}专项检查，请相关部门做好准备工作。",
}


def generate_regions(conn):
    for region_id, region_name, province, city in REGIONS:
        conn.execute("""
            INSERT OR IGNORE INTO regions (region_id, region_name, province, city)
            VALUES (?, ?, ?, ?)
        """, (region_id, region_name, province, city))
    conn.commit()
    print(f"Generated {len(REGIONS)} regions")


def generate_sync_pipeline(conn, operator, batch_no):
    pipeline = DataSyncPipeline(operator=operator, batch_no=batch_no)

    sync_ids = {}

    node_configs = [
        (SyncNodeType.EXTRACT, "数据提取节点", "源系统", "临时存储"),
        (SyncNodeType.TRANSFORM, "数据转换节点", "临时存储", "处理区"),
        (SyncNodeType.VALIDATE, "数据校验节点", "处理区", "校验区"),
        (SyncNodeType.LOAD, "数据加载节点", "校验区", "目标库"),
        (SyncNodeType.ARCHIVE, "数据归档节点", "目标库", "归档库"),
    ]

    for node_type, node_name, source, target in node_configs:
        sync_id = pipeline.create_node(node_type, node_name, source, target)
        sync_ids[node_type.value] = sync_id

    return pipeline, sync_ids


def generate_audit_workpapers(conn, sync_id, count=50):
    workpapers = []
    for i in range(count):
        workpaper_id = f"wp_{uuid.uuid4().hex[:12]}"
        region = random.choice(REGIONS)
        audit_date = datetime.now() - timedelta(days=random.randint(0, 365))
        auditor = random.choice(AUDITORS)
        dept = random.choice(DEPARTMENTS)
        title = random.choice(WORKPAPER_TITLES)
        workpaper_no = f"AUD-{audit_date.year}-{random.randint(1000, 9999)}"
        content = f"""
        审计项目：{title}
        审计期间：{(audit_date - timedelta(days=90)).strftime('%Y-%m-%d')} 至 {audit_date.strftime('%Y-%m-%d')}
        审计人员：{auditor}
        被审计部门：{dept}

        审计内容：
        1. 内部控制制度执行情况检查
        2. 财务数据真实性核实
        3. 合规性审查
        4. 风险管理评估

        审计结论：经审计，该部门内部控制制度执行情况良好，财务数据真实可靠。
        """

        workpapers.append((
            workpaper_id, workpaper_no, title, content,
            region[0], audit_date, auditor, dept, sync_id
        ))

    conn.executemany("""
        INSERT INTO audit_workpapers (
            workpaper_id, workpaper_no, title, content, region_id,
            audit_date, auditor, department, sync_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, workpapers)
    conn.commit()
    print(f"Generated {len(workpapers)} audit workpapers")
    return [w[0] for w in workpapers]


def generate_permission_logs(conn, sync_id, count=200):
    logs = []
    for i in range(count):
        log_id = f"log_{uuid.uuid4().hex[:12]}"
        region = random.choice(REGIONS)
        op_time = datetime.now() - timedelta(days=random.randint(0, 365),
                                            hours=random.randint(0, 23),
                                            minutes=random.randint(0, 59))
        user_idx = random.randint(1000, 9999)
        user_name = random.choice(AUDITORS)
        dept = random.choice(DEPARTMENTS)
        perm = random.choice(PERMISSIONS)

        is_violation = random.random() < 0.15
        violation_reason = random.choice(VIOLATION_REASONS) if is_violation else None

        ip_parts = [random.randint(1, 255) for _ in range(4)]
        ip_address = ".".join(map(str, ip_parts))

        logs.append((
            log_id, f"U{user_idx}", user_name, dept,
            perm[0], perm[1], perm[2], perm[3],
            ip_address, is_violation, violation_reason,
            region[0], op_time, sync_id
        ))

    conn.executemany("""
        INSERT INTO permission_logs (
            log_id, user_id, user_name, department, permission_code,
            permission_name, action, resource_path, ip_address,
            is_violation, violation_reason, region_id, operation_time, sync_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, logs)
    conn.commit()
    print(f"Generated {len(logs)} permission logs, {sum(1 for l in logs if l[9])} violations")
    return [l[0] for l in logs]


def generate_mail_materials(conn, sync_id, count=100):
    mails = []
    for i in range(count):
        mail_id = f"mail_{uuid.uuid4().hex[:12]}"
        region = random.choice(REGIONS)
        sent_time = datetime.now() - timedelta(days=random.randint(0, 365),
                                               hours=random.randint(0, 23))
        subject = random.choice(MAIL_SUBJECTS)
        sender = random.choice(MAIL_SENDERS)
        recipient = random.choice(MAIL_RECIPIENTS)
        has_attachment = random.random() < 0.4
        attachment_count = random.randint(1, 5) if has_attachment else 0

        cc_list = random.sample(MAIL_RECIPIENTS, random.randint(0, 3))
        cc_recipients = ";".join(cc_list) if cc_list else None

        content = f"""
        主题：{subject}

        尊敬的领导/同事：

        您好！

        {subject}相关事宜通知如下：

        一、背景说明
        根据公司合规管理要求，为加强内部控制，防范合规风险，现就相关事项进行通知。

        二、具体内容
        请各部门严格按照相关规定执行，确保各项工作合规开展。如有疑问，请及时与合规部联系。

        三、联系方式
        联系人：合规部
        联系电话：010-XXXXXXX

        此致
        敬礼！

        {sender.split('@')[0]}
        {sent_time.strftime('%Y年%m月%d日')}
        """

        mails.append((
            mail_id, subject, sender, recipient, cc_recipients, content,
            has_attachment, attachment_count, region[0], sent_time, sync_id
        ))

    conn.executemany("""
        INSERT INTO mail_materials (
            mail_id, subject, sender, recipient, cc_recipients, content,
            has_attachment, attachment_count, region_id, sent_time, sync_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, mails)
    conn.commit()
    print(f"Generated {len(mails)} mail materials")
    return [m[0] for m in mails]


def generate_evidence_archive(conn, sync_ids, workpaper_ids, log_ids, mail_ids):
    archives = []
    all_items = []

    for wp_id in workpaper_ids:
        all_items.append((EvidenceType.AUDIT_WORKPAPER, wp_id, "audit_workpapers"))

    for log_id in log_ids:
        all_items.append((EvidenceType.PERMISSION_LOG, log_id, "permission_logs"))

    for mail_id in mail_ids:
        all_items.append((EvidenceType.MAIL_MATERIAL, mail_id, "mail_materials"))

    region_ids = [r[0] for r in REGIONS]

    for i, (ev_type, source_id, source_table) in enumerate(all_items):
        archive_id = f"arc_{uuid.uuid4().hex[:12]}"
        region_id = random.choice(region_ids)
        archive_date = datetime.now() - timedelta(days=random.randint(0, 300))
        archived_by = random.choice(AUDITORS)
        retention_period = random.choice([3, 5, 7, 10, 15])
        is_sensitive = random.random() < 0.3

        type_names = {
            "audit_workpapers": "审计底稿",
            "permission_logs": "权限日志",
            "mail_materials": "邮件材料"
        }
        title = f"{type_names[source_table]}-{source_id}"
        description = f"{type_names[source_table]}归档记录，来源ID: {source_id}"

        sync_id = random.choice(list(sync_ids.values()))

        minio_bucket = {
            "audit_workpapers": "audit-documents",
            "permission_logs": "permission-logs",
            "mail_materials": "mail-materials"
        }[source_table]
        minio_object_key = f"{source_table}/{archive_date.year}/{archive_date.month}/{source_id}.dat"
        file_hash = uuid.uuid4().hex + uuid.uuid4().hex

        archives.append((
            archive_id, ev_type.value, source_id, source_table, title, description,
            region_id, archive_date, archived_by, retention_period, is_sensitive,
            minio_bucket, minio_object_key, file_hash, sync_id
        ))

    conn.executemany("""
        INSERT INTO evidence_archive (
            archive_id, evidence_type, source_id, source_table, title, description,
            region_id, archive_date, archived_by, retention_period, is_sensitive,
            minio_bucket, minio_object_key, file_hash, sync_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, archives)
    conn.commit()
    print(f"Generated {len(archives)} evidence archives")
    return [a[0] for a in archives]


def generate_issue_records(conn, archive_ids):
    issues = []
    region_ids = [r[0] for r in REGIONS]

    for i in range(80):
        issue_id = f"issue_{uuid.uuid4().hex[:12]}"
        issue_no = f"ISS-{datetime.now().year}-{random.randint(1000, 9999)}"
        title = random.choice(ISSUE_TITLES)
        severity = random.choice(list(IssueSeverity)).value

        is_reoccurrence = random.random() < 0.25
        original_issue_id = random.choice([None] + [issue[0] for issue in issues[:max(0, len(issues)-20)]]) if is_reoccurrence and issues else None
        recurrence_count = random.randint(1, 5) if is_reoccurrence else 0

        status = random.choice(list(IssueStatus)).value
        if is_reoccurrence:
            status = IssueStatus.REOCCURRED.value

        found_date = datetime.now() - timedelta(days=random.randint(0, 300))
        resolved_date = found_date + timedelta(days=random.randint(3, 30)) if status in [IssueStatus.RESOLVED.value, IssueStatus.CLOSED.value] else None

        region_id = random.choice(region_ids)
        related_archive_id = random.choice(archive_ids) if archive_ids else None
        handler = random.choice(AUDITORS)

        description = f"""
        问题描述：
        {title}问题在日常检查中被发现，涉及{random.choice(DEPARTMENTS)}部门。

        风险影响：
        该问题可能导致{random.choice(['数据泄露风险', '合规风险', '操作风险', '财务风险', '声誉风险'])}，
        影响范围涉及{random.choice(['单个部门', '多个部门', '全公司'])}。

        整改要求：
        请相关部门于{(found_date + timedelta(days=15)).strftime('%Y-%m-%d')}前完成整改，
        并提交整改报告至合规部。
        """

        issues.append((
            issue_id, issue_no, title, description, severity, status,
            region_id, related_archive_id, found_date, resolved_date,
            handler, is_reoccurrence, original_issue_id, recurrence_count
        ))

    conn.executemany("""
        INSERT INTO issue_records (
            issue_id, issue_no, title, description, severity, status,
            region_id, related_archive_id, found_date, resolved_date,
            handler, is_reoccurrence, original_issue_id, recurrence_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, issues)
    conn.commit()
    print(f"Generated {len(issues)} issue records, {sum(1 for i in issues if i[11])} reoccurrences")
    return [i[0] for i in issues]


def generate_checklist_items(conn, archive_ids):
    items = []
    region_ids = [r[0] for r in REGIONS]

    for i, checklist_content in enumerate(CHECKLIST_ITEMS):
        for j, region_id in enumerate(region_ids):
            checklist_id = f"cl_{uuid.uuid4().hex[:12]}"
            item_no = f"CL-{str(i+1).zfill(3)}-{str(j+1).zfill(2)}"
            category = random.choice(CHECKLIST_CATEGORIES)
            is_checked = random.random() < 0.7
            checked_by = random.choice(AUDITORS) if is_checked else None
            checked_at = datetime.now() - timedelta(days=random.randint(0, 180)) if is_checked else None
            remark = "检查通过" if is_checked else None
            related_archive_id = random.choice(archive_ids) if archive_ids and random.random() < 0.6 else None

            items.append((
                checklist_id, item_no, checklist_content, category,
                is_checked, checked_by, checked_at, remark,
                related_archive_id, region_id
            ))

    conn.executemany("""
        INSERT INTO checklist_items (
            checklist_id, item_no, item_content, category,
            is_checked, checked_by, checked_at, remark,
            related_archive_id, region_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, items)
    conn.commit()
    print(f"Generated {len(items)} checklist items")
    return [i[0] for i in items]


def generate_sampling_records(conn, archive_ids):
    records = []
    region_ids = [r[0] for r in REGIONS]

    for i in range(30):
        sampling_id = f"samp_{uuid.uuid4().hex[:12]}"
        sampling_no = f"SAMP-{datetime.now().year}-{random.randint(1000, 9999)}"
        sampling_method = random.choice(SAMPLING_METHODS)
        population_size = random.randint(100, 5000)
        sample_size = random.randint(10, 200)
        confidence_level = random.choice([0.90, 0.95, 0.99])
        margin_of_error = random.choice([0.05, 0.10, 0.15])
        region_id = random.choice(region_ids)
        sampled_by = random.choice(AUDITORS)
        sampled_at = datetime.now() - timedelta(days=random.randint(0, 180))

        method_descriptions = {
            "random": f"对{population_size}条记录进行简单随机抽样",
            "stratified": f"按部门分层抽样，共{population_size}条记录",
            "systematic": f"按固定间隔系统抽样，总体{population_size}条",
            "cluster": f"按区域整群抽样，抽取{random.randint(2, 10)}个群组",
            "weighted": f"按风险等级加权抽样，高风险样本权重加倍",
            "filtered": f"筛选近30天异常操作记录进行抽样"
        }
        sampling_criteria = method_descriptions[sampling_method]

        related_count = min(random.randint(5, 30), len(archive_ids))
        related_archives = random.sample(archive_ids, related_count) if archive_ids else []
        related_archive_ids = ",".join(related_archives) if related_archives else None

        original_refs = []
        for arc_id in related_archives[:10]:
            original_refs.append(f"permission_logs:{arc_id}")
        original_record_refs = ",".join(original_refs) if original_refs else None

        remark = f"本次抽样用于{random.choice(['季度合规检查', '专项审计', '风险评估', '日常监控'])}"

        records.append((
            sampling_id, sampling_no, sampling_method, population_size, sample_size,
            confidence_level, margin_of_error, sampling_criteria, region_id,
            sampled_by, sampled_at, related_archive_ids, original_record_refs, remark
        ))

    conn.executemany("""
        INSERT INTO sampling_records (
            sampling_id, sampling_no, sampling_method, population_size, sample_size,
            confidence_level, margin_of_error, sampling_criteria, region_id,
            sampled_by, sampled_at, related_archive_ids, original_record_refs, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records)
    conn.commit()
    print(f"Generated {len(records)} sampling records")
    return [r[0] for r in records]


def generate_notification_templates(conn):
    templates = []
    region_ids = [r[0] for r in REGIONS]

    for template_type in TEMPLATE_TYPES:
        for region_id in region_ids:
            for version in ["v1.0", "v1.1", "v2.0"]:
                template_id = f"tpl_{uuid.uuid4().hex[:12]}"
                template_name = f"{template_type}模板-{REGIONS[[r[0] for r in REGIONS].index(region_id)][1]}"
                subject = TEMPLATE_SUBJECTS[template_type]
                content = TEMPLATE_CONTENTS[template_type]
                created_by = random.choice(AUDITORS)
                created_at = datetime.now() - timedelta(days=random.randint(60, 365))
                updated_at = created_at + timedelta(days=random.randint(0, 30))

                templates.append((
                    template_id, template_name, template_type, subject, content,
                    version, region_id, created_by, created_at, updated_at
                ))

    conn.executemany("""
        INSERT INTO notification_templates (
            template_id, template_name, template_type, subject, content,
            version, region_id, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, templates)
    conn.commit()
    print(f"Generated {len(templates)} notification templates")
    return [t[0] for t in templates]


def generate_evidence_attachments(conn, archive_ids):
    attachments = []
    file_types = ["application/pdf", "image/jpeg", "image/png", "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/vnd.ms-excel", "text/plain"]

    for i in range(200):
        attachment_id = f"att_{uuid.uuid4().hex[:12]}"
        archive_id = random.choice(archive_ids)
        file_type = random.choice(file_types)
        ext_map = {
            "application/pdf": ".pdf",
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "application/msword": ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
            "application/vnd.ms-excel": ".xls",
            "text/plain": ".txt"
        }
        ext = ext_map[file_type]
        file_name = f"证据附件_{random.randint(10000, 99999)}{ext}"
        file_size = random.randint(1024, 10*1024*1024)
        minio_bucket = random.choice(["audit-documents", "permission-logs", "mail-materials"])
        minio_object_key = f"attachments/{datetime.now().year}/{datetime.now().month}/{attachment_id}{ext}"
        file_hash = uuid.uuid4().hex + uuid.uuid4().hex
        uploaded_by = random.choice(AUDITORS)
        uploaded_at = datetime.now() - timedelta(days=random.randint(0, 180))

        attachments.append((
            attachment_id, archive_id, file_name, file_type, file_size,
            minio_bucket, minio_object_key, file_hash, uploaded_by, uploaded_at
        ))

    conn.executemany("""
        INSERT INTO evidence_attachments (
            attachment_id, archive_id, file_name, file_type, file_size,
            minio_bucket, minio_object_key, file_hash, uploaded_by, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, attachments)
    conn.commit()
    print(f"Generated {len(attachments)} evidence attachments")
    return [a[0] for a in attachments]


def complete_sync_pipeline(pipeline, sync_ids, record_counts):
    for node_type, sync_id in sync_ids.items():
        count = record_counts.get(node_type, 0)
        pipeline.orchestrator.update_record_count(sync_id, count)
        pipeline.orchestrator.mark_completed(sync_id, count)


def main():
    print("=" * 60)
    print("开始生成模拟测试数据...")
    print("=" * 60)

    db_path = get_duckdb_path()
    Path(db_path).unlink(missing_ok=True)
    print(f"Database path: {db_path}")

    init_database(db_path)

    conn = get_connection(db_path)

    try:
        generate_regions(conn)

        record_counts_all = {}

        for batch_idx in range(5):
            operator = random.choice(OPERATORS)
            batch_no = f"BATCH-{202401 + batch_idx:06d}"

            print(f"\n--- 生成批次 {batch_no} 数据 ---")

            pipeline, sync_ids = generate_sync_pipeline(conn, operator, batch_no)

            workpaper_ids = generate_audit_workpapers(conn, sync_ids["extract"], 30)
            log_ids = generate_permission_logs(conn, sync_ids["extract"], 100)
            mail_ids = generate_mail_materials(conn, sync_ids["extract"], 50)

            archive_ids = generate_evidence_archive(conn, sync_ids, workpaper_ids, log_ids, mail_ids)

            record_counts = {
                "extract": len(workpaper_ids) + len(log_ids) + len(mail_ids),
                "transform": len(workpaper_ids) + len(log_ids) + len(mail_ids),
                "validate": len(workpaper_ids) + len(log_ids) + len(mail_ids),
                "load": len(archive_ids),
                "archive": len(archive_ids)
            }

            complete_sync_pipeline(pipeline, sync_ids, record_counts)

            for k, v in record_counts.items():
                record_counts_all[k] = record_counts_all.get(k, 0) + v

            generate_issue_records(conn, archive_ids)
            generate_checklist_items(conn, archive_ids)
            generate_sampling_records(conn, archive_ids)
            generate_evidence_attachments(conn, archive_ids)

            pipeline.close()

        generate_notification_templates(conn)

        print("\n" + "=" * 60)
        print("模拟数据生成完成！")
        print("=" * 60)
        print(f"同步记录总计: {record_counts_all}")

        print("\n数据统计:")
        tables = [
            "regions", "sync_nodes", "audit_workpapers", "permission_logs",
            "mail_materials", "evidence_archive", "issue_records",
            "checklist_items", "sampling_records", "notification_templates",
            "evidence_attachments"
        ]
        for table in tables:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"  {table}: {count} 条")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
