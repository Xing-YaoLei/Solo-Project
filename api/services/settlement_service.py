from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy import select, func, Integer, case
from sqlalchemy.ext.asyncio import AsyncSession
import duckdb

from api.models import Settlement, Patient, Department, RejectionRecord, TreatmentSession, RemarkTask
from api.schemas import SettlementTrendPoint, SettlementSummary


def _get_prev_period(period: str, granularity: str) -> str:
    if granularity == "quarterly":
        parts = period.split("-Q")
        year = int(parts[0])
        q = int(parts[1])
        if q == 1:
            return f"{year - 1}-Q4"
        return f"{year - 1}-Q{q - 1}"
    else:
        y, m = map(int, period.split("-"))
        if m == 1:
            return f"{y - 1}-12"
        return f"{y}-{m - 1:02d}"


def _calc_change_pct(curr: float, prev: float) -> float:
    if prev == 0:
        return 0.0 if curr == 0 else 100.0
    return round((curr - prev) / prev * 100, 2)


def _apply_rejection_status_filter(stmt, status: Optional[str], model=RejectionRecord):
    if not status:
        return stmt
    if status == "pending":
        return stmt.where(model.status.in_(["pending", None]))
    elif status == "processing":
        return stmt.where(model.status == "remarked")
    elif status == "resolved":
        return stmt.where(model.status == "concluded")
    return stmt


def _apply_dept_filter(stmt, patient_model, department_id: Optional[int] = None, department: Optional[str] = None):
    if department_id:
        return stmt.where(patient_model.department_id == department_id)
    elif department:
        return stmt.join(Department, patient_model.department_id == Department.id).where(Department.name == department)
    return stmt


async def _get_rejections_by_period(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    granularity: str,
    department_id: Optional[int] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
) -> dict:
    rej_status_expr = case(
        (RemarkTask.status == "resolved", "resolved"),
        (RemarkTask.status == "processing", "processing"),
        else_="pending",
    ).label("task_status")

    stmt = select(
        RejectionRecord,
        rej_status_expr,
    ).select_from(RejectionRecord).join(
        Patient, RejectionRecord.patient_id == Patient.id
    ).outerjoin(RemarkTask, RemarkTask.rejection_id == RejectionRecord.id)
    if start_date:
        stmt = stmt.where(RejectionRecord.rejection_date >= start_date)
    if end_date:
        stmt = stmt.where(RejectionRecord.rejection_date <= end_date)
    stmt = _apply_dept_filter(stmt, Patient, department_id, department)
    stmt = _apply_rejection_status_filter(stmt, status)
    result = await db.execute(stmt)
    rows = result.all()

    grouped: dict[str, dict] = {}
    for r, task_status in rows:
        if granularity == "quarterly":
            q = (r.rejection_date.month - 1) // 3 + 1
            key = f"{r.rejection_date.year}-Q{q}"
        else:
            key = r.rejection_date.strftime("%Y-%m")
        if key not in grouped:
            grouped[key] = {
                "total": 0.0,
                "pending": 0.0,
                "processing": 0.0,
                "resolved": 0.0,
            }
        grouped[key]["total"] += r.amount
        status_key = task_status or "pending"
        if status_key in grouped[key]:
            grouped[key][status_key] += r.amount
    return grouped


