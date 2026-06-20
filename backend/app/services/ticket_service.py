from typing import List

from ..repositories import duckdb_repository
from ..models.schemas import TicketRankItem
from ..utils.logger import logger


def get_ticket_rank(metric: str = "absolute", top: int = 10) -> List[TicketRankItem]:
    logger.info(f"Fetching ticket rank: metric={metric}, top={top}")
    valid_metrics = ["absolute", "ratio"]
    if metric not in valid_metrics:
        metric = "absolute"
    if top <= 0:
        top = 10
    if top > 100:
        top = 100
    result = duckdb_repository.ticket_rank(metric=metric, top=top)
    logger.info(f"Ticket rank fetched: {len(result)} items")
    return result
