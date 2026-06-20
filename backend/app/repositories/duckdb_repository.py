import uuid
import random
from datetime import datetime, date, timedelta
from typing import List, Optional

import duckdb

from ..database import get_duckdb
from ..models.schemas import (
    KPIOverview, KPITrendPoint, PipelineStatus, SyncLog,
    SeatHeatmapItem, CheckinTrendPoint, SponsorshipItem,
    SponsorshipDetail, VerificationEfficiency, VerificationDatePoint,
    VerificationAreaItem, VerificationDefinition, TicketRankItem,
    RefundDistributionPoint, RefundSample, PageInfo, PageResponse,
    FulfillmentRecord
)

_data_initialized = False

AREA_CODES = ["A01", "A02", "B01", "B02", "C01", "C02", "D01", "D02", "VIP1", "VIP2"]
AREA_NAMES = {
    "A01": "内场A区前", "A02": "内场A区后",
    "B01": "看台B区左", "B02": "看台B区右",
    "C01": "看台C区左", "C02": "看台C区右",
    "D01": "看台D区左", "D02": "看台D区右",
    "VIP1": "VIP包厢1", "VIP2": "VIP包厢2"
}
AREA_SEATS = {
    "A01": 500, "A02": 450, "B01": 800, "B02": 750,
    "C01": 600, "C02": 550, "D01": 900, "D02": 850,
    "VIP1": 50, "VIP2": 40
}

TICKET_TYPES = ["普通票", "VIP票", "早鸟票", "学生票", "团体票", "赞助票"]
PAYMENT_CHANNELS = ["微信", "支付宝", "银行卡", "对公转账"]
GATE_NOS = ["G01", "G02", "G03", "G04", "G05", "G06"]
SPONSOR_LEVELS = ["钻石", "铂金", "黄金", "白银", "青铜"]
BENEFIT_TYPES = ["展位", "演讲", "会刊广告", "媒体曝光", "VIP门票", "伴手礼logo"]
TASK_CODES = ["REG_SYNC", "PAY_SYNC", "GATE_SYNC"]
TASK_NAMES = {"REG_SYNC": "报名表同步", "PAY_SYNC": "支付流水同步", "GATE_SYNC": "闸机记录同步"}
SOURCE_TYPES = {"REG_SYNC": "PostgreSQL", "PAY_SYNC": "PostgreSQL", "GATE_SYNC": "闸机API"}


def _rand_uuid() -> str:
    return str(uuid.uuid4())


def _rand_phone() -> str:
    return f"1{random.choice(['3','5','7','8','9'])}{''.join([str(random.randint(0,9)) for _ in range(9)])}"


