from typing import List, Optional
from datetime import date, timedelta

from ..repositories import duckdb_repository
from ..models.schemas import RefundDistributionPoint, RefundSample
from ..utils.logger import logger


def get_refund_distribution(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[RefundDistributionPoint]:
    logger.info(f"Fetching refund distribution: start_date={start_date}, end_date={end_date}")
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=29)
    if start_date > end_date:
        start_date, end_date = end_date, start_date
    result = duckdb_repository.refund_distribution(start_date=start_date, end_date=end_date)
    logger.info(f"Refund distribution fetched: {len(result)} points")
    return result


def get_refund_sample(refund_id: str) -> Optional[RefundSample]:
    logger.info(f"Fetching refund sample: refund_id={refund_id}")
    if not refund_id:
        raise ValueError("refund_id is required")
    result = duckdb_repository.refund_sample(refund_id=refund_id)
    if result:
        logger.info(f"Refund sample fetched: registrant={result.registrant_name}, amount={result.refund_amount}")
    else:
        logger.warning(f"Refund sample not found: refund_id={refund_id}")
    return result


def mark_refund_processed(refund_id: str, note: Optional[str] = None) -> Optional[RefundSample]:
    logger.info(f"Marking refund as processed: refund_id={refund_id}, note={note}")
    if not refund_id:
        raise ValueError("refund_id is required")
    result = duckdb_repository.mark_refund_processed(refund_id=refund_id, note=note)
    if result:
        logger.info(f"Refund marked as processed: refund_id={refund_id}")
    else:
        logger.warning(f"Refund not found for marking processed: refund_id={refund_id}")
    return result