async def _get_completion_by_period(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    granularity: str,
    department_id: Optional[int] = None,
    department: Optional[str] = None,
    therapist_id: Optional[int] = None,
    therapist: Optional[str] = None,
) -> dict:
    from api.models import Therapist

    stmt = select(TreatmentSession).join(Patient, TreatmentSession.patient_id == Patient.id)
    if start_date:
        stmt = stmt.where(TreatmentSession.treatment_date >= start_date)
    if end_date:
        stmt = stmt.where(TreatmentSession.treatment_date <= end_date)
    stmt = _apply_dept_filter(stmt, Patient, department_id, department)
    if therapist_id:
        stmt = stmt.where(TreatmentSession.therapist_id == therapist_id)
    elif therapist:
        stmt = stmt.join(Therapist, TreatmentSession.therapist_id == Therapist.id).where(Therapist.name == therapist)

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
    department_id: Optional[int] = None,
    department: Optional[str] = None,
    rejection_status: Optional[str] = None,
) -> List[SettlementTrendPoint]:
    stmt = select(Settlement).join(Patient, Settlement.patient_id == Patient.id)
    if start_date:
        stmt = stmt.where(Settlement.settlement_date >= start_date)
    if end_date:
        stmt = stmt.where(Settlement.settlement_date <= end_date)
    stmt = _apply_dept_filter(stmt, Patient, department_id, department)
    stmt = stmt.order_by(Settlement.settlement_date)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    rejection_by_period = await _get_rejections_by_period(
        db, start_date, end_date, granularity,
        department_id=department_id, department=department,
        status=rejection_status,
    )
    completion_by_period = await _get_completion_by_period(
        db, start_date, end_date, granularity,
        department_id=department_id, department=department,
    )

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
        rej = rejection_by_period.get(period, {})
        rejected = round(rej.get("total", 0.0), 2)
        rejected_pending = round(rej.get("pending", 0.0), 2)
        rejected_processing = round(rej.get("processing", 0.0), 2)
        rejected_resolved = round(rej.get("resolved", 0.0), 2)
        points.append(
            SettlementTrendPoint(
                period=period,
                total_amount=total,
                insurance_amount=round(g["insurance_amount"], 2),
                self_paid_amount=round(g["self_paid_amount"], 2),
                rejected_amount=rejected,
                rejected_pending_amount=rejected_pending,
                rejected_processing_amount=rejected_processing,
                rejected_resolved_amount=rejected_resolved,
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
    department_id: Optional[int] = None,
    department: Optional[str] = None,
    rejection_status: Optional[str] = None,
) -> List[SettlementTrendPoint]:
    settle_stmt = select(
        Settlement.settlement_date,
        Settlement.total_amount,
        Settlement.insurance_amount,
        Settlement.self_paid_amount,
    ).join(Patient, Settlement.patient_id == Patient.id)
    if start_date:
        settle_stmt = settle_stmt.where(Settlement.settlement_date >= start_date)
    if end_date:
        settle_stmt = settle_stmt.where(Settlement.settlement_date <= end_date)
    settle_stmt = _apply_dept_filter(settle_stmt, Patient, department_id, department)
    settle_result = await db.execute(settle_stmt)
    settle_rows = settle_result.all()

    if not settle_rows:
        return []

    from api.models import Therapist

    session_stmt = select(
        TreatmentSession.treatment_date,
        TreatmentSession.status,
    ).join(Patient, TreatmentSession.patient_id == Patient.id)
    if start_date:
        session_stmt = session_stmt.where(TreatmentSession.treatment_date >= start_date)
    if end_date:
        session_stmt = session_stmt.where(TreatmentSession.treatment_date <= end_date)
    session_stmt = _apply_dept_filter(session_stmt, Patient, department_id, department)
    session_result = await db.execute(session_stmt)
    session_rows = session_result.all()

    rejection_stmt = select(
        RejectionRecord.rejection_date,
        RejectionRecord.amount,
        RejectionRecord.status,
        RemarkTask.status.label("task_status"),
    ).join(Patient, RejectionRecord.patient_id == Patient.id
    ).outerjoin(RemarkTask, RemarkTask.rejection_id == RejectionRecord.id)
    if start_date:
        rejection_stmt = rejection_stmt.where(RejectionRecord.rejection_date >= start_date)
    if end_date:
        rejection_stmt = rejection_stmt.where(RejectionRecord.rejection_date <= end_date)
    rejection_stmt = _apply_dept_filter(rejection_stmt, Patient, department_id, department)
    if rejection_status:
        if rejection_status == "pending":
            rejection_stmt = rejection_stmt.where(RejectionRecord.status.in_(["pending", None]))
        elif rejection_status == "processing":
            rejection_stmt = rejection_stmt.where(RejectionRecord.status == "remarked")
        elif rejection_status == "resolved":
            rejection_stmt = rejection_stmt.where(RejectionRecord.status == "concluded")
    rejection_result = await db.execute(rejection_stmt)
    rejection_rows = rejection_result.all()

    con = duckdb.connect(":memory:")

    con.execute(
        "CREATE TABLE settlements (settlement_date DATE, total_amount DOUBLE, insurance_amount DOUBLE, self_paid_amount DOUBLE)"
    )
    con.executemany(
        "INSERT INTO settlements VALUES (?, ?, ?, ?)",
        [
            (
                r.settlement_date.isoformat(),
                r.total_amount,
                r.insurance_amount,
                r.self_paid_amount,
            )
            for r in settle_rows
        ],
    )

    con.execute(
        "CREATE TABLE treatment_sessions (treatment_date DATE, status VARCHAR)"
    )
    con.executemany(
        "INSERT INTO treatment_sessions VALUES (?, ?)",
        [
            (
                r.treatment_date.isoformat(),
                r.status,
            )
            for r in session_rows
        ],
    )

    con.execute(
        "CREATE TABLE rejection_records (rejection_date DATE, amount DOUBLE, status VARCHAR, task_status VARCHAR)"
    )
    con.executemany(
        "INSERT INTO rejection_records VALUES (?, ?, ?, ?)",
        [
            (
                r.rejection_date.isoformat(),
                r.amount,
                r.status or "pending",
                r.task_status or "pending",
            )
            for r in rejection_rows
        ],
    )

    if granularity == "quarterly":
        settle_period = "strftime(settlement_date, '%Y') || '-Q' || CAST(((MONTH(settlement_date) - 1) // 3 + 1) AS VARCHAR)"
        session_period = "strftime(treatment_date, '%Y') || '-Q' || CAST(((MONTH(treatment_date) - 1) // 3 + 1) AS VARCHAR)"
        rejection_period = "strftime(rejection_date, '%Y') || '-Q' || CAST(((MONTH(rejection_date) - 1) // 3 + 1) AS VARCHAR)"
    else:
        settle_period = "strftime(settlement_date, '%Y-%m')"
        session_period = "strftime(treatment_date, '%Y-%m')"
        rejection_period = "strftime(rejection_date, '%Y-%m')"

    olap_sql = f"""
        WITH settle AS (
            SELECT {settle_period} AS period,
                   SUM(total_amount) AS total_amount,
                   SUM(insurance_amount) AS insurance_amount,
                   SUM(self_paid_amount) AS self_paid_amount,
                   COUNT(*) AS cnt
            FROM settlements
            GROUP BY period
        ),
        rej AS (
            SELECT {rejection_period} AS period,
                   SUM(amount) AS rejected_amount,
                   SUM(CASE WHEN task_status = 'pending' OR task_status IS NULL THEN amount ELSE 0 END) AS rejected_pending_amount,
                   SUM(CASE WHEN task_status = 'processing' THEN amount ELSE 0 END) AS rejected_processing_amount,
                   SUM(CASE WHEN task_status = 'resolved' THEN amount ELSE 0 END) AS rejected_resolved_amount
            FROM rejection_records
            GROUP BY period
        ),
        sess AS (
            SELECT {session_period} AS period,
                   COUNT(*) AS total_sessions,
                   SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions
            FROM treatment_sessions
            GROUP BY period
        )
        SELECT s.period,
               s.total_amount,
               s.insurance_amount,
               s.self_paid_amount,
               s.cnt,
               COALESCE(r.rejected_amount, 0) AS rejected_amount,
               COALESCE(r.rejected_pending_amount, 0) AS rejected_pending_amount,
               COALESCE(r.rejected_processing_amount, 0) AS rejected_processing_amount,
               COALESCE(r.rejected_resolved_amount, 0) AS rejected_resolved_amount,
               CASE
                   WHEN s.total_amount > 0 THEN ROUND(COALESCE(r.rejected_amount, 0) / s.total_amount * 100, 2)
                   ELSE 0.0
               END AS rejection_rate,
               CASE
                   WHEN COALESCE(sess.total_sessions, 0) > 0 THEN ROUND(COALESCE(sess.completed_sessions, 0) * 100.0 / sess.total_sessions, 2)
                   ELSE 0.0
               END AS completion_rate
        FROM settle s
        LEFT JOIN rej r ON s.period = r.period
        LEFT JOIN sess ON s.period = sess.period
        ORDER BY s.period
    """
    olap_result = con.execute(olap_sql).fetchall()
    con.close()

    points = []
    for r in olap_result:
        points.append(
            SettlementTrendPoint(
                period=r[0],
                total_amount=round(r[1], 2),
                insurance_amount=round(r[2], 2),
                self_paid_amount=round(r[3], 2),
                rejected_amount=round(r[5], 2),
                rejected_pending_amount=round(r[6], 2),
                rejected_processing_amount=round(r[7], 2),
                rejected_resolved_amount=round(r[8], 2),
                rejection_rate=float(r[9]),
                completion_rate=float(r[10]),
                count=r[4],
            )
        )
    return points


async def _get_range_summary(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    department_id: Optional[int] = None,
    department: Optional[str] = None,
    rejection_status: Optional[str] = None,
) -> Tuple[float, float, float, int, float, float, float, float, float]:
    stmt_settle = select(
        func.sum(Settlement.total_amount),
        func.sum(Settlement.insurance_amount),
        func.sum(Settlement.self_paid_amount),
        func.count(Settlement.id),
    ).join(Patient, Settlement.patient_id == Patient.id).where(
        Settlement.settlement_date >= start_date,
        Settlement.settlement_date <= end_date,
    )
    stmt_settle = _apply_dept_filter(stmt_settle, Patient, department_id, department)
    row = (await db.execute(stmt_settle)).one()
    total = float(row[0] or 0)
    ins = float(row[1] or 0)
    self_paid = float(row[2] or 0)
    cnt = row[3] or 0

    rej_status_expr = case(
        (RemarkTask.status == "resolved", "resolved"),
        (RemarkTask.status == "processing", "processing"),
        else_="pending",
    )
    stmt_rej = select(
        func.sum(RejectionRecord.amount),
        func.sum(func.cast(rej_status_expr == "pending", type_=Integer) * RejectionRecord.amount),
        func.sum(func.cast(rej_status_expr == "processing", type_=Integer) * RejectionRecord.amount),
        func.sum(func.cast(rej_status_expr == "resolved", type_=Integer) * RejectionRecord.amount),
    ).select_from(RejectionRecord).join(
        Patient, RejectionRecord.patient_id == Patient.id
    ).outerjoin(RemarkTask, RemarkTask.rejection_id == RejectionRecord.id).where(
        RejectionRecord.rejection_date >= start_date,
        RejectionRecord.rejection_date <= end_date,
    )
    stmt_rej = _apply_dept_filter(stmt_rej, Patient, department_id, department)
    stmt_rej = _apply_rejection_status_filter(stmt_rej, rejection_status)
    rej_row = (await db.execute(stmt_rej)).one()
    rejected = float(rej_row[0] or 0)
    rejected_pending = float(rej_row[1] or 0)
    rejected_processing = float(rej_row[2] or 0)
    rejected_resolved = float(rej_row[3] or 0)

    stmt_session = select(
        func.count(TreatmentSession.id),
        func.sum(func.cast(TreatmentSession.status == "completed", type_=Integer)),
    ).join(Patient, TreatmentSession.patient_id == Patient.id).where(
        TreatmentSession.treatment_date >= start_date,
        TreatmentSession.treatment_date <= end_date,
    )
    stmt_session = _apply_dept_filter(stmt_session, Patient, department_id, department)
    sess_row = (await db.execute(stmt_session)).one()
    total_sess = sess_row[0] or 0
    completed_sess = int(sess_row[1] or 0)
    completion_rate = round(completed_sess / total_sess * 100, 2) if total_sess > 0 else 0.0

    return total, ins, self_paid, cnt, rejected, completion_rate, rejected_pending, rejected_processing, rejected_resolved


async def get_settlement_summary(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    department_id: Optional[int] = None,
    department: Optional[str] = None,
    rejection_status: Optional[str] = None,
) -> SettlementSummary:
    today = date.today()
    end = end_date or today
    if start_date:
        start = start_date
    else:
        start = date(end.year, 1, 1)

    curr_total, curr_ins, curr_self, curr_cnt, curr_rej, curr_completion, curr_pending, curr_processing, curr_resolved = await _get_range_summary(
        db, start, end, department_id, department, rejection_status
    )

    curr_days = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=curr_days - 1)
    if prev_start < date(2020, 1, 1):
        prev_start = date(2020, 1, 1)

    prev_total, _, _, _, prev_rej, prev_completion, _, _, _ = await _get_range_summary(
        db, prev_start, prev_end, department_id, department, rejection_status
    )

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
        rejected_pending_amount=round(curr_pending, 2),
        rejected_processing_amount=round(curr_processing, 2),
        rejected_resolved_amount=round(curr_resolved, 2),
        rejection_rate=rej_rate,
        completion_rate=curr_completion,
        total_amount_change=_calc_change_pct(curr_total, prev_total),
        rejected_amount_change=_calc_change_pct(curr_rej, prev_rej),
        rejection_rate_change=round(rej_rate - prev_rej_rate, 2),
        completion_rate_change=round(curr_completion - prev_completion, 2),
    )
