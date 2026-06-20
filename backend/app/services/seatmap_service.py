from typing import List, Optional

from ..repositories import duckdb_repository
from ..models.schemas import SeatHeatmapItem, CheckinTrendPoint
from ..utils.logger import logger


def get_seat_heatmap(period: str = "current", compare: Optional[str] = None) -> List[SeatHeatmapItem]:
    logger.info(f"Fetching seat heatmap: period={period}, compare={compare}")
    valid_periods = ["current", "previous"]
    valid_compares = [None, "yoy", "mom", "both"]
    if period not in valid_periods:
        period = "current"
    if compare not in valid_compares:
        compare = None
    result = duckdb_repository.seat_heatmap(period=period, compare=compare)
    logger.info(f"Seat heatmap fetched: {len(result)} areas")
    return result


def get_checkin_trend(period: int = 30) -> List[CheckinTrendPoint]:
    logger.info(f"Fetching checkin trend for {period} days")
    if period <= 0:
        period = 30
    if period > 365:
        period = 365
    result = duckdb_repository.checkin_trend(period=period)
    logger.info(f"Checkin trend fetched: {len(result)} points")
    return result
