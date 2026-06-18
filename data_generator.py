import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import polars as pl

from config import REGIONS, ATTACHMENT_CATEGORIES, RISK_LEVELS

CUSTOMER_NAMES = [
    "张伟", "王芳", "李娜", "刘洋", "陈静", "杨帆", "赵磊", "黄敏",
    "周杰", "吴丽", "徐强", "孙燕", "马超", "朱琳", "郭峰", "何婷",
]

PROJECT_NAMES = [
    "阳光花园A座", "碧水湾小区", "锦绣家园", "幸福里", "绿城公寓",
    "金色年华", "江景豪庭", "学府壹号", "中央公园", "万象城",
    "滨湖天地", "紫金东郡", "保利香槟", "万科城", "碧桂园",
]

STREET_NAMES = [
    "中山路", "人民路", "解放路", "建设路", "和平路",
    "长江路", "黄河路", "珠江路", "松花江路", "闽江路",
]

MATERIAL_NAMES = [
    "实木地板", "瓷砖", "乳胶漆", "石膏板", "电线电缆",
    "水管管件", "开关插座", "卫生洁具", "橱柜门板", "五金配件",
    "大理石台面", "铝合金门窗", "防水材料", "腻子粉", "墙纸",
]

SUPPLIER_NAMES = [
    "华东建材有限公司", "万家装饰材料", "顺达五金供应", "恒通卫浴",
    "金盾电缆", "绿源木业", "华润涂料", "东鹏陶瓷", "科勒卫浴",
    "西门子电气", "飞利浦照明", "海尔智能家居", "美的厨卫", "欧派橱柜",
]

PAYMENT_METHODS = ["银行转账", "支付宝", "微信支付", "现金", "刷卡"]
PAYMENT_STATUS = ["已到账", "处理中", "待确认", "已退款"]
ORDER_STATUS = ["已发货", "待发货", "已签收", "部分发货", "已取消"]
DESIGN_VERSIONS = ["v1.0", "v1.1", "v1.2", "v2.0", "v2.1", "v3.0"]
CONFIRMATION_STATUS = ["待确认", "已确认", "已拒绝", "需修改"]


def _random_id() -> str:
    return str(uuid.uuid4())[:8]


def _random_date(start_days: int = 90, end_days: int = 0) -> datetime:
    now = datetime.now()
    days = random.randint(end_days, start_days)
    return now - timedelta(days=days, hours=random.randint(0, 23), minutes=random.randint(0, 59))


def _random_missing(probability: float = 0.15) -> bool:
    return random.random() < probability


def generate_projects(n: int = 30) -> List[Dict[str, Any]]:
    projects = []
    for i in range(n):
        project_id = f"PRJ{_random_id().upper()}"
        projects.append({
            "project_id": project_id,
            "project_name": random.choice(PROJECT_NAMES) + f"-{random.randint(101, 999)}",
            "region": random.choice(REGIONS),
            "customer_id": f"CUS{_random_id().upper()}",
            "customer_name": random.choice(CUSTOMER_NAMES),
            "address": f"{random.choice(STREET_NAMES)}{random.randint(1, 999)}号",
        })
    return projects


