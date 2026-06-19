import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import random

from app.database import SessionLocal, engine, Base
from app.models import (
    Vehicle, Quotation, RepairOrder, InspectionPhoto,
    StockTask, WarningThreshold, InsuranceMaterial, CashierTransaction,
    QuotationStatus, RepairOrderStatus, StockTaskStatus,
)


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Vehicle).count() > 0:
            print("数据库已有数据，跳过初始化")
            return

        brands = ["丰田", "本田", "大众", "奔驰", "宝马", "奥迪", "别克", "福特", "日产", "现代"]
        models = ["凯美瑞", "雅阁", "帕萨特", "C级", "3系", "A4L", "君越", "蒙迪欧", "天籁", "索纳塔"]
        colors = ["黑色", "白色", "银色", "灰色", "红色", "蓝色", "金色"]
        salespeople = ["张伟", "李娜", "王强", "刘洋", "陈静"]
        mechanics = ["赵师傅", "孙师傅", "周师傅", "吴师傅", "郑师傅"]
        parts_list = [
            {"code": "P001", "name": "前刹车片", "price": 380},
            {"code": "P002", "name": "机油滤清器", "price": 45},
            {"code": "P003", "name": "空气滤清器", "price": 68},
            {"code": "P004", "name": "火花塞(4支)", "price": 520},
            {"code": "P005", "name": "变速箱油", "price": 280},
            {"code": "P006", "name": "刹车油", "price": 120},
            {"code": "P007", "name": "前保险杠", "price": 1200},
            {"code": "P008", "name": "前大灯总成", "price": 2800},
            {"code": "P009", "name": "正时皮带", "price": 680},
            {"code": "P010", "name": "蓄电池", "price": 580},
            {"code": "P011", "name": "减震器", "price": 850},
            {"code": "P012", "name": "轮胎(条)", "price": 650},
        ]
        labor_list = [
            {"name": "常规保养工时", "price": 150},
            {"name": "刹车系统检修", "price": 200},
            {"name": "发动机大修", "price": 1500},
            {"name": "钣金喷漆", "price": 800},
            {"name": "变速箱维修", "price": 1200},
            {"name": "电路检测", "price": 180},
        ]
        insurance_companies = ["平安保险", "人保财险", "太平洋保险", "阳光保险", "大地保险"]
        fault_descriptions = [
            "制动异响，刹车抖动",
            "发动机怠速不稳，加速无力",
            "空调制冷效果差",
            "底盘异响，过颠簸路面明显",
            "车辆跑偏，方向盘不正",
            "电瓶亏电，启动困难",
            "变速箱换挡顿挫",
            "正常例行保养",
            "事故车修复，前杠损坏",
            "灯光不亮，电路故障",
        ]
        rework_reasons = [
            "配件质量问题，更换后仍有异响",
            "安装工艺问题，密封不严导致漏油",
            "故障诊断错误，未找到根本原因",
            "客户使用不当，涉水行驶导致二次故障",
            "配件不匹配，需重新订购",
        ]

        print("开始初始化数据...")

        vehicles = []
        for i in range(50):
            brand = random.choice(brands)
            model = random.choice(models)
            plate = f"京A{random.randint(10000, 99999)}"
            vehicle = Vehicle(
                plate_number=plate,
                vin=f"LFV2A21K{random.randint(10000000, 99999999)}",
                brand=brand,
                model=model,
                year=random.randint(2015, 2024),
                color=random.choice(colors),
                mileage=random.randint(5000, 150000),
                owner_name=f"车主{i+1:03d}",
                owner_phone=f"138{random.randint(10000000, 99999999)}",
                repair_count=0,
                total_amount=0,
                warning_level="normal",
            )
            db.add(vehicle)
            vehicles.append(vehicle)
        db.flush()
        print(f"✓ 创建了 {len(vehicles)} 条车辆档案")

        default_thresholds = [
            {"name": "车辆维修次数预警", "code": "repair_count_threshold", "description": "车辆累计维修次数达到此值时触发预警",
             "category": "vehicle", "min_value": 1, "max_value": 50, "current_value": 5, "unit": "次"},
            {"name": "车辆里程预警", "code": "mileage_threshold", "description": "车辆里程达到此值时触发保养预警",
             "category": "vehicle", "min_value": 1000, "max_value": 500000, "current_value": 100000, "unit": "公里"},
            {"name": "车辆消费金额预警", "code": "total_amount_threshold", "description": "车辆累计消费金额达到此值时触发预警",
             "category": "vehicle", "min_value": 1000, "max_value": 500000, "current_value": 20000, "unit": "元"},
            {"name": "返修率预警", "code": "rework_rate_threshold", "description": "返修率超过此值触发预警",
             "category": "quality", "min_value": 0, "max_value": 100, "current_value": 5, "unit": "%"},
            {"name": "配件缺货时长预警", "code": "stockout_days_threshold", "description": "配件缺货超过此天数触发预警",
             "category": "inventory", "min_value": 1, "max_value": 60, "current_value": 3, "unit": "天"},
        ]
        for t in default_thresholds:
            db.add(WarningThreshold(**t, updated_by="system"))
        db.flush()
        print(f"✓ 创建了 {len(default_thresholds)} 条预警阈值配置")

        quotations = []
        repair_orders = []
        for i in range(120):
            vehicle = random.choice(vehicles)
            created_at = datetime.now() - timedelta(days=random.randint(0, 89), hours=random.randint(0, 23))

            parts_count = random.randint(1, 5)
            selected_parts = random.sample(parts_list, parts_count)
            parts = []
            parts_amount = 0
            has_stockout = False
            stockout_parts = []
            for p in selected_parts:
                qty = random.randint(1, 3)
                price = p["price"]
                amount = price * qty
                parts_amount += amount
                is_out = random.random() < 0.15
                parts.append({
                    "code": p["code"],
                    "name": p["name"],
                    "qty": qty,
                    "price": price,
                    "amount": amount,
                    "out_of_stock": is_out,
                })
                if is_out:
                    has_stockout = True
                    stockout_parts.append({"code": p["code"], "name": p["name"], "qty": qty})

            labor_count = random.randint(1, 3)
            selected_labor = random.sample(labor_list, labor_count)
            labor_items = []
            labor_amount = 0
            for l in selected_labor:
                labor_items.append({
                    "name": l["name"],
                    "price": l["price"],
                    "amount": l["price"],
                })
                labor_amount += l["price"]

            discount = random.choice([0, 0, 0, 50, 100, 200])
            total_amount = parts_amount + labor_amount - discount
            insurance_covered = random.random() < 0.35

            status_weights = [0.05, 0.10, 0.15, 0.08, 0.62]
            statuses = [QuotationStatus.DRAFT, QuotationStatus.SUBMITTED, QuotationStatus.APPROVED,
                        QuotationStatus.REJECTED, QuotationStatus.CONVERTED]
            status = random.choices(statuses, weights=status_weights, k=1)[0]

            quotation = Quotation(
                quotation_no=f"QT{created_at.strftime('%Y%m%d')}{i+1:05d}",
                vehicle_id=vehicle.id,
                vehicle_plate=vehicle.plate_number,
                status=status,
                total_amount=total_amount,
                parts_amount=parts_amount,
                labor_amount=labor_amount,
                discount_amount=discount,
                insurance_covered=insurance_covered,
                insurance_claim_no=f"BX{created_at.strftime('%Y%m%d')}{random.randint(1000, 9999)}" if insurance_covered else None,
                parts=parts,
                labor_items=labor_items,
                created_by=random.choice(salespeople),
                salesperson=random.choice(salespeople),
                created_at=created_at,
                converted_at=created_at + timedelta(hours=random.randint(1, 48)) if status == QuotationStatus.CONVERTED else None,
            )
            db.add(quotation)
            quotations.append(quotation)

            if status == QuotationStatus.CONVERTED:
                is_rework = random.random() < 0.08
                order_created_at = quotation.created_at + timedelta(hours=random.randint(1, 24))
                mechanic = random.choice(mechanics)
                actual_amount = total_amount * random.uniform(0.95, 1.1)

                status_weights_ro = [0.05, 0.10, 0.10, 0.70, 0.05]
                statuses_ro = [RepairOrderStatus.PENDING, RepairOrderStatus.IN_PROGRESS,
                               RepairOrderStatus.QUALITY_CHECK, RepairOrderStatus.COMPLETED, RepairOrderStatus.REWORKED]
                order_status = random.choices(statuses_ro, weights=status_weights_ro, k=1)[0]
                if is_rework:
                    order_status = RepairOrderStatus.REWORKED

                start_time = order_created_at + timedelta(hours=random.randint(0, 2))
                end_time = start_time + timedelta(hours=random.randint(2, 72))
                qc_time = end_time + timedelta(minutes=random.randint(30, 120)) if order_status in [RepairOrderStatus.QUALITY_CHECK, RepairOrderStatus.COMPLETED, RepairOrderStatus.REWORKED] else None
                delivery_time = qc_time + timedelta(hours=random.randint(1, 6)) if order_status == RepairOrderStatus.COMPLETED else None

                order = RepairOrder(
                    order_no=f"RO{order_created_at.strftime('%Y%m%d')}{i+1:05d}",
                    quotation_id=quotation.id,
                    vehicle_id=vehicle.id,
                    vehicle_plate=vehicle.plate_number,
                    status=order_status,
                    is_rework=is_rework,
                    rework_reason=random.choice(rework_reasons) if is_rework else None,
                    total_amount=total_amount,
                    actual_amount=round(actual_amount, 2),
                    mechanic=mechanic,
                    quality_inspector=random.choice(["质检员A", "质检员B", "质检员C"]) if order_status in [RepairOrderStatus.QUALITY_CHECK, RepairOrderStatus.COMPLETED, RepairOrderStatus.REWORKED] else None,
                    fault_description=random.choice(fault_descriptions),
                    repair_content=f"已完成{random.choice(fault_descriptions)}的维修工作",
                    has_stockout=has_stockout,
                    stockout_parts=stockout_parts,
                    start_time=start_time,
                    end_time=end_time,
                    quality_check_time=qc_time,
                    delivery_time=delivery_time,
                    cashier_no=f"CX{order_created_at.strftime('%Y%m%d')}{random.randint(1000, 9999)}" if delivery_time else None,
                    cashier_amount=round(actual_amount, 2) if delivery_time else 0,
                    cashier_time=delivery_time,
                    created_at=order_created_at,
                )
                db.add(order)
                repair_orders.append(order)

                vehicle.repair_count += 1
                vehicle.total_amount += round(actual_amount, 2)
                vehicle.last_repair_date = order_created_at.date()

                if order_status == RepairOrderStatus.COMPLETED and delivery_time:
                    cashier = CashierTransaction(
                        transaction_no=f"CX{delivery_time.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                        repair_order_id=order.id,
                        order_no=order.order_no,
                        vehicle_plate=vehicle.plate_number,
                        total_amount=total_amount,
                        paid_amount=round(actual_amount, 2),
                        discount_amount=discount,
                        payment_method=random.choice(["微信", "支付宝", "银行卡", "现金", "保险理赔"]),
                        insurance_paid=round(actual_amount * 0.7, 2) if insurance_covered else 0,
                        self_paid=round(actual_amount * (0.3 if insurance_covered else 1), 2),
                        cashier=random.choice(["收银员1", "收银员2", "收银员3"]),
                        transaction_time=delivery_time,
                    )
                    db.add(cashier)

                if has_stockout and stockout_parts:
                    for idx, sp in enumerate(stockout_parts):
                        task_status = random.choice([StockTaskStatus.OPEN, StockTaskStatus.IN_PROGRESS, StockTaskStatus.RESOLVED])
                        task = StockTask(
                            task_no=f"STK{order.id}{idx:03d}",
                            repair_order_id=order.id,
                            order_no=order.order_no,
                            part_code=sp["code"],
                            part_name=sp["name"],
                            required_qty=sp.get("qty", 1),
                            status=task_status,
                            priority=random.choice(["normal", "high", "urgent"]),
                            notes="维修过程中发现缺货，需紧急采购",
                            resolution="已从同城调配，次日可达" if task_status == StockTaskStatus.RESOLVED else None,
                            resolved_by=random.choice(["采购员1", "采购员2"]) if task_status == StockTaskStatus.RESOLVED else None,
                            resolved_at=order_created_at + timedelta(days=random.randint(1, 3)) if task_status == StockTaskStatus.RESOLVED else None,
                            assigned_to=random.choice(["采购员1", "采购员2", "库管"]),
                            created_by="system",
                            created_at=order_created_at,
                        )
                        db.add(task)

        db.flush()
        print(f"✓ 创建了 {len(quotations)} 条报价单")
        print(f"✓ 创建了 {len(repair_orders)} 条维修工单")

        sample_photos = [
            ("damage", "车辆左前部受损照片"),
            ("damage", "右前大灯破损照片"),
            ("engine", "发动机舱整体照片"),
            ("engine", "机油液位检测照片"),
            ("undercarriage", "底盘检测照片"),
            ("undercarriage", "悬挂系统照片"),
            ("brake", "刹车片磨损照片"),
            ("brake", "刹车盘磨损照片"),
            ("interior", "内饰检测照片"),
            ("electrical", "电路检测照片"),
        ]

        photo_count = 0
        for order in repair_orders:
            num_photos = random.randint(2, 6)
            selected_photos = random.sample(sample_photos, min(num_photos, len(sample_photos)))
            for photo_type, desc in selected_photos:
                is_issue = random.random() < 0.2
                photo = InspectionPhoto(
                    repair_order_id=order.id,
                    quotation_id=order.quotation_id,
                    photo_type=photo_type,
                    photo_url=f"https://picsum.photos/seed/photo{photo_count}/800/600",
                    thumbnail_url=f"https://picsum.photos/seed/photo{photo_count}/200/150",
                    description=desc,
                    uploader=random.choice(mechanics),
                    is_quality_issue=is_issue,
                    issue_notes=random.choice(["轻微磨损，建议更换", "存在渗漏，需检修", None, None, None]) if is_issue else None,
                    created_at=order.created_at + timedelta(minutes=random.randint(5, 60)),
                )
                db.add(photo)
                photo_count += 1
        print(f"✓ 创建了 {photo_count} 条质检照片")

        insurance_count = 0
        for q in quotations:
            if q.insurance_covered and q.status in [QuotationStatus.APPROVED, QuotationStatus.CONVERTED]:
                mat = InsuranceMaterial(
                    claim_no=q.insurance_claim_no or f"INS{q.id:06d}",
                    quotation_id=q.id,
                    insurance_company=random.choice(insurance_companies),
                    policy_no=f"POL{random.randint(100000, 999999)}",
                    claim_type=random.choice(["车损险", "交强险", "第三者责任险", "综合险"]),
                    coverage_amount=q.total_amount,
                    approved_amount=round(q.total_amount * random.uniform(0.7, 1.0), 2),
                    materials=q.parts,
                    review_status=random.choice(["pending", "approved", "approved", "approved", "rejected"]),
                    reviewer=random.choice(["保险审核员1", "保险审核员2"]),
                    created_at=q.created_at + timedelta(hours=random.randint(1, 12)),
                )
                db.add(mat)
                insurance_count += 1
        print(f"✓ 创建了 {insurance_count} 条保险材料")

        for v in vehicles:
            if v.repair_count >= 5:
                v.warning_level = "danger"
            elif v.repair_count >= 3:
                v.warning_level = "warning"

        db.commit()
        print("\n数据初始化完成！")

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
