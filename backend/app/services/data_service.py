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

_data_source = "mock"

_duckdb_available = False
_pg_available = False
_get_duckdb_summary = None
_get_duckdb_trend = None
_get_duckdb_orders = None
_get_duckdb_approvals = None
_get_duckdb_checks = None
_get_duckdb_diffs = None
_get_duckdb_rules = None
_generate_duckdb_download = None

_pg_summary_func = None
_pg_trend_func = None
_pg_orders_func = None
_pg_approvals_func = None
_pg_checks_func = None
_pg_diffs_func = None
_pg_session = None


def _init_duckdb_layer():
    global _duckdb_available, _get_duckdb_summary, _get_duckdb_trend
    global _get_duckdb_orders, _get_duckdb_approvals, _get_duckdb_checks
    global _get_duckdb_diffs, _get_duckdb_rules, _generate_duckdb_download
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
        _get_duckdb_summary = get_dashboard_summary_duckdb
        _get_duckdb_trend = get_settlement_trend_duckdb
        _get_duckdb_orders = get_order_details_duckdb
        _get_duckdb_approvals = get_approval_nodes_duckdb
        _get_duckdb_checks = get_amount_checks_duckdb
        _get_duckdb_diffs = get_caliber_diffs_duckdb
        _get_duckdb_rules = get_settlement_rules
        _generate_duckdb_download = generate_download_data_duckdb
        _duckdb_available = True
        logger.info("DuckDB data layer initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"DuckDB data layer unavailable: {e}")
        return False


def _init_postgres_layer():
    global _pg_available, _pg_summary_func, _pg_trend_func, _pg_orders_func
    global _pg_approvals_func, _pg_checks_func, _pg_diffs_func, _pg_session
    try:
        from app.core.database import SessionLocal
        from app.services.postgres_service import (
            get_dashboard_summary_pg,
            get_settlement_trend_pg,
            get_order_details_pg,
            get_approval_nodes_pg,
            get_amount_checks_pg,
            get_caliber_diffs_pg,
        )
        from app.services.postgres_init import init_postgres

        if not init_postgres():
            return False

        db = SessionLocal()
        try:
            db.execute("SELECT 1")
            db.fetchall() if hasattr(db, 'fetchall') else None
        except Exception:
            db.rollback()
        finally:
            db.close()

        _pg_summary_func = get_dashboard_summary_pg
        _pg_trend_func = get_settlement_trend_pg
        _pg_orders_func = get_order_details_pg
        _pg_approvals_func = get_approval_nodes_pg
        _pg_checks_func = get_amount_checks_pg
        _pg_diffs_func = get_caliber_diffs_pg
        _pg_session = SessionLocal
        _pg_available = True
        logger.info("PostgreSQL data layer initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"PostgreSQL data layer unavailable: {e}")
        return False


def _init_mock_layer():
    global _mock_summary, _mock_trend, _mock_orders, _mock_approvals
    global _mock_checks, _mock_diffs, _mock_rules, _mock_download
    import app.services.mock_service as mock_service
    _mock_summary = mock_service.get_dashboard_summary
    _mock_trend = mock_service.get_settlement_trend
    _mock_orders = mock_service.get_order_details
    _mock_approvals = mock_service.get_approval_nodes
    _mock_checks = mock_service.get_amount_checks
    _mock_diffs = mock_service.get_caliber_diffs
    _mock_rules = mock_service.get_settlement_rules
    _mock_download = mock_service.generate_download_data
    logger.info("Mock data layer loaded (fallback)")


_mock_summary = None
_mock_trend = None
_mock_orders = None
_mock_approvals = None
_mock_checks = None
_mock_diffs = None
_mock_rules = None
_mock_download = None


def _initialize_layers():
    global _data_source
    if _init_duckdb_layer():
        _data_source = "duckdb"
    elif _init_postgres_layer():
        _data_source = "postgresql"
    else:
        _init_mock_layer()
        _data_source = "mock"
    logger.info(f"Active data source: {_data_source}")


_initialize_layers()


def get_data_source() -> str:
    return _data_source


def _with_pg_session(func, *args, **kwargs):
    db = _pg_session()
    try:
        return func(db, *args, **kwargs)
    finally:
        db.close()


def get_dashboard_summary() -> DashboardSummary:
    if _duckdb_available:
        try:
            return _get_duckdb_summary()
        except Exception as e:
            logger.error(f"DuckDB summary query failed, falling back: {e}")

    if _pg_available:
        try:
            return _with_pg_session(_pg_summary_func)
        except Exception as e:
            logger.error(f"PostgreSQL summary query failed, falling back: {e}")

    return _mock_summary()


def get_settlement_trend(
    merchant_id: int = 1,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> SettlementTrendResponse:
    if _duckdb_available:
        try:
            return _get_duckdb_trend(merchant_id, start_date, end_date)
        except Exception as e:
            logger.error(f"DuckDB trend query failed, falling back: {e}")

    if _pg_available:
        try:
            return _with_pg_session(_pg_trend_func, merchant_id, start_date, end_date)
        except Exception as e:
            logger.error(f"PostgreSQL trend query failed, falling back: {e}")

    return _mock_trend(merchant_id, start_date, end_date)


def get_order_details(
    merchant_id: int = 1,
    settlement_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    if _duckdb_available:
        try:
            return _get_duckdb_orders(merchant_id, settlement_id, page, page_size)
        except Exception as e:
            logger.error(f"DuckDB orders query failed, falling back: {e}")

    if _pg_available:
        try:
            return _with_pg_session(_pg_orders_func, merchant_id, settlement_id, page, page_size)
        except Exception as e:
            logger.error(f"PostgreSQL orders query failed, falling back: {e}")

    return _mock_orders(merchant_id, settlement_id, page, page_size)


def get_approval_nodes(settlement_id: int) -> List[ApprovalNode]:
    if _duckdb_available:
        try:
            return _get_duckdb_approvals(settlement_id)
        except Exception as e:
            logger.error(f"DuckDB approvals query failed, falling back: {e}")

    if _pg_available:
        try:
            return _with_pg_session(_pg_approvals_func, settlement_id)
        except Exception as e:
            logger.error(f"PostgreSQL approvals query failed, falling back: {e}")

    return _mock_approvals(settlement_id)


def get_amount_checks(settlement_id: Optional[int] = None) -> List[AmountCheck]:
    if _duckdb_available:
        try:
            return _get_duckdb_checks(settlement_id)
        except Exception as e:
            logger.error(f"DuckDB checks query failed, falling back: {e}")

    if _pg_available:
        try:
            return _with_pg_session(_pg_checks_func, settlement_id)
        except Exception as e:
            logger.error(f"PostgreSQL checks query failed, falling back: {e}")

    return _mock_checks(settlement_id)


def get_caliber_diffs(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    if _duckdb_available:
        try:
            return _get_duckdb_diffs(page, page_size)
        except Exception as e:
            logger.error(f"DuckDB diffs query failed, falling back: {e}")

    if _pg_available:
        try:
            return _with_pg_session(_pg_diffs_func, page, page_size)
        except Exception as e:
            logger.error(f"PostgreSQL diffs query failed, falling back: {e}")

    return _mock_diffs(page, page_size)


def get_settlement_rules_text() -> str:
    if _duckdb_available and _get_duckdb_rules:
        try:
            return _get_duckdb_rules()
        except Exception as e:
            logger.error(f"DuckDB rules query failed, falling back: {e}")
    return _mock_rules()


def generate_download_data(
    merchant_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_rules: bool = True,
) -> Dict[str, Any]:
    if _duckdb_available:
        try:
            return _generate_duckdb_download(merchant_id, start_date, end_date, include_rules)
        except Exception as e:
            logger.error(f"DuckDB download query failed, falling back: {e}")
    return _mock_download(merchant_id, start_date, end_date, include_rules)