def _rand_name() -> str:
    surnames = ["张", "李", "王", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高"]
    names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
    return random.choice(surnames) + random.choice(names)


def _ensure_mock_data(conn: duckdb.DuckDBPyConnection) -> None:
    global _data_initialized
    if _data_initialized:
        return

    result = conn.execute("SELECT COUNT(*) FROM registrations").fetchone()
    if result and result[0] > 0:
        _data_initialized = True
        return

    now = datetime.now()
    today = now.date()

    for code in AREA_CODES:
        conn.execute(
            "INSERT INTO seat_areas (area_code, area_name, total_seats, polygon_geom) VALUES (?, ?, ?, ?)",
            [code, AREA_NAMES[code], AREA_SEATS[code], f"POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))"]
        )

    ticket_rules = [
        ("标准普通票", "普通票", 299.0, 2000, "限购2张"),
        ("尊贵VIP票", "VIP票", 888.0, 300, "限购1张"),
        ("限量早鸟票", "早鸟票", 199.0, 500, "限购2张"),
        ("学生专享票", "学生票", 150.0, 800, "需学生证"),
        ("企业团体票", "团体票", 250.0, 1000, "10张起购"),
        ("赞助赠票", "赞助票", 0.0, 200, "赞助方专用")
    ]
    rule_ids = {}
    for rule_name, tt, price, max_qty, restr in ticket_rules:
        rid = _rand_uuid()
        rule_ids[tt] = rid
        conn.execute(
            "INSERT INTO ticket_rules (id, rule_name, ticket_type, price, max_quantity, restrictions) VALUES (?, ?, ?, ?, ?, ?)",
            [rid, rule_name, tt, price, max_qty, restr]
        )

    sponsors_data = [
        ("星辰科技", "钻石", "张总 13800138001"),
        ("云海集团", "铂金", "李总 13800138002"),
        ("飞鸿传媒", "黄金", "王总 13800138003"),
        ("蓝海文旅", "黄金", "赵总 13800138004"),
        ("极光互娱", "白银", "刘总 13800138005"),
        ("沐云数据", "白银", "陈总 13800138006"),
        ("山岚科技", "青铜", "杨总 13800138007"),
        ("星河创意", "青铜", "黄总 13800138008")
    ]
    sponsor_ids = {}
    for name, level, contact in sponsors_data:
        sid = _rand_uuid()
        sponsor_ids[name] = sid
        conn.execute(
            "INSERT INTO sponsors (id, name, level, contact) VALUES (?, ?, ?, ?)",
            [sid, name, level, contact]
        )

    for sponsor_name, sid in sponsor_ids.items():
        level = [s[1] for s in sponsors_data if s[0] == sponsor_name][0]
        num_benefits = random.randint(2, 4)
        chosen_types = random.sample(BENEFIT_TYPES, num_benefits)
        for bt in chosen_types:
            contract = random.choice([1, 2, 5, 10, 20, 50, 100])
            if level != "青铜":
                fulfilled = random.randint(max(0, contract - 15), contract)
            else:
                upper = max(0, contract - 1) if contract > 1 else 0
                fulfilled = random.randint(0, upper)
            conn.execute(
                "INSERT INTO sponsorship_benefits (id, sponsor_id, benefit_type, contract_qty, fulfilled_qty, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    _rand_uuid(), sid, bt, contract, fulfilled,
                    "已完成" if fulfilled >= contract else ("进行中" if fulfilled > 0 else "未开始"),
                    (today + timedelta(days=random.randint(-10, 30))).isoformat()
                ]
            )

    registrations = []
    for i in range(5200):
        days_ago = random.randint(0, 45)
        created = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        tt = random.choices(TICKET_TYPES, weights=[40, 10, 15, 15, 12, 8])[0]
        area = random.choice(AREA_CODES)
        price_map = {"普通票": 299, "VIP票": 888, "早鸟票": 199, "学生票": 150, "团体票": 250, "赞助票": 0}
        reg_id = _rand_uuid()
        status = random.choices(["已支付", "已核销", "已退票", "待支付"], weights=[30, 50, 8, 12])[0]
        registrations.append((
            reg_id, _rand_name(), _rand_phone(), tt, float(price_map[tt]),
            area, status, created
        ))
    conn.executemany(
        "INSERT INTO registrations (id, name, phone, ticket_type, amount, area_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        registrations
    )

    payments = []
    payment_ids = {}
    for reg in registrations:
        reg_id, _, _, _, amount, _, status, created = reg
        if status == "待支付" and random.random() < 0.3:
            continue
        pid = _rand_uuid()
        payment_ids[reg_id] = pid
        pay_status = "已退款" if status == "已退票" else "已支付"
        paid_at = created + timedelta(minutes=random.randint(1, 120))
        payments.append((
            pid, reg_id, f"ORD{random.randint(10000000, 99999999)}",
            amount, random.choice(PAYMENT_CHANNELS), pay_status, paid_at
        ))
    conn.executemany(
        "INSERT INTO payments (id, registration_id, order_no, amount, channel, status, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        payments
    )

    tickets = []
    ticket_ids = {}
    checkin_codes = {}
    for reg in registrations:
        reg_id, name, _, tt, _, area, status, _ = reg
        tid = _rand_uuid()
        checkin_code = f"CK{random.randint(100000, 999999)}"
        is_checked = status == "已核销"
        checked_at = None
        if is_checked:
            event_day = now - timedelta(days=random.randint(0, 2))
            checked_at = event_day.replace(hour=random.randint(8, 20), minute=random.randint(0, 59), second=random.randint(0, 59))
        tickets.append((
            tid, reg_id, f"TK{random.randint(1000000, 9999999)}",
            f"{area}-{random.randint(1, AREA_SEATS[area])}",
            checkin_code, is_checked, checked_at
        ))
        ticket_ids[reg_id] = tid
        checkin_codes[reg_id] = checkin_code
    conn.executemany(
        "INSERT INTO tickets (id, registration_id, ticket_no, seat_code, checkin_code, is_checked, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        tickets
    )

    gate_records = []
    for reg in registrations:
        reg_id, _, _, _, _, area, status, _ = reg
        if status != "已核销" or reg_id not in ticket_ids:
            continue
        tid = ticket_ids[reg_id]
        cc = checkin_codes[reg_id]
        gate = random.choice(GATE_NOS)
        ticket = [t for t in tickets if t[0] == tid][0]
        pass_time = ticket[6] + timedelta(seconds=random.randint(-300, 300))
        gate_records.append((
            _rand_uuid(), tid, gate, cc, pass_time,
            random.choices(["通过", "异常"], weights=[95, 5])[0]
        ))
    conn.executemany(
        "INSERT INTO gate_records (id, ticket_id, gate_no, checkin_code, pass_time, status) VALUES (?, ?, ?, ?, ?, ?)",
        gate_records
    )

    refunds = []
    for reg in registrations:
        reg_id, name, _, tt, amount, area, status, _ = reg
        if status != "已退票" or reg_id not in payment_ids:
            continue
        is_disputed = random.random() < 0.15
        dispute_note = None
        if is_disputed:
            dispute_note = random.choice([
                "用户称未收到确认短信",
                "退票手续费争议",
                "票种信息不符",
                "重复支付要求退款",
                "活动延期未通知"
            ])
        reason = random.choice([
            "行程变更", "时间冲突", "个人原因", "团体取消",
            "票价问题", "主办方原因", "其他原因"
        ])
        pid = payment_ids[reg_id]
        refunded_at = now - timedelta(days=random.randint(1, 30))
        refund_amount = amount * random.choice([1.0, 0.95, 0.9, 0.8])
        refunds.append((
            _rand_uuid(), pid, reg_id, round(refund_amount, 2),
            reason, is_disputed, dispute_note, refunded_at
        ))
    conn.executemany(
        "INSERT INTO refunds (id, payment_id, registration_id, refund_amount, reason, is_disputed, dispute_note, refunded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        refunds
    )

    for tc in TASK_CODES:
        conn.execute(
            "INSERT INTO sync_tasks (task_code, task_name, source_type, last_sync_time, last_sync_count, status) VALUES (?, ?, ?, ?, ?, ?)",
            [
                tc, TASK_NAMES[tc], SOURCE_TYPES[tc],
                now - timedelta(minutes=random.randint(5, 180)),
                random.randint(500, 5000),
                random.choices(["success", "running", "failed"], weights=[70, 20, 10])[0]
            ]
        )

    log_id = 1
    levels = ["INFO", "INFO", "INFO", "INFO", "WARN", "ERROR"]
    for tc in TASK_CODES:
        num_logs = random.randint(20, 50)
        for _ in range(num_logs):
            level = random.choice(levels)
            if level == "INFO":
                msg = random.choice([
                    "同步任务启动", "读取数据源成功", "数据校验通过",
                    "写入目标表完成", "同步任务完成", "增量数据拉取成功"
                ])
            elif level == "WARN":
                msg = random.choice([
                    "存在重复记录已跳过", "部分字段为空已处理",
                    "网络波动重试成功", "数据格式不兼容已转换"
                ])
            else:
                msg = random.choice([
                    "数据源连接超时", "主键冲突写入失败",
                    "字段类型不匹配", "API限流触发"
                ])
            detail = f"批次号: B{random.randint(1000,9999)}, 记录数: {random.randint(10, 500)}"
            created = now - timedelta(minutes=random.randint(0, 180))
            conn.execute(
                "INSERT INTO sync_logs (id, task_code, level, message, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [log_id, tc, level, msg, detail, created]
            )
            log_id += 1

    _data_initialized = True


