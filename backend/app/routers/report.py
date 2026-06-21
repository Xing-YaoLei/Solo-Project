from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.report import ReportData, ReportRequest
from app.services.report_service import ReportService

router = APIRouter()


@router.post(
    "/generate",
    response_model=ReportData,
    status_code=status.HTTP_200_OK,
    summary="生成报表",
)
async def generate_report(
    report_request: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ReportData:
    return await ReportService.generate_report(db, report_request, current_user)


@router.get(
    "/case-summary",
    status_code=status.HTTP_200_OK,
    summary="案件汇总报表",
)
async def get_case_summary(
    start_date: str | None = None,
    end_date: str | None = None,
    lawyer_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ReportData:
    from datetime import date
    from uuid import UUID

    report_request = ReportRequest(
        report_type="case_summary",
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        lawyer_id=UUID(lawyer_id) if lawyer_id else None,
    )
    return await ReportService.generate_report(db, report_request, current_user)


@router.get(
    "/revenue-analysis",
    status_code=status.HTTP_200_OK,
    summary="收入分析报表",
)
async def get_revenue_analysis(
    start_date: str | None = None,
    end_date: str | None = None,
    case_id: str | None = None,
    lawyer_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ReportData:
    from datetime import date
    from uuid import UUID

    report_request = ReportRequest(
        report_type="revenue_analysis",
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        case_id=UUID(case_id) if case_id else None,
        lawyer_id=UUID(lawyer_id) if lawyer_id else None,
    )
    return await ReportService.generate_report(db, report_request, current_user)


@router.get(
    "/collection-forecast",
    status_code=status.HTTP_200_OK,
    summary="回款预测报表",
)
async def get_collection_forecast(
    start_date: str | None = None,
    end_date: str | None = None,
    case_id: str | None = None,
    lawyer_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ReportData:
    from datetime import date
    from uuid import UUID

    report_request = ReportRequest(
        report_type="collection_forecast",
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        case_id=UUID(case_id) if case_id else None,
        lawyer_id=UUID(lawyer_id) if lawyer_id else None,
    )
    return await ReportService.generate_report(db, report_request, current_user)


@router.get(
    "/approval-status",
    status_code=status.HTTP_200_OK,
    summary="审批状态报表",
)
async def get_approval_status(
    start_date: str | None = None,
    end_date: str | None = None,
    case_id: str | None = None,
    lawyer_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ReportData:
    from datetime import date
    from uuid import UUID

    report_request = ReportRequest(
        report_type="approval_status",
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        case_id=UUID(case_id) if case_id else None,
        lawyer_id=UUID(lawyer_id) if lawyer_id else None,
    )
    return await ReportService.generate_report(db, report_request, current_user)


@router.get(
    "/lawyer-performance",
    status_code=status.HTTP_200_OK,
    summary="律师绩效报表",
)
async def get_lawyer_performance(
    start_date: str | None = None,
    end_date: str | None = None,
    lawyer_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ReportData:
    from datetime import date
    from uuid import UUID

    report_request = ReportRequest(
        report_type="lawyer_performance",
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        lawyer_id=UUID(lawyer_id) if lawyer_id else None,
    )
    return await ReportService.generate_report(db, report_request, current_user)
