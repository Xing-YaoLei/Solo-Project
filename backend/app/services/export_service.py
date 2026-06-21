from datetime import date, datetime
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval_node import ApprovalNode
from app.models.case import Case
from app.models.invoice import Invoice, InvoiceItem
from app.models.payment_schedule import PaymentSchedule
from app.models.user import UserRole
from app.schemas.auth import CurrentUser
from app.schemas.export import ExportFormat, ExportRequest, ExportResponse, ExportType
from app.services.permission_service import PermissionService
from app.utils.export_helper import export_data
from app.utils.payment_cycle import get_role_label


class ExportService:
    @staticmethod
    def _get_user_info(current_user: CurrentUser) -> str:
        role_label = get_role_label(current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role))
        return f"{current_user.name}({role_label})"

    @staticmethod
    def _filter_data_by_role(
        data: dict[str, list[dict[str, Any]]],
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        role = current_user.role.value if hasattr(current_user.role, "value") else current_user.role

        if role in (UserRole.PARTNER.value, UserRole.LAWYER.value):
            return data

        filtered_data: dict[str, list[dict[str, Any]]] = {}

        for sheet_name, records in data.items():
            if not records:
                filtered_data[sheet_name] = records
                continue

            filtered_records: list[dict[str, Any]] = []

            for record in records:
                filtered_record = record.copy()

                if role == UserRole.ASSISTANT.value:
                    filtered_record.pop("quoted_amount", None)
                    filtered_record.pop("actual_amount", None)
                    filtered_record.pop("profit_margin", None)
                    filtered_record.pop("internal_notes", None)
                elif role == UserRole.CLIENT.value:
                    filtered_record.pop("lawyer_id", None)
                    filtered_record.pop("internal_notes", None)
                    filtered_record.pop("quoted_amount", None)
                    filtered_record.pop("cost_amount", None)
                    filtered_record.pop("profit_margin", None)

                filtered_records.append(filtered_record)

            filtered_data[sheet_name] = filtered_records

        return filtered_data

    @staticmethod
    async def create_export(
        db: AsyncSession,
        export_request: ExportRequest,
        current_user: CurrentUser,
        base_url: str = "http://localhost:8000",
    ) -> ExportResponse:
        PermissionService.can_export(current_user)

        export_id = uuid4()
        timestamp = datetime.now()

        response = ExportResponse(
            export_id=export_id,
            export_type=export_request.export_type,
            format=export_request.format,
            status="processing",
            created_at=timestamp,
        )

        try:
            data = await ExportService._collect_data(
                db,
                export_request,
                current_user,
            )

            data = ExportService._filter_data_by_role(data, current_user)

            user_info = ExportService._get_user_info(current_user)

            output_path, file_size = export_data(
                data,
                export_request.export_type.value,
                export_request.format,
                user_info=user_info,
                include_payment_cycle=True,
            )

            file_name = output_path.split("/")[-1]
            download_url = f"{base_url}/api/export/download/{file_name}"

            response.status = "completed"
            response.started_at = timestamp
            response.completed_at = datetime.now()
            response.file_name = file_name
            response.file_size = file_size
            response.download_url = download_url

        except Exception as e:
            response.status = "failed"
            response.error_message = str(e)
            response.completed_at = datetime.now()

        return response

    @staticmethod
    async def _collect_data(
        db: AsyncSession,
        export_request: ExportRequest,
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        start_date = export_request.start_date or date(2020, 1, 1)
        end_date = export_request.end_date or date.today()

        data_collectors = {
            ExportType.CASES: ExportService._collect_cases_data,
            ExportType.INVOICES: ExportService._collect_invoices_data,
            ExportType.PAYMENTS: ExportService._collect_payments_data,
            ExportType.APPROVALS: ExportService._collect_approvals_data,
            ExportType.FULL_REPORT: ExportService._collect_full_report_data,
        }

        collector = data_collectors.get(export_request.export_type)
        if not collector:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported export type: {export_request.export_type}",
            )

        return await collector(
            db,
            start_date,
            end_date,
            export_request.case_ids,
            export_request.hide_sensitive,
            current_user,
        )

    @staticmethod
    async def _collect_cases_data(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_ids: list[UUID] | None,
        hide_sensitive: bool,
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        query = select(Case).where(
            and_(
                Case.created_at >= start_date,
                Case.created_at <= end_date,
            )
        )

        if case_ids:
            query = query.where(Case.id.in_(case_ids))

        if not PermissionService.is_admin(current_user):
            query = query.where(Case.lawyer_id == current_user.id)

        result = await db.execute(query)
        cases = result.scalars().all()

        cases_data = []
        for case in cases:
            case_dict = {
                "id": str(case.id),
                "case_no": case.case_no,
                "name": case.name,
                "case_type": case.case_type,
                "status": case.status.value if hasattr(case.status, "value") else case.status,
                "created_at": case.created_at.isoformat(),
            }
            if not hide_sensitive:
                case_dict["quoted_amount"] = float(case.quoted_amount)
                case_dict["actual_amount"] = float(case.actual_amount)

            cases_data.append(case_dict)

        return {"cases": cases_data}

    @staticmethod
    async def _collect_invoices_data(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_ids: list[UUID] | None,
        hide_sensitive: bool,
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        query = select(Invoice).where(
            and_(
                Invoice.invoice_date >= start_date,
                Invoice.invoice_date <= end_date,
            )
        ).join(Case, Invoice.case_id == Case.id)

        if case_ids:
            query = query.where(Invoice.case_id.in_(case_ids))

        if not PermissionService.is_admin(current_user):
            query = query.where(Case.lawyer_id == current_user.id)

        result = await db.execute(query)
        invoices = result.scalars().all()

        invoices_data = []
        items_data = []

        for invoice in invoices:
            invoice_dict = {
                "id": str(invoice.id),
                "invoice_no": invoice.invoice_no,
                "case_id": str(invoice.case_id),
                "amount": float(invoice.amount),
                "status": invoice.status.value if hasattr(invoice.status, "value") else invoice.status,
                "invoice_date": invoice.invoice_date.isoformat(),
                "source": invoice.source.value if hasattr(invoice.source, "value") else invoice.source,
                "created_at": invoice.created_at.isoformat(),
            }
            invoices_data.append(invoice_dict)

            items_query = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id)
            items_result = await db.execute(items_query)
            items = items_result.scalars().all()

            for item in items:
                item_dict = {
                    "id": str(item.id),
                    "invoice_id": str(item.invoice_id),
                    "item_name": item.item_name,
                    "description": item.description,
                    "quantity": float(item.quantity),
                    "unit_price": float(item.unit_price),
                    "amount": float(item.amount),
                    "fee_type": item.fee_type,
                }
                items_data.append(item_dict)

        return {"invoices": invoices_data, "invoice_items": items_data}

    @staticmethod
    async def _collect_payments_data(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_ids: list[UUID] | None,
        hide_sensitive: bool,
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        query = select(PaymentSchedule).join(
            Case, PaymentSchedule.case_id == Case.id
        ).where(
            and_(
                PaymentSchedule.due_date >= start_date,
                PaymentSchedule.due_date <= end_date,
            )
        )

        if case_ids:
            query = query.where(PaymentSchedule.case_id.in_(case_ids))

        if not PermissionService.is_admin(current_user):
            query = query.where(Case.lawyer_id == current_user.id)

        result = await db.execute(query)
        payments = result.scalars().all()

        payments_data = []
        for payment in payments:
            payment_dict = {
                "id": str(payment.id),
                "case_id": str(payment.case_id),
                "phase": payment.phase,
                "phase_name": payment.phase_name,
                "amount": float(payment.amount),
                "due_date": payment.due_date.isoformat(),
                "actual_payment_date": payment.actual_payment_date.isoformat() if payment.actual_payment_date else None,
                "status": payment.status.value if hasattr(payment.status, "value") else payment.status,
                "payment_cycle_type": payment.payment_cycle_type.value if hasattr(payment.payment_cycle_type, "value") else payment.payment_cycle_type,
            }
            payments_data.append(payment_dict)

        return {"payment_schedules": payments_data}

    @staticmethod
    async def _collect_approvals_data(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_ids: list[UUID] | None,
        hide_sensitive: bool,
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        query = select(ApprovalNode).join(
            Case, ApprovalNode.case_id == Case.id
        ).where(
            and_(
                ApprovalNode.submit_time >= start_date,
                ApprovalNode.submit_time <= end_date,
            )
        )

        if case_ids:
            query = query.where(ApprovalNode.case_id.in_(case_ids))

        if not PermissionService.is_admin(current_user):
            query = query.where(Case.lawyer_id == current_user.id)

        result = await db.execute(query)
        approvals = result.scalars().all()

        approvals_data = []
        for approval in approvals:
            approval_dict = {
                "id": str(approval.id),
                "case_id": str(approval.case_id),
                "node_name": approval.node_name,
                "approver_id": str(approval.approver_id),
                "order_index": approval.order_index,
                "submit_time": approval.submit_time.isoformat(),
                "expected_complete_time": approval.expected_complete_time.isoformat(),
                "actual_complete_time": approval.actual_complete_time.isoformat() if approval.actual_complete_time else None,
                "status": approval.status.value if hasattr(approval.status, "value") else approval.status,
                "reason": approval.reason,
            }
            approvals_data.append(approval_dict)

        return {"approval_nodes": approvals_data}

    @staticmethod
    async def _collect_full_report_data(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        case_ids: list[UUID] | None,
        hide_sensitive: bool,
        current_user: CurrentUser,
    ) -> dict[str, list[dict[str, Any]]]:
        data: dict[str, list[dict[str, Any]]] = {}

        cases_data = await ExportService._collect_cases_data(
            db, start_date, end_date, case_ids, hide_sensitive, current_user
        )
        data.update(cases_data)

        invoices_data = await ExportService._collect_invoices_data(
            db, start_date, end_date, case_ids, hide_sensitive, current_user
        )
        data.update(invoices_data)

        payments_data = await ExportService._collect_payments_data(
            db, start_date, end_date, case_ids, hide_sensitive, current_user
        )
        data.update(payments_data)

        approvals_data = await ExportService._collect_approvals_data(
            db, start_date, end_date, case_ids, hide_sensitive, current_user
        )
        data.update(approvals_data)

        return data

    @staticmethod
    async def get_export_progress(
        export_id: UUID,
        current_user: CurrentUser,
    ) -> dict[str, Any]:
        PermissionService.is_assistant_or_above(current_user)

        return {
            "export_id": export_id,
            "status": "completed",
            "progress": 100,
            "message": "导出完成",
        }

    @staticmethod
    async def get_export_history(
        db: AsyncSession,
        current_user: CurrentUser,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        PermissionService.is_assistant_or_above(current_user)

        from app.models.user import User

        query = (
            select(User)
            .where(User.id == current_user.id)
            .limit(limit)
            .order_by(User.created_at.desc())
        )

        result = await db.execute(query)
        users = result.scalars().all()

        history: list[dict[str, Any]] = []
        for user in users:
            history.append({
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
            })

        return history

    @staticmethod
    async def cancel_export(
        export_id: UUID,
        current_user: CurrentUser,
    ) -> dict[str, Any]:
        PermissionService.is_assistant_or_above(current_user)

        return {
            "export_id": export_id,
            "status": "cancelled",
            "message": "导出已取消",
        }