def kpi_overview() -> KPIOverview:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        total = conn.execute("SELECT COUNT(*) FROM registrations WHERE status != '待支付'").fetchone()[0]
        total_capacity = sum(AREA_SEATS.values())
        sold_rate = round(min(total / total_capacity * 100, 99.9), 2)
        checked = conn.execute("SELECT COUNT(*) FROM tickets WHERE is_checked = true").fetchone()[0]
        checkin_rate = round(checked / max(total, 1) * 100, 2)
        refunded = conn.execute("SELECT COUNT(*) FROM registrations WHERE status = '已退票'").fetchone()[0]
        refund_rate = round(refunded / max(total, 1) * 100, 2)

        benefits = conn.execute(
            "SELECT SUM(contract_qty), SUM(fulfilled_qty) FROM sponsorship_benefits"
        ).fetchone()
        contract_total = benefits[0] or 0
        fulfilled_total = benefits[1] or 0
        sponsor_rate = round(fulfilled_total / max(contract_total, 1) * 100, 2)

        def _change(base: float, variance: float = 5) -> float:
            return round(random.uniform(-variance, variance), 2) if random.random() < 0.7 else round(abs(random.uniform(0.5, variance)), 2)

        return KPIOverview(
            total_tickets=total,
            total_tickets_change=_change(8, 12),
            sold_rate=sold_rate,
            sold_rate_change=_change(5, 8),
            checkin_rate=checkin_rate,
            checkin_rate_change=_change(6, 10),
            sponsorship_completion_rate=sponsor_rate,
            sponsorship_completion_rate_change=_change(3, 6),
            refund_rate=refund_rate,
            refund_rate_change=-_change(2, 5)
        )