def generate_design_exports(n: int = 50, projects: Optional[List[Dict]] = None) -> pl.DataFrame:
    if projects is None:
        projects = generate_projects(max(n // 2, 10))

    rows = []
    for _ in range(n):
        proj = random.choice(projects)
        export_time = _random_date(60)
        row = {
            "id": _random_id(),
            "project_id": proj["project_id"],
            "project_name": proj["project_name"],
            "region": proj["region"],
            "customer_id": proj["customer_id"],
            "customer_name": proj["customer_name"],
            "design_version": random.choice(DESIGN_VERSIONS),
            "export_time": export_time,
            "file_path": f"/designs/{proj['project_id']}/{_random_id()}.dwg",
            "file_size": random.randint(100_000, 10_000_000),
            "confirmation_status": random.choice(CONFIRMATION_STATUS),
            "confirmed_by": random.choice(CUSTOMER_NAMES) if random.random() > 0.4 else None,
            "confirmed_at": export_time + timedelta(days=random.randint(0, 7)) if random.random() > 0.4 else None,
        }

        if _random_missing(0.12):
            missing_fields = random.sample(
                ["design_version", "export_time", "file_path", "customer_id"],
                k=random.randint(1, 2),
            )
            for f in missing_fields:
                if f in row and random.random() > 0.3:
                    row[f] = None

        rows.append(row)
    return pl.DataFrame(rows)


def generate_payment_records(n: int = 60, projects: Optional[List[Dict]] = None) -> pl.DataFrame:
    if projects is None:
        projects = generate_projects(max(n // 2, 10))

    rows = []
    for _ in range(n):
        proj = random.choice(projects)
        payment_time = _random_date(60)
        row = {
            "id": _random_id(),
            "project_id": proj["project_id"],
            "project_name": proj["project_name"],
            "region": proj["region"],
            "customer_id": proj["customer_id"],
            "customer_name": proj["customer_name"],
            "payment_amount": round(random.uniform(5_000, 500_000), 2),
            "payment_time": payment_time,
            "payment_method": random.choice(PAYMENT_METHODS),
            "payment_status": random.choice(PAYMENT_STATUS),
        }

        if _random_missing(0.1):
            missing_fields = random.sample(
                ["payment_amount", "payment_time", "payment_method"],
                k=random.randint(1, 2),
            )
            for f in missing_fields:
                if f in row and random.random() > 0.3:
                    row[f] = None

        rows.append(row)
    return pl.DataFrame(rows)


def generate_purchase_orders(n: int = 70, projects: Optional[List[Dict]] = None) -> pl.DataFrame:
    if projects is None:
        projects = generate_projects(max(n // 2, 10))

    rows = []
    for _ in range(n):
        proj = random.choice(projects)
        order_time = _random_date(60)
        row = {
            "id": _random_id(),
            "project_id": proj["project_id"],
            "project_name": proj["project_name"],
            "region": proj["region"],
            "supplier_name": random.choice(SUPPLIER_NAMES),
            "material_name": random.choice(MATERIAL_NAMES),
            "order_amount": round(random.uniform(2_000, 200_000), 2),
            "order_time": order_time,
            "order_status": random.choice(ORDER_STATUS),
        }

        if _random_missing(0.08):
            missing_fields = random.sample(
                ["supplier_name", "material_name", "order_amount", "order_time"],
                k=random.randint(1, 2),
            )
            for f in missing_fields:
                if f in row and random.random() > 0.3:
                    row[f] = None

        rows.append(row)
    return pl.DataFrame(rows)


def generate_attachments(n: int = 100, projects: Optional[List[Dict]] = None) -> pl.DataFrame:
    if projects is None:
        projects = generate_projects(max(n // 3, 15))

    rows = []
    for _ in range(n):
        proj = random.choice(projects)
        category = random.choice(ATTACHMENT_CATEGORIES)
        upload_time = _random_date(60)
        row = {
            "id": _random_id(),
            "project_id": proj["project_id"],
            "category": category,
            "file_name": f"{category}_{proj['project_id']}_{random.randint(1, 99)}.pdf",
            "file_path": f"/attachments/{proj['project_id']}/{_random_id()}.pdf",
            "file_size": random.randint(50_000, 20_000_000),
            "upload_time": upload_time,
            "uploaded_by": random.choice(CUSTOMER_NAMES),
            "tags": ",".join(random.sample(
                ["重要", "紧急", "已审核", "待审核", "客户提供", "系统生成"],
                k=random.randint(0, 3),
            )) or None,
            "is_valid": random.random() > 0.05,
        }
        rows.append(row)
    return pl.DataFrame(rows)


def generate_change_timeline(n: int = 50, projects: Optional[List[Dict]] = None) -> pl.DataFrame:
    if projects is None:
        projects = generate_projects(max(n // 2, 15))

    change_types = [
        "设计变更", "金额调整", "工期变更", "材料替换", "附件补充",
        "确认状态变更", "风险等级调整", "标签变更",
    ]
    field_map = {
        "设计变更": ["design_version", "confirmation_status"],
        "金额调整": ["payment_amount", "order_amount"],
        "工期变更": ["expected_finish_date"],
        "材料替换": ["material_name"],
        "附件补充": ["attachment_count"],
        "确认状态变更": ["design_confirmed", "payment_confirmed", "purchase_confirmed"],
        "风险等级调整": ["risk_level"],
        "标签变更": ["tags"],
    }

    rows = []
    for _ in range(n):
        proj = random.choice(projects)
        change_type = random.choice(change_types)
        field_name = random.choice(field_map[change_type])
        changed_at = _random_date(60)
        row = {
            "id": _random_id(),
            "project_id": proj["project_id"],
            "change_type": change_type,
            "field_name": field_name,
            "old_value": f"旧值_{random.randint(1, 100)}",
            "new_value": f"新值_{random.randint(1, 100)}",
            "changed_by": random.choice(CUSTOMER_NAMES),
            "changed_at": changed_at,
            "description": f"{change_type}：由{random.choice(CUSTOMER_NAMES)}于{changed_at.strftime('%Y-%m-%d')}发起，原因：{random.choice(['客户需求变化', '现场条件限制', '材料供应问题', '优化设计方案'])}",
            "version": f"v{random.randint(1, 5)}.{random.randint(0, 9)}",
        }
        rows.append(row)
    return pl.DataFrame(rows)


def generate_auth_scopes() -> pl.DataFrame:
    users = [
        {"user_id": "U001", "user_name": "张经理", "role": "大区经理", "region": "华东区"},
        {"user_id": "U002", "user_name": "李总监", "role": "区域总监", "region": "华南区"},
        {"user_id": "U003", "user_name": "王主管", "role": "项目经理", "region": "华北区"},
        {"user_id": "U004", "user_name": "赵总", "role": "总经理", "region": None},
        {"user_id": "U005", "user_name": "陈监理", "role": "监理", "region": "华中区"},
    ]

    rows = []
    for u in users:
        rows.append({
            "id": _random_id(),
            "user_id": u["user_id"],
            "user_name": u["user_name"],
            "region": u["region"],
            "allowed_project_ids": None,
            "role": u["role"],
        })
    return pl.DataFrame(rows)


def generate_all_data() -> Dict[str, pl.DataFrame]:
    projects = generate_projects(40)
    return {
        "design_exports": generate_design_exports(60, projects),
        "payment_records": generate_payment_records(80, projects),
        "purchase_orders": generate_purchase_orders(90, projects),
        "attachments": generate_attachments(120, projects),
        "change_timeline": generate_change_timeline(60, projects),
        "auth_scopes": generate_auth_scopes(),
    }
