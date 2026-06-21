from fastapi import APIRouter, Query, HTTPException
from datetime import date
from typing import Optional

from app.services.data_service import (
    get_settlement_trend,
    get_order_details,
    get_approval_nodes,
    get_amount_checks,
    get_caliber_diffs,
    get_dashboard_summary,
    get_settlement_rules_text,
    generate_download_data,
    save_amount_check,
)
from app.schemas import (
    SettlementTrendResponse,
    DashboardSummary,
    SaveAmountCheckRequest,
    AmountCheck,
)

router = APIRouter()


@router.get("/trend", response_model=SettlementTrendResponse)
def settlement_trend(
    merchant_id: int = Query(1, description="商户ID"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
):
    """获取商户结算趋势数据，包含异常点标注和受影响区间"""
    return get_settlement_trend(merchant_id, start_date, end_date)


@router.get("/orders")
def order_list(
    merchant_id: int = Query(1, description="商户ID"),
    settlement_id: Optional[int] = Query(None, description="结算单ID"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    """获取单据明细列表"""
    return get_order_details(merchant_id, settlement_id, page, page_size)


@router.get("/approval-nodes")
def approval_nodes(settlement_id: int = Query(..., description="结算单ID")):
    """获取审批节点列表"""
    return get_approval_nodes(settlement_id)


@router.get("/amount-checks")
def amount_checks(settlement_id: Optional[int] = Query(None, description="结算单ID")):
    """获取金额校验记录"""
    return get_amount_checks(settlement_id)


@router.post("/amount-checks/save", response_model=AmountCheck)
def save_amount_check_api(request: SaveAmountCheckRequest):
    """保存金额校验结果，更新实际结算金额和一致性标记"""
    result = save_amount_check(
        check_id=request.check_id,
        actual_settlement=request.actual_settlement,
        check_note=request.check_note,
    )
    if result is None:
        raise HTTPException(status_code=404, detail=f"校验记录 {request.check_id} 不存在")
    return result


@router.get("/caliber-diffs")
def caliber_diffs(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    """获取客服记录与支付流水口径差异表（保留差异，不直接覆盖）"""
    return get_caliber_diffs(page, page_size)


@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary():
    """获取看板概览数据"""
    return get_dashboard_summary()


@router.get("/rules")
def settlement_rules():
    """获取回款周期计算规则"""
    return {"rules": get_settlement_rules_text()}


@router.get("/download")
def download_data(
    merchant_id: Optional[int] = Query(None, description="商户ID"),
    start_date: date = Query(..., description="开始日期"),
    end_date: date = Query(..., description="结束日期"),
    include_rules: bool = Query(True, description="是否包含计算规则"),
):
    """下载结算数据，附带回款周期计算规则"""
    return generate_download_data(merchant_id, start_date, end_date, include_rules)