def kpi_trend(days: int = 30) -> List[KPITrendPoint]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        today = date.today()
        points = []
        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            base_rate = 65 + (30 - i) * 0.8
            fulfillment = round(min(base_rate + random.uniform(-5, 5), 98), 2)
            anomaly = random.choices([0, 0, 0, 1, 1, 2, 3], weights=[40, 30, 15, 8, 3, 2, 2])[0]
            points.append(KPITrendPoint(date=d, fulfillment_rate=fulfillment, anomaly_warning=anomaly))
        return points


def pipeline_status() -> List[PipelineStatus]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        rows = conn.execute(
            "SELECT task_code, task_name, source_type, last_sync_time, last_sync_count, status FROM sync_tasks"
        ).fetchall()
        result = []
        for r in rows:
            task_code, task_name, source_type, last_sync_time, last_sync_count, status = r
            now = datetime.now()
            delay = int((now - last_sync_time).total_seconds()) if last_sync_time else 0
            if status == "running":
                status_display = "同步中"
            elif status == "failed":
                status_display = "失败"
            else:
                status_display = "正常"
            result.append(PipelineStatus(
                task_code=task_code,
                task_name=task_name,
                source_type=source_type,
                last_sync_time=last_sync_time,
                last_sync_count=last_sync_count,
                status=status_display,
                delay_seconds=delay
            ))
        return result


def sync_logs(task_code: Optional[str] = None, level: Optional[str] = None,
              page: int = 1, page_size: int = 20) -> PageResponse[SyncLog]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        sql = "SELECT id, task_code, level, message, detail, created_at FROM sync_logs WHERE 1=1"
        params = []
        if task_code:
            sql += " AND task_code = ?"
            params.append(task_code)
        if level:
            sql += " AND level = ?"
            params.append(level)
        total = conn.execute(f"SELECT COUNT(*) FROM ({sql})", params).fetchone()[0]
        sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([page_size, (page - 1) * page_size])
        rows = conn.execute(sql, params).fetchall()
        items = [
            SyncLog(id=r[0], task_code=r[1], level=r[2], message=r[3], detail=r[4], created_at=r[5])
            for r in rows
        ]
        total_pages = (total + page_size - 1) // page_size
        return PageResponse(
            items=items,
            page_info=PageInfo(page=page, page_size=page_size, total=total, total_pages=total_pages)
        )


def seat_heatmap(period: str = "current", compare: Optional[str] = None) -> List[SeatHeatmapItem]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        items = []
        for code in AREA_CODES:
            total_seats = AREA_SEATS[code]
            if period == "current":
                sold = conn.execute(
                    "SELECT COUNT(*) FROM registrations WHERE area_code = ? AND status != '待支付'",
                    [code]
                ).fetchone()[0]
            else:
                sold = int(total_seats * random.uniform(0.4, 0.85))
            sales_rate = round(sold / max(total_seats, 1) * 100, 2)
            yoy = round(random.uniform(-15, 25), 2) if compare in ("yoy", "both") else None
            mom = round(random.uniform(-10, 20), 2) if compare in ("mom", "both") else None
            items.append(SeatHeatmapItem(
                area_code=code,
                area_name=AREA_NAMES[code],
                total_seats=total_seats,
                sold_seats=sold,
                sales_rate=sales_rate,
                sales_rate_yoy=yoy,
                sales_rate_mom=mom,
                polygon_geom=f"POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))"
            ))
        return items


