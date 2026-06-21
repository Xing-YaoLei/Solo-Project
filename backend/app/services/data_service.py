from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
import logging

from app.schemas import (
    SettlementTrendResponse,
    OrderDetail,
    ApprovalNode,
    AmountCheck,
    CaliberDiffDetail,
    DashboardSummary,
)

logger = logging.getLogger(__name__)

_duckdb_available = False
_pg_available = False

try:
    from app.services.duckdb_service import (
        get_dashboard_summary_duckdb,
        get_settlement_trend_duckdb,
        get_order_details_duckdb,
        get_approval_nodes_duckdb,
        get_amount_checks_duckdb,
        get_caliber_diffs_duckdb,
        get_settlement_rules,
        generate_download_data_duckdb,
    )
    from app.services.duckdb_init import init_duckdb
    init_duckdb()
    _duckdb_available = True
    logger.info("DuckDB data layer initialized successfully")
except Exception as e:
    logger.warning(f"DuckDB initialization failed, falling back to mock: {e}")

try:
    from sqlalchemy.orm import Session
    from app.core.database import SessionLocal
    from app.models import (
        Settlement, Order, ApprovalNode as ApprovalNodeModel,
        AmountCheck as AmountCheckModel, CaliberDiff, Merchant,
    )
    _pg_available = True
except Exception as e:
    logger.warning(f"PostgreSQL layer not available: {e}")

from app.services.mock_service import (
    get_dashboard_summary as _mock_summary,
    get_settlement_trend as _mock_trend,
    get_order_details as _mock_orders,
    get_approval_nodes as _mock_approvals,
    get_amount_checks as _mock_checks,
    get_caliber_diffs as _mock_diffs,
    get_settlement_rules as _mock_rules,
    generate_download_data as _mock_download,
)


def get_dashboard_summary() -> DashboardSummary:
    if _duckdb_available:
        try:
            return get_dashboard_summary_duckdb()
        except Exception as e:
            logger.error(f"DuckDB summary query failed: {e}")
    return _mock_summary()


def get_settlement_trend(
    merchant_id: int = 1,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> SettlementTrendResponse:
    if _duckdb_available:
        try:
            return get_settlement_trend_duckdb(merchant_id, start_date, end_date)
        except Exception as e:
            logger.error(f"DuckDB trend query failed: {e}")
    return _mock_trend(merchant_id, start_date, end_date)


def get_order_details(
    merchant_id: int = 1,
    settlement_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    if _duckdb_available:
        try:
            return get_order_details_duckdb(merchant_id, settlement_id, page, page_size)
        except Exception as e:
            logger.error(f"DuckDB orders query failed: {e}")
    return _mock_orders(merchant_id, settlement_id, page, page_size)


def get_approval_nodes(settlement_id: int) -> List[ApprovalNode]:
    if _duckdb_available:
        try:
            return get_approval_nodes_duckdb(settlement_id)
        except Exception as e:
            logger.error(f"DuckDB approvals query failed: {e}")
    return _mock_approvals(settlement_id)


def get_amount_checks(settlement_id: Optional[int] = None) -> List[AmountCheck]:
    if _duckdb_available:
        try:
            return get_amount_checks_duckdb(settlement_id)
        except Exception as e:
            logger.error(f"DuckDB checks query failed: {e}")
    return _mock_checks(settlement_id)


def get_caliber_diffs(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    if _duckdb_available:
        try:
            return get_caliber_diffs_duckdb(page, page_size)
        except Exception as e:
            logger.error(f"DuckDB diffs query failed: {e}")
    return _mock_diffs(page, page_size)


def get_settlement_rules_text() -> str:
    try:
        return get_settlement_rules()
    except Exception:
        return _mock_rules()


def generate_download_data(
    merchant_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_rules: bool = True,
) -> Dict[str, Any]:
    if _duckdb_available:
        try:
            return generate_download_data_duckdb(merchant_id, start_date, end_date, include_rules)
        except Exception as e:
            logger.error(f"DuckDB download query failed: {e}")
    return _mock_download(merchant_id, start_date, end_date, include_rules)
