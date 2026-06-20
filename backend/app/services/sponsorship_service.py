from typing import Optional

from ..repositories import duckdb_repository
from ..models.schemas import PageResponse, SponsorshipItem, SponsorshipDetail
from ..utils.logger import logger


def get_sponsorship_list(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
) -> PageResponse[SponsorshipItem]:
    logger.info(f"Fetching sponsorship list: page={page}, page_size={page_size}, status={status}")
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 200:
        page_size = 200
    valid_statuses = [None, "未开始", "进行中", "已完成"]
    if status not in valid_statuses:
        status = None
    result = duckdb_repository.sponsorship_list(
        page=page, page_size=page_size, status=status
    )
    logger.info(f"Sponsorship list fetched: {len(result.items)} items, total={result.page_info.total}")
    return result


def get_sponsorship_detail(benefit_id: str) -> Optional[SponsorshipDetail]:
    logger.info(f"Fetching sponsorship detail: benefit_id={benefit_id}")
    if not benefit_id:
        raise ValueError("benefit_id is required")
    result = duckdb_repository.sponsorship_detail(benefit_id=benefit_id)
    if result:
        logger.info(f"Sponsorship detail fetched: benefit_type={result.benefit_type}, completion_rate={result.completion_rate}")
    else:
        logger.warning(f"Sponsorship detail not found: benefit_id={benefit_id}")
    return result
