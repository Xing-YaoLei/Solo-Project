from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import os
import uuid
import pandas as pd
import io
from decimal import Decimal

from ..database import get_db
from ..models import (
    ExportRecord,
    Contract,
    Bill,
    ReconciliationDiff,
    ExceptionOrder,
)
from ..schemas import (
    ExportRequest,
    ExportRecordResponse,
    PaginatedResponse,
    PaginationParams,
)
from ..config import settings
from ..utils.export_utils import create_excel_export, generate_export_caliber
from ..utils.response import success_response

router = APIRouter(prefix="/api/exports", tags=["导出管理"])


def ensure_export_dir():
    export_dir = os.path.join(settings.UPLOAD_DIR, "exports")
    os.makedirs(export_dir, exist_ok=True)
    return export_dir


def get_contracts_data(db: Session, filters: Dict[str, Any] = None) -> pd.DataFrame:
    query = db.query(Contract)
    if filters:
        if filters.get("keyword"):
            query = query.filter(
                or_(
                    Contract.contract_no.contains(filters["keyword"]),
                    Contract.client_name.contains(filters["keyword"]),
                    Contract.project_name.contains(filters["keyword"]),
                )
            )
        if filters.get("status"):
            query = query.filter(Contract.status == filters["status"])
        if filters.get("start_date"):
            query = query.filter(Contract.sign_date >= filters["start_date"])
        if filters.get("end_date"):
            query = query.filter(Contract.sign_date <= filters["end_date"])

    contracts = query.all()
    data = []
    for contract in contracts:
        data.append({
            "合同ID": contract.id,
            "合同编号": contract.contract_no,
            "项目名称": contract.project_name,
            "客户名称": contract.client_name,
            "客户电话": contract.client_phone,
            "地址": contract.address,
            "房屋类型": contract.house_type,
            "面积(㎡)": float(contract.area) if contract.area else None,
            "合同金额(元)": float(contract.contract_amount) if contract.contract_amount else None,
            "签约日期": contract.sign_date.strftime("%Y-%m-%d") if contract.sign_date else None,
            "开始日期": contract.start_date.strftime("%Y-%m-%d") if contract.start_date else None,
            "结束日期": contract.end_date.strftime("%Y-%m-%d") if contract.end_date else None,
            "状态": contract.status,
            "备注": contract.remark,
            "创建时间": contract.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(data)


def get_bills_data(db: Session, filters: Dict[str, Any] = None) -> pd.DataFrame:
    query = db.query(Bill)
    if filters:
        if filters.get("keyword"):
            query = query.filter(
                or_(
                    Bill.bill_no.contains(filters["keyword"]),
                    Bill.bill_name.contains(filters["keyword"]),
                )
            )
        if filters.get("status"):
            query = query.filter(Bill.status == filters["status"])
        if filters.get("contract_id"):
            query = query.filter(Bill.contract_id == filters["contract_id"])
        if filters.get("bill_type"):
            query = query.filter(Bill.bill_type == filters["bill_type"])
        if filters.get("start_date"):
            query = query.filter(Bill.created_at >= filters["start_date"])
        if filters.get("end_date"):
            query = query.filter(Bill.created_at <= filters["end_date"])

    bills = query.all()
    data = []
    for bill in bills:
        contract_no = bill.contract.contract_no if bill.contract else None
        data.append({
            "单据ID": bill.id,
            "单据编号": bill.bill_no,
            "单据类型": bill.bill_type,
            "单据名称": bill.bill_name,
            "合同编号": contract_no,
            "总金额(元)": float(bill.total_amount) if bill.total_amount else None,
            "已付金额(元)": float(bill.paid_amount) if bill.paid_amount else None,
            "未付金额(元)": float(bill.unpaid_amount) if bill.unpaid_amount else None,
            "状态": bill.status,
            "到期日期": bill.due_date.strftime("%Y-%m-%d") if bill.due_date else None,
            "付款日期": bill.paid_date.strftime("%Y-%m-%d") if bill.paid_date else None,
            "审核时间": bill.verified_at.strftime("%Y-%m-%d %H:%M:%S") if bill.verified_at else None,
            "备注": bill.remark,
            "创建时间": bill.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(data)


def get_reconciliation_data(db: Session, filters: Dict[str, Any] = None) -> pd.DataFrame:
    query = db.query(ReconciliationDiff)
    if filters:
        if filters.get("keyword"):
            query = query.filter(
                or_(
                    ReconciliationDiff.diff_no.contains(filters["keyword"]),
                    ReconciliationDiff.handler_conclusion.contains(filters["keyword"]),
                )
            )
        if filters.get("status"):
            query = query.filter(ReconciliationDiff.status == filters["status"])
        if filters.get("contract_id"):
            query = query.filter(ReconciliationDiff.contract_id == filters["contract_id"])
        if filters.get("diff_type"):
            query = query.filter(ReconciliationDiff.diff_type == filters["diff_type"])
        if filters.get("start_date"):
            query = query.filter(ReconciliationDiff.created_at >= filters["start_date"])
        if filters.get("end_date"):
            query = query.filter(ReconciliationDiff.created_at <= filters["end_date"])

    diffs = query.all()
    data = []
    for diff in diffs:
        contract_no = diff.contract.contract_no if diff.contract else None
        bill_no = diff.bill.bill_no if diff.bill else None
        data.append({
            "差异ID": diff.id,
            "差异编号": diff.diff_no,
            "差异类型": diff.diff_type,
            "合同编号": contract_no,
            "单据编号": bill_no,
            "预期金额(元)": float(diff.expected_amount) if diff.expected_amount else None,
            "实际金额(元)": float(diff.actual_amount) if diff.actual_amount else None,
            "差异金额(元)": float(diff.diff_amount) if diff.diff_amount else None,
            "状态": diff.status,
            "处理结论": diff.handler_conclusion,
            "处理时间": diff.handled_at.strftime("%Y-%m-%d %H:%M:%S") if diff.handled_at else None,
            "备注": diff.remark,
            "创建时间": diff.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(data)


def get_exceptions_data(db: Session, filters: Dict[str, Any] = None) -> pd.DataFrame:
    query = db.query(ExceptionOrder)
    if filters:
        if filters.get("keyword"):
            query = query.filter(
                or_(
                    ExceptionOrder.exception_no.contains(filters["keyword"]),
                    ExceptionOrder.title.contains(filters["keyword"]),
                    ExceptionOrder.description.contains(filters["keyword"]),
                )
            )
        if filters.get("status"):
            query = query.filter(ExceptionOrder.status == filters["status"])
        if filters.get("contract_id"):
            query = query.filter(ExceptionOrder.contract_id == filters["contract_id"])
        if filters.get("exception_type"):
            query = query.filter(ExceptionOrder.exception_type == filters["exception_type"])
        if filters.get("priority"):
            query = query.filter(ExceptionOrder.priority == filters["priority"])
        if filters.get("start_date"):
            query = query.filter(ExceptionOrder.created_at >= filters["start_date"])
        if filters.get("end_date"):
            query = query.filter(ExceptionOrder.created_at <= filters["end_date"])

    exceptions = query.all()
    data = []
    for exc in exceptions:
        contract_no = exc.contract.contract_no if exc.contract else None
        bill_no = exc.bill.bill_no if exc.bill else None
        data.append({
            "异常单ID": exc.id,
            "异常单编号": exc.exception_no,
            "异常类型": exc.exception_type,
            "标题": exc.title,
            "合同编号": contract_no,
            "单据编号": bill_no,
            "预期金额(元)": float(exc.expected_amount) if exc.expected_amount else None,
            "实际金额(元)": float(exc.actual_amount) if exc.actual_amount else None,
            "差异金额(元)": float(exc.diff_amount) if exc.diff_amount else None,
            "状态": exc.status,
            "优先级": exc.priority,
            "最终结论": exc.final_conclusion,
            "关闭时间": exc.closed_at.strftime("%Y-%m-%d %H:%M:%S") if exc.closed_at else None,
            "备注": exc.remark,
            "创建时间": exc.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(data)


DATA_FETCHERS = {
    "contracts": get_contracts_data,
    "bills": get_bills_data,
    "reconciliation": get_reconciliation_data,
    "exceptions": get_exceptions_data,
}

SHEET_NAMES = {
    "contracts": "合同数据",
    "bills": "单据数据",
    "reconciliation": "对账差异数据",
    "exceptions": "异常单数据",
}


@router.post("", status_code=status.HTTP_201_CREATED)
def export_data(
    export_request: ExportRequest,
    exported_by: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    from fastapi.responses import StreamingResponse

    if export_request.export_type not in DATA_FETCHERS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的导出类型: {export_request.export_type}, 支持的类型: {list(DATA_FETCHERS.keys())}",
        )

    fetcher = DATA_FETCHERS[export_request.export_type]
    filters = export_request.filter_conditions or {}
    df = fetcher(db, filters)

    if df.empty:
        raise HTTPException(status_code=400, detail="没有符合条件的数据可导出")

    sheet_name = SHEET_NAMES.get(export_request.export_type, "数据")
    custom_caliber = export_request.data_caliber if export_request.include_caliber else None

    excel_data = create_excel_export(
        data=df,
        sheet_name=sheet_name,
        export_type=export_request.export_type,
        operator_name=f"用户{exported_by}" if exported_by else "系统",
        custom_caliber=custom_caliber,
    )

    export_dir = ensure_export_dir()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    file_name = f"{export_request.export_name}_{timestamp}.xlsx"
    unique_filename = f"{uuid.uuid4().hex}_{file_name}"
    file_path = os.path.join(export_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(excel_data)

    file_size = len(excel_data)
    data_caliber = custom_caliber or generate_export_caliber(export_request.export_type, f"用户{exported_by}" if exported_by else "系统")

    export_record = ExportRecord(
        export_type=export_request.export_type,
        export_name=export_request.export_name,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        data_caliber=data_caliber,
        filter_conditions=str(filters) if filters else None,
        record_count=len(df),
        exported_by=exported_by,
    )
    db.add(export_record)
    db.commit()
    db.refresh(export_record)

    return StreamingResponse(
        io.BytesIO(excel_data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{file_name.encode('utf-8').decode('latin-1')}"
        },
    )


@router.get("/records")
def get_export_records(
    pagination: PaginationParams = Depends(),
    export_type: Optional[str] = None,
    exported_by: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ExportRecord)

    if pagination.keyword:
        query = query.filter(
            or_(
                ExportRecord.export_name.contains(pagination.keyword),
                ExportRecord.file_name.contains(pagination.keyword),
            )
        )
    if export_type:
        query = query.filter(ExportRecord.export_type == export_type)
    if exported_by:
        query = query.filter(ExportRecord.exported_by == exported_by)
    if pagination.start_date:
        query = query.filter(ExportRecord.created_at >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(ExportRecord.created_at <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(ExportRecord.created_at.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return success_response(
        PaginatedResponse(
            items=items,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages,
        ),
        "获取导出记录列表成功",
    )


@router.get("/records/{record_id}/download")
def download_export_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    from fastapi.responses import FileResponse

    db_record = db.query(ExportRecord).filter(ExportRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="导出记录不存在")

    if not os.path.exists(db_record.file_path):
        raise HTTPException(status_code=404, detail="文件已被删除")

    return FileResponse(
        path=db_record.file_path,
        filename=db_record.file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/records/{record_id}")
def get_export_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ExportRecord).filter(ExportRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="导出记录不存在")
    return success_response(record, "获取导出记录详情成功")


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_export_record(record_id: int, db: Session = Depends(get_db)):
    db_record = db.query(ExportRecord).filter(ExportRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="导出记录不存在")

    if os.path.exists(db_record.file_path):
        os.remove(db_record.file_path)

    db.delete(db_record)
    db.commit()

    return None


@router.get("/types")
def get_export_types():
    return success_response(
        {
            "types": list(DATA_FETCHERS.keys()),
            "descriptions": {
                "contracts": "导出合同数据",
                "bills": "导出单据数据",
                "reconciliation": "导出对账差异数据",
                "exceptions": "导出异常单数据",
            },
        },
        "获取导出类型成功",
    )
