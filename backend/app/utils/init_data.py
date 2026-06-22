from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models import (
    User, UserRole, Vendor, AuditChecklist, SamplingRecord,
    RectificationPlan, SupplierMaterial, ExceptionOrder, StatusChangeLog,
    SamplingStatus, EvidenceStatus, RiskLevel, RectificationStatus,
    ExceptionType, ExceptionStatus, MaterialStatus
)
from app.core.security import get_password_hash


def init_default_user(db: Session):
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        print("✅ 默认管理员用户已创建: admin / admin123")

    auditor = db.query(User).filter(User.username == "auditor").first()
    if not auditor:
        auditor = User(
            username="auditor",
            email="auditor@example.com",
            hashed_password=get_password_hash("auditor123"),
            role=UserRole.AUDITOR,
        )
        db.add(auditor)
        print("✅ 默认审计员用户已创建: auditor / auditor123")

    db.commit()


def init_test_data(db: Session):
    existing_vendor = db.query(Vendor).first()
    if existing_vendor:
        return

    print("🔄 正在初始化测试数据...")

    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        return

    vendor1 = Vendor(
        name="华为技术有限公司",
        contact="张三",
        email="zhangsan@huawei.com",
        phone="13800138001",
        address="广东省深圳市龙岗区坂田华为基地",
    )
    vendor2 = Vendor(
        name="阿里巴巴集团",
        contact="李四",
        email="lisi@alibaba.com",
        phone="13800138002",
        address="浙江省杭州市余杭区文一西路969号",
    )
    vendor3 = Vendor(
        name="腾讯科技",
        contact="王五",
        email="wangwu@tencent.com",
        phone="13800138003",
        address="广东省深圳市南山区科技园",
    )
    db.add_all([vendor1, vendor2, vendor3])
    db.flush()

    checklist1 = AuditChecklist(
        title="ISO 27001 信息安全管理体系检查",
        category="信息安全",
        description="依据 ISO 27001:2022 标准对供应商信息安全管理体系进行全面检查",
        criteria="应建立完善的信息安全管理体系，包括风险评估、访问控制、数据保护等方面",
        created_by=admin.id,
    )
    checklist2 = AuditChecklist(
        title="数据安全合规检查",
        category="数据安全",
        description="检查供应商数据处理流程是否符合《数据安全法》和《个人信息保护法》要求",
        criteria="数据分类分级、数据出境评估、个人信息保护影响评估等应符合法规要求",
        created_by=admin.id,
    )
    checklist3 = AuditChecklist(
        title="网络安全等级保护检查",
        category="网络安全",
        description="依据《网络安全等级保护条例》对供应商系统进行等保合规检查",
        criteria="系统应通过相应等级的等保测评，安全技术和管理措施应符合要求",
        created_by=admin.id,
    )
    checklist4 = AuditChecklist(
        title="供应商质量管理体系检查",
        category="质量管理",
        description="检查供应商质量管理体系是否符合 ISO 9001 标准要求",
        criteria="应建立完善的质量管理体系，包括质量方针、质量目标、质量控制流程等",
        created_by=admin.id,
    )
    db.add_all([checklist1, checklist2, checklist3, checklist4])
    db.flush()

    today = date.today()
    sampling1 = SamplingRecord(
        checklist_id=checklist1.id,
        sample_name="华为信息安全文档抽样",
        sample_code="SAM-ISO-001",
        source="华为技术有限公司",
        sampling_date=today - timedelta(days=5),
        sampled_by=admin.username,
        status=SamplingStatus.REVIEWED,
        sample_data={
            "document_review": "已审核 ISMS 手册、程序文件、记录表单",
            "interview": "已访谈信息安全负责人、IT 经理、运维工程师",
            "on_site_check": "已检查机房、网络设备、服务器、安全设备",
            "findings": "整体符合要求，但存在 2 项轻微不符合项",
        },
        evidence_status=EvidenceStatus.COMPLETE,
    )
    sampling2 = SamplingRecord(
        checklist_id=checklist2.id,
        sample_name="阿里数据安全检查",
        sample_code="SAM-DS-001",
        source="阿里巴巴集团",
        sampling_date=today - timedelta(days=3),
        sampled_by=admin.username,
        status=SamplingStatus.FOLLOW_UP,
        sample_data={
            "data_classification": "已建立数据分类分级制度",
            "privacy_assessment": "已完成个人信息保护影响评估",
            "data_export": "数据出境评估待补充",
        },
        evidence_status=EvidenceStatus.PARTIAL,
    )
    sampling3 = SamplingRecord(
        checklist_id=checklist3.id,
        sample_name="腾讯等保检查",
        sample_code="SAM-CP-001",
        source="腾讯科技",
        sampling_date=today - timedelta(days=1),
        sampled_by=admin.username,
        status=SamplingStatus.PENDING,
        sample_data={
            "system_name": "腾讯云用户管理系统",
            "level": "三级等保",
            "test_report": "缺失",
        },
        evidence_status=EvidenceStatus.MISSING,
    )
    sampling4 = SamplingRecord(
        checklist_id=checklist4.id,
        sample_name="华为质量体系检查",
        sample_code="SAM-QM-001",
        source="华为技术有限公司",
        sampling_date=today - timedelta(days=7),
        sampled_by=admin.username,
        status=SamplingStatus.REVIEWED,
        sample_data={
            "quality_manual": "已审核",
            "certificate": "ISO 9001:2015 证书在有效期内",
            "internal_audit": "内部审核记录完整",
        },
        evidence_status=EvidenceStatus.COMPLETE,
    )
    db.add_all([sampling1, sampling2, sampling3, sampling4])
    db.flush()

    rectification1 = RectificationPlan(
        sampling_id=sampling2.id,
        title="补充数据出境评估材料",
        description="数据出境评估报告缺失，需要在 2 周内补充完整",
        risk_level=RiskLevel.MEDIUM,
        deadline=today + timedelta(days=14),
        responsible_person="李四",
        vendor_id=vendor2.id,
        status=RectificationStatus.IN_PROGRESS,
    )
    rectification2 = RectificationPlan(
        sampling_id=sampling3.id,
        title="提交等保测评报告",
        description="三级等保测评报告缺失，需要立即联系测评机构获取",
        risk_level=RiskLevel.HIGH,
        deadline=today + timedelta(days=7),
        responsible_person="王五",
        vendor_id=vendor3.id,
        status=RectificationStatus.NOT_STARTED,
    )
    rectification3 = RectificationPlan(
        sampling_id=sampling1.id,
        title="整改信息安全轻微不符合项",
        description="整改 2 项轻微不符合项：1) 访问日志保留不足 6 个月；2) 密码策略未启用复杂度要求",
        risk_level=RiskLevel.LOW,
        deadline=today + timedelta(days=30),
        responsible_person="张三",
        vendor_id=vendor1.id,
        status=RectificationStatus.SUBMITTED,
    )
    rectification4 = RectificationPlan(
        sampling_id=sampling4.id,
        title="质量体系持续改进",
        description="优化内部审核流程，增加管理评审频次",
        risk_level=RiskLevel.LOW,
        deadline=today + timedelta(days=60),
        responsible_person="张三",
        vendor_id=vendor1.id,
        status=RectificationStatus.CLOSED,
    )
    db.add_all([rectification1, rectification2, rectification3, rectification4])
    db.flush()

    exception1 = ExceptionOrder(
        sampling_id=sampling3.id,
        exception_type=ExceptionType.EVIDENCE_MISSING,
        impact_scope="腾讯云用户管理系统安全评估无法完成，等保合规认证可能延迟",
        responsible_person="王五",
        root_cause="测评机构更换，新机构的测评报告尚未出具",
        handling_result="已联系原测评机构，预计 3 个工作日内可获取报告",
        status=ExceptionStatus.PROCESSING,
    )
    exception2 = ExceptionOrder(
        sampling_id=sampling2.id,
        exception_type=ExceptionType.OTHER,
        impact_scope="数据出境业务可能面临监管处罚风险",
        responsible_person="李四",
        root_cause="数据出境评估工作开展较晚，尚未完成",
        handling_result="已成立专项工作组，加快评估进度，预计 10 个工作日完成",
        status=ExceptionStatus.OPEN,
    )
    db.add_all([exception1, exception2])
    db.flush()

    log1 = StatusChangeLog(
        entity_type="rectification_plan",
        entity_id=rectification3.id,
        old_status=RectificationStatus.NOT_STARTED.value,
        new_status=RectificationStatus.IN_PROGRESS.value,
        changed_by=admin.id,
        remark="供应商已启动整改工作",
    )
    log2 = StatusChangeLog(
        entity_type="rectification_plan",
        entity_id=rectification3.id,
        old_status=RectificationStatus.IN_PROGRESS.value,
        new_status=RectificationStatus.SUBMITTED.value,
        changed_by=admin.id,
        remark="供应商已提交整改材料",
    )
    log3 = StatusChangeLog(
        entity_type="sampling_record",
        entity_id=sampling1.id,
        old_status=SamplingStatus.PENDING.value,
        new_status=SamplingStatus.REVIEWED.value,
        changed_by=admin.id,
        remark="审核通过，整体符合要求",
    )
    log4 = StatusChangeLog(
        entity_type="sampling_record",
        entity_id=sampling4.id,
        old_status=SamplingStatus.PENDING.value,
        new_status=SamplingStatus.REVIEWED.value,
        changed_by=admin.id,
        remark="质量管理体系运行良好",
    )
    log5 = StatusChangeLog(
        entity_type="exception_order",
        entity_id=exception1.id,
        old_status=ExceptionStatus.OPEN.value,
        new_status=ExceptionStatus.PROCESSING.value,
        changed_by=admin.id,
        remark="已与测评机构沟通，正在处理中",
    )
    db.add_all([log1, log2, log3, log4, log5])
    db.flush()

    material1 = SupplierMaterial(
        vendor_id=vendor1.id,
        material_type="资质证书",
        material_name="ISO 27001 信息安全管理体系认证证书",
        upload_date=datetime.utcnow() - timedelta(days=10),
        uploaded_by="admin",
        file_path="/materials/huawei/iso27001_cert.pdf",
        status=MaterialStatus.APPROVED,
    )
    material2 = SupplierMaterial(
        vendor_id=vendor1.id,
        material_type="资质证书",
        material_name="ISO 9001 质量管理体系认证证书",
        upload_date=datetime.utcnow() - timedelta(days=8),
        uploaded_by="admin",
        file_path="/materials/huawei/iso9001_cert.pdf",
        status=MaterialStatus.APPROVED,
    )
    material3 = SupplierMaterial(
        vendor_id=vendor2.id,
        material_type="合规报告",
        material_name="数据安全合规评估报告",
        upload_date=datetime.utcnow() - timedelta(days=5),
        uploaded_by="admin",
        file_path="/materials/alibaba/data_security_report.pdf",
        status=MaterialStatus.PENDING,
    )
    material4 = SupplierMaterial(
        vendor_id=vendor2.id,
        material_type="资质证书",
        material_name="网络安全等级保护备案证明",
        upload_date=datetime.utcnow() - timedelta(days=3),
        uploaded_by="admin",
        file_path="/materials/alibaba/等保备案证明.pdf",
        status=MaterialStatus.PENDING,
    )
    material5 = SupplierMaterial(
        vendor_id=vendor3.id,
        material_type="资质证书",
        material_name="ISO 27001 信息安全管理体系认证证书",
        upload_date=datetime.utcnow() - timedelta(days=15),
        uploaded_by="admin",
        file_path="/materials/tencent/iso27001_cert.pdf",
        status=MaterialStatus.REJECTED,
    )
    material6 = SupplierMaterial(
        vendor_id=vendor3.id,
        material_type="其他材料",
        material_name="供应商安全管理制度",
        upload_date=datetime.utcnow() - timedelta(days=1),
        uploaded_by="admin",
        file_path="/materials/tencent/security_policy.pdf",
        status=MaterialStatus.PENDING,
    )
    db.add_all([material1, material2, material3, material4, material5, material6])

    db.commit()
    print("✅ 测试数据初始化完成")
    print(f"   - 供应商: 3 家")
    print(f"   - 供应商材料: 6 份（含已审核、待审核、已拒绝）")
    print(f"   - 检查清单: 4 份")
    print(f"   - 抽样记录: 4 条（包含缺失证据触发自动异常单）")
    print(f"   - 整改计划: 4 条（各风险等级均有）")
    print(f"   - 异常单: 2 条（待处理 + 处理中）")
    print(f"   - 状态变更日志: 5 条")