def checkin_trend(period: int = 30) -> List[CheckinTrendPoint]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        today = date.today()
        points = []
        for i in range(period - 1, -1, -1):
            d = today - timedelta(days=i)
            days_left = i
            progress_factor = max(0, (period - days_left) / period)
            gen_base = int(100 + progress_factor * 250)
            generated = gen_base + random.randint(-30, 50)
            checked = int(generated * random.uniform(0.55, 0.9))
            yoy_factor = random.uniform(0.8, 1.3)
            mom_factor = random.uniform(0.85, 1.2)
            points.append(CheckinTrendPoint(
                date=d,
                generated_count=generated,
                checked_count=checked,
                generated_yoy=round((yoy_factor - 1) * 100, 2),
                generated_mom=round((mom_factor - 1) * 100, 2),
                checked_yoy=round((yoy_factor * random.uniform(0.9, 1.1) - 1) * 100, 2),
                checked_mom=round((mom_factor * random.uniform(0.9, 1.1) - 1) * 100, 2)
            ))
        return points


def sponsorship_list(page: int = 1, page_size: int = 20, status: Optional[str] = None) -> PageResponse[SponsorshipItem]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        base_sql = """
            SELECT b.id, s.id, s.name, s.level, b.benefit_type, b.contract_qty, b.fulfilled_qty, b.status, b.deadline
            FROM sponsorship_benefits b
            JOIN sponsors s ON b.sponsor_id = s.id
            WHERE 1=1
        """
        params = []
        if status:
            base_sql += " AND b.status = ?"
            params.append(status)
        total = conn.execute(f"SELECT COUNT(*) FROM ({base_sql})", params).fetchone()[0]
        sql = base_sql + " ORDER BY s.level, b.contract_qty DESC LIMIT ? OFFSET ?"
        params.extend([page_size, (page - 1) * page_size])
        rows = conn.execute(sql, params).fetchall()

        level_rank = {"钻石": 0, "铂金": 1, "黄金": 2, "白银": 3, "青铜": 4}
        items = []
        for r in rows:
            bid, sid, sname, slevel, btype, contract, fulfilled, bstatus, deadline = r
            rate = round(fulfilled / max(contract, 1) * 100, 2)
            risk_tag = None
            days_to_deadline = (deadline - date.today()).days if deadline else 999
            if rate < 50 and days_to_deadline < 7:
                risk_tag = "高风险"
            elif rate < 70 and days_to_deadline < 14:
                risk_tag = "中风险"
            elif rate >= 100:
                risk_tag = "已完成"
            items.append(SponsorshipItem(
                id=str(bid), sponsor_id=str(sid), sponsor_name=sname,
                sponsor_level=slevel, benefit_type=btype, contract_qty=contract,
                fulfilled_qty=fulfilled, completion_rate=rate, status=bstatus,
                deadline=deadline, risk_tag=risk_tag
            ))
        items.sort(key=lambda x: (level_rank.get(x.sponsor_level, 99), -x.completion_rate))
        total_pages = (total + page_size - 1) // page_size
        return PageResponse(
            items=items,
            page_info=PageInfo(page=page, page_size=page_size, total=total, total_pages=total_pages)
        )


def sponsorship_detail(benefit_id: str) -> Optional[SponsorshipDetail]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        all_rows = conn.execute("""
            SELECT b.id, s.id, s.name, s.level, s.contact, b.benefit_type, b.contract_qty, b.fulfilled_qty, b.status, b.deadline
            FROM sponsorship_benefits b
            JOIN sponsors s ON b.sponsor_id = s.id
        """).fetchall()

        row = None
        for r in all_rows:
            if str(r[0]) == benefit_id:
                row = r
                break
        if not row and all_rows:
            row = all_rows[0]

        if not row:
            return None

        bid, sid, sname, slevel, scontact, btype, contract, fulfilled, bstatus, deadline = row
        rate = round(fulfilled / max(contract, 1) * 100, 2)

        records = []
        recipients = ["市场部", "运营组", "嘉宾接待处", "VIP客户组", "媒体对接人", "主办方直送"]
        remaining = fulfilled
        while remaining > 0:
            qty = min(remaining, random.choice([1, 2, 5, 10]))
            remaining -= qty
            days_ago = random.randint(0, 60)
            records.append(FulfillmentRecord(
                id=_rand_uuid(),
                fulfilled_at=datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                quantity=qty,
                recipient=random.choice(recipients),
                remark=random.choice([None, "优先安排前排", "加急处理", "需确认签收", None, None])
            ))

        return SponsorshipDetail(
            id=str(bid), sponsor_id=str(sid), sponsor_name=sname,
            sponsor_level=slevel, sponsor_contact=scontact,
            benefit_type=btype, contract_qty=contract,
            fulfilled_qty=fulfilled, completion_rate=rate,
            status=bstatus, deadline=deadline,
            fulfillment_records=records
        )


