from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal

from .database import engine, Base, SessionLocal
from .config import settings
from .models import (
    User, ApprovalNode, Contract, Bill, BillItem,
    ReconciliationDiff, ExceptionOrder, ExceptionAffectedObject
)
from .utils.auth import get_password_hash
from .routers import auth, contracts, reconciliation, bills, approval, exceptions, timelines, exports, validation


def create_tables():
    Base.metadata.create_all(bind=engine)


def init_test_data():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users = [
                User(
                    username="admin",
                    email="admin@example.com",
                    full_name="系统管理员",
                    hashed_password=get_password_hash("admin123"),
                    role="admin",
                    department="IT部",
                    is_active=True
                ),
                User(
                    username="manager",
                    email="manager@example.com",
                    full_name="项目经理",
                    hashed_password=get_password_hash("manager123"),
                    role="manager",
                    department="项目部",
                    is_active=True
                ),
                User(
                    username="sales",
                    email="sales@example.com",
                    full_name="销售人员",
                    hashed_password=get_password_hash("sales123"),
                    role="sales",
                    department="销售部",
                    is_active=True
                ),
                User(
                    username="designer",
                    email="designer@example.com",
                    full_name="设计师",
                    hashed_password=get_password_hash("designer123"),
                    role="designer",
                    department="设计部",
                    is_active=True
                ),
                User(
                    username="finance",
                    email="finance@example.com",
                    full_name="财务人员",
                    hashed_password=get_password_hash("finance123"),
                    role="finance",
                    department="财务部",
                    is_active=True
                ),
                User(
                    username="user",
                    email="user@example.com",
                    full_name="普通用户",
                    hashed_password=get_password_hash("user123"),
                    role="user",
                    department="业务部",
                    is_active=True
                ),
            ]
            db.add_all(users)
            db.commit()
            print("测试用户数据初始化完成")

        if db.query(ApprovalNode).count() == 0:
            admin = db.query(User).filter(User.username == "admin").first()
            manager = db.query(User).filter(User.username == "manager").first()
            finance = db.query(User).filter(User.username == "finance").first()

            approval_nodes = [
                ApprovalNode(
                    node_name="项目主管审批",
                    node_code="PROJECT_MANAGER_APPROVAL",
                    approver_role="manager",
                    approver_id=manager.id if manager else None,
                    approval_type="and",
                    sort_order=1,
                    is_active=1,
                    description="项目主管对账单进行初步审核"
                ),
                ApprovalNode(
                    node_name="财务审核",
                    node_code="FINANCE_REVIEW",
                    approver_role="finance",
                    approver_id=finance.id if finance else None,
                    approval_type="and",
                    sort_order=2,
                    is_active=1,
                    description="财务人员对金额进行审核"
                ),
                ApprovalNode(
                    node_name="总经理审批",
                    node_code="GENERAL_MANAGER_APPROVAL",
                    approver_role="admin",
                    approver_id=admin.id if admin else None,
                    approval_type="and",
                    sort_order=3,
                    is_active=1,
                    description="总经理最终审批"
                ),
            ]
            db.add_all(approval_nodes)
            db.commit()
            print("审批节点数据初始化完成")

        if db.query(Contract).count() == 0:
            contracts = [
                Contract(
                    contract_no="HT20260601001",
                    project_name="翡翠花园精装修项目",
                    client_name="张伟",
                    client_phone="13800138001",
                    address="北京市朝阳区翡翠花园3栋1802",
                    house_type="新房",
                    area=Decimal("128.50"),
                    contract_amount=Decimal("258000.00"),
                    sign_date=datetime(2026, 5, 8, 10, 30),
                    start_date=datetime(2026, 5, 15),
                    end_date=datetime(2026, 9, 15),
                    status="active",
                    manager_id=2,
                    sales_id=3,
                    designer_id=4,
                    remark="客户要求使用环保材料，工期紧张"
                ),
                Contract(
                    contract_no="HT20260601002",
                    project_name="阳光家园改造工程",
                    client_name="李娜",
                    client_phone="13800138002",
                    address="北京市海淀区阳光家园5栋601",
                    house_type="二手房",
                    area=Decimal("95.80"),
                    contract_amount=Decimal("168500.00"),
                    sign_date=datetime(2026, 5, 12, 14, 0),
                    start_date=datetime(2026, 5, 20),
                    end_date=datetime(2026, 8, 20),
                    status="active",
                    manager_id=2,
                    sales_id=3,
                    designer_id=4,
                    remark="老房改造，水电需要全部重做"
                ),
                Contract(
                    contract_no="HT20260601003",
                    project_name="龙湖别墅全屋整装",
                    client_name="王强",
                    client_phone="13800138003",
                    address="北京市顺义区龙湖别墅区A12",
                    house_type="别墅",
                    area=Decimal("380.00"),
                    contract_amount=Decimal("986000.00"),
                    sign_date=datetime(2026, 5, 18, 9, 0),
                    start_date=datetime(2026, 6, 1),
                    end_date=datetime(2026, 12, 31),
                    status="active",
                    manager_id=2,
                    sales_id=3,
                    designer_id=4,
                    remark="高端客户，对品质要求极高，含智能家居系统"
                ),
                Contract(
                    contract_no="HT20260601004",
                    project_name="金色家园简装项目",
                    client_name="赵敏",
                    client_phone="13800138004",
                    address="北京市丰台区金色家园8栋1203",
                    house_type="新房",
                    area=Decimal("88.00"),
                    contract_amount=Decimal("98000.00"),
                    sign_date=datetime(2026, 5, 25, 15, 30),
                    start_date=datetime(2026, 6, 5),
                    end_date=datetime(2026, 8, 25),
                    status="draft",
                    manager_id=2,
                    sales_id=3,
                    designer_id=4,
                    remark="客户预算有限，性价比方案"
                ),
                Contract(
                    contract_no="HT20260601005",
                    project_name="碧水湾小区装修工程",
                    client_name="陈刚",
                    client_phone="13800138005",
                    address="北京市通州区碧水湾2栋901",
                    house_type="新房",
                    area=Decimal("112.30"),
                    contract_amount=Decimal("198600.00"),
                    sign_date=datetime(2026, 4, 20, 11, 0),
                    start_date=datetime(2026, 5, 1),
                    end_date=datetime(2026, 8, 15),
                    status="completed",
                    manager_id=2,
                    sales_id=3,
                    designer_id=4,
                    remark="项目已基本完成，进入收尾阶段"
                ),
                Contract(
                    contract_no="HT20260601006",
                    project_name="星河苑老房翻新",
                    client_name="刘洋",
                    client_phone="13800138006",
                    address="北京市西城区星河苑6栋402",
                    house_type="二手房",
                    area=Decimal("76.50"),
                    contract_amount=Decimal("125000.00"),
                    sign_date=datetime(2026, 6, 2, 10, 0),
                    start_date=datetime(2026, 6, 10),
                    end_date=datetime(2026, 9, 10),
                    status="active",
                    manager_id=2,
                    sales_id=3,
                    designer_id=4,
                    remark="学区房翻新，需要在开学前完工"
                ),
            ]
            db.add_all(contracts)
            db.commit()
            print("合同数据初始化完成")

        if db.query(Bill).count() == 0:
            contracts_all = db.query(Contract).all()
            contract_map = {c.contract_no: c for c in contracts_all}

            bills_data = [
                {
                    "contract_no": "HT20260601001",
                    "bill_no": "DJ20260601001",
                    "bill_type": "材料采购",
                    "bill_name": "翡翠花园-主材采购单",
                    "status": "approved",
                    "due_date": datetime(2026, 5, 25),
                    "paid_date": datetime(2026, 5, 23),
                    "items": [
                        {"item_name": "瓷砖", "specification": "800x800mm 抛光砖", "unit": "块", "quantity": Decimal("160"), "unit_price": Decimal("185.00")},
                        {"item_name": "地板", "specification": "复合木地板 12mm", "unit": "㎡", "quantity": Decimal("85"), "unit_price": Decimal("220.00")},
                        {"item_name": "乳胶漆", "specification": "多乐士净味五合一", "unit": "桶", "quantity": Decimal("8"), "unit_price": Decimal("680.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601001",
                    "bill_no": "DJ20260601002",
                    "bill_type": "人工费",
                    "bill_name": "翡翠花园-水电改造人工费",
                    "status": "approved",
                    "due_date": datetime(2026, 6, 5),
                    "paid_date": None,
                    "items": [
                        {"item_name": "水电改造", "specification": "全屋水电重新布线", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("18000.00")},
                        {"item_name": "人工费", "specification": "水电工施工费", "unit": "工日", "quantity": Decimal("25"), "unit_price": Decimal("450.00")},
                        {"item_name": "开槽费", "specification": "墙面地面开槽", "unit": "米", "quantity": Decimal("120"), "unit_price": Decimal("35.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601002",
                    "bill_no": "DJ20260601003",
                    "bill_type": "材料采购",
                    "bill_name": "阳光家园-拆除及新材料",
                    "status": "pending",
                    "due_date": datetime(2026, 6, 8),
                    "paid_date": None,
                    "items": [
                        {"item_name": "拆除费", "specification": "原有装修拆除清运", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("8500.00")},
                        {"item_name": "瓷砖", "specification": "600x600mm 仿古砖", "unit": "块", "quantity": Decimal("120"), "unit_price": Decimal("128.00")},
                        {"item_name": "防水材料", "specification": "卫生间厨房防水", "unit": "套", "quantity": Decimal("3"), "unit_price": Decimal("1200.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601002",
                    "bill_no": "DJ20260601004",
                    "bill_type": "设计费",
                    "bill_name": "阳光家园-设计服务合同",
                    "status": "paid",
                    "due_date": datetime(2026, 5, 20),
                    "paid_date": datetime(2026, 5, 18),
                    "items": [
                        {"item_name": "方案设计", "specification": "平面方案+效果图", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("8000.00")},
                        {"item_name": "施工图", "specification": "全套施工图纸", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("5000.00")},
                        {"item_name": "软装搭配", "specification": "软装方案咨询", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("2000.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601003",
                    "bill_no": "DJ20260601005",
                    "bill_type": "材料费",
                    "bill_name": "龙湖别墅-一期石材采购",
                    "status": "pending",
                    "due_date": datetime(2026, 6, 15),
                    "paid_date": None,
                    "items": [
                        {"item_name": "大理石", "specification": "客厅地面意大利灰", "unit": "㎡", "quantity": Decimal("150"), "unit_price": Decimal("880.00")},
                        {"item_name": "瓷砖", "specification": "厨房卫生间墙地砖", "unit": "㎡", "quantity": Decimal("200"), "unit_price": Decimal("320.00")},
                        {"item_name": "木地板", "specification": "三层实木地板", "unit": "㎡", "quantity": Decimal("180"), "unit_price": Decimal("560.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601003",
                    "bill_no": "DJ20260601006",
                    "bill_type": "管理费",
                    "bill_name": "龙湖别墅-项目管理费",
                    "status": "approved",
                    "due_date": datetime(2026, 6, 10),
                    "paid_date": None,
                    "items": [
                        {"item_name": "项目管理", "specification": "全程项目管理服务", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("45000.00")},
                        {"item_name": "监理服务", "specification": "第三方监理", "unit": "次", "quantity": Decimal("20"), "unit_price": Decimal("800.00")},
                        {"item_name": "材料验收", "specification": "进场材料检验", "unit": "次", "quantity": Decimal("15"), "unit_price": Decimal("500.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601004",
                    "bill_no": "DJ20260601007",
                    "bill_type": "材料采购",
                    "bill_name": "金色家园-基础材料采购",
                    "status": "rejected",
                    "due_date": datetime(2026, 6, 6),
                    "paid_date": None,
                    "items": [
                        {"item_name": "乳胶漆", "specification": "立邦净味120", "unit": "桶", "quantity": Decimal("6"), "unit_price": Decimal("450.00")},
                        {"item_name": "瓷砖", "specification": "普通抛釉砖", "unit": "块", "quantity": Decimal("110"), "unit_price": Decimal("95.00")},
                        {"item_name": "地板", "specification": "强化复合地板", "unit": "㎡", "quantity": Decimal("65"), "unit_price": Decimal("128.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601005",
                    "bill_no": "DJ20260601008",
                    "bill_type": "材料采购",
                    "bill_name": "碧水湾-尾款材料清单",
                    "status": "paid",
                    "due_date": datetime(2026, 8, 1),
                    "paid_date": datetime(2026, 7, 28),
                    "items": [
                        {"item_name": "开关插座", "specification": "西门子全套", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("3800.00")},
                        {"item_name": "灯具", "specification": "客厅卧室吸顶灯", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("5200.00")},
                        {"item_name": "五金配件", "specification": "门锁把手合页等", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("2800.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601005",
                    "bill_no": "DJ20260601009",
                    "bill_type": "人工费",
                    "bill_name": "碧水湾-竣工验收前修补",
                    "status": "approved",
                    "due_date": datetime(2026, 8, 10),
                    "paid_date": None,
                    "items": [
                        {"item_name": "油漆修补", "specification": "墙面局部修补", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("2500.00")},
                        {"item_name": "安装人工", "specification": "灯具开关安装", "unit": "工日", "quantity": Decimal("5"), "unit_price": Decimal("400.00")},
                        {"item_name": "清洁费", "specification": "开荒保洁", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("1800.00")},
                    ]
                },
                {
                    "contract_no": "HT20260601006",
                    "bill_no": "DJ20260601010",
                    "bill_type": "其他",
                    "bill_name": "星河苑-设计及前期费用",
                    "status": "pending",
                    "due_date": datetime(2026, 6, 15),
                    "paid_date": None,
                    "items": [
                        {"item_name": "设计费", "specification": "老房改造方案", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("6000.00")},
                        {"item_name": "量房费", "specification": "现场勘测出图", "unit": "次", "quantity": Decimal("2"), "unit_price": Decimal("500.00")},
                        {"item_name": "审图费", "specification": "物业报备审图", "unit": "项", "quantity": Decimal("1"), "unit_price": Decimal("800.00")},
                    ]
                },
            ]

            for bill_data in bills_data:
                contract = contract_map.get(bill_data["contract_no"])
                if not contract:
                    continue

                items = []
                total_amount = Decimal("0")
                for idx, item_data in enumerate(bill_data["items"]):
                    subtotal = item_data["quantity"] * item_data["unit_price"]
                    actual_amount = subtotal * (Decimal("1") - Decimal("0"))
                    total_amount += actual_amount
                    items.append(BillItem(
                        item_name=item_data["item_name"],
                        specification=item_data["specification"],
                        unit=item_data["unit"],
                        quantity=item_data["quantity"],
                        unit_price=item_data["unit_price"],
                        subtotal=subtotal,
                        discount_rate=Decimal("0"),
                        actual_amount=actual_amount,
                        sort_order=idx
                    ))

                paid_amount = Decimal("0")
                if bill_data["status"] == "paid":
                    paid_amount = total_amount

                bill = Bill(
                    contract_id=contract.id,
                    bill_no=bill_data["bill_no"],
                    bill_type=bill_data["bill_type"],
                    bill_name=bill_data["bill_name"],
                    total_amount=total_amount,
                    paid_amount=paid_amount,
                    unpaid_amount=total_amount - paid_amount,
                    status=bill_data["status"],
                    due_date=bill_data["due_date"],
                    paid_date=bill_data["paid_date"],
                    created_by=1
                )
                bill.items = items
                db.add(bill)
            db.commit()
            print("单据及明细数据初始化完成")

        if db.query(ReconciliationDiff).count() == 0:
            contracts_all = db.query(Contract).all()
            bills_all = db.query(Bill).all()
            contract_map = {c.contract_no: c for c in contracts_all}
            bill_map = {b.bill_no: b for b in bills_all}

            diffs_data = [
                {
                    "contract_no": "HT20260601001",
                    "bill_no": "DJ20260601001",
                    "diff_no": "DZ20260601001",
                    "diff_type": "金额差异",
                    "expected_amount": Decimal("58240.00"),
                    "actual_amount": Decimal("54540.00"),
                    "status": "resolved",
                    "handler_conclusion": "供应商给与优惠，瓷砖实际单价降低，差异已确认",
                    "has_handler": True,
                    "has_handled_at": True
                },
                {
                    "contract_no": "HT20260601001",
                    "bill_no": "DJ20260601002",
                    "diff_no": "DZ20260601002",
                    "diff_type": "数量差异",
                    "expected_amount": Decimal("33450.00"),
                    "actual_amount": Decimal("30950.00"),
                    "status": "pending",
                    "handler_conclusion": None,
                    "has_handler": False,
                    "has_handled_at": False
                },
                {
                    "contract_no": "HT20260601003",
                    "bill_no": "DJ20260601005",
                    "diff_no": "DZ20260601003",
                    "diff_type": "项目变更",
                    "expected_amount": Decimal("295000.00"),
                    "actual_amount": Decimal("268800.00"),
                    "status": "resolved",
                    "handler_conclusion": "大理石用量按实际铺贴面积计算，客户确认变更",
                    "has_handler": True,
                    "has_handled_at": True
                },
                {
                    "contract_no": "HT20260601002",
                    "bill_no": "DJ20260601003",
                    "diff_no": "DZ20260601004",
                    "diff_type": "金额差异",
                    "expected_amount": Decimal("27460.00"),
                    "actual_amount": Decimal("28960.00"),
                    "status": "rejected",
                    "handler_conclusion": "差异原因不明，不予确认，需重新核对",
                    "has_handler": True,
                    "has_handled_at": True
                },
                {
                    "contract_no": "HT20260601005",
                    "bill_no": "DJ20260601009",
                    "diff_no": "DZ20260601005",
                    "diff_type": "其他",
                    "expected_amount": Decimal("6300.00"),
                    "actual_amount": Decimal("7100.00"),
                    "status": "pending",
                    "handler_conclusion": None,
                    "has_handler": False,
                    "has_handled_at": False
                },
            ]

            for diff_data in diffs_data:
                contract = contract_map.get(diff_data["contract_no"])
                bill = bill_map.get(diff_data["bill_no"])
                if not contract:
                    continue

                diff_amount = abs(diff_data["expected_amount"] - diff_data["actual_amount"])
                diff = ReconciliationDiff(
                    contract_id=contract.id,
                    bill_id=bill.id if bill else None,
                    diff_no=diff_data["diff_no"],
                    diff_type=diff_data["diff_type"],
                    expected_amount=diff_data["expected_amount"],
                    actual_amount=diff_data["actual_amount"],
                    diff_amount=diff_amount,
                    status=diff_data["status"],
                    handler_conclusion=diff_data["handler_conclusion"],
                    handled_by=5 if diff_data["has_handler"] else None,
                    handled_at=datetime(2026, 6, 5, 14, 30) if diff_data["has_handled_at"] else None
                )
                db.add(diff)
            db.commit()
            print("对账差异数据初始化完成")

        if db.query(ExceptionOrder).count() == 0:
            contracts_all = db.query(Contract).all()
            bills_all = db.query(Bill).all()
            contract_map = {c.contract_no: c for c in contracts_all}
            bill_map = {b.bill_no: b for b in bills_all}

            exceptions_data = [
                {
                    "exception_no": "YC20260601001",
                    "exception_type": "amount_mismatch",
                    "title": "龙湖别墅石材采购金额异常",
                    "description": "石材采购单实际金额与预算差异较大，超出5%预警线，需要核实原因并确认是否存在供应商报价错误或材料变更未报备情况。",
                    "contract_no": "HT20260601003",
                    "bill_no": "DJ20260601005",
                    "expected_amount": Decimal("295000.00"),
                    "actual_amount": Decimal("268800.00"),
                    "status": "processing",
                    "priority": "high",
                    "final_conclusion": None,
                    "closed_at": None,
                    "affected": [
                        {"object_type": "contract", "object_id": None, "object_name": "龙湖别墅全屋整装", "object_no": "HT20260601003", "impact_level": "high", "impact_description": "合同成本控制受影响"},
                        {"object_type": "bill", "object_id": None, "object_name": "龙湖别墅-一期石材采购", "object_no": "DJ20260601005", "impact_level": "high", "impact_description": "单据金额与预期不符"},
                    ]
                },
                {
                    "exception_no": "YC20260601002",
                    "exception_type": "approval_overdue",
                    "title": "阳光家园材料单审批超时",
                    "description": "阳光家园拆除及新材料采购单提交已超过48小时，仍未完成审批流程，可能影响施工进度，需催办。",
                    "contract_no": "HT20260601002",
                    "bill_no": "DJ20260601003",
                    "expected_amount": None,
                    "actual_amount": None,
                    "status": "open",
                    "priority": "medium",
                    "final_conclusion": None,
                    "closed_at": None,
                    "affected": [
                        {"object_type": "bill", "object_id": None, "object_name": "阳光家园-拆除及新材料", "object_no": "DJ20260601003", "impact_level": "high", "impact_description": "单据审批延迟"},
                        {"object_type": "contract", "object_id": None, "object_name": "阳光家园改造工程", "object_no": "HT20260601002", "impact_level": "medium", "impact_description": "项目进度有延误风险"},
                    ]
                },
                {
                    "exception_no": "YC20260601003",
                    "exception_type": "document_missing",
                    "title": "金色家园合同附件缺失",
                    "description": "金色家园项目合同已创建，但缺少正式合同扫描件和预算明细附件，请项目负责人尽快补传相关文档。",
                    "contract_no": "HT20260601004",
                    "bill_no": None,
                    "expected_amount": None,
                    "actual_amount": None,
                    "status": "closed",
                    "priority": "low",
                    "final_conclusion": "合同附件已补传，预算明细表已上传系统，相关文档审核通过，异常解除。",
                    "closed_at": datetime(2026, 6, 3, 11, 20),
                    "affected": [
                        {"object_type": "contract", "object_id": None, "object_name": "金色家园简装项目", "object_no": "HT20260601004", "impact_level": "low", "impact_description": "合同文件不完整"},
                        {"object_type": "other", "object_id": 0, "object_name": "合同附件资料", "object_no": "附件-001", "impact_level": "low", "impact_description": "缺少必要文件"},
                    ]
                },
                {
                    "exception_no": "YC20260601004",
                    "exception_type": "other",
                    "title": "星河苑工期紧张预警",
                    "description": "星河苑老房翻新项目合同签订时间6月2日，要求9月10日前完工（开学前），工期仅3个月，叠加老房改造拆改量大，存在工期延误风险。",
                    "contract_no": "HT20260601006",
                    "bill_no": None,
                    "expected_amount": Decimal("125000.00"),
                    "actual_amount": Decimal("125000.00"),
                    "status": "processing",
                    "priority": "medium",
                    "final_conclusion": None,
                    "closed_at": None,
                    "affected": [
                        {"object_type": "contract", "object_id": None, "object_name": "星河苑老房翻新", "object_no": "HT20260601006", "impact_level": "high", "impact_description": "工期紧张有延期风险"},
                        {"object_type": "other", "object_id": 0, "object_name": "项目排期计划", "object_no": "P202606001", "impact_level": "medium", "impact_description": "施工计划需优化"},
                    ]
                },
            ]

            for exc_data in exceptions_data:
                contract = contract_map.get(exc_data["contract_no"]) if exc_data["contract_no"] else None
                bill = bill_map.get(exc_data["bill_no"]) if exc_data["bill_no"] else None

                diff_amount = None
                if exc_data["expected_amount"] is not None and exc_data["actual_amount"] is not None:
                    diff_amount = abs(exc_data["expected_amount"] - exc_data["actual_amount"])
                    priority = "high" if diff_amount > Decimal("10000") else exc_data["priority"]
                else:
                    priority = exc_data["priority"]

                exception_order = ExceptionOrder(
                    exception_no=exc_data["exception_no"],
                    exception_type=exc_data["exception_type"],
                    title=exc_data["title"],
                    description=exc_data["description"],
                    contract_id=contract.id if contract else None,
                    bill_id=bill.id if bill else None,
                    expected_amount=exc_data["expected_amount"],
                    actual_amount=exc_data["actual_amount"],
                    diff_amount=diff_amount,
                    status=exc_data["status"],
                    priority=priority,
                    handler_id=2,
                    supervisor_id=1,
                    final_conclusion=exc_data["final_conclusion"],
                    closed_at=exc_data["closed_at"]
                )

                affected_objects = []
                for aff in exc_data["affected"]:
                    obj_id = aff["object_id"]
                    if obj_id is None:
                        if aff["object_type"] == "contract" and contract:
                            obj_id = contract.id
                        elif aff["object_type"] == "bill" and bill:
                            obj_id = bill.id
                        else:
                            obj_id = 0

                    affected_objects.append(ExceptionAffectedObject(
                        object_type=aff["object_type"],
                        object_id=obj_id,
                        object_name=aff["object_name"],
                        object_no=aff["object_no"],
                        impact_level=aff["impact_level"],
                        impact_description=aff["impact_description"]
                    ))

                exception_order.affected_objects = affected_objects
                db.add(exception_order)
            db.commit()
            print("异常单数据初始化完成")

    except Exception as e:
        db.rollback()
        print(f"初始化测试数据失败: {e}")
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="家装管理系统 API",
        description="家装项目合同、账单、对账管理系统后端API",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(contracts.router)
    app.include_router(reconciliation.router)
    app.include_router(bills.router)
    app.include_router(approval.router)
    app.include_router(exceptions.router)
    app.include_router(timelines.router)
    app.include_router(exports.router)
    app.include_router(validation.router)

    @app.get("/health", tags=["系统"])
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }

    @app.get("/", tags=["系统"])
    async def root():
        return {
            "message": "家装管理系统 API",
            "version": "1.0.0",
            "docs": "/docs"
        }

    return app


create_tables()
init_test_data()

app = create_app()
