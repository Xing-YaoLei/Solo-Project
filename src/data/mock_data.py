import polars as pl
import numpy as np
from datetime import datetime, timedelta
import uuid
import random
import json
from pathlib import Path
from src.utils.config import Config
from src.data.data_loader import DataLoader


PLATFORMS = [
    {"code": "damai", "name": "大麦网", "base_url": "https://www.damai.cn", "api_prefix": "/api/trade/"},
    {"code": "maoyan", "name": "猫眼演出", "base_url": "https://show.maoyan.com", "api_prefix": "/api/v1/order/"},
    {"code": "weixin", "name": "微信小程序", "base_url": "https://mp.weixin.qq.com", "api_prefix": "/ticket/"},
    {"code": "self", "name": "官方自研", "base_url": "https://tickets.event-official.com", "api_prefix": "/v2/orders/"},
]


def generate_seats() -> pl.DataFrame:
    sections = ["A", "B", "C", "D"]
    seat_types = {"A": "VIP", "B": "Premium", "C": "Standard", "D": "Economy"}
    rows_per_section = {"A": 5, "B": 8, "C": 10, "D": 12}
    seats_per_row = {"A": 10, "B": 12, "C": 15, "D": 18}

    seats = []
    for section in sections:
        seat_type = seat_types[section]
        for row in range(1, rows_per_section[section] + 1):
            for num in range(1, seats_per_row[section] + 1):
                seats.append({
                    "seat_id": f"{section}-{row:02d}-{num:02d}",
                    "seat_row": row,
                    "seat_number": num,
                    "section": section,
                    "seat_type": seat_type,
                    "price": {"VIP": 1980, "Premium": 980, "Standard": 580, "Economy": 280}[seat_type]
                })
    return pl.DataFrame(seats)


def generate_sponsors() -> pl.DataFrame:
    sponsors = [
        {"sponsor_id": "SP001", "sponsor_name": "星辰科技", "sponsor_level": "钻石", "allocated_tickets": 20},
        {"sponsor_id": "SP002", "sponsor_name": "云帆资本", "sponsor_level": "白金", "allocated_tickets": 15},
        {"sponsor_id": "SP003", "sponsor_name": "绿洲生态", "sponsor_level": "黄金", "allocated_tickets": 10},
        {"sponsor_id": "SP004", "sponsor_name": "蓝鲸传媒", "sponsor_level": "黄金", "allocated_tickets": 8},
        {"sponsor_id": "SP005", "sponsor_name": "鸿图咨询", "sponsor_level": "白银", "allocated_tickets": 5},
    ]
    return pl.DataFrame(sponsors)


