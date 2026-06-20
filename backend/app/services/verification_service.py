from typing import List, Optional
from datetime import date

from ..repositories import duckdb_repository
from ..models.schemas import (
    VerificationEfficiency,
    VerificationDatePoint,
    VerificationAreaItem,
    VerificationDefinitionRule,
)
from ..utils.logger import logger


def get_verification_efficiency(group: str = "gate") -> List[VerificationEfficiency]:
    logger.info(f"Fetching verification efficiency: group={group}")
    valid_groups = ["gate", "area", "time"]
    if group not in valid_groups:
        group = "gate"
    result = duckdb_repository.verification_efficiency(group=group)
    logger.info(f"Verification efficiency fetched: {len(result)} items")
    return result


def get_verification_date_trend(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[VerificationDatePoint]:
    logger.info(f"Fetching verification date trend: start_date={start_date}, end_date={end_date}")
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date
    if start_date > end_date:
        start_date, end_date = end_date, start_date
    result = duckdb_repository.verification_date_trend(start_date=start_date, end_date=end_date)
    logger.info(f"Verification date trend fetched: {len(result)} points")
    return result


def get_verification_area_compare() -> List[VerificationAreaItem]:
    logger.info("Fetching verification area compare")
    result = duckdb_repository.verification_area_compare()
    logger.info(f"Verification area compare fetched: {len(result)} areas")
    return result


def get_verification_definition() -> List[VerificationDefinitionRule]:
    logger.info("Fetching verification definition rules")
    result = duckdb_repository.verification_definition()
    logger.info(f"Verification definition fetched: {len(result)} rules")
    return result
