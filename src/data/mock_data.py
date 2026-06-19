import random
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

import polars as pl
import numpy as np


random.seed(42)
np.random.seed(42)


def _random_date(start: date, end: date) -> date:
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))


def _random_datetime(start: datetime, end: datetime) -> datetime:
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


BRANDS = ["大众", "丰田", "本田", "宝马", "奔驰", "奥迪", "日产", "福特", "别克", "雪佛兰"]
MODELS = {
    "大众": ["朗逸", "帕萨特", "途观L", "迈腾", "速腾"],
    "丰田": ["卡罗拉", "凯美瑞", "RAV4", "汉兰达", "雷凌"],
    "本田": ["雅阁", "思域", "CR-V", "飞度", "皓影"],
    "宝马": ["3系", "5系", "X3", "X5", "1系"],
    "奔驰": ["C级", "E级", "GLC", "GLE", "A级"],
    "奥迪": ["A4L", "A6L", "Q5L", "Q3", "A3L"],
    "日产": ["轩逸", "天籁", "奇骏", "逍客", "骐达"],
    "福特": ["福克斯", "蒙迪欧", "翼虎", "锐界", "福睿斯"],
    "别克": ["英朗", "君威", "君越", "昂科威", "威朗"],
    "雪佛兰": ["科鲁泽", "迈锐宝", "探界者", "科沃兹", "创酷"],
}
COLORS = ["黑色", "白色", "银色", "灰色", "红色", "蓝色", "棕色", "金色"]
CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "重庆", "苏州"]
CUSTOMER_TYPES = ["个人", "企业", "网约车", "出租车"]
INSURANCE_COMPANIES = ["人保", "平安", "太平洋", "国寿财", "大地", "阳光", "中华联合"]
MAINTENANCE_TYPES = ["常规保养", "大保养", "小保养", "首保", "换季保养"]
SERVICE_TYPES = ["保养", "维修", "钣金喷漆", "轮胎服务", "空调服务", "电路维修", "发动机维修"]
WORK_ORDER_STATUS = ["已完成", "进行中", "待配件", "已取消", "已结算"]
PAYMENT_METHODS = ["现金", "微信", "支付宝", "银行卡", "挂账", "保险理赔"]
DIAGNOSIS_RESULTS = ["正常", "建议保养", "需要维修", "存在隐患", "需更换配件"]
PARTS_CATEGORIES = ["机油", "机滤", "空滤", "空调滤", "火花塞", "刹车片", "刹车盘", "轮胎", "雨刮", "电瓶", "冷却液", "变速箱油"]


def generate_vehicles(n: int = 200) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()

    for i in range(1, n + 1):
        brand = random.choice(BRANDS)
        model = random.choice(MODELS[brand])
        plate_city = random.choice(["京", "沪", "粤", "浙", "苏", "川", "鄂"])
        plate_num = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ0123456789", k=5))

        purchase_date = _random_date(date(2018, 1, 1), date(2024, 12, 31))
        age_years = (today - purchase_date).days / 365.25
        mileage = int(age_years * random.randint(8000, 25000))

        data.append({
            "vehicle_id": f"V{i:06d}",
            "plate_number": f"{plate_city}A{plate_num}",
            "vin": f"LHG{''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', k=14))}",
            "brand": brand,
            "model": model,
            "year": random.randint(2018, 2024),
            "color": random.choice(COLORS),
            "displacement": random.choice([1.5, 1.6, 1.8, 2.0, 2.0, 2.5, 3.0]),
            "purchase_date": purchase_date,
            "current_mileage": mileage,
            "customer_name": f"客户{i:04d}",
            "customer_phone": f"1{random.choice(['3','5','7','8','9'])}{''.join(random.choices('0123456789', k=9))}",
            "customer_type": random.choice(CUSTOMER_TYPES),
            "city": random.choice(CITIES),
            "insurance_company": random.choice(INSURANCE_COMPANIES),
            "insurance_expire_date": _random_date(today, today + timedelta(days=365)),
            "last_maintenance_date": _random_date(today - timedelta(days=180), today),
            "register_date": purchase_date,
        })

    return pl.DataFrame(data)


