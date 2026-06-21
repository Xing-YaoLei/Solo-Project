from datetime import date, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.duckdb_client import duckdb_client
from app.models.case import Case, CaseStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment_schedule import PaymentSchedule, PaymentStatus
from app.schemas.auth import CurrentUser
from app.schemas.report import (
    CaseStatusSummary,
    CollectionForecast,
    LawyerPerformance,
    ReportData,
    ReportRequest,
    ReportType,
    RevenueByPeriod,
)
from app.services.permission_service import PermissionService


class ReportService:
    @staticmethod
    async def generate_report(
        db: AsyncSession,
        report_request: ReportRequest,
        current_user: CurrentUser,
    ) -> ReportData:
        PermissionService.is_assistant_or_above(current_user)

        start_date = report_request.start_date or date(2020, 1, 1)
        end_date = report_request.end_date or date.today()

        report_generators = {
            ReportType.CASE_SUMMARY: ReportService._generate_case_summary,
            ReportType.REVENUE_ANALYSIS: ReportService._generate_revenue_analysis,
            ReportType.COLLECTION_FORECAST: ReportService._generate_collection_forecast,
            ReportType.APPROVAL_STATUS: ReportService._generate_approval_status,
            ReportType.LAWYER_PERFORMANCE: ReportService._generate_lawyer_performance,
        }

        generator = report_generators.get(report_request.report_type)
        if not generator:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported report type: {report_request.report_type}",
            )

        return await generator(
            db,
            start_date,
            end_date,
            report_request.case_id,
            report_request.lawyer_id,
            report_request.parameters,
        )

    @staticmethod
    async def _generate_case_summary(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_id: UUID | None,
        lawyer_id: UUID | None,
        parameters: dict[str, Any],
    ) -> ReportData:
        query = select(
            Case.status,
            func.count(Case.id).label("count"),
            func.sum(Case.actual_amount).label("total_amount"),
        ).where(
            and_(
                Case.created_at >= start_date,
                Case.created_at <= end_date,
            )
        )

        if case_id:
            query = query.where(Case.id == case_id)
        if lawyer_id:
            query = query.where(Case.lawyer_id == lawyer_id)

        query = query.group_by(Case.status)
        result = await db.execute(query)
        rows = result.all()

        details = [
            CaseStatusSummary(
                status=row.status.value if hasattr(row.status, "value") else row.status,
                count=row.count,
                total_amount=float(row.total_amount or 0),
            ).model_dump()
            for row in rows
        ]

        summary = {
            "total_cases": sum(d["count"] for d in details),
            "total_amount": sum(d["total_amount"] for d in details),
            "active_cases": sum(d["count"] for d in details if d["status"] == CaseStatus.ACTIVE),
            "closed_cases": sum(d["count"] for d in details if d["status"] == CaseStatus.CLOSED),
        }

        return ReportData(
            report_type=ReportType.CASE_SUMMARY,
            generated_at=datetime.now(),
            period_start=start_date,
            period_end=end_date,
            summary=summary,
            details=details,
        )

    @staticmethod
    async def _generate_revenue_analysis(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_id: UUID | None,
        lawyer_id: UUID | None,
        parameters: dict[str, Any],
    ) -> ReportData:
        query = """
            SELECT
                DATE_TRUNC('month', i.invoice_date) as period,
                SUM(c.quoted_amount) as quoted_amount,
                SUM(c.actual_amount) as actual_amount,
                SUM(i.amount) as invoiced_amount,
                SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as collected_amount
            FROM cases c
            LEFT JOIN invoices i ON c.id = i.case_id
            WHERE i.invoice_date BETWEEN $1 AND $2
        """
        params: list[Any] = [start_date, end_date]

        if case_id:
            query += " AND c.id = $3"
            params.append(case_id)
        if lawyer_id:
            query += " AND c.lawyer_id = $4"
            params.append(lawyer_id)

        query += " GROUP BY period ORDER BY period"

        duckdb_result = await duckdb_client.fetch_all(query, params)
        details = [
            RevenueByPeriod(
                period=row[0].strftime("%Y-%m") if row[0] else "Unknown",
                quoted_amount=float(row[1] or 0),
                actual_amount=float(row[2] or 0),
                invoiced_amount=float(row[3] or 0),
                collected_amount=float(row[4] or 0),
            ).model_dump()
            for row in duckdb_result
        ]

        summary = {
            "total_quoted": sum(d["quoted_amount"] for d in details),
            "total_actual": sum(d["actual_amount"] for d in details),
            "total_invoiced": sum(d["invoiced_amount"] for d in details),
            "total_collected": sum(d["collected_amount"] for d in details),
            "collection_rate": (
                sum(d["collected_amount"] for d in details) / sum(d["invoiced_amount"] for d in details)
                if sum(d["invoiced_amount"] for d in details) > 0
                else 0
            ),
        }

        return ReportData(
            report_type=ReportType.REVENUE_ANALYSIS,
            generated_at=datetime.now(),
            period_start=start_date,
            period_end=end_date,
            summary=summary,
            details=details,
        )

    @staticmethod
    async def _generate_collection_forecast(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_id: UUID | None,
        lawyer_id: UUID | None,
        parameters: dict[str, Any],
    ) -> ReportData:
        query = select(
            PaymentSchedule.due_date,
            PaymentSchedule.amount,
            PaymentSchedule.status,
            PaymentSchedule.case_id,
            Case.name.label("case_name"),
        ).join(
            Case,
            PaymentSchedule.case_id == Case.id,
        ).where(
            and_(
                PaymentSchedule.due_date >= start_date,
                PaymentSchedule.due_date <= end_date,
            )
        )

        if case_id:
            query = query.where(PaymentSchedule.case_id == case_id)
        if lawyer_id:
            query = query.where(Case.lawyer_id == lawyer_id)

        query = query.order_by(PaymentSchedule.due_date)
        result = await db.execute(query)
        rows = result.all()

        today = date.today()
        details = [
            CollectionForecast(
                due_date=row.due_date,
                expected_amount=float(row.amount),
                overdue_amount=float(row.amount) if row.due_date < today and row.status != PaymentStatus.PAID else 0,
                case_id=row.case_id,
                case_name=row.case_name,
            ).model_dump()
            for row in rows
        ]

        summary = {
            "total_expected": sum(d["expected_amount"] for d in details),
            "total_overdue": sum(d["overdue_amount"] for d in details),
            "upcoming_30_days": sum(
                d["expected_amount"] for d in details
                if (d["due_date"] - today).days <= 30 and d["due_date"] >= today
            ),
            "upcoming_90_days": sum(
                d["expected_amount"] for d in details
                if (d["due_date"] - today).days <= 90 and d["due_date"] >= today
            ),
        }

        return ReportData(
            report_type=ReportType.COLLECTION_FORECAST,
            generated_at=datetime.now(),
            period_start=start_date,
            period_end=end_date,
            summary=summary,
            details=details,
        )

    @staticmethod
    async def _generate_approval_status(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_id: UUID | None,
        lawyer_id: UUID | None,
        parameters: dict[str, Any],
    ) -> ReportData:
        from app.models.approval_node import ApprovalNode, ApprovalStatus

        query = select(
            ApprovalNode.status,
            func.count(ApprovalNode.id).label("count"),
            func.avg(
                func.extract(
                    "epoch",
                    func.coalesce(
                        ApprovalNode.actual_complete_time,
                        func.now(),
                    ) - ApprovalNode.submit_time,
                ) / 86400
            ).label("avg_days"),
        ).where(
            and_(
                ApprovalNode.submit_time >= start_date,
                ApprovalNode.submit_time <= end_date,
            )
        ).join(
            Case,
            ApprovalNode.case_id == Case.id,
        )

        if case_id:
            query = query.where(ApprovalNode.case_id == case_id)
        if lawyer_id:
            query = query.where(Case.lawyer_id == lawyer_id)

        query = query.group_by(ApprovalNode.status)
        result = await db.execute(query)
        rows = result.all()

        details = [
            {
                "status": row.status.value if hasattr(row.status, "value") else row.status,
                "count": row.count,
                "avg_days": float(row.avg_days or 0),
            }
            for row in rows
        ]

        summary = {
            "total_approvals": sum(d["count"] for d in details),
            "pending_count": sum(d["count"] for d in details if d["status"] == ApprovalStatus.PENDING),
            "approved_count": sum(d["count"] for d in details if d["status"] == ApprovalStatus.APPROVED),
            "rejected_count": sum(d["count"] for d in details if d["status"] == ApprovalStatus.REJECTED),
            "avg_approval_days": sum(d["avg_days"] for d in details) / len(details) if details else 0,
        }

        return ReportData(
            report_type=ReportType.APPROVAL_STATUS,
            generated_at=datetime.now(),
            period_start=start_date,
            period_end=end_date,
            summary=summary,
            details=details,
        )

    @staticmethod
    async def _generate_lawyer_performance(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_id: UUID | None,
        lawyer_id: UUID | None,
        parameters: dict[str, Any],
    ) -> ReportData:
        from app.models.user import User
        from app.models.approval_node import ApprovalNode

        query = select(
            User.id.label("lawyer_id"),
            User.name.label("lawyer_name"),
            func.count(Case.id).label("case_count"),
            func.sum(Case.actual_amount).label("total_revenue"),
        ).select_from(
            User,
        ).join(
            Case,
            Case.lawyer_id == User.id,
        ).where(
            and_(
                Case.created_at >= start_date,
                Case.created_at <= end_date,
            )
        )

        if lawyer_id:
            query = query.where(User.id == lawyer_id)

        query = query.group_by(User.id, User.name)
        result = await db.execute(query)
        rows = result.all()

        details = []
        for row in rows:
            paid_invoices = await db.execute(
                select(func.sum(Invoice.amount))
                .join(Case, Invoice.case_id == Case.id)
                .where(
                    and_(
                        Case.lawyer_id == row.lawyer_id,
                        Invoice.status == InvoiceStatus.PAID,
                        Invoice.invoice_date >= start_date,
                        Invoice.invoice_date <= end_date,
                    )
                )
            )
            total_invoices = await db.execute(
                select(func.sum(Invoice.amount))
                .join(Case, Invoice.case_id == Case.id)
                .where(
                    and_(
                        Case.lawyer_id == row.lawyer_id,
                        Invoice.invoice_date >= start_date,
                        Invoice.invoice_date <= end_date,
                    )
                )
            )
            paid_amount = float(paid_invoices.scalar() or 0)
            total_amount = float(total_invoices.scalar() or 0)
            collection_rate = paid_amount / total_amount if total_amount > 0 else 0

            approval_days = await db.execute(
                select(
                    func.avg(
                        func.extract(
                            "epoch",
                            func.coalesce(
                                ApprovalNode.actual_complete_time,
                                func.now(),
                            ) - ApprovalNode.submit_time,
                        ) / 86400
                    )
                ).join(Case, ApprovalNode.case_id == Case.id)
                .where(
                    and_(
                        Case.lawyer_id == row.lawyer_id,
                        ApprovalNode.submit_time >= start_date,
                        ApprovalNode.submit_time <= end_date,
                    )
                )
            )
            avg_approval_days = float(approval_days.scalar() or 0)

            details.append(
                LawyerPerformance(
                    lawyer_id=row.lawyer_id,
                    lawyer_name=row.lawyer_name,
                    case_count=row.case_count,
                    total_revenue=float(row.total_revenue or 0),
                    collection_rate=collection_rate,
                    avg_approval_days=avg_approval_days,
                ).model_dump()
            )

        summary = {
            "total_lawyers": len(details),
            "total_cases": sum(d["case_count"] for d in details),
            "total_revenue": sum(d["total_revenue"] for d in details),
            "avg_collection_rate": (
                sum(d["collection_rate"] for d in details) / len(details) if details else 0
            ),
        }

        return ReportData(
            report_type=ReportType.LAWYER_PERFORMANCE,
            generated_at=datetime.now(),
            period_start=start_date,
            period_end=end_date,
            summary=summary,
            details=details,
        )