def generate_registrations(seats_df: pl.DataFrame, sponsors_df: pl.DataFrame) -> pl.DataFrame:
    first_names = ["王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡"]
    last_names = ["伟", "芳", "娜", "敏", "静", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明"]
    ticket_types = ["VIP票", "尊享票", "标准票", "经济票"]
    statuses = ["confirmed", "pending", "cancelled"]
    status_weights = [0.85, 0.1, 0.05]

    seats = seats_df["seat_id"].to_list()
    random.shuffle(seats)

    sponsor_ids = sponsors_df["sponsor_id"].to_list()
    sponsor_allocations = dict(zip(
        sponsors_df["sponsor_id"].to_list(),
        sponsors_df["allocated_tickets"].to_list()
    ))

    registrations = []
    base_time = datetime(2026, 5, 15, 10, 0, 0)

    for i, seat_id in enumerate(seats[:int(len(seats) * 0.9)]):
        reg_id = f"REG{202606000 + i}"
        first = random.choice(first_names)
        last = random.choice(last_names)
        name = f"{first}{last}"
        seat_info = seats_df.filter(pl.col("seat_id") == seat_id).row(0, named=True)
        ticket_type = {"VIP": "VIP票", "Premium": "尊享票", "Standard": "标准票", "Economy": "经济票"}[seat_info["seat_type"]]
        status = np.random.choice(statuses, p=status_weights)

        sponsor_id = None
        for sid in sponsor_ids:
            if sponsor_allocations[sid] > 0 and random.random() < 0.15:
                sponsor_id = sid
                sponsor_allocations[sid] -= 1
                break

        platform = random.choice(PLATFORMS)
        platform_order_id = f"{platform['code'].upper()}{random.randint(100000000, 999999999)}"

        registrations.append({
            "registration_id": reg_id,
            "attendee_name": name,
            "email": f"user{i}@example.com",
            "phone": f"138{random.randint(10000000, 99999999)}",
            "ticket_type": ticket_type,
            "seat_id": seat_id,
            "sponsor_id": sponsor_id,
            "status": status,
            "registration_time": base_time + timedelta(
                days=random.randint(-30, -1),
                hours=random.randint(0, 12),
                minutes=random.randint(0, 59)
            ),
            "source": platform["name"],
            "platform_code": platform["code"],
            "platform_order_id": platform_order_id,
        })

    df = pl.DataFrame(registrations)
    return df.with_columns([
        pl.col("registration_time").cast(pl.Datetime("us"))
    ])


def generate_payments(registrations_df: pl.DataFrame) -> pl.DataFrame:
    confirmed = registrations_df.filter(pl.col("status") == "confirmed")
    payments = []

    for reg in confirmed.iter_rows(named=True):
        pay_id = f"PAY{random.randint(100000, 999999)}"
        reg_time = reg["registration_time"]
        pay_time = reg_time + timedelta(minutes=random.randint(1, 120))

        amount = {
            "VIP票": 1980,
            "尊享票": 980,
            "标准票": 580,
            "经济票": 280
        }.get(reg["ticket_type"], 580)

        success = random.random() < 0.95
        status = "success" if success else random.choice(["failed", "pending"])

        platform = next(p for p in PLATFORMS if p["code"] == reg["platform_code"])
        platform_payment_id = f"{platform['code']}_PAY_{random.randint(100000, 999999)}"

        payments.append({
            "payment_id": pay_id,
            "registration_id": reg["registration_id"],
            "amount": amount,
            "currency": "CNY",
            "payment_method": random.choice(["微信支付", "支付宝", "银行卡", "企业转账"]),
            "status": status,
            "payment_time": pay_time if success else None,
            "transaction_id": f"TXN{random.randint(100000000000, 999999999999)}" if success else None,
            "platform_code": platform["code"],
            "platform_payment_id": platform_payment_id,
        })

    df = pl.DataFrame(payments)
    return df.with_columns([
        pl.col("payment_time").cast(pl.Datetime("us"))
    ])


def generate_checkin_codes(registrations_df: pl.DataFrame) -> pl.DataFrame:
    confirmed = registrations_df.filter(pl.col("status") == "confirmed")
    codes = []
    event_start = datetime(2026, 6, 21, 9, 0, 0)

    for i, reg in enumerate(confirmed.iter_rows(named=True)):
        code = f"CK{20260600000 + i}"

        generated = random.random() < 0.97
        sent = generated and random.random() < 0.94
        checked_in = sent and random.random() < 0.88

        checkin_time = None
        if checked_in:
            checkin_time = event_start + timedelta(minutes=random.randint(-30, 180))

        generated_at = None
        if generated:
            generated_at = event_start - timedelta(days=random.randint(3, 10))

        sent_at = None
        if sent:
            sent_at = event_start - timedelta(days=random.randint(1, 2))

        codes.append({
            "checkin_code": code,
            "registration_id": reg["registration_id"],
            "generated": generated,
            "generated_at": generated_at,
            "sent": sent,
            "sent_at": sent_at,
            "checked_in": checked_in,
            "checkin_time": checkin_time,
            "checkin_channel": random.choice(["闸机", "人工通道", "扫码枪"]) if checked_in else None,
            "gate_number": random.choice(["A1", "A2", "B1", "B2", "C1"]) if checked_in else None,
        })

    df = pl.DataFrame(codes)
    return df.with_columns([
        pl.col("generated_at").cast(pl.Datetime("us")),
        pl.col("sent_at").cast(pl.Datetime("us")),
        pl.col("checkin_time").cast(pl.Datetime("us")),
    ])


def generate_refunds(registrations_df: pl.DataFrame, payments_df: pl.DataFrame) -> pl.DataFrame:
    confirmed_regs = registrations_df.filter(pl.col("status") == "confirmed")
    successful_pays = payments_df.filter(pl.col("status") == "success")

    refund_count = int(len(successful_pays) * 0.08)
    available_ids = successful_pays["registration_id"].to_list()
    refunded_regs = random.sample(available_ids, min(refund_count, len(available_ids)))

    refunds = []
    reasons = ["行程变更", "时间冲突", "身体原因", "购票错误", "价格争议", "服务不满"]
    statuses = ["completed", "disputed", "processing", "rejected"]
    status_weights = [0.5, 0.2, 0.2, 0.1]

    for i, reg_id in enumerate(refunded_regs):
        reg = confirmed_regs.filter(pl.col("registration_id") == reg_id).row(0, named=True)
        pay = successful_pays.filter(pl.col("registration_id") == reg_id).row(0, named=True)

        refund_id = f"RF{i+1:05d}"
        amount = pay["amount"] * random.choice([1.0, 0.8, 0.5])
        status = np.random.choice(statuses, p=status_weights)
        request_time = pay["payment_time"] + timedelta(days=random.randint(1, 20))

        resolved_time = None
        if status in ["completed", "rejected"]:
            resolved_time = request_time + timedelta(days=random.randint(1, 7))

        platform = next(p for p in PLATFORMS if p["code"] == reg["platform_code"])
        platform_refund_id = f"{platform['code']}_REF_{random.randint(10000, 99999)}" if status == "completed" else None

        refunds.append({
            "refund_id": refund_id,
            "registration_id": reg_id,
            "payment_id": pay["payment_id"],
            "refund_amount": round(amount, 2),
            "refund_reason": random.choice(reasons),
            "status": status,
            "request_time": request_time,
            "resolved_time": resolved_time,
            "platform_code": platform["code"],
            "platform_refund_id": platform_refund_id,
        })

    df = pl.DataFrame(refunds)
    return df.with_columns([
        pl.col("request_time").cast(pl.Datetime("us")),
        pl.col("resolved_time").cast(pl.Datetime("us")),
    ])


def generate_refund_notes(refunds_df: pl.DataFrame) -> pl.DataFrame:
    notes = []
    disputed = refunds_df.filter(pl.col("status") == "disputed")

    for refund in disputed.iter_rows(named=True):
        note_count = random.randint(2, 5)
        for i in range(note_count):
            notes.append({
                "note_id": str(uuid.uuid4()),
                "refund_id": refund["refund_id"],
                "note_content": f"备注{i+1}：关于{refund['refund_reason']}的处理跟进",
                "created_by": random.choice(["客服小王", "客服小李", "主管张三", "运营李四"]),
                "created_at": refund["request_time"] + timedelta(hours=i * 24),
                "is_resolution": i == note_count - 1 and refund["status"] == "resolved"
            })

    processing = refunds_df.filter(pl.col("status") == "processing")
    for refund in processing.iter_rows(named=True):
        notes.append({
            "note_id": str(uuid.uuid4()),
            "refund_id": refund["refund_id"],
            "note_content": "正在核实支付流水，请稍候",
            "created_by": "客服小王",
            "created_at": refund["request_time"] + timedelta(hours=2),
            "is_resolution": False
        })

    df = pl.DataFrame(notes)
    return df.with_columns([
        pl.col("created_at").cast(pl.Datetime("us"))
    ])


def generate_platform_raw_records(registrations_df: pl.DataFrame, payments_df: pl.DataFrame) -> pl.DataFrame:
    records = []

    for reg in registrations_df.iter_rows(named=True):
        platform = next(p for p in PLATFORMS if p["code"] == reg["platform_code"])
        raw_payload = {
            "platform": platform["code"],
            "platform_name": platform["name"],
            "order_id": reg["platform_order_id"],
            "attendee": {
                "name": reg["attendee_name"],
                "email": reg["email"],
                "phone": reg["phone"]
            },
            "ticket": {
                "type": reg["ticket_type"],
                "seat_id": reg["seat_id"],
                "price": {"VIP票": 1980, "尊享票": 980, "标准票": 580, "经济票": 280}.get(reg["ticket_type"], 580)
            },
            "status": reg["status"],
            "created_at": reg["registration_time"].isoformat() if isinstance(reg["registration_time"], datetime) else str(reg["registration_time"]),
            "source": platform["base_url"] + platform["api_prefix"] + reg["platform_order_id"],
            "raw_response_headers": {
                "X-Request-ID": f"{platform['code']}-{uuid.uuid4().hex[:12]}",
                "X-Trace-ID": uuid.uuid4().hex,
                "Server-Timing": "db=23ms,render=5ms"
            }
        }
        records.append({
            "record_id": str(uuid.uuid4()),
            "source_type": "registration",
            "source_id": reg["registration_id"],
            "platform_code": platform["code"],
            "platform_name": platform["name"],
            "platform_record_id": reg["platform_order_id"],
            "platform_url": platform["base_url"] + platform["api_prefix"] + reg["platform_order_id"],
            "raw_payload": json.dumps(raw_payload, ensure_ascii=False),
            "synced_at": datetime.now(),
        })

    for pay in payments_df.iter_rows(named=True):
        platform = next(p for p in PLATFORMS if p["code"] == pay["platform_code"])
        raw_payload = {
            "platform": platform["code"],
            "platform_name": platform["name"],
            "payment_id": pay["platform_payment_id"],
            "transaction_id": pay["transaction_id"],
            "registration_id": pay["registration_id"],
            "amount": pay["amount"],
            "currency": pay["currency"],
            "method": pay["payment_method"],
            "status": pay["status"],
            "paid_at": pay["payment_time"].isoformat() if isinstance(pay["payment_time"], datetime) and pay["payment_time"] else None,
            "gateway_response": {
                "code": "200" if pay["status"] == "success" else random.choice(["400", "504", "PENDING"]),
                "message": "支付成功" if pay["status"] == "success" else "处理中"
            },
            "source": platform["base_url"] + platform["api_prefix"] + "payments/" + pay["platform_payment_id"]
        }
        records.append({
            "record_id": str(uuid.uuid4()),
            "source_type": "payment",
            "source_id": pay["payment_id"],
            "platform_code": platform["code"],
            "platform_name": platform["name"],
            "platform_record_id": pay["platform_payment_id"],
            "platform_url": platform["base_url"] + platform["api_prefix"] + "payments/" + pay["platform_payment_id"],
            "raw_payload": json.dumps(raw_payload, ensure_ascii=False),
            "synced_at": datetime.now(),
        })

    df = pl.DataFrame(records)
    return df.with_columns([
        pl.col("synced_at").cast(pl.Datetime("us"))
    ])


def generate_all_data() -> dict:
    seats_df = generate_seats()
    sponsors_df = generate_sponsors()
    registrations_df = generate_registrations(seats_df, sponsors_df)
    payments_df = generate_payments(registrations_df)
    checkin_codes_df = generate_checkin_codes(registrations_df)
    refunds_df = generate_refunds(registrations_df, payments_df)
    refund_notes_df = generate_refund_notes(refunds_df)
    platform_raw_df = generate_platform_raw_records(registrations_df, payments_df)

    return {
        "seats": seats_df,
        "sponsors": sponsors_df,
        "registrations": registrations_df,
        "payments": payments_df,
        "checkin_codes": checkin_codes_df,
        "refunds": refunds_df,
        "refund_notes": refund_notes_df,
        "platform_raw_records": platform_raw_df,
    }


def save_data_to_csv(data: dict, output_dir: str = None):
    if output_dir is None:
        output_dir = Config.DATA_DIR
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    paths = {}
    for name, df in data.items():
        path = Path(output_dir) / f"{name}.csv"
        df.write_csv(str(path))
        paths[name] = str(path)

    return paths


def load_data_into_duckdb(data: dict = None):
    if data is None:
        data = generate_all_data()

    loader = DataLoader()

    for name in ["seats", "sponsors", "registrations", "payments", "checkin_codes", "refunds", "refund_notes", "platform_raw_records"]:
        if name in data:
            loader.load_polars_df(name, data[name])

    loader.ddb.execute("CREATE TABLE IF NOT EXISTS platforms (code VARCHAR, name VARCHAR, base_url VARCHAR, api_prefix VARCHAR)")
    loader.ddb.execute("DELETE FROM platforms")
    for p in PLATFORMS:
        loader.ddb.execute(
            f"INSERT INTO platforms VALUES ('{p['code']}', '{p['name']}', '{p['base_url']}', '{p['api_prefix']}')"
        )

    return loader


if __name__ == "__main__":
    print("Generating mock data...")
    data = generate_all_data()
    save_data_to_csv(data)
    load_data_into_duckdb(data)
    print(f"Done! Generated {len(data['registrations'])} registrations, "
          f"{len(data['checkin_codes'])} checkin codes, "
          f"{len(data['refunds'])} refunds, "
          f"{len(data['platform_raw_records'])} platform raw records")