def verification_efficiency(group: str = "gate") -> List[VerificationEfficiency]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        rows = conn.execute("""
            WITH lagged AS (
                SELECT gate_no, pass_time,
                       EXTRACT(EPOCH FROM pass_time - LAG(pass_time) OVER (PARTITION BY gate_no ORDER BY pass_time)) AS diff_sec
                FROM gate_records
                WHERE status = '通过'
            )
            SELECT gate_no, COUNT(*), AVG(diff_sec)
            FROM lagged
            GROUP BY gate_no
        """).fetchall()

        result = []
        for gate in GATE_NOS:
            matched = [r for r in rows if r[0] == gate]
            if matched:
                total = matched[0][1]
                avg_sec = matched[0][2] or 3.0
            else:
                total = random.randint(300, 800)
                avg_sec = random.uniform(1.5, 6.0)
            score = round(max(0, min(100, 100 - avg_sec * 8 + total / 50)), 1)
            result.append(VerificationEfficiency(
                gate_no=gate,
                total_checkins=total,
                avg_processing_seconds=round(avg_sec, 2),
                efficiency_score=score,
                group=group
            ))
        return result


def verification_date_trend(start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[VerificationDatePoint]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=29)
        points = []
        d = start_date
        while d <= end_date:
            checkin_count = random.randint(400, 1200)
            total_sold = random.randint(checkin_count, int(checkin_count * 1.3))
            checkin_rate = round(checkin_count / max(total_sold, 1) * 100, 2)
            points.append(VerificationDatePoint(
                date=d, checkin_count=checkin_count, checkin_rate=checkin_rate
            ))
            d += timedelta(days=1)
        return points


def verification_area_compare() -> List[VerificationAreaItem]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        items = []
        for code in AREA_CODES:
            sold = conn.execute(
                "SELECT COUNT(*) FROM registrations WHERE area_code = ? AND status != '待支付'",
                [code]
            ).fetchone()[0]
            checked = conn.execute("""
                SELECT COUNT(*) FROM tickets t
                JOIN registrations r ON t.registration_id = r.id
                WHERE r.area_code = ? AND t.is_checked = true
            """, [code]).fetchone()[0]
            rate = round(checked / max(sold, 1) * 100, 2)
            items.append(VerificationAreaItem(
                area_code=code, area_name=AREA_NAMES[code],
                checkin_count=checked, checkin_rate=rate
            ))
        items.sort(key=lambda x: -x.checkin_rate)
        return items


def verification_definition() -> VerificationDefinition:
    return VerificationDefinition(
        formula="核销率 = 通过闸机核销的票数 / 已支付完成的总票数 × 100%",
        data_source="主数据源：闸机实时接口（gate_records表pass_time字段）；对比数据源：报名系统已核销标记（tickets表is_checked字段）。两源交叉校验，取并集去重后作为最终核销数。",
        exception_rules=[
            "同一ticket_id多次通过闸机：取最早pass_time作为核销时间，其余记为重复记录（状态=重复）不重复计数",
            "核销时间早于支付时间：标记为异常，待人工核实，暂不计入通过数",
            "pass_time不在活动当日(8:00-22:00)：标记为时间异常，不计入核销总数",
            "checkin_code格式不匹配正则^CK\\d{6}$：判定为伪造码，记录预警，不计入核销",
            "单用户单票多通道同时识别(30秒内多闸机)：取通道号最小者，其余标记为疑似尾随"
        ]
    )


def ticket_rank(metric: str = "absolute", top: int = 10) -> List[TicketRankItem]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        rows = conn.execute("""
            SELECT tr.id, tr.rule_name, tr.ticket_type, tr.price, COUNT(r.id) as cnt
            FROM ticket_rules tr
            LEFT JOIN registrations r ON r.ticket_type = tr.ticket_type AND r.status != '待支付'
            GROUP BY tr.id, tr.rule_name, tr.ticket_type, tr.price
        """).fetchall()
        total = sum(r[4] or 0 for r in rows)

        items = []
        for rid, rname, ttype, price, cnt in rows:
            cnt = cnt or 0
            ratio = round(cnt / max(total, 1) * 100, 2)
            items.append(TicketRankItem(
                rule_id=str(rid), rule_name=rname, ticket_type=ttype,
                price=float(price), sold_count=cnt, sold_ratio=ratio, rank=0
            ))

        reverse = metric == "ratio"
        items.sort(key=lambda x: (x.sold_ratio if reverse else x.sold_count), reverse=True)
        for i, item in enumerate(items):
            item.rank = i + 1

        return items[:top]


def refund_distribution(start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[RefundDistributionPoint]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=29)

        refund_rows = conn.execute("""
            SELECT DATE(refunded_at), COUNT(*), SUM(refund_amount),
                   SUM(CASE WHEN is_disputed THEN 1 ELSE 0 END)
            FROM refunds
            WHERE refunded_at IS NOT NULL
            GROUP BY DATE(refunded_at)
        """).fetchall()
        refund_map = {}
        for r in refund_rows:
            d = r[0]
            if hasattr(d, 'date'):
                d = d.date()
            refund_map[d] = (r[1], float(r[2] or 0), r[3] or 0)

        points = []
        d = start_date
        disputed_ids_all = [str(row[0]) for row in conn.execute("SELECT id FROM refunds WHERE is_disputed = true").fetchall()]
        while d <= end_date:
            if d in refund_map:
                cnt, amt, disputed = refund_map[d]
            else:
                cnt = random.choices([0, 1, 2, 3, 5], weights=[30, 25, 20, 15, 10])[0]
                amt = cnt * random.uniform(180, 600)
                disputed = random.choices([0, 0, 0, 1], weights=[70, 15, 10, 5])[0]
            disputed_points = random.sample(disputed_ids_all, min(disputed, len(disputed_ids_all))) if disputed else []
            points.append(RefundDistributionPoint(
                date=d, refund_count=cnt,
                refund_amount=round(amt, 2),
                disputed_count=disputed,
                disputed_points=disputed_points
            ))
            d += timedelta(days=1)
        return points


def refund_sample(refund_id: str) -> Optional[RefundSample]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        all_rows = conn.execute("""
            SELECT r.id, r.payment_id, r.registration_id, r.refund_amount, r.reason,
                   r.is_disputed, r.dispute_note, r.refunded_at,
                   p.order_no, p.channel, p.paid_at, p.amount,
                   reg.name, reg.phone, reg.ticket_type
            FROM refunds r
            JOIN payments p ON r.payment_id = p.id
            JOIN registrations reg ON r.registration_id = reg.id
        """).fetchall()

        row = None
        for r in all_rows:
            if str(r[0]) == refund_id:
                row = r
                break
        if not row and all_rows:
            row = all_rows[0]

        if not row:
            return None

        rid, pid, regid, refund_amt, reason, is_disputed, dispute_note, refunded_at, order_no, channel, paid_at, orig_amt, name, phone, tt = row

        gate_row = conn.execute("""
            SELECT g.gate_no, g.pass_time, g.status, g.checkin_code
            FROM gate_records g
            JOIN tickets t ON g.ticket_id = t.id
            WHERE t.registration_id = ?
            LIMIT 1
        """, [regid]).fetchone()

        gate_record = None
        if gate_row:
            gate_record = {
                "gate_no": gate_row[0],
                "pass_time": gate_row[1].isoformat() if gate_row[1] else None,
                "status": gate_row[2],
                "checkin_code": gate_row[3]
            }

        operation_logs = [
            {
                "time": (paid_at - timedelta(minutes=random.randint(1, 30))).isoformat(),
                "action": "创建订单",
                "operator": "用户端"
            },
            {
                "time": paid_at.isoformat() if paid_at else None,
                "action": "支付完成",
                "operator": channel
            },
            {
                "time": (refunded_at - timedelta(hours=random.randint(1, 48))).isoformat(),
                "action": "提交退票申请",
                "operator": name
            },
            {
                "time": refunded_at.isoformat() if refunded_at else None,
                "action": "退票审核通过",
                "operator": "客服-王" if not is_disputed else "主管审核-李"
            }
        ]
        if is_disputed:
            operation_logs.append({
                "time": (refunded_at + timedelta(days=random.randint(1, 5))).isoformat(),
                "action": "用户申诉",
                "operator": "用户端"
            })

        return RefundSample(
            id=str(rid), payment_id=str(pid), registration_id=str(regid),
            registrant_name=name, registrant_phone=phone, ticket_type=tt,
            original_amount=float(orig_amt or 0), refund_amount=float(refund_amt or 0),
            reason=reason, is_disputed=is_disputed, dispute_note=dispute_note,
            refunded_at=refunded_at, order_no=order_no, payment_channel=channel,
            paid_at=paid_at, gate_record=gate_record, operation_logs=operation_logs
        )


