from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import date, datetime
import os
import json
import pandas as pd
from decimal import Decimal

from ..core.database import get_db
from ..services import generate_export_task_no
from ..models import ExportTask, Order, Package, AnomalyOrder, PackageInventory
from ..schemas import ExportTaskCreate, ExportTaskOut

router = APIRouter()

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "../../exports")
os.makedirs(EXPORT_DIR, exist_ok=True)


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


DATA_CALIBER = {
    "orders": {
        "name": "订单明细导出",
        "description": "包含所有订单的基础信息、客户信息、金额与状态等字段",
        "fields": {
            "order_no": "订单号",
            "package_name": "套餐名称",
            "homestay_name": "民宿名称",
            "customer_name": "客户姓名",
            "customer_phone": "客户电话",
            "check_in_date": "入住日期",
            "check_out_date": "退房日期",
            "nights": "入住晚数",
            "room_count": "房间数",
            "guest_count": "入住人数",
            "original_amount": "原价总额(元)",
            "discount_amount": "优惠金额(元)",
            "final_amount": "实收金额(元)",
            "deposit_amount": "押金金额(元)",
            "status": "订单状态",
            "status_cn": "订单状态(中文)",
            "sales_channel": "销售渠道",
            "sales_person": "销售负责人",
            "operator": "操作人",
            "created_at": "创建时间"
        },
        "status_mapping": {
            "pending": "待确认",
            "confirmed": "已确认",
            "checked_in": "已入住",
            "checked_out": "已退房",
            "cancelled": "已取消",
            "refunded": "已退款"
        },
        "filter_rules": "说明：订单状态流转顺序为 待确认→已确认→已入住→已退房，取消或退款会释放库存。"
    },
    "conversion": {
        "name": "套餐转化率分析导出",
        "description": "按套餐维度统计订单确认率与入住率与销售额",
        "fields": {
            "package_id": "套餐ID",
            "package_name": "套餐名称",
            "period": "统计周期",
            "total_orders": "下单数",
            "confirmed_orders": "确认数",
            "checked_in_orders": "入住数",
            "cancelled_orders": "取消数",
            "order_to_confirm_rate": "订单确认率(%)",
            "confirm_to_checkin_rate": "确认入住率(%)",
            "overall_conversion_rate": "整体转化率(%)",
            "total_revenue": "总营收(元)",
            "avg_order_value": "平均客单价(元)"
        },
        "formula": {
            "订单确认率": "确认数 / 下单数 × 100%",
            "确认入住率": "入住数 / 确认数 × 100%",
            "整体转化率": "入住数 / 估算咨询量 × 100%（咨询量按下单数×3估算）",
            "总营收": "实收金额合计，不含已取消和已退款订单"
        }
    },
    "inventory": {
        "name": "套餐库存明细导出",
        "description": "按日期展示各套餐的总库存、已售、预留及单价等",
        "fields": {
            "package_name": "套餐名称",
            "inventory_date": "日期",
            "total_quantity": "总库存",
            "sold_quantity": "已售",
            "reserved_quantity": "预留",
            "available_quantity": "可售",
            "available_rate": "可售率(%)",
            "unit_price": "单价(元)"
        }
    },
    "anomaly": {
        "name": "异常单导出",
        "description": "包含异常类型、影响范围、责任归属、赔付金额及处理状态等字段",
        "fields": {
            "anomaly_no": "异常单号",
            "order_no": "关联订单号",
            "package_name": "关联套餐",
            "anomaly_type": "异常类型",
            "anomaly_type_cn": "异常类型(中文)",
            "title": "异常标题",
            "description": "异常描述",
            "impact_level": "影响等级",
            "status": "处理状态",
            "status_cn": "处理状态(中文)",
            "responsibility_owner": "责任归属",
            "responsibility_owner_cn": "责任归属(中文)",
            "responsible_person": "责任人",
            "root_cause": "根本原因",
            "resolution": "处理结果",
            "compensation_amount": "赔付金额(元)",
            "reported_by": "上报人",
            "reported_at": "上报时间",
            "handled_by": "处理人",
            "resolved_at": "解决时间"
        },
        "anomaly_type_mapping": {
            "oversold": "套餐超卖",
            "price_mismatch": "价格异常",
            "inventory_error": "库存错误",
            "verification_failed": "核销失败",
            "deposit_issue": "押金问题"
        },
        "status_mapping": {
            "open": "待处理",
            "processing": "处理中",
            "resolved": "已解决",
            "closed": "已关闭"
        },
        "responsibility_mapping": {
            "sales": "销售部",
            "operations": "运营部",
            "front_desk": "前台",
            "system": "系统",
            "customer": "客户"
        }
    }
}


