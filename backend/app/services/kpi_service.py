from typing import List

from ..repositories import duckdb_repository
from ..models.schemas import KPIOverview, KPITrendPoint
from ..utils.logger import logger


def get_kpi_overview() -> KPIOverview:
    logger.info("Fetching KPI overview")
    result = duckdb_repository.kpi_overview()
    logger.info(f"KPI overview fetched: total_tickets={result.total_tickets}, sold_rate={result.sold_rate}")
    return result


def get_kpi_trend(days: int = 30) -> List[KPITrendPoint]:
    logger.info(f"Fetching KPI trend for {days} days")
    if days <= 0:
        days = 30
    if days > 365:
        days = 365
    result = duckdb_repository.kpi_trend(days=days)
    logger.info(f"KPI trend fetched: {len(result)} points")
    return result