def generate_cash_transactions(n: int = 800) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()
    start_date = today - timedelta(days=365 * 2)

    for i in range(1, n + 1):
        work_order_id = f"WO{random.randint(1, 600):06d}"
        txn_date = _random_datetime(
            datetime.combine(start_date, datetime.min.time()),
            datetime.combine(today, datetime.max.time()),
        )
        amount = round(random.uniform(200, 8000), 2)
        discount = round(random.uniform(0, amount * 0.15), 2)
        actual_amount = round(amount - discount, 2)

        data.append({
            "transaction_id": f"TXN{i:07d}",
            "work_order_id": work_order_id,
            "transaction_date": txn_date,
            "transaction_type": random.choice(["收款", "退款", "预收款", "挂账"]),
            "total_amount": amount,
            "discount_amount": discount,
            "actual_amount": actual_amount,
            "payment_method": random.choice(PAYMENT_METHODS),
            "insurance_claim_amount": round(random.uniform(0, actual_amount * 0.6), 2) if random.random() < 0.3 else 0,
            "cashier": f"收银员{random.randint(1, 10):02d}",
            "remark": random.choice(["", "会员优惠", "活动折扣", "老客户折扣", "保险理赔"]) if random.random() < 0.4 else "",
            "is_settled": random.random() < 0.9,
            "source_version": f"v{random.randint(1, 3)}.{random.randint(0, 9)}",
        })

    return pl.DataFrame(data).sort("transaction_date")


def generate_work_orders(n: int = 600) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()
    start_date = today - timedelta(days=365 * 2)

    for i in range(1, n + 1):
        vehicle_id = f"V{random.randint(1, 200):06d}"
        create_date = _random_datetime(
            datetime.combine(start_date, datetime.min.time()),
            datetime.combine(today, datetime.max.time()),
        )
        status = random.choice(WORK_ORDER_STATUS)
        labor_hours = round(random.uniform(0.5, 8.0), 1)
        labor_cost = labor_hours * random.uniform(80, 200)
        parts_cost = round(random.uniform(100, 5000), 2)
        total_amount = round(labor_cost + parts_cost, 2)

        data.append({
            "work_order_id": f"WO{i:06d}",
            "vehicle_id": vehicle_id,
            "order_date": create_date.date(),
            "create_time": create_date,
            "service_type": random.choice(SERVICE_TYPES),
            "maintenance_type": random.choice(MAINTENANCE_TYPES) if random.random() < 0.6 else None,
            "status": status,
            "mileage_in": random.randint(5000, 150000),
            "labor_hours": labor_hours,
            "labor_cost": round(labor_cost, 2),
            "parts_cost": parts_cost,
            "total_amount": total_amount,
            "customer_complaint": random.choice([
                "常规保养", "发动机异响", "刹车抖动", "空调不制冷", "保养提醒",
                "更换轮胎", "钣金修复", "电瓶亏电", "漏油检查", "正常检测"
            ]),
            "technician": f"技师{random.randint(1, 20):02d}",
            "service_advisor": f"SA{random.randint(1, 15):02d}",
            "complete_time": create_date + timedelta(hours=random.randint(1, 72)) if status == "已完成" else None,
            "is_warranty": random.random() < 0.1,
            "is_insurance_claim": random.random() < 0.25,
            "current_version": f"v{random.randint(1, 3)}.{random.randint(0, 9)}",
            "remark": "",
        })

    return pl.DataFrame(data).sort("create_time")


def generate_work_order_items(n: int = 2500) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []

    for i in range(1, n + 1):
        work_order_id = f"WO{random.randint(1, 600):06d}"
        is_part = random.random() < 0.65
        category = random.choice(PARTS_CATEGORIES) if is_part else random.choice([
            "工时费-小修", "工时费-保养", "工时费-大修", "工时费-检测", "工时费-钣金"
        ])
        unit_price = round(random.uniform(30, 800), 2)
        quantity = random.randint(1, 4) if is_part else round(random.uniform(0.5, 4.0), 1)
        subtotal = round(unit_price * quantity, 2)

        data.append({
            "item_id": f"ITEM{i:07d}",
            "work_order_id": work_order_id,
            "item_type": "配件" if is_part else "工时",
            "item_name": category,
            "item_code": f"{'P' if is_part else 'L'}{random.randint(1000, 99999)}",
            "category": category,
            "unit_price": unit_price,
            "quantity": quantity,
            "subtotal": subtotal,
            "discount": round(random.uniform(0, subtotal * 0.1), 2) if random.random() < 0.3 else 0,
            "is_warranty": random.random() < 0.05,
            "source_inventory_id": f"INV{random.randint(1, 150):05d}" if is_part else None,
        })

    return pl.DataFrame(data)