def _export_orders(db: Session, criteria: Optional[Dict[str, Any]]):
    query = db.query(Order)
    rows = []
    for o in query.all():
        rows.append({
            "order_no": o.order_no,
            "package_name": o.package.name if o.package else "",
            "homestay_name": o.package.homestay_name if o.package else "",
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "check_in_date": o.check_in_date,
            "check_out_date": o.check_out_date,
            "nights": o.nights,
            "room_count": o.room_count,
            "guest_count": o.guest_count,
            "original_amount": o.original_amount,
            "discount_amount": o.discount_amount,
            "final_amount": o.final_amount,
            "deposit_amount": o.deposit_amount,
            "status": o.status.value,
            "status_cn": DATA_CALIBER["orders"]["status_mapping"].get(o.status.value, o.status.value),
            "sales_channel": o.sales_channel or "",
            "sales_person": o.sales_person or "",
            "operator": o.operator or "",
            "created_at": o.created_at
        })
    return rows


def _export_conversion(db: Session, criteria: Optional[Dict[str, Any]]):
    from ..services import AnalyticsService
    period_start = criteria.get("period_start") if criteria else date(2020, 1, 1)
    period_end = criteria.get("period_end") if criteria else date.today()
    details = AnalyticsService.get_package_conversion(db, period_start, period_end)
    rows = []
    for d in details:
        m = d.metrics
        rows.append({
            "package_id": d.package_id,
            "package_name": d.package_name,
            "period": m.period,
            "total_orders": m.total_orders,
            "confirmed_orders": m.confirmed_orders,
            "checked_in_orders": m.checked_in_orders,
            "cancelled_orders": m.cancelled_orders,
            "order_to_confirm_rate": m.order_to_confirm_rate,
            "confirm_to_checkin_rate": m.confirm_to_checkin_rate,
            "overall_conversion_rate": m.overall_conversion_rate,
            "total_revenue": m.total_revenue,
            "avg_order_value": m.avg_order_value
        })
    return rows


def _export_inventory(db: Session, criteria: Optional[Dict[str, Any]]):
    query = db.query(PackageInventory)
    rows = []
    for inv in query.all():
        available = inv.total_quantity - inv.sold_quantity - inv.reserved_quantity
        rate = round(available / inv.total_quantity * 100, 2) if inv.total_quantity > 0 else 0
        rows.append({
            "package_name": inv.package.name if inv.package else "",
            "inventory_date": inv.inventory_date,
            "total_quantity": inv.total_quantity,
            "sold_quantity": inv.sold_quantity,
            "reserved_quantity": inv.reserved_quantity,
            "available_quantity": available,
            "available_rate": rate,
            "unit_price": inv.unit_price
        })
    return rows


