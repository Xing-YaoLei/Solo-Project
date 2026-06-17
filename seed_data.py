import uuid
from datetime import datetime, timedelta
import random

from models.schema import (
    SessionLocal,
    Project,
    Contract,
    PaymentRecord,
    PurchaseOrder,
    PurchaseOrderItem,
    DesignExportItem,
    ReconciliationResult,
    init_db,
)


def seed():
    init_db()
    session = SessionLocal()
    try:
        if session.query(Project).first():
            print("数据已存在，跳过种子数据")
            return

        base_date = datetime(2025, 1, 15)

        projects = [
            Project(
                id="proj-001",
                name="翠湖天地 3号楼 1802",
                address="上海市黄浦区翠湖天地3号楼18层",
                client_name="张先生",
                client_phone="138****1234",
                status="active",
            ),
            Project(
                id="proj-002",
                name="万科城市花园 A5-302",
                address="上海市闵行区万科城市花园A5栋",
                client_name="李女士",
                client_phone="139****5678",
                status="active",
            ),
            Project(
                id="proj-003",
                name="绿地海珀 12-1601",
                address="上海市浦东新区绿地海珀12栋",
                client_name="王先生",
                client_phone="137****9012",
                status="completed",
            ),
        ]
        session.add_all(projects)
        session.flush()

        contracts = [
            Contract(
                id="ctr-001",
                project_id="proj-001",
                contract_no="HT-2025-001",
                total_amount=185000,
                signed_date=base_date,
                attachment_path="/contracts/HT-2025-001.pdf",
                remarks="三室两厅全包合同，含设计变更一次",
                version=2,
            ),
            Contract(
                id="ctr-002",
                project_id="proj-002",
                contract_no="HT-2025-002",
                total_amount=128000,
                signed_date=base_date + timedelta(days=30),
                attachment_path="/contracts/HT-2025-002.pdf",
                remarks="两室一厅半包合同",
                version=1,
            ),
            Contract(
                id="ctr-003",
                project_id="proj-003",
                contract_no="HT-2025-003",
                total_amount=210000,
                signed_date=base_date + timedelta(days=60),
                attachment_path="/contracts/HT-2025-003.pdf",
                remarks="四室两厅全包合同，含智能家居",
                version=1,
            ),
        ]
        session.add_all(contracts)
        session.flush()

        payment_records = []
        payment_configs = [
            ("proj-001", "ctr-001", [
                (50000, "首付款", "银行转账", base_date + timedelta(days=3)),
                (40000, "二期款", "银行转账", base_date + timedelta(days=35)),
                (45000, "三期款", "微信支付", base_date + timedelta(days=70)),
                (35000, "尾款", "银行转账", base_date + timedelta(days=105)),
            ]),
            ("proj-002", "ctr-002", [
                (38000, "首付款", "银行转账", base_date + timedelta(days=33)),
                (35000, "二期款", "支付宝", base_date + timedelta(days=68)),
                (30000, "三期款", "银行转账", base_date + timedelta(days=100)),
            ]),
            ("proj-003", "ctr-003", [
                (63000, "首付款", "银行转账", base_date + timedelta(days=62)),
                (60000, "二期款", "银行转账", base_date + timedelta(days=100)),
                (55000, "三期款", "微信支付", base_date + timedelta(days=140)),
            ]),
        ]
        for proj_id, ctr_id, payments in payment_configs:
            for i, (amt, ptype, method, pdate) in enumerate(payments):
                payment_records.append(
                    PaymentRecord(
                        id=f"pay-{uuid.uuid4().hex[:8]}",
                        project_id=proj_id,
                        contract_id=ctr_id,
                        payment_no=f"PAY-2025-{len(payment_records)+1:04d}",
                        amount=amt,
                        payment_type=ptype,
                        payment_method=method,
                        payment_date=pdate,
                        payer_name="客户",
                        receiver_name="公司账户",
                        status="completed",
                    )
                )
        session.add_all(payment_records)
        session.flush()

        purchase_orders = [
            PurchaseOrder(
                id="po-001",
                project_id="proj-001",
                po_no="PO-2025-001",
                version=2,
                supplier_name="东方建材",
                total_amount=92000,
                order_date=base_date + timedelta(days=5),
                status="confirmed",
            ),
            PurchaseOrder(
                id="po-002",
                project_id="proj-001",
                po_no="PO-2025-002",
                version=1,
                supplier_name="鼎盛家居",
                total_amount=58000,
                order_date=base_date + timedelta(days=10),
                status="confirmed",
            ),
            PurchaseOrder(
                id="po-003",
                project_id="proj-002",
                po_no="PO-2025-003",
                version=1,
                supplier_name="永安材料",
                total_amount=68000,
                order_date=base_date + timedelta(days=35),
                status="confirmed",
            ),
            PurchaseOrder(
                id="po-004",
                project_id="proj-003",
                po_no="PO-2025-004",
                version=1,
                supplier_name="华美装饰",
                total_amount=120000,
                order_date=base_date + timedelta(days=65),
                status="confirmed",
            ),
        ]
        session.add_all(purchase_orders)
        session.flush()

        po_items = [
            PurchaseOrderItem(id="poi-001", po_id="po-001", room="客厅", material_name="大理石地砖800x800", spec="800x800mm", qty=120, unit="片", price=85, amount=10200, category="瓷砖"),
            PurchaseOrderItem(id="poi-002", po_id="po-001", room="客厅", material_name="乳胶漆", spec="20L/桶", qty=8, unit="桶", price=480, amount=3840, category="涂料"),
            PurchaseOrderItem(id="poi-003", po_id="po-001", room="主卧", material_name="实木地板", spec="910x125mm", qty=45, unit="㎡", price=320, amount=14400, category="地板"),
            PurchaseOrderItem(id="poi-004", po_id="po-001", room="厨房", material_name="整体橱柜", spec="3m地柜+2m吊柜", qty=1, unit="套", price=18000, amount=18000, category="橱柜"),
            PurchaseOrderItem(id="poi-005", po_id="po-001", room="卫生间", material_name="卫浴三件套", spec="马桶+洗手台+淋浴", qty=2, unit="套", price=6500, amount=13000, category="卫浴"),
            PurchaseOrderItem(id="poi-006", po_id="po-002", room="客厅", material_name="石膏板吊顶", spec="9.5mm", qty=35, unit="㎡", price=120, amount=4200, category="吊顶"),
            PurchaseOrderItem(id="poi-007", po_id="po-002", room="主卧", material_name="壁纸", spec="0.53x10m", qty=12, unit="卷", price=280, amount=3360, category="墙纸"),
            PurchaseOrderItem(id="poi-008", po_id="po-003", room="客厅", material_name="复合地板", spec="1215x195mm", qty=40, unit="㎡", price=180, amount=7200, category="地板"),
            PurchaseOrderItem(id="poi-009", po_id="po-003", room="厨房", material_name="墙砖300x600", spec="300x600mm", qty=80, unit="片", price=35, amount=2800, category="瓷砖"),
            PurchaseOrderItem(id="poi-010", po_id="po-004", room="客厅", material_name="微晶石地砖", spec="800x800mm", qty=100, unit="片", price=220, amount=22000, category="瓷砖"),
            PurchaseOrderItem(id="poi-011", po_id="po-004", room="主卧", material_name="实木复合地板", spec="910x127mm", qty=50, unit="㎡", price=380, amount=19000, category="地板"),
        ]
        session.add_all(po_items)
        session.flush()

        design_exports = [
            DesignExportItem(id="dei-001", project_id="proj-001", export_batch="batch-001", room_name="客厅", item_name="大理石地砖800x800", quantity=120, unit="片", unit_price=85, total_price=10200),
            DesignExportItem(id="dei-002", project_id="proj-001", export_batch="batch-001", room_name="客厅", item_name="乳胶漆", quantity=8, unit="片", unit_price=480, total_price=3840),
            DesignExportItem(id="dei-003", project_id="proj-001", export_batch="batch-001", room_name="主卧", item_name="实木地板", quantity=45, unit="㎡", unit_price=330, total_price=14850),
            DesignExportItem(id="dei-004", project_id="proj-001", export_batch="batch-001", room_name="厨房", item_name="整体橱柜", quantity=1, unit="套", unit_price=18000, total_price=18000),
            DesignExportItem(id="dei-005", project_id="proj-001", export_batch="batch-001", room_name="卫生间", item_name="卫浴三件套", quantity=2, unit="套", unit_price=6200, total_price=12400),
            DesignExportItem(id="dei-006", project_id="proj-001", export_batch="batch-001", room_name="阳台", item_name="防腐木地板", quantity=15, unit="㎡", unit_price=260, total_price=3900),
            DesignExportItem(id="dei-007", project_id="proj-002", export_batch="batch-002", room_name="客厅", item_name="复合地板", quantity=40, unit="㎡", unit_price=185, total_price=7400),
            DesignExportItem(id="dei-008", project_id="proj-002", export_batch="batch-002", room_name="厨房", item_name="墙砖300x600", quantity=80, unit="片", unit_price=35, total_price=2800),
            DesignExportItem(id="dei-009", project_id="proj-002", export_batch="batch-002", room_name="次卧", item_name="乳胶漆", quantity=5, unit="桶", unit_price=480, total_price=2400),
            DesignExportItem(id="dei-010", project_id="proj-003", export_batch="batch-003", room_name="客厅", item_name="微晶石地砖", quantity=100, unit="片", unit_price=220, total_price=22000),
            DesignExportItem(id="dei-011", project_id="proj-003", export_batch="batch-003", room_name="主卧", item_name="实木复合地板", quantity=50, unit="㎡", unit_price=380, total_price=19000),
        ]
        session.add_all(design_exports)

        session.commit()
        print("种子数据写入完成")
    except Exception as e:
        session.rollback()
        print(f"种子数据写入失败: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
