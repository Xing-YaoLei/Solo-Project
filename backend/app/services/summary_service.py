from datetime import datetime

from sqlalchemy import select, func, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.verification import VerificationTicket
from app.schemas.summary import (
    EfficiencyStats,
    SourceGroupStats,
    AssigneeGroupStats,
    ConclusionGroupStats,
)


class SummaryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _date_filter(self, stmt, date_from: datetime | None, date_to: datetime | None):
        if date_from:
            stmt = stmt.where(VerificationTicket.created_at >= date_from)
        if date_to:
            stmt = stmt.where(VerificationTicket.created_at <= date_to)
        return stmt

    async def get_efficiency_stats(
        self,
        source: str | None,
        assignee: str | None,
        conclusion: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ) -> EfficiencyStats:
        stmt = select(
            func.count().label("total"),
            func.count(
                case(
                    (VerificationTicket.status.in_(["closed_normal", "closed_dispute"]), 1)
                )
            ).label("verified"),
            func.avg(
                case(
                    (
                        VerificationTicket.verified_at.isnot(None),
                        func.extract("epoch", VerificationTicket.verified_at - VerificationTicket.created_at) / 3600.0,
                    )
                )
            ).label("avg_time_hours"),
        )
        if source:
            stmt = stmt.where(VerificationTicket.source == source)
        if assignee:
            stmt = stmt.where(VerificationTicket.assignee == assignee)
        if conclusion:
            stmt = stmt.where(VerificationTicket.conclusion == conclusion)
        stmt = self._date_filter(stmt, date_from, date_to)
        result = await self.db.execute(stmt)
        row = result.one()
        total = row.total or 0
        verified = row.verified or 0
        avg_time = float(row.avg_time_hours or 0)
        efficiency_rate = (verified / total * 100) if total > 0 else 0.0
        return EfficiencyStats(
            total=total,
            verified=verified,
            avg_time_hours=round(avg_time, 2),
            efficiency_rate=round(efficiency_rate, 2),
        )

    async def get_by_source(
        self, date_from: datetime | None, date_to: datetime | None
    ) -> list[SourceGroupStats]:
        stmt = select(
            VerificationTicket.source,
            func.count().label("count"),
            func.count(
                case(
                    (VerificationTicket.status.in_(["closed_normal", "closed_dispute"]), 1)
                )
            ).label("closed_count"),
            func.count(
                case(
                    (VerificationTicket.status == "disputed", 1)
                )
            ).label("disputed_count"),
        ).group_by(VerificationTicket.source)
        stmt = self._date_filter(stmt, date_from, date_to)
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            SourceGroupStats(
                source=row.source or "unknown",
                count=row.count,
                closed_count=row.closed_count,
                disputed_count=row.disputed_count,
            )
            for row in rows
        ]

    async def get_by_assignee(
        self, date_from: datetime | None, date_to: datetime | None
    ) -> list[AssigneeGroupStats]:
        stmt = select(
            VerificationTicket.assignee,
            func.count().label("count"),
            func.count(
                case(
                    (VerificationTicket.status.in_(["closed_normal", "closed_dispute"]), 1)
                )
            ).label("closed_count"),
            func.avg(
                case(
                    (
                        VerificationTicket.verified_at.isnot(None),
                        func.extract("epoch", VerificationTicket.verified_at - VerificationTicket.created_at) / 3600.0,
                    )
                )
            ).label("avg_time_hours"),
        ).group_by(VerificationTicket.assignee)
        stmt = self._date_filter(stmt, date_from, date_to)
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            AssigneeGroupStats(
                assignee=row.assignee or "unassigned",
                count=row.count,
                closed_count=row.closed_count,
                avg_time_hours=round(float(row.avg_time_hours or 0), 2),
            )
            for row in rows
        ]

    async def get_by_conclusion(
        self, date_from: datetime | None, date_to: datetime | None
    ) -> list[ConclusionGroupStats]:
        stmt = select(
            VerificationTicket.conclusion,
            func.count().label("count"),
        ).group_by(VerificationTicket.conclusion)
        stmt = self._date_filter(stmt, date_from, date_to)
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            ConclusionGroupStats(
                conclusion=row.conclusion or "none",
                count=row.count,
            )
            for row in rows
        ]