def generate_work_order_versions(n: int = 1200) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    base_orders = list(range(1, 601))

    for wo_id in base_orders:
        version_count = random.randint(1, 3)
        work_order_id = f"WO{wo_id:06d}"
        for v in range(1, version_count + 1):
            data.append({
                "version_id": f"VER{len(data) + 1:07d}",
                "work_order_id": work_order_id,
                "version_number": f"v{v}.0",
                "change_type": random.choice(["创建", "修改项目", "调整价格", "添加配件", "状态变更"]),
                "parts_cost_before": round(random.uniform(0, 5000), 2) if v > 1 else 0,
                "parts_cost_after": round(random.uniform(100, 5000), 2),
                "labor_cost_before": round(random.uniform(0, 2000), 2) if v > 1 else 0,
                "labor_cost_after": round(random.uniform(100, 2000), 2),
                "total_before": 0 if v == 1 else round(random.uniform(200, 7000), 2),
                "total_after": round(random.uniform(200, 8000), 2),
                "modified_by": f"用户{random.randint(1, 30):02d}",
                "modify_time": _random_datetime(
                    datetime(2024, 1, 1),
                    datetime.now(),
                ),
                "change_note": random.choice([
                    "", "客户要求增加项目", "调整配件价格", "更换配件品牌",
                    "补充检测项目", "修正工时", "保险理赔调整"
                ]),
            })

    return pl.DataFrame(data).sort(["work_order_id", "modify_time"])


def generate_parts_inventory(n: int = 150) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []

    for i in range(1, n + 1):
        category = random.choice(PARTS_CATEGORIES)
        stock_qty = random.randint(0, 100)
        safety_stock = random.randint(5, 20)

        data.append({
            "inventory_id": f"INV{i:05d}",
            "part_id": f"P{i:05d}",
            "part_name": category,
            "part_code": f"SKU{random.randint(10000, 99999)}",
            "brand": random.choice(BRANDS),
            "category": category,
            "spec": random.choice(["标准", "加强版", "原厂", "副厂", "OEM"]),
            "unit": random.choice(["个", "瓶", "套", "条", "片", "盒"]),
            "unit_cost": round(random.uniform(20, 600), 2),
            "selling_price": round(random.uniform(50, 1000), 2),
            "stock_quantity": stock_qty,
            "safety_stock": safety_stock,
            "is_out_of_stock": stock_qty == 0,
            "is_below_safety": stock_qty < safety_stock,
            "location": f"货架{random.choice(['A','B','C','D'])}-{random.randint(1, 10):02d}",
            "supplier": f"供应商{random.randint(1, 20):02d}",
            "last_purchase_date": _random_date(date.today() - timedelta(days=180), date.today()),
            "original_record_id": f"PO{random.randint(1000, 9999)}",
        })

    return pl.DataFrame(data)


def generate_parts_inventory_history(n: int = 2000) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()
    start_date = today - timedelta(days=365 * 2)

    for i in range(1, n + 1):
        inventory_id = f"INV{random.randint(1, 150):05d}"
        change_type = random.choice(["入库", "出库", "盘点调整", "退货", "报损"])
        qty = random.randint(1, 30)
        if change_type in ["出库", "报损", "退货"]:
            qty = -qty

        data.append({
            "history_id": f"HIST{i:07d}",
            "inventory_id": inventory_id,
            "change_date": _random_datetime(
                datetime.combine(start_date, datetime.min.time()),
                datetime.combine(today, datetime.max.time()),
            ),
            "change_type": change_type,
            "quantity_change": qty,
            "quantity_before": random.randint(0, 80),
            "quantity_after": random.randint(0, 100),
            "related_order_id": f"WO{random.randint(1, 600):06d}" if change_type == "出库" else (
                f"PO{random.randint(1000, 9999)}" if change_type == "入库" else None
            ),
            "operator": f"仓管{random.randint(1, 10):02d}",
            "remark": "",
            "original_source": random.choice(["采购系统", "工单系统", "盘点系统"]),
            "original_record_ref": f"REF{i:06d}",
            "sample_record_id": f"SMP{1000 + i}" if random.random() < 0.4 else None,
        })

    return pl.DataFrame(data).sort("change_date")


