from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy import select, func, extract, Integer
from sqlalchemy.ext.asyncio import AsyncSession
import duckdb

from api.models import Settlement, Patient, Department, RejectionRecord, TreatmentSession
from api.schemas import SettlementTrendPoint, SettlementSummary


def _get_prev_period(period: str, granularity: str) -> str:
    if granularity == "quarterly":
        parts = period.split("-Q")
        year = int(parts[0])
        q = int(parts[1])
        if q == 1:
            return f"{year - 1}-Q4"
        return f"{year}-Q{q - 1}"
    else:
        y, m = map(int, period.split("-"))
        if m == 1:
            return f"{y - 1}-12"
        return f"{y}-{m - 1:02d}"


def _calc_change_pct(curr: float, prev: float) -> float:
    if prev == 0:
        return 0.0 if curr == 0 else 100.0
    return round((curr - prev) / prev * 100, 2)


async def _get_rejections_by_period(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    granularity: str,
) -> dict:
    stmt = select(RejectionRecord)
    if start_date:
        stmt = stmt.where(RejectionRecord.rejection_date >= start_date)
    if end_date:
        stmt = stmt.where(RejectionRecord.rejection_date <= end_date)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    grouped: dict[str, float] = {}
    for r in rows:
        if granularity == "quarterly":
            q = (r.rejection_date.month - 1) // 3 + 1
            key = f"{r.rejection_date.year}-Q{q}"
        else:
            key = r.rejection_date.strftime("%Y-%m")
        grouped[key] = grouped.get(key, 0.0) + r.amount
    return grouped


async def _get_completion_by_period(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    granularity: str,
) -> dict:
    stmt = select(TreatmentSession)
    if start_date:
        stmt = stmt.where(TreatmentSession.treatment_date >= start_date)
    if end_date:
        stmt = stmt.where(TreatmentSession.treatment_date <= end_date)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    grouped: dict[str, dict] = {}
    for s in rows:
        if granularity == "quarterly":
            q = (s.treatment_date.month - 1) // 3 + 1
            key = f"{s.treatment_date.year}-Q{q}"
        else:
            key = s.treatment_date.strftime("%Y-%m")
        if key not in grouped:
            grouped[key] = {"total": 0, "completed": 0}
        grouped[key]["total"] += 1
        if s.status == "completed":
            grouped[key]["completed"] += 1

    rates = {}
    for k, v in grouped.items():
        rates[k] = round(v["completed"] / v["total"] * 100, 2) if v["total"] > 0 else 0.0
    return rates


async def get_settlement_trend(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    granularity: str = "monthly",
) -> List[SettlementTrendPoint]:
    stmt = select(Settlement)
    if start_date:
        stmt = stmt.where(Settlement.settlement_date >= start_date)
    if end_date:
        stmt = stmt.where(Settlement.settlement_date <= end_date)
    stmt = stmt.order_by(Settlement.settlement_date)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    rejection_by_period = await _get_rejections_by_period(db, start_date, end_date, granularity)
    completion_by_period = await _get_completion_by_period(db, start_date, end_date, granularity)

    grouped: dict[str, dict] = {}
    for s in rows:
        if granularity == "quarterly":
            q = (s.settlement_date.month - 1) // 3 + 1
            key = f"{s.settlement_date.year}-Q{q}"
        else:
            key = s.settlement_date.strftime("%Y-%m")

        if key not in grouped:
            grouped[key] = {
                "total_amount": 0.0,
                "insurance_amount": 0.0,
                "self_paid_amount": 0.0,
                "count": 0,
            }
        grouped[key]["total_amount"] += s.total_amount
        grouped[key]["insurance_amount"] += s.insurance_amount
        grouped[key]["self_paid_amount"] += s.self_paid_amount
        grouped[key]["count"] += 1

    points = []
    for period in sorted(grouped.keys()):
        g = grouped[period]
        total = round(g["total_amount"], 2)
        rejected = round(rejection_by_period.get(period, 0.0), 2)
        points.append(
            SettlementTrendPoint(
                period=period,
                total_amount=total,
                insurance_amount=round(g["insurance_amount"], 2),
                self_paid_amount=round(g["self_paid_amount"], 2),
                rejected_amount=rejected,
                rejection_rate=round(rejected / total * 100, 2) if total > 0 else 0.0,
                completion_rate=completion_by_period.get(period, 0.0),
                count=g["count"],
            )
        )
    return points


