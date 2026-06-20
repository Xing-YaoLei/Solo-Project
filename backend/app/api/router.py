from fastapi import APIRouter

from app.api.events import router as events_router
from app.api.ticket_types import router as ticket_types_router
from app.api.orders import router as orders_router
from app.api.seats import router as seats_router
from app.api.verifications import router as verifications_router
from app.api.summary import router as summary_router

api_router = APIRouter(prefix="/api")

api_router.include_router(events_router)
api_router.include_router(ticket_types_router)
api_router.include_router(orders_router)
api_router.include_router(seats_router)
api_router.include_router(verifications_router)
api_router.include_router(summary_router)