def generate_insurance_docs(n: int = 300) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()

    for i in range(1, n + 1):
        work_order_id = f"WO{random.randint(1, 600):06d}"
        insurance_amount = round(random.uniform(500, 10000), 2)
        workshop_amount = round(insurance_amount * random.uniform(0.8, 1.1), 2)

        data.append({
            "doc_id": f"INS{i:06d}",
            "work_order_id": work_order_id,
            "insurance_company": random.choice(INSURANCE_COMPANIES),
            "claim_number": f"CLM{random.randint(100000, 999999)}",
            "report_date": _random_date(today - timedelta(days=365), today),
            "insurance_amount": insurance_amount,
            "workshop_amount": workshop_amount,
            "amount_diff": round(workshop_amount - insurance_amount, 2),
            "has_diff": abs(workshop_amount - insurance_amount) > 50,
            "parts_count_insurance": random.randint(1, 10),
            "parts_count_workshop": random.randint(1, 12),
            "labor_hours_insurance": round(random.uniform(1, 8), 1),
            "labor_hours_workshop": round(random.uniform(1, 8), 1),
            "status": random.choice(["已赔付", "审核中", "待提交", "有异议", "已拒绝"]),
            "reviewer": f"核赔{random.randint(1, 15):02d}",
            "remark": random.choice(["", "金额有差异", "配件清单不一致", "工时差异", "需补充材料"]) if random.random() < 0.4 else "",
        })

    return pl.DataFrame(data).sort("report_date")


def generate_diagnosis_results(n: int = 500) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()

    for i in range(1, n + 1):
        work_order_id = f"WO{random.randint(1, 600):06d}"
        items = random.choice([1, 2, 3, 4])

        for j in range(items):
            data.append({
                "diagnosis_id": f"DIAG{i:05d}-{j}",
                "work_order_id": work_order_id,
                "diagnosis_date": _random_date(today - timedelta(days=365 * 2), today),
                "diagnosis_item": random.choice([
                    "发动机系统", "制动系统", "转向系统", "悬挂系统", "电气系统",
                    "空调系统", "冷却系统", "润滑系统", "燃油系统", "传动系统",
                    "轮胎检查", "电瓶检测", "刹车片检查", "机油检查"
                ]),
                "diagnosis_result": random.choice(DIAGNOSIS_RESULTS),
                "severity": random.choice(["轻微", "一般", "严重", "紧急"]),
                "suggestion": random.choice([
                    "建议更换", "建议保养", "建议清洗", "建议维修", "继续观察", "需立即处理"
                ]),
                "estimated_cost": round(random.uniform(0, 3000), 2),
                "diagnostician": f"技师{random.randint(1, 20):02d}",
                "linked_work_item": random.choice(["", f"ITEM{random.randint(1, 2500):07d}"]) if random.random() < 0.6 else "",
            })

    return pl.DataFrame(data).sort("diagnosis_date")


def generate_maintenance_reminders(n: int = 400) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()

    for i in range(1, n + 1):
        vehicle_id = f"V{random.randint(1, 200):06d}"
        reminder_type = random.choice(MAINTENANCE_TYPES)
        due_date = _random_date(today - timedelta(days=30), today + timedelta(days=90))
        status = "已过期" if due_date < today else (
            "即将到期" if (due_date - today).days < 15 else "未到期"
        )

        data.append({
            "reminder_id": f"REM{i:06d}",
            "vehicle_id": vehicle_id,
            "reminder_type": reminder_type,
            "reminder_date": _random_date(today - timedelta(days=60), today),
            "due_date": due_date,
            "due_mileage": random.randint(5000, 150000),
            "current_mileage": random.randint(5000, 150000),
            "status": status,
            "priority": random.choice(["高", "中", "低"]),
            "notification_count": random.randint(0, 5),
            "last_notification_date": _random_date(today - timedelta(days=30), today) if random.random() < 0.7 else None,
            "customer_response": random.choice(["已预约", "已到店", "未响应", "推迟"]),
            "linked_work_order": f"WO{random.randint(1, 600):06d}" if random.random() < 0.4 else None,
            "remark": "",
        })

    return pl.DataFrame(data).sort("reminder_date")