async def get_settlement_trend_olap(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    granularity: str = "monthly",
) -> List[SettlementTrendPoint]:
    stmt = select(
        Settlement.settlement_date,
        Settlement.total_amount,
        Settlement.insurance_amount,
        Settlement.self_paid_amount,
    )
    if start_date:
        stmt = stmt.where(Settlement.settlement_date >= start_date)
    if end_date:
        stmt = stmt.where(Settlement.settlement_date <= end_date)
    result = await db.execute(stmt)
    rows = result.all()

    rejection_by_period = await _get_rejections_by_period(db, start_date, end_date, granularity)
    completion_by_period = await _get_completion_by_period(db, start_date, end_date, granularity)

    data = [
        {
            "settlement_date": r.settlement_date,
            "total_amount": r.total_amount,
            "insurance_amount": r.insurance_amount,
            "self_paid_amount": r.self_paid_amount,
        }
        for r in rows
    ]

    if not data:
        return []

    con = duckdb.connect(":memory:")
    con.execute(
        "CREATE TABLE settlements (settlement_date DATE, total_amount DOUBLE, insurance_amount DOUBLE, self_paid_amount DOUBLE)"
    )
    con.executemany(
        "INSERT INTO settlements VALUES (?, ?, ?, ?)",
        [
            (
                d["settlement_date"].isoformat(),
                d["total_amount"],
                d["insurance_amount"],
                d["self_paid_amount"],
            )
            for d in data
        ],
    )

    if granularity == "quarterly":
        period_expr = "strftime(settlement_date, '%Y') || '-Q' || CAST(((MONTH(settlement_date) - 1) // 3 + 1) AS VARCHAR)"
    else:
        period_expr = "strftime(settlement_date, '%Y-%m')"

    olap_sql = f"""
        SELECT {period_expr} AS period,
               SUM(total_amount) AS total_amount,
               SUM(insurance_amount) AS insurance_amount,
               SUM(self_paid_amount) AS self_paid_amount,
               COUNT(*) AS cnt
        FROM settlements
        GROUP BY period
        ORDER BY period
    """
    olap_result = con.execute(olap_sql).fetchall()
    con.close()

    points = []
    for r in olap_result:
        period = r[0]
        total = round(r[1], 2)
        rejected = round(rejection_by_period.get(period, 0.0), 2)
        points.append(
            SettlementTrendPoint(
                period=period,
                total_amount=total,
                insurance_amount=round(r[2], 2),
                self_paid_amount=round(r[3], 2),
                rejected_amount=rejected,
                rejection_rate=round(rejected / total * 100, 2) if total > 0 else 0.0,
                completion_rate=completion_by_period.get(period, 0.0),
                count=r[4],
            )
        )
    return points


async def _get_range_summary(
    db: AsyncSession,
    start_date: date,
    end_date: date,
) -> Tuple[float, float, float, int, float, float]:
    stmt_settle = select(
        func.sum(Settlement.total_amount),
        func.sum(Settlement.insurance_amount),
        func.sum(Settlement.self_paid_amount),
        func.count(Settlement.id),
    ).where(
        Settlement.settlement_date >= start_date,
        Settlement.settlement_date <= end_date,
    )
    row = (await db.execute(stmt_settle)).one()
    total = float(row[0] or 0)
    ins = float(row[1] or 0)
    self_paid = float(row[2] or 0)
    cnt = row[3] or 0

    stmt_rej = select(func.sum(RejectionRecord.amount)).where(
        RejectionRecord.rejection_date >= start_date,
        RejectionRecord.rejection_date <= end_date,
    )
    rej_row = (await db.execute(stmt_rej)).one()
    rejected = float(rej_row[0] or 0)

    stmt_session = select(
        func.count(TreatmentSession.id),
        func.sum(func.cast(TreatmentSession.status == "completed", type_=Integer)),
    ).where(
        TreatmentSession.treatment_date >= start_date,
        TreatmentSession.treatment_date <= end_date,
    )
    sess_row = (await db.execute(stmt_session)).one()
    total_sess = sess_row[0] or 0
    completed_sess = int(sess_row[1] or 0)
    completion_rate = round(completed_sess / total_sess * 100, 2) if total_sess > 0 else 0.0

    return total, ins, self_paid, cnt, rejected, completion_rate


async def get_settlement_summary(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> SettlementSummary:
    today = date.today()
    end = end_date or today
    if start_date:
        start = start_date
    else:
        start = date(end.year, 1, 1)

    curr_total, curr_ins, curr_self, curr_cnt, curr_rej, curr_completion = await _get_range_summary(db, start, end)

    curr_days = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=curr_days - 1)
    if prev_start < date(2020, 1, 1):
        prev_start = date(2020, 1, 1)

    prev_total, _, _, _, prev_rej, prev_completion = await _get_range_summary(db, prev_start, prev_end)

    avg_per_case = round(curr_total / curr_cnt, 2) if curr_cnt else 0.0
    rej_rate = round(curr_rej / curr_total * 100, 2) if curr_total > 0 else 0.0
    prev_rej_rate = round(prev_rej / prev_total * 100, 2) if prev_total > 0 else 0.0

    return SettlementSummary(
        total_settled=round(curr_total, 2),
        total_insurance=round(curr_ins, 2),
        total_self_paid=round(curr_self, 2),
        total_count=curr_cnt,
        avg_per_case=avg_per_case,
        rejected_amount=round(curr_rej, 2),
        rejection_rate=rej_rate,
        completion_rate=curr_completion,
        total_amount_change=_calc_change_pct(curr_total, prev_total),
        rejected_amount_change=_calc_change_pct(curr_rej, prev_rej),
        rejection_rate_change=round(rej_rate - prev_rej_rate, 2),
        completion_rate_change=round(curr_completion - prev_completion, 2),
    )
