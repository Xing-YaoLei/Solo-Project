import sys
from datetime import date, datetime, timedelta
from random import choice, randint, uniform, random
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, init_db
from app.models import (
    User, Project, Quotation, QuotationItem, Contract, ContractAttachment,
    PurchaseOrder, PurchaseItem, SitePhoto, Approval, Payment, RefreshLog,
    ProjectStatus, ApprovalStatus, PaymentStatus, RoleEnum
)
from app.auth import create_default_users, hash_password
from config import Config


ATTACHMENT_TYPES = [
    "主合同", "报价单", "设计图", "施工图纸", "材料清单",
    "验收单", "变更单", "补充协议", "预算表", "工期表", "其他"
]
APPROVAL_TYPES = [
    "报价审批", "合同审批", "采购审批", "变更审批",
    "付款审批", "验收审批"
]
PAYMENT_STAGES = ["定金", "开工款", "进度款", "竣工款", "质保金"]
HOUSE_TYPES = ["三居室", "两居室", "四居室", "复式", "别墅", "公寓", "平层"]
CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "西安", "重庆"]
DISTRICT = ["朝阳区", "海淀区", "浦东新区", "天河区", "西湖区", "武侯区", "洪山区", "鼓楼区"]


def seed_demo_data():
    Config.ensure_dirs()
    init_db()
    create_default_users()

    db = SessionLocal()
    try:
        if db.query(Project).count() > 0:
            print("⚠️  数据库已有数据，跳过数据填充。")
            return

        print("开始填充演示数据...")

        users = db.query(User).all()
        user_by_role = {}
        for u in users:
            user_by_role.setdefault(u.role, []).append(u)

        designers = user_by_role.get(RoleEnum.DESIGNER, [users[0]])
        supervisors = user_by_role.get(RoleEnum.SUPERVISOR, [users[0]])
        sales = user_by_role.get(RoleEnum.SALES, [users[0]])
        admins = user_by_role.get(RoleEnum.ADMIN, [users[0]])

        base_date = date.today() - timedelta(days=180)
        categories = ["基础工程", "水电改造", "瓦工工程", "木工工程", "油漆工程",
                      "主材", "辅材", "家具", "家电", "软装", "五金"]
        item_names = {
            "基础工程": ["拆墙", "砌墙", "地面找平", "墙面基层处理", "防水工程"],
            "水电改造": ["给水管改造", "排水管改造", "强电改造", "弱电改造", "开关插座"],
            "瓦工工程": ["客厅地砖", "厨房墙砖", "卫生间地砖", "阳台地砖", "踢脚线"],
            "木工工程": ["石膏板吊顶", "定制衣柜", "鞋柜", "橱柜柜体", "电视背景墙"],
            "油漆工程": ["墙面乳胶漆", "顶面乳胶漆", "木器漆", "墙纸", "艺术漆"],
            "主材": ["瓷砖", "地板", "木门", "铝合金门", "淋浴房"],
            "辅材": ["水泥", "沙子", "石膏板", "龙骨", "腻子粉"],
            "家具": ["沙发", "餐桌", "床架", "床垫", "茶几"],
            "家电": ["空调", "冰箱", "洗衣机", "电视", "热水器"],
            "软装": ["窗帘", "灯具", "装饰画", "地毯", "抱枕"],
            "五金": ["门锁", "合页", "拉手", "水龙头", "地漏"],
        }
        suppliers = ["东方建材", "居然之家", "红星美凯龙", "本地建材批发", "厂家直供", "建材超市"]
        brands = ["TOTO", "科勒", "诺贝尔", "马可波罗", "圣象", "索菲亚", "欧派", "格力", "美的", "海尔"]

        project_qty = 45
        projects = []
        for i in range(project_qty):
            idx = i + 1
            measure_days = randint(0, 120)
            measure_date = base_date + timedelta(days=measure_days)
            status_idx = min(int(random() * 6), len(ProjectStatus) - 1)
            status = list(ProjectStatus)[status_idx]

            proj = Project(
                project_no=f"P{base_date.year}{idx:05d}",
                project_name=f"{choice(CITIES)}{choice(DISTRICT)}{randint(1,30)}号楼{randint(101,3205)}家装",
                customer_name=f"客户{idx:03d}",
                customer_phone=f"138{randint(10000000, 99999999)}",
                address=f"{choice(CITIES)}{choice(DISTRICT)}{randint(1,30)}号小区{randint(1,20)}栋{randint(101,3205)}",
                house_type=choice(HOUSE_TYPES),
                area=Decimal(uniform(60.0, 320.0)).quantize(Decimal("0.01")),
                status=status,
                designer_id=choice(designers).id,
                supervisor_id=choice(supervisors).id,
                sales_id=choice(sales).id,
                measure_date=measure_date,
                quote_date=measure_date + timedelta(days=randint(2, 14)) if status_idx >= 1 else None,
                contract_date=measure_date + timedelta(days=randint(7, 45)) if status_idx >= 2 else None,
                start_date=measure_date + timedelta(days=randint(15, 60)) if status_idx >= 3 else None,
                end_date=measure_date + timedelta(days=randint(90, 180)) if status_idx >= 4 else None,
            )
            db.add(proj)
            projects.append(proj)
        db.flush()

        quotation_count = 0
        purchase_count = 0
        approval_count = 0

        for proj in projects:
            if proj.status in [ProjectStatus.QUOTED, ProjectStatus.CONTRACTED,
                               ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED, ProjectStatus.CLOSED]:
                num_versions = randint(1, 3)
                for v in range(num_versions):
                    q = Quotation(
                        project_id=proj.id,
                        quotation_no=f"Q-{proj.project_no}-{v+1:02d}",
                        version=f"v{v+1}.0",
                        created_by=proj.designer_id,
                        is_approved=(v == num_versions - 1),
                    )
                    items = []
                    total = Decimal("0")
                    num_cats = randint(4, 8)
                    chosen_cats = list({choice(categories) for _ in range(num_cats)})[:num_cats]
                    for cat in chosen_cats:
                        cat_items = item_names.get(cat, ["材料项"])
                        chosen_items = list({choice(cat_items) for _ in range(randint(2, 5))})[:5]
                        for iname in chosen_items:
                            qty = Decimal(uniform(1.0, 80.0)).quantize(Decimal("0.0001"))
                            price = Decimal(uniform(20.0, 1500.0)).quantize(Decimal("0.01"))
                            subtotal = (qty * price).quantize(Decimal("0.01"))
                            total += subtotal
                            items.append(QuotationItem(
                                category=cat,
                                item_name=iname,
                                specification=f"{randint(10,200)}*{randint(10,200)}*{randint(1,20)}mm" if random() > 0.5 else "标准规格",
                                unit=choice(["㎡", "m", "件", "套", "个", "项"]),
                                quantity=qty,
                                unit_price=price,
                                subtotal=subtotal,
                            ))
                    q.total_amount = total
                    q.material_cost = (total * Decimal("0.55")).quantize(Decimal("0.01"))
                    q.labor_cost = (total * Decimal("0.30")).quantize(Decimal("0.01"))
                    q.management_fee = (total * Decimal("0.10")).quantize(Decimal("0.01"))
                    q.design_fee = (total * Decimal("0.05")).quantize(Decimal("0.01"))
                    q.discount_rate = Decimal(uniform(0, 0.08)).quantize(Decimal("0.0001"))
                    q.final_amount = (total * (1 - q.discount_rate)).quantize(Decimal("0.01"))
                    q.items = items
                    db.add(q)
                    quotation_count += 1

                if proj.status in [ProjectStatus.CONTRACTED, ProjectStatus.IN_PROGRESS,
                                   ProjectStatus.COMPLETED, ProjectStatus.CLOSED] and proj.contract_date:
                    contract_amt = q.final_amount * Decimal(uniform(0.95, 1.02))
                    c = Contract(
                        project_id=proj.id,
                        contract_no=f"C-{proj.project_no}",
                        contract_amount=contract_amt.quantize(Decimal("0.01")),
                        signed_date=proj.contract_date,
                        effective_date=proj.contract_date,
                        expiry_date=proj.contract_date + timedelta(days=365 + randint(0, 90)),
                        warranty_period=randint(12, 60),
                        payment_terms="按进度分5期支付：定金10%+开工款30%+进度款30%+竣工款20%+质保金10%",
                    )
                    num_att = randint(3, 9)
                    atts = []
                    chosen_types = list({choice(ATTACHMENT_TYPES) for _ in range(num_att)})[:num_att]
                    for att_type in chosen_types:
                        atts.append(ContractAttachment(
                            contract_id=0,
                            attachment_type=att_type,
                            file_name=f"{att_type}_{proj.project_no}_{randint(1,999)}.pdf",
                            file_path=f"/contracts/{proj.project_no}/{att_type}.pdf",
                            file_size=randint(10000, 5000000),
                            uploaded_by=choice(admins).id,
                        ))
                    c.attachment_count = len(atts)
                    c.attachments = atts
                    db.add(c)

                    for stage_idx, stage in enumerate(PAYMENT_STAGES):
                        pct = [0.1, 0.3, 0.3, 0.2, 0.1][stage_idx]
                        plan_amt = (c.contract_amount * Decimal(pct)).quantize(Decimal("0.01"))
                        offset_days = [0, 15, 50, 95, 420][stage_idx]
                        plan_date = c.signed_date + timedelta(days=offset_days)
                        actual_offset = offset_days + randint(-10, 30)
                        status_idx_project = list(ProjectStatus).index(proj.status)
                        actual = status_idx_project >= 3 and actual_offset <= 180
                        actual_date = (c.signed_date + timedelta(days=actual_offset)) if actual else None
                        actual_amt = plan_amt * Decimal(uniform(0.95, 1.0)) if actual else Decimal("0")
                        if actual_amt == 0:
                            pay_status = PaymentStatus.UNPAID
                        elif actual_amt < plan_amt * Decimal("0.99"):
                            pay_status = PaymentStatus.PARTIAL
                        else:
                            pay_status = PaymentStatus.FULL
                        db.add(Payment(
                            project_id=proj.id,
                            payment_no=f"PM-{proj.project_no}-{stage_idx+1:02d}",
                            stage=stage,
                            plan_amount=plan_amt,
                            actual_amount=actual_amt.quantize(Decimal("0.01")),
                            plan_date=plan_date,
                            actual_date=actual_date,
                            status=pay_status,
                            remark=f"第{stage_idx+1}期回款"
                        ))

            if proj.status in [ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED, ProjectStatus.CLOSED]:
                num_pos = randint(2, 7)
                for _ in range(num_pos):
                    po = PurchaseOrder(
                        project_id=proj.id,
                        po_no=f"PO-{proj.project_no}-{purchase_count+1:04d}",
                        supplier=choice(suppliers),
                        category=choice(categories),
                        order_date=proj.start_date + timedelta(days=randint(1, 90)) if proj.start_date else base_date,
                        delivery_date=proj.start_date + timedelta(days=randint(5, 105)) if proj.start_date else base_date,
                        status=choice(["已收货", "待收货", "已入库"]),
                        created_by=choice(supervisors).id,
                    )
                    items = []
                    total = Decimal("0")
                    num = randint(3, 8)
                    for _ in range(num):
                        cat = po.category
                        cat_items = item_names.get(cat, ["材料项"])
                        iname = choice(cat_items)
                        qty = Decimal(uniform(1.0, 50.0)).quantize(Decimal("0.0001"))
                        price = Decimal(uniform(20.0, 800.0)).quantize(Decimal("0.01"))
                        subtotal = (qty * price).quantize(Decimal("0.01"))
                        total += subtotal
                        items.append(PurchaseItem(
                            item_name=iname,
                            specification=f"规格{randint(1,20)}",
                            brand=choice(brands),
                            unit=choice(["㎡", "件", "套", "个"]),
                            quantity=qty,
                            unit_price=price,
                            subtotal=subtotal,
                            quotation_ref=f"报价单关联-{randint(1,100)}",
                        ))
                    po.total_amount = total
                    variance_rate = Decimal(uniform(-0.12, 0.08)).quantize(Decimal("0.0001"))
                    po.actual_amount = (total * (1 + variance_rate)).quantize(Decimal("0.01"))
                    po.items = items
                    db.add(po)
                    purchase_count += 1

                    num_approvals = randint(1, 4)
                    for _ in range(num_approvals):
                        submit_time = datetime.now() - timedelta(days=randint(0, 150), hours=randint(0, 23))
                        expected_hours = Decimal(uniform(8.0, 72.0)).quantize(Decimal("0.01"))
                        actual_hours = Decimal(uniform(4.0, 120.0)).quantize(Decimal("0.01"))
                        approve_delay = randint(-20, 200)
                        approve_time = submit_time + timedelta(hours=float(expected_hours) + approve_delay)
                        status_choice = random()
                        if status_choice < 0.75:
                            ap_status = ApprovalStatus.APPROVED
                        elif status_choice < 0.90:
                            ap_status = ApprovalStatus.PENDING
                            approve_time = None
                        else:
                            ap_status = ApprovalStatus.REJECTED

                        db.add(Approval(
                            project_id=proj.id,
                            approval_type=choice(APPROVAL_TYPES),
                            ref_no=po.po_no,
                            approver_id=choice(admins + supervisors).id,
                            status=ap_status,
                            submit_time=submit_time,
                            approve_time=approve_time,
                            expected_hours=expected_hours,
                            actual_hours=actual_hours,
                            created_at=submit_time,
                        ))
                        approval_count += 1

            for _ in range(randint(2, 12)):
                ptype = choice(["measure", "material", "progress", "quality", "acceptance"])
                shoot_time = datetime.now() - timedelta(days=randint(0, 180), hours=randint(6, 20))
                db.add(SitePhoto(
                    project_id=proj.id,
                    photo_type=ptype,
                    file_name=f"{proj.project_no}_{ptype}_{randint(1000, 9999)}.jpg",
                    file_path=f"/photos/{proj.project_no}/{ptype}_{randint(1000,9999)}.jpg",
                    thumbnail_path=f"/photos/thumbnails/thumb_{proj.project_no}_{randint(1000,9999)}.jpg",
                    file_size=randint(200000, 8000000),
                    shoot_time=shoot_time,
                    uploader_id=choice(supervisors).id,
                    description=f"工地{choice(['巡查', '验收', '材料进场', '施工过程', '量房'])}照片",
                    parsed_tags=[ptype],
                    uploaded_at=shoot_time + timedelta(hours=randint(1, 8)),
                ))

        log = RefreshLog(
            refresh_type="full_refresh",
            status="success",
            start_time=datetime.now() - timedelta(minutes=5),
            end_time=datetime.now() - timedelta(minutes=2),
            records_processed=project_qty + quotation_count + purchase_count + approval_count,
            triggered_by=admins[0].id if admins else None,
        )
        db.add(log)

        db.commit()
        print(f"✅ 演示数据填充完成！")
        print(f"   • 项目数: {project_qty}")
        print(f"   • 报价单数: {quotation_count}")
        print(f"   • 采购单数: {purchase_count}")
        print(f"   • 审批记录: {approval_count}")

    except Exception as e:
        db.rollback()
        print(f"❌ 数据填充失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