def _export_anomaly(db: Session, criteria: Optional[Dict[str, Any]]):
    query = db.query(AnomalyOrder)
    rows = []
    cal = DATA_CALIBER["anomaly"]
    for a in query.all():
        rows.append({
            "anomaly_no": a.anomaly_no,
            "order_no": a.order.order_no if a.order else "",
            "package_name": a.package.name if a.package else "",
            "anomaly_type": a.anomaly_type.value,
            "anomaly_type_cn": cal["anomaly_type_mapping"].get(a.anomaly_type.value, a.anomaly_type.value),
            "title": a.title,
            "description": a.description or "",
            "impact_level": a.impact_level or "",
            "status": a.status.value,
            "status_cn": cal["status_mapping"].get(a.status.value, a.status.value),
            "responsibility_owner": a.responsibility_owner.value if a.responsibility_owner else "",
            "responsibility_owner_cn": cal["responsibility_mapping"].get(a.responsibility_owner.value, "") if a.responsibility_owner else "",
            "responsible_person": a.responsible_person or "",
            "root_cause": a.root_cause or "",
            "resolution": a.resolution or "",
            "compensation_amount": a.compensation_amount,
            "reported_by": a.reported_by or "",
            "reported_at": a.reported_at,
            "handled_by": a.handled_by or "",
            "resolved_at": a.resolved_at
        })
    return rows


EXPORT_FUNCS = {
    "orders": _export_orders,
    "conversion": _export_conversion,
    "inventory": _export_inventory,
    "anomaly": _export_anomaly
}


@router.post("", response_model=ExportTaskOut, tags=["数据导出"])
def create_export(
    obj: ExportTaskCreate,
    db: Session = Depends(get_db)
):
    if obj.export_type not in EXPORT_FUNCS:
        raise HTTPException(status_code=400, detail="不支持的导出类型")

    task = ExportTask(
        task_no=generate_export_task_no(),
        export_type=obj.export_type,
        status="processing",
        criteria=obj.criteria,
        data_caliber=DATA_CALIBER.get(obj.export_type),
        requested_by=obj.requested_by
    )
    db.add(task)
    db.flush()

    func = EXPORT_FUNCS[obj.export_type]
    rows = func(db, obj.criteria)
    caliber = DATA_CALIBER[obj.export_type]
    df = pd.DataFrame(rows)

    caliber_df = pd.DataFrame([
        {"字段": k, "说明": v} for k, v in caliber["fields"].items()
    ])
    extra_info = []
    if "formula" in caliber:
        extra_info.append({"项目": "指标公式", "内容": json.dumps(caliber["formula"], ensure_ascii=False)})
    if "status_mapping" in caliber:
        extra_info.append({"项目": "状态映射", "内容": json.dumps(caliber["status_mapping"], ensure_ascii=False)})
    if "filter_rules" in caliber:
        extra_info.append({"项目": "筛选说明", "内容": caliber["filter_rules"]})
    if "anomaly_type_mapping" in caliber:
        extra_info.append({"项目": "异常类型映射", "内容": json.dumps(caliber["anomaly_type_mapping"], ensure_ascii=False)})
    if "responsibility_mapping" in caliber:
        extra_info.append({"项目": "责任归属映射", "内容": json.dumps(caliber["responsibility_mapping"], ensure_ascii=False)})
    extra_df = pd.DataFrame(extra_info) if extra_info else None
    filename = f"{obj.export_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filepath = os.path.join(EXPORT_DIR, filename)

    with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='数据明细', index=False)
        caliber_df.to_excel(writer, sheet_name='数据口径说明', index=False)
        if extra_df is not None:
            extra_df.to_excel(writer, sheet_name='口径补充', index=False)

    task.status = "completed"
    task.file_url = f"/api/exports/download/{filename}"
    task.file_size = os.path.getsize(filepath)
    task.total_rows = len(rows)
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks", response_model=list[ExportTaskOut], tags=["数据导出"])
def list_export_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ExportTask)
    if status:
        query = query.filter(ExportTask.status == status)
    return query.order_by(ExportTask.created_at.desc()).all()


@router.get("/tasks/{task_id}", response_model=ExportTaskOut, tags=["数据导出"])
def get_export_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(ExportTask).filter(ExportTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    return task


@router.get("/download/{filename}", tags=["数据导出"])
def download_export(filename: str):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(EXPORT_DIR, safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(
        path=filepath,
        filename=safe_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