def generate_rework_records(n: int = 120) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()

    for i in range(1, n + 1):
        original_wo = f"WO{random.randint(1, 600):06d}"
        rework_date = _random_date(today - timedelta(days=365), today)
        rework_reason = random.choice([
            "配件质量问题", "安装不当", "诊断错误", "工艺问题", "客户原因",
            "配件型号不符", "漏项维修", "密封不严", "调试不到位"
        ])

        data.append({
            "rework_id": f"RW{i:05d}",
            "work_order_id": original_wo,
            "rework_order_id": f"RW{random.randint(601, 900):06d}",
            "rework_date": rework_date,
            "original_complete_date": rework_date - timedelta(days=random.randint(1, 45)),
            "rework_reason": rework_reason,
            "rework_category": random.choice(["质量返修", "责任返修", "客户返修"]),
            "rework_items": random.choice([
                "重新更换机油", "更换配件", "重新安装", "补充维修项目",
                "重新调试", "更换其他型号配件"
            ]),
            "responsible_person": f"技师{random.randint(1, 20):02d}",
            "rework_cost": round(random.uniform(100, 3000), 2),
            "parts_cost": round(random.uniform(0, 2500), 2),
            "labor_cost": round(random.uniform(50, 1000), 2),
            "is_covered_under_warranty": random.random() < 0.7,
            "customer_compensation": round(random.uniform(0, 500), 2) if random.random() < 0.3 else 0,
            "resolution": random.choice(["已解决", "待观察", "客户接受", "仍有问题"]),
            "remark": "",
        })

    return pl.DataFrame(data).sort("rework_date")


def generate_parts_shortage(n: int = 80, inventory_history: Optional[pl.DataFrame] = None) -> pl.DataFrame:
    data: List[Dict[str, Any]] = []
    today = date.today()

    valid_original_refs = []
    valid_sample_ids = {}
    existing_sample_ids = set()
    used_sample_ids = set()
    if inventory_history is not None and not inventory_history.is_empty():
        history_with_sample = inventory_history.filter(pl.col("sample_record_id").is_not_null())
        valid_original_refs = inventory_history["original_record_ref"].to_list()
        if not history_with_sample.is_empty():
            for row in history_with_sample.to_dicts():
                valid_sample_ids[row["sample_record_id"]] = row["original_record_ref"]
                existing_sample_ids.add(row["sample_record_id"])

    def _generate_unique_sample_id() -> str:
        while True:
            candidate = f"SMP{random.randint(1000, 9999)}"
            if candidate not in existing_sample_ids and candidate not in used_sample_ids:
                used_sample_ids.add(candidate)
                return candidate

    for i in range(1, n + 1):
        part_id = f"P{random.randint(1, 150):05d}"
        needed_qty = random.randint(2, 20)
        stock_qty = random.randint(0, needed_qty - 1)

        source_ref = None
        sample_id = None

        if valid_sample_ids and random.random() < 0.8:
            available_samples = [(s, r) for s, r in valid_sample_ids.items() if s not in used_sample_ids]
            if available_samples:
                sample_id, orig_ref = random.choice(available_samples)
                used_sample_ids.add(sample_id)
                source_ref = orig_ref
            elif valid_original_refs:
                source_ref = random.choice(valid_original_refs)
                sample_id = _generate_unique_sample_id()
            else:
                source_ref = f"REF{random.randint(1, 2000):06d}"
                sample_id = _generate_unique_sample_id()
        elif valid_original_refs and random.random() < 0.5:
            source_ref = random.choice(valid_original_refs)
            sample_id = _generate_unique_sample_id()
        else:
            source_ref = f"REF{random.randint(1, 2000):06d}"
            sample_id = _generate_unique_sample_id()

        data.append({
            "shortage_id": f"SH{i:05d}",
            "part_id": part_id,
            "part_name": random.choice(PARTS_CATEGORIES),
            "report_date": _random_date(today - timedelta(days=180), today),
            "requested_work_order": f"WO{random.randint(1, 600):06d}",
            "needed_quantity": needed_qty,
            "stock_quantity": stock_qty,
            "shortage_quantity": needed_qty - stock_qty,
            "urgency": random.choice(["紧急", "高", "中", "低"]),
            "status": random.choice(["待补货", "已补货", "已替代", "客户取消", "在途"]),
            "estimated_arrival_date": _random_date(today, today + timedelta(days=30)) if random.random() < 0.6 else None,
            "supplier": f"供应商{random.randint(1, 20):02d}",
            "sample_record_id": sample_id,
            "source_record_ref": source_ref,
            "remark": "",
        })

    return pl.DataFrame(data).sort("report_date")
