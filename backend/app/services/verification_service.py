from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.verification import VerificationTicket, VerificationAction
from app.schemas.verification import VerificationTransitionRequest

VALID_TRANSITIONS: dict[str, list[str]] = {
    "pending": ["in_progress"],
    "in_progress": ["closed_normal", "disputed"],
    "disputed": ["supplementing", "escalated", "closed_dispute"],
    "supplementing": ["disputed", "closed_normal", "closed_dispute"],
    "escalated": ["closed_dispute", "closed_normal", "supplementing"],
}

ACTION_NAMES: dict[tuple[str, str], str] = {
    ("pending", "in_progress"): "start_verification",
    ("in_progress", "closed_normal"): "close_normal",
    ("in_progress", "disputed"): "raise_dispute",
    ("disputed", "supplementing"): "request_supplement",
    ("disputed", "escalated"): "escalate",
    ("disputed", "closed_dispute"): "close_dispute",
    ("supplementing", "disputed"): "return_to_disputed",
    ("supplementing", "closed_normal"): "close_normal",
    ("supplementing", "closed_dispute"): "close_dispute",
    ("escalated", "closed_dispute"): "close_dispute",
    ("escalated", "closed_normal"): "close_normal",
    ("escalated", "supplementing"): "request_supplement",
}


class VerificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def transition(
        self, ticket: VerificationTicket, request: VerificationTransitionRequest
    ) -> VerificationTicket:
        from_status = ticket.status
        to_status = request.to_status

        allowed = VALID_TRANSITIONS.get(from_status, [])
        if to_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transition from '{from_status}' to '{to_status}'. Allowed: {allowed}",
            )

        action_name = ACTION_NAMES.get((from_status, to_status), "unknown")

        ticket.status = to_status

        if to_status in ("closed_normal", "closed_dispute"):
            ticket.closed_at = datetime.utcnow()

        if to_status == "in_progress" and not ticket.verified_at:
            ticket.verified_at = datetime.utcnow()

        if request.dispute_reason:
            ticket.dispute_reason = request.dispute_reason

        if request.supplement_note:
            ticket.supplement_note = request.supplement_note

        if request.escalation_target:
            ticket.escalation_target = request.escalation_target

        action = VerificationAction(
            verification_id=ticket.id,
            from_status=from_status,
            to_status=to_status,
            action=action_name,
            operator=request.operator,
            note=request.note,
        )
        self.db.add(action)
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket
