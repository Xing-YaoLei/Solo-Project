from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

try:
    import mailparser
    MAILPARSER_AVAILABLE = True
except ImportError:
    MAILPARSER_AVAILABLE = False
    mailparser = None

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.duckdb_client import duckdb_client
from app.models.case import Case
from app.models.data_sync_log import DataSyncLog, SyncStatus, SyncType
from app.models.email_attachment import EmailAttachment
from app.models.invoice import Invoice
from app.schemas.auth import CurrentUser
from app.services.permission_service import PermissionService


class DataSyncService:
    @staticmethod
    async def sync_from_email(
        db: AsyncSession,
        email_file_path: str,
        current_user: CurrentUser,
    ) -> dict[str, Any]:
        PermissionService.is_assistant_or_above(current_user)

        if not MAILPARSER_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="mailparser library is not installed. Email sync functionality is unavailable.",
            )

        sync_id = uuid4()
        sync_log = DataSyncLog(
            id=sync_id,
            source_system="email",
            sync_type=SyncType.INCREMENTAL,
            status=SyncStatus.RUNNING,
        )
        db.add(sync_log)
        await db.commit()

        try:
            with open(email_file_path, "rb") as f:
                email_content = f.read()

            mail = mailparser.parse_from_bytes(email_content)

            records_processed = 0
            for attachment in mail.attachments:
                if "pdf" in attachment["mail_content_type"].lower() or \
                   "excel" in attachment["mail_content_type"].lower() or \
                   attachment["filename"].endswith((".pdf", ".xlsx", ".xls")):

                    email_attachment = EmailAttachment(
                        message_id=mail.message_id or str(uuid4()),
                        subject=mail.subject,
                        sender=mail.from_[0][1] if mail.from_ else None,
                        received_at=datetime.now(),
                        file_name=attachment["filename"],
                        file_path=f"/tmp/{attachment['filename']}",
                        hash=str(hash(attachment["payload"])),
                    )
                    db.add(email_attachment)
                    records_processed += 1

            sync_log.records_processed = records_processed
            sync_log.status = SyncStatus.COMPLETED
            sync_log.completed_at = datetime.now()
            await db.commit()

            return {
                "sync_id": sync_id,
                "status": "completed",
                "records_processed": records_processed,
            }

        except Exception as e:
            sync_log.status = SyncStatus.FAILED
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now()
            await db.commit()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Email sync failed: {str(e)}",
            )

    @staticmethod
    async def sync_to_duckdb(
        db: AsyncSession,
        sync_type: SyncType = SyncType.INCREMENTAL,
        current_user: CurrentUser | None = None,
    ) -> dict[str, Any]:
        if current_user:
            PermissionService.is_assistant_or_above(current_user)

        sync_id = uuid4()
        sync_log = DataSyncLog(
            id=sync_id,
            source_system="postgresql_to_duckdb",
            sync_type=sync_type,
            status=SyncStatus.RUNNING,
        )
        db.add(sync_log)
        await db.commit()

        try:
            records_processed = 0

            cases_result = await db.execute(select("*").select_from(Case))
            cases = cases_result.all()
            cases_df = [dict(row._mapping) for row in cases]
            if cases_df:
                import pandas as pd
                df = pd.DataFrame(cases_df)
                await duckdb_client.execute("DROP TABLE IF EXISTS cases")
                await duckdb_client.register_table("cases_temp", df)
                await duckdb_client.execute("CREATE TABLE cases AS SELECT * FROM cases_temp")
                records_processed += len(cases_df)

            invoices_result = await db.execute(select("*").select_from(Invoice))
            invoices = invoices_result.all()
            invoices_df = [dict(row._mapping) for row in invoices]
            if invoices_df:
                import pandas as pd
                df = pd.DataFrame(invoices_df)
                await duckdb_client.execute("DROP TABLE IF EXISTS invoices")
                await duckdb_client.register_table("invoices_temp", df)
                await duckdb_client.execute("CREATE TABLE invoices AS SELECT * FROM invoices_temp")
                records_processed += len(invoices_df)

            await duckdb_client.execute("""
                CREATE OR REPLACE VIEW case_financial_summary AS
                SELECT
                    c.id as case_id,
                    c.case_no,
                    c.name,
                    c.status,
                    SUM(i.amount) as total_invoiced,
                    SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as total_paid,
                    SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END) as total_pending
                FROM cases c
                LEFT JOIN invoices i ON c.id = i.case_id
                GROUP BY c.id, c.case_no, c.name, c.status
            """)

            sync_log.records_processed = records_processed
            sync_log.status = SyncStatus.COMPLETED
            sync_log.completed_at = datetime.now()
            await db.commit()

            return {
                "sync_id": sync_id,
                "status": "completed",
                "records_processed": records_processed,
            }

        except Exception as e:
            sync_log.status = SyncStatus.FAILED
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now()
            await db.commit()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"DuckDB sync failed: {str(e)}",
            )

    @staticmethod
    async def get_sync_history(
        db: AsyncSession,
        current_user: CurrentUser,
        limit: int = 20,
        source_system: str | None = None,
    ) -> list[dict[str, Any]]:
        PermissionService.is_assistant_or_above(current_user)

        query = select(DataSyncLog)

        if source_system:
            query = query.where(DataSyncLog.source_system == source_system)

        query = query.order_by(DataSyncLog.started_at.desc()).limit(limit)
        result = await db.execute(query)
        sync_logs = result.scalars().all()

        return [
            {
                "id": str(log.id),
                "source_system": log.source_system,
                "sync_type": log.sync_type.value if hasattr(log.sync_type, "value") else log.sync_type,
                "records_processed": log.records_processed,
                "status": log.status.value if hasattr(log.status, "value") else log.status,
                "error_message": log.error_message,
                "started_at": log.started_at.isoformat(),
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
            }
            for log in sync_logs
        ]

    @staticmethod
    async def link_email_to_invoice(
        db: AsyncSession,
        email_attachment_id: UUID,
        invoice_id: UUID,
        current_user: CurrentUser,
    ) -> dict[str, Any]:
        PermissionService.is_assistant_or_above(current_user)

        result = await db.execute(
            select(EmailAttachment).where(EmailAttachment.id == email_attachment_id)
        )
        email_attachment = result.scalar_one_or_none()

        if not email_attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email attachment not found",
            )

        invoice_result = await db.execute(
            select(Invoice).where(Invoice.id == invoice_id)
        )
        invoice = invoice_result.scalar_one_or_none()

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        email_attachment.linked_invoice_id = invoice_id
        await db.commit()

        return {
            "message": "Email attachment linked to invoice successfully",
            "email_attachment_id": email_attachment_id,
            "invoice_id": invoice_id,
        }

    @staticmethod
    async def process_email_attachments(
        db: AsyncSession,
        current_user: CurrentUser,
    ) -> dict[str, Any]:
        PermissionService.is_assistant_or_above(current_user)

        result = await db.execute(
            select(EmailAttachment).where(EmailAttachment.linked_invoice_id.is_(None))
        )
        unlinked_attachments = result.scalars().all()

        processed = 0
        for attachment in unlinked_attachments:
            if "invoice" in (attachment.subject or "").lower() or \
               "invoice" in (attachment.file_name or "").lower():
                processed += 1

        return {
            "message": f"Processed {processed} email attachments",
            "total_unlinked": len(unlinked_attachments),
            "processed": processed,
        }