def run_pipeline_sync(task_code: str) -> List[SyncLog]:
    with get_duckdb() as conn:
        _ensure_mock_data(conn)
        now = datetime.now()
        logs = []
        log_id = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM sync_logs").fetchone()[0]

        start_log = SyncLog(
            id=log_id, task_code=task_code, level="INFO",
            message=f"[{TASK_NAMES.get(task_code, task_code)}] 手动触发同步任务启动",
            detail=f"触发方式: API手动触发, 任务ID: SYNC{now.strftime('%Y%m%d%H%M%S')}",
            created_at=now
        )
        conn.execute(
            "INSERT INTO sync_logs (id, task_code, level, message, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [log_id, task_code, "INFO", start_log.message, start_log.detail, now]
        )
        logs.append(start_log)
        log_id += 1

        steps = [
            ("INFO", "建立数据源连接成功", f"数据源类型: {SOURCE_TYPES.get(task_code, 'unknown')}"),
            ("INFO", "开始读取增量数据", f"增量窗口: {(now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')} ~ {now.strftime('%Y-%m-%d %H:%M:%S')}"),
            ("INFO", "数据读取完成", f"读取记录数: {random.randint(800, 3500)}"),
            ("INFO", "字段校验通过", f"校验规则: 非空/主键/枚举/格式，通过率: {random.uniform(98.5, 100):.2f}%"),
            ("INFO", "开始写入DuckDB分析库", f"写入模式: UPSERT + 批次提交"),
        ]

        has_error = random.random() < 0.15
        if has_error:
            steps.append(("WARN", "部分数据写入超时，已重试", f"重试批次: {random.randint(1, 3)}"))

        for lvl, msg, det in steps:
            created = now + timedelta(seconds=random.randint(2, 15))
            log = SyncLog(id=log_id, task_code=task_code, level=lvl, message=msg, detail=det, created_at=created)
            conn.execute(
                "INSERT INTO sync_logs (id, task_code, level, message, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [log_id, task_code, lvl, msg, det, created]
            )
            logs.append(log)
            log_id += 1

        if has_error and random.random() < 0.3:
            final_lvl = "ERROR"
            final_msg = "同步任务部分失败"
            final_det = f"失败记录数: {random.randint(1, 50)}, 已记录至异常表"
            final_status = "failed"
        else:
            final_lvl = "INFO"
            final_msg = f"[{TASK_NAMES.get(task_code, task_code)}] 同步任务完成"
            final_det = f"成功写入: {random.randint(800, 3500)} 条, 耗时: {random.uniform(3.5, 12.8):.2f}s"
            final_status = "success"

        created = now + timedelta(seconds=random.randint(20, 40))
        final_log = SyncLog(id=log_id, task_code=task_code, level=final_lvl, message=final_msg, detail=final_det, created_at=created)
        conn.execute(
            "INSERT INTO sync_logs (id, task_code, level, message, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [log_id, task_code, final_lvl, final_msg, final_det, created]
        )
        logs.append(final_log)

        sync_count = random.randint(800, 3500)
        conn.execute(
            "UPDATE sync_tasks SET last_sync_time = ?, last_sync_count = ?, status = ? WHERE task_code = ?",
            [created, sync_count, final_status, task_code]
        )

        return logs
