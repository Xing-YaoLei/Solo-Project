from __future__ import annotations

import io
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

import streamlit as st
import polars as pl

from src.data.database import db
from src.data.minio_client import minio_client
from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole
from src.ui.charts import metric_card, style_dataframe, safe_drop_columns


ORDERS_STANDARD_COLUMNS = [
    "order_id", "event_id", "buyer_name", "buyer_phone", "buyer_email",
    "total_amount", "discount_amount", "final_amount", "ticket_count",
    "order_status", "order_source", "sales_channel",
]

TICKETS_STANDARD_COLUMNS = [
    "ticket_id", "order_id", "event_id", "ticket_type_id", "sponsor_id",
    "ticket_code", "buyer_name", "buyer_phone", "buyer_email",
    "attendee_name", "seat_info", "original_price", "discount_amount",
    "final_price", "ticket_status", "purchase_time", "payment_status",
    "refund_status", "source_file",
]

PAYMENTS_STANDARD_COLUMNS = [
    "payment_id", "order_id", "event_id", "payment_method", "transaction_id",
    "amount", "payment_status", "payment_time", "refund_amount",
    "refund_time", "refund_reason", "gateway_response", "source_file",
]

COLUMN_ALIAS_MAP = {
    "tickets": {
        "票码": "ticket_code", "门票编码": "ticket_code", "ticket_code": "ticket_code",
        "订单号": "order_id", "订单ID": "order_id", "order_id": "order_id",
        "票种ID": "ticket_type_id", "票种": "ticket_type_name",
        "票种名称": "ticket_type_name", "type_name": "ticket_type_name",
        "购票人": "buyer_name", "购票人姓名": "buyer_name", "购买人": "buyer_name",
        "购票人手机": "buyer_phone", "联系手机": "buyer_phone", "phone": "buyer_phone",
        "购票人邮箱": "buyer_email", "联系邮箱": "buyer_email", "email": "buyer_email",
        "持票人": "attendee_name", "持票人姓名": "attendee_name", "attendee": "attendee_name",
        "座位": "seat_info", "座位信息": "seat_info", "seat": "seat_info",
        "原价": "original_price", "原始价格": "original_price", "original_price": "original_price",
        "优惠金额": "discount_amount", "折扣金额": "discount_amount",
        "实付金额": "final_price", "实际价格": "final_price", "price": "final_price",
        "支付状态": "payment_status", "支付": "payment_status",
        "票据状态": "ticket_status", "票状态": "ticket_status", "ticket_status": "ticket_status",
        "退票状态": "refund_status", "退款状态": "refund_status",
        "购买时间": "purchase_time", "下单时间": "purchase_time", "created_at": "purchase_time",
        "订单来源": "order_source", "来源": "order_source", "source": "order_source",
        "销售渠道": "sales_channel", "渠道": "sales_channel", "channel": "sales_channel",
        "赞助商": "sponsor_name", "赞助商名称": "sponsor_name",
        "赞助商ID": "sponsor_id", "sponsor_id": "sponsor_id",
        "订单金额": "total_amount", "总金额": "total_amount", "total": "total_amount",
        "订单实付": "final_amount", "order_final_amount": "final_amount",
        "购票人名字": "buyer_name",
    },
    "payments": {
        "交易流水号": "transaction_id", "交易ID": "transaction_id", "交易号": "transaction_id",
        "支付ID": "payment_id", "payment_id": "payment_id",
        "订单号": "order_id", "order_id": "order_id",
        "门票ID": "ticket_id", "ticket_id": "ticket_id",
        "金额": "amount", "支付金额": "amount", "amount": "amount", "payment_amount": "amount",
        "币种": "currency", "currency": "currency",
        "支付方式": "payment_method", "payment_method": "payment_method", "method": "payment_method",
        "支付状态": "payment_status", "payment_status": "payment_status", "status": "payment_status",
        "支付时间": "payment_time", "paid_time": "payment_time", "paidAt": "payment_time", "pay_time": "payment_time",
        "支付渠道": "gateway", "gateway": "gateway", "渠道": "gateway",
        "渠道订单号": "gateway_order_id", "gateway_order_id": "gateway_order_id",
        "退款金额": "refund_amount", "refund_amount": "refund_amount",
        "退款时间": "refund_time", "refund_time": "refund_time",
        "退款原因": "refund_reason", "refund_reason": "refund_reason",
        "网关响应": "gateway_response", "raw_response": "gateway_response", "gateway_response": "gateway_response",
    },
}


IMPORT_TYPES = {
    "tickets": {
        "label": "🎫 票务平台数据",
        "description": "票务平台导出的门票明细，含订单、票种、持票人等，导入 orders+tickets 两张表",
        "tables": ["orders", "tickets"],
        "required_columns": ["ticket_code"],
        "suggested_columns": [
            "order_id", "ticket_id", "ticket_code", "ticket_type_id",
            "buyer_name", "buyer_phone", "buyer_email", "attendee_name",
            "seat_info", "original_price", "discount_amount", "final_price",
            "payment_status", "ticket_status", "purchase_time",
            "order_source", "sales_channel", "sponsor_id",
        ],
    },
    "payments": {
        "label": "💳 支付流水数据",
        "description": "支付平台导出的交易流水，用于核销漏斗对账和财务核对",
        "tables": ["payments"],
        "required_columns": ["transaction_id"],
        "suggested_columns": [
            "payment_id", "transaction_id", "order_id", "amount",
            "payment_method", "payment_status", "payment_time",
            "gateway", "refund_amount", "refund_time", "gateway_response",
        ],
    },
}


def _detect_format(filename: str) -> str:
    if filename.lower().endswith(".json"):
        return "json"
    return "csv"


def _read_uploaded_file(file, fmt: str) -> Optional[pl.DataFrame]:
    try:
        if fmt == "json":
            content = file.getvalue().decode("utf-8")
            data = json.loads(content)
            if isinstance(data, list):
                return pl.DataFrame(data, infer_schema_length=None)
            elif isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
                return pl.DataFrame(data["data"], infer_schema_length=None)
            else:
                return pl.DataFrame([data], infer_schema_length=None)
        else:
            return pl.read_csv(io.BytesIO(file.getvalue()), infer_schema_length=None)
    except Exception as e:
        st.error(f"文件解析失败: {str(e)}")
        return None


def _map_to_standard_columns(df: pl.DataFrame, import_type: str) -> pl.DataFrame:
    result = df.clone()
    mapping = COLUMN_ALIAS_MAP.get(import_type, {})
    rename_map: Dict[str, str] = {}
    for col in result.columns:
        clean = col.strip()
        if clean in mapping and mapping[clean] not in result.columns and mapping[clean] != clean:
            rename_map[col] = mapping[clean]
        elif clean.lower() in {k.lower(): v for k, v in mapping.items()}:
            for k, v in mapping.items():
                if k.lower() == clean.lower() and v not in result.columns:
                    rename_map[col] = v
                    break
    if rename_map:
        result = result.rename(rename_map)
    return result


def _validate_columns(df: pl.DataFrame, required: List[str]) -> Tuple[bool, List[str]]:
    missing = [col for col in required if col not in df.columns]
    return len(missing) == 0, missing


def _ensure_event_id(df: pl.DataFrame, event_id: Optional[str]) -> pl.DataFrame:
    if event_id and "event_id" not in df.columns:
        return df.with_columns(pl.lit(event_id).alias("event_id"))
    return df


def _generate_order_id(idx: int, event_id: Optional[str]) -> str:
    prefix = event_id or "ORD"
    return f"{prefix}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{idx:06d}"


def _generate_ticket_id(idx: int) -> str:
    return f"TKT_{uuid.uuid4().hex[:12].upper()}"


def _generate_payment_id(idx: int) -> str:
    return f"PAY_{uuid.uuid4().hex[:12].upper()}"


def _normalize_orders_df(df: pl.DataFrame, event_id: Optional[str]) -> pl.DataFrame:
    work = df.clone()
    work = _ensure_event_id(work, event_id)

    if "order_id" not in work.columns:
        work = work.with_row_index("__ord_idx").with_columns(
            pl.col("__ord_idx").map_elements(lambda i: _generate_order_id(i, event_id), return_dtype=str).alias("order_id")
        ).drop("__ord_idx")
    else:
        work = work.with_columns(
            pl.when(pl.col("order_id").is_null() | (pl.col("order_id").cast(pl.Utf8) == ""))
            .then(pl.concat_str([pl.lit("ORD_AUTO_"), pl.int_range(0, work.height).cast(pl.Utf8)]))
            .otherwise(pl.col("order_id").cast(pl.Utf8))
            .alias("order_id")
        )

    if "order_status" not in work.columns:
        work = work.with_columns(pl.lit("completed").alias("order_status"))

    for col in ["total_amount", "discount_amount", "final_amount", "ticket_count"]:
        if col in work.columns:
            work = work.with_columns(pl.col(col).cast(pl.Float64, strict=False).alias(col))
        else:
            if col != "ticket_count":
                work = work.with_columns(pl.lit(None).cast(pl.Float64).alias(col))

    if "ticket_count" not in work.columns:
        work = work.with_columns(pl.lit(1).cast(pl.Int64).alias("ticket_count"))

    for col in ["buyer_name", "buyer_phone", "buyer_email", "order_status", "order_source", "sales_channel"]:
        if col not in work.columns:
            work = work.with_columns(pl.lit(None).cast(pl.Utf8).alias(col))
        else:
            work = work.with_columns(pl.col(col).cast(pl.Utf8, strict=False).alias(col))

    existing = [c for c in ORDERS_STANDARD_COLUMNS if c in work.columns]
    return work.select(existing).unique(subset=["order_id"])


def _normalize_tickets_df(
    df: pl.DataFrame,
    event_id: Optional[str],
    source_file: str,
    default_ticket_type_id: str,
) -> pl.DataFrame:
    work = df.clone()
    work = _ensure_event_id(work, event_id)
    work = work.with_columns(pl.lit(source_file).alias("source_file"))

    if "ticket_id" not in work.columns:
        work = work.with_row_index("__tkt_idx").with_columns(
            pl.col("__tkt_idx").map_elements(lambda i: _generate_ticket_id(i), return_dtype=str).alias("ticket_id")
        ).drop("__tkt_idx")

    if "order_id" not in work.columns:
        work = work.with_row_index("__ord_idx").with_columns(
            pl.col("__ord_idx").map_elements(lambda i: _generate_order_id(i, event_id), return_dtype=str).alias("order_id")
        ).drop("__ord_idx")
    else:
        work = work.with_columns(
            pl.when(pl.col("order_id").is_null() | (pl.col("order_id").cast(pl.Utf8) == ""))
            .then(pl.concat_str([pl.lit("ORD_AUTO_"), pl.int_range(0, work.height).cast(pl.Utf8)]))
            .otherwise(pl.col("order_id").cast(pl.Utf8))
            .alias("order_id")
        )

    if "ticket_type_id" not in work.columns:
        work = work.with_columns(pl.lit(default_ticket_type_id).alias("ticket_type_id"))
    else:
        work = work.with_columns(
            pl.when(pl.col("ticket_type_id").is_null() | (pl.col("ticket_type_id").cast(pl.Utf8) == ""))
            .then(pl.lit(default_ticket_type_id))
            .otherwise(pl.col("ticket_type_id").cast(pl.Utf8))
            .alias("ticket_type_id")
        )

    if "ticket_status" not in work.columns:
        work = work.with_columns(pl.lit("active").alias("ticket_status"))
    if "payment_status" not in work.columns:
        work = work.with_columns(pl.lit("paid").alias("payment_status"))
    if "refund_status" not in work.columns:
        work = work.with_columns(pl.lit("none").alias("refund_status"))

    work = work.with_columns(pl.col("ticket_code").cast(pl.Utf8, strict=False).alias("ticket_code"))

    for col in ["original_price", "discount_amount", "final_price"]:
        if col in work.columns:
            work = work.with_columns(pl.col(col).cast(pl.Float64, strict=False).alias(col))
        else:
            work = work.with_columns(pl.lit(None).cast(pl.Float64).alias(col))

    for col in [
        "buyer_name", "buyer_phone", "buyer_email", "attendee_name", "seat_info",
        "ticket_status", "payment_status", "refund_status", "sponsor_id",
    ]:
        if col not in work.columns:
            work = work.with_columns(pl.lit(None).cast(pl.Utf8).alias(col))
        else:
            work = work.with_columns(pl.col(col).cast(pl.Utf8, strict=False).alias(col))

    if "purchase_time" in work.columns:
        work = work.with_columns(
            pl.col("purchase_time").cast(pl.Utf8, strict=False).str.to_datetime(strict=False).alias("purchase_time")
        )
    else:
        work = work.with_columns(pl.lit(None).cast(pl.Datetime).alias("purchase_time"))

    existing = [c for c in TICKETS_STANDARD_COLUMNS if c in work.columns]
    missing_std = [c for c in TICKETS_STANDARD_COLUMNS if c not in existing]
    if missing_std:
        st.warning(f"标准化后仍缺少标准列(会补NULL): {', '.join(missing_std)}")

    result = work.select(existing).unique(subset=["ticket_code"])
    return result


def _get_or_create_default_ticket_type(event_id: str) -> str:
    default_tt_id = f"TT_IMPORT_{event_id}"
    check_sql = f"SELECT ticket_type_id FROM ticket_types WHERE ticket_type_id = '{default_tt_id}' LIMIT 1"
    existing = db.query_to_df(check_sql)
    if existing.height == 0:
        create_sql = f"""
        INSERT INTO ticket_types (ticket_type_id, event_id, type_name, price, total_quantity, description)
        VALUES ('{default_tt_id}', '{event_id}', '导入通用票种', 0, 100000, '数据导入自动创建的通用票种')
        """
        try:
            db.conn.execute(create_sql)
        except Exception:
            pass
    return default_tt_id


def _normalize_payments_df(df: pl.DataFrame, event_id: Optional[str], source_file: str) -> pl.DataFrame:
    work = df.clone()
    work = _ensure_event_id(work, event_id)
    work = work.with_columns(pl.lit(source_file).alias("source_file"))

    if "payment_time" not in work.columns and "paid_time" in work.columns:
        work = work.rename({"paid_time": "payment_time"})

    if "payment_id" not in work.columns:
        work = work.with_row_index("__pay_idx").with_columns(
            pl.col("__pay_idx").map_elements(lambda i: _generate_payment_id(i), return_dtype=str).alias("payment_id")
        ).drop("__pay_idx")

    if "order_id" not in work.columns:
        work = work.with_columns(pl.lit("UNKNOWN_ORDER").alias("order_id"))

    work = work.with_columns(pl.col("transaction_id").cast(pl.Utf8, strict=False).alias("transaction_id"))

    for col in ["amount", "refund_amount"]:
        if col in work.columns:
            work = work.with_columns(pl.col(col).cast(pl.Float64, strict=False).alias(col))

    for col in ["payment_method", "payment_status", "refund_reason"]:
        if col in work.columns:
            work = work.with_columns(pl.col(col).cast(pl.Utf8, strict=False).alias(col))

    if "payment_time" in work.columns:
        work = work.with_columns(
            pl.col("payment_time").cast(pl.Utf8, strict=False).str.to_datetime(strict=False).alias("payment_time")
        )
    if "refund_time" in work.columns:
        work = work.with_columns(
            pl.col("refund_time").cast(pl.Utf8, strict=False).str.to_datetime(strict=False).alias("refund_time")
        )
    if "gateway_response" in work.columns:
        work = work.with_columns(pl.col("gateway_response").cast(pl.Utf8, strict=False).alias("gateway_response"))

    existing = [c for c in PAYMENTS_STANDARD_COLUMNS if c in work.columns]
    result = work.select(existing).unique(subset=["transaction_id"])
    return result


def _import_tickets_data(df: pl.DataFrame, event_id: Optional[str], source_file: str) -> Dict[str, Any]:
    stats: Dict[str, Any] = {"orders": 0, "tickets": 0, "errors": []}

    if not event_id:
        stats["errors"].append("导入票务数据必须指定目标活动 event_id")
        return stats

    default_tt_id = _get_or_create_default_ticket_type(event_id)

    try:
        orders_df = _normalize_orders_df(df, event_id)
        if orders_df.height > 0:
            inserted = db.write_df(orders_df, "orders", if_exists="append")
            stats["orders"] = inserted
    except Exception as e:
        stats["errors"].append(f"订单表写入失败: {str(e)}")

    try:
        tickets_df = _normalize_tickets_df(df, event_id, source_file, default_tt_id)
        if tickets_df.height > 0:
            inserted = db.write_df(tickets_df, "tickets", if_exists="append")
            stats["tickets"] = inserted
    except Exception as e:
        stats["errors"].append(f"门票表写入失败: {str(e)}")

    return stats


def _import_payments_data(df: pl.DataFrame, event_id: Optional[str], source_file: str) -> Dict[str, Any]:
    stats: Dict[str, Any] = {"payments": 0, "tickets_updated": 0, "errors": []}
    try:
        payments_df = _normalize_payments_df(df, event_id, source_file)
        if payments_df.height > 0:
            inserted = db.write_df(payments_df, "payments", if_exists="append")
            stats["payments"] = inserted

            if event_id and inserted > 0:
                order_ids = payments_df.filter(pl.col("payment_status").is_in(["success", "paid"]))["order_id"].unique().to_list()
                if order_ids:
                    placeholders = ",".join([f"'{o}'" for o in order_ids])
                    update_sql = f"""
                    UPDATE tickets
                    SET payment_status = 'paid'
                    WHERE event_id = '{event_id}'
                      AND order_id IN ({placeholders})
                      AND (payment_status IS NULL OR payment_status != 'paid')
                    """
                    try:
                        result = db.conn.execute(update_sql)
                        stats["tickets_updated"] = result.fetchone()[0] if result.description else 0
                    except Exception as e:
                        stats["errors"].append(f"更新票务支付状态失败: {str(e)}")
    except Exception as e:
        stats["errors"].append(f"支付流水写入失败: {str(e)}")
    return stats


def _archive_to_minio(file_bytes: bytes, filename: str, import_type: str, event_id: Optional[str]) -> Tuple[bool, str]:
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        event_prefix = event_id if event_id else "unknown_event"
        object_name = f"imports/{event_prefix}/{import_type}/{timestamp}_{filename}"
        fmt = _detect_format(filename)
        content_type = "application/json" if fmt == "json" else "text/csv"
        ok, info = minio_client.upload_bytes(file_bytes, object_name, content_type)
        if ok:
            return True, object_name
        else:
            return False, info
    except Exception as e:
        return False, str(e)


def _get_import_history(event_id: Optional[str] = None) -> pl.DataFrame:
    try:
        parts: List[str] = []
        for table, time_col in [("tickets", "purchase_time"), ("payments", "payment_time")]:
            sql = f"""
            SELECT
                '{table}' as import_type,
                source_file,
                COUNT(*) as record_count,
                MIN({time_col}) as first_time,
                MAX({time_col}) as last_time,
                MAX(created_at) as imported_at
            FROM {table}
            WHERE source_file IS NOT NULL
            """
            if event_id:
                sql += f" AND event_id = '{event_id}'"
            sql += " GROUP BY source_file"
            parts.append(sql)

        full_sql = " UNION ALL ".join(parts) + " ORDER BY imported_at DESC NULLS LAST"
        return db.query_to_df(full_sql)
    except Exception as e:
        st.warning(f"读取导入历史异常: {str(e)}")
        return pl.DataFrame(schema=["import_type", "source_file", "record_count", "first_time", "last_time", "imported_at"])


def render_import_data_page(event_id: Optional[str] = None) -> None:
    role = permission_manager.get_current_role()

    if not permission_manager.role_has_access(UserRole.TICKET_STAFF, role):
        st.error("🔒 您无权限导入数据，需要票务人员或主办方权限")
        return

    st.markdown("## 📥 数据导入中心")
    st.caption("导入票务平台和支付流水数据到 DuckDB，原始文件自动归档 MinIO，导入后立即可在核销漏斗复盘查看")

    tab_import, tab_history, tab_guide = st.tabs(["📤 数据导入", "📋 导入历史", "📖 导入指南"])

    with tab_import:
        minio_status = minio_client.get_status_info()
        if minio_status["available"]:
            st.success(f"✅ 对象存储就绪: {minio_status['endpoint']} / bucket: {minio_status['bucket']}")
        else:
            fallback_dir = minio_status.get("fallback_dir") or "./data/archive"
            st.info(f"📦 对象存储离线，使用本地归档目录: `{fallback_dir}`（文件仍会按 imports/{{event_id}}/{{type}} 路径保存）")

        st.markdown("### 选择导入类型")

        import_type_key = st.selectbox(
            "数据类型",
            options=list(IMPORT_TYPES.keys()),
            format_func=lambda k: f"{IMPORT_TYPES[k]['label']} - {IMPORT_TYPES[k]['description']}",
            key="import_type_select",
        )
        import_info = IMPORT_TYPES[import_type_key]

        st.divider()
        st.markdown("### 上传文件")
        st.caption("支持 CSV 和 JSON 格式，建议 UTF-8 编码。JSON 使用数组格式或带 data 字段")

        uploaded_file = st.file_uploader(
            "选择文件",
            type=["csv", "json"],
            accept_multiple_files=False,
            key=f"file_upload_{import_type_key}",
        )

        df_std: Optional[pl.DataFrame] = None

        if uploaded_file is not None:
            file_bytes = uploaded_file.getvalue()
            filename = uploaded_file.name
            fmt = _detect_format(filename)

            st.info(f"📄 文件名: **{filename}** | 格式: **{fmt.upper()}** | 大小: **{len(file_bytes)/1024:.1f} KB**")

            df_raw = _read_uploaded_file(uploaded_file, fmt)

            if df_raw is not None and df_raw.height > 0:
                st.success(f"✅ 解析成功，共 {df_raw.height} 条记录，{df_raw.width} 个字段")

                df_std = _map_to_standard_columns(df_raw, import_type_key)

                with st.expander("🔍 字段映射详情", expanded=True):
                    mc1, mc2 = st.columns(2)
                    with mc1:
                        st.markdown("**原始字段**")
                        orig_preview = pl.DataFrame({
                            "字段名": df_raw.columns,
                            "示例值": [str(df_raw[c][0])[:60] if df_raw.height > 0 else "" for c in df_raw.columns],
                        })
                        style_dataframe(orig_preview, height=260)
                    with mc2:
                        st.markdown("**标准化后字段**")
                        std_preview = pl.DataFrame({
                            "字段名": df_std.columns,
                            "示例值": [str(df_std[c][0])[:60] if df_std.height > 0 else "" for c in df_std.columns],
                        })
                        style_dataframe(std_preview, height=260)

                valid, missing = _validate_columns(df_std, import_info["required_columns"])

                if not valid:
                    st.error(f"❌ 缺少必要字段: **{', '.join(missing)}**")
                    st.info("💡 请使用正确的中/英列名，或在原始文件中补充上述字段后重试")
                else:
                    st.success(f"✅ 字段校验通过，必填字段: {', '.join(import_info['required_columns'])}")

                    with st.expander("📊 数据预览（前20条，标准化后）", expanded=False):
                        style_dataframe(df_std.head(20), height=340)

                    st.divider()
                    st.markdown("### 导入配置")

                    target_event = event_id
                    if not target_event:
                        events_df = db.query_to_df("SELECT event_id, event_name FROM events ORDER BY created_at DESC")
                        if events_df.height > 0:
                            event_options = [(row["event_id"], row["event_name"]) for row in events_df.iter_rows(named=True)]
                            ev_idx = st.selectbox(
                                "目标活动",
                                range(len(event_options)),
                                format_func=lambda i: f"{event_options[i][1]} ({event_options[i][0]})",
                                key="import_target_event",
                            )
                            target_event = event_options[ev_idx][0]
                        else:
                            st.warning("⚠️ 未找到活动，可在侧边栏先用数据生成器创建")
                            target_event = None

                    archive_minio = st.checkbox(
                        "✅ 同时归档原始文件（推荐，便于审计追溯）",
                        value=True,
                        key="archive_minio_check",
                    )
                    if not minio_status["available"]:
                        st.caption("ℹ️ 当前使用本地文件系统归档（MinIO 离线时自动 fallback）")

                    st.divider()

                    col_pre, col_run = st.columns([1, 1])
                    with col_pre:
                        if st.button("🔍 预演导入统计", use_container_width=True, key="preview_import"):
                            with st.spinner("分析数据中..."):
                                if import_type_key == "tickets":
                                    order_cnt = df_std.select(["order_id"]).unique().height if "order_id" in df_std.columns else df_std.height
                                    ticket_cnt = df_std.select(["ticket_code"]).unique().height if "ticket_code" in df_std.columns else 0
                                    st.info(
                                        "📊 预演结果\n\n"
                                        f"- 预计导入订单: **{order_cnt}** 条\n"
                                        f"- 预计导入门票: **{ticket_cnt}** 张\n"
                                        f"- 目标活动: **{target_event or '未指定'}**\n"
                                        f"- 归档 MinIO: **{'是' if archive_minio else '否'}**"
                                    )
                                else:
                                    pay_cnt = df_std.select(["transaction_id"]).unique().height if "transaction_id" in df_std.columns else 0
                                    st.info(
                                        "📊 预演结果\n\n"
                                        f"- 预计导入支付流水: **{pay_cnt}** 条\n"
                                        f"- 目标活动: **{target_event or '未指定'}**\n"
                                        f"- 归档 MinIO: **{'是' if archive_minio else '否'}**"
                                    )

                    with col_run:
                        if st.button("🚀 确认导入到 DuckDB", type="primary", use_container_width=True, key="confirm_import"):
                            with st.spinner("正在写入 DuckDB 并归档 MinIO..."):
                                source_tag = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"

                                if import_type_key == "tickets":
                                    stats = _import_tickets_data(df_std, target_event, source_tag)
                                elif import_type_key == "payments":
                                    stats = _import_payments_data(df_std, target_event, source_tag)
                                else:
                                    stats = {"errors": ["未知导入类型"]}

                                archived_path = ""
                                if archive_minio and not stats.get("errors"):
                                    ok, info = _archive_to_minio(file_bytes, filename, import_type_key, target_event)
                                    if not ok:
                                        stats["errors"] = stats.get("errors", []) + [f"MinIO 归档失败: {info}（数据已写入 DuckDB）"]
                                    else:
                                        archived_path = info

                                if stats.get("errors"):
                                    for err in stats["errors"]:
                                        st.error(f"❌ {err}")
                                else:
                                    st.success("🎉 数据导入成功！已写入 DuckDB 并可用于核销漏斗复盘")

                                    if import_type_key == "tickets":
                                        mc1, mc2 = st.columns(2)
                                        with mc1:
                                            metric_card("导入订单数", stats.get("orders", 0))
                                        with mc2:
                                            metric_card("导入门票数", stats.get("tickets", 0))
                                    else:
                                        mc1, mc2, mc3 = st.columns(3)
                                        with mc1:
                                            metric_card("🧾 导入支付流水", stats.get("payments", 0))
                                        tickets_updated = stats.get("tickets_updated", 0)
                                        with mc2:
                                            delta_text = f"{tickets_updated} 张已支付" if tickets_updated > 0 else None
                                            delta_color = "normal" if tickets_updated > 0 else "off"
                                            metric_card(
                                                "🔄 联动更新票务已支付",
                                                tickets_updated,
                                                delta=delta_text,
                                                delta_color=delta_color,
                                                help_text="按 order_id 将未支付门票的 payment_status 更新为 paid",
                                            )
                                        if target_event:
                                            analytics = TicketAnalytics(target_event)
                                            recon = analytics.get_payment_reconciliation()
                                            if recon:
                                                with mc3:
                                                    metric_card(
                                                        "📊 对账状态",
                                                        recon.get("对账状态", "-"),
                                                        help_text=recon.get("对账详情", ""),
                                                    )

                                    st.caption(f"源文件标签: `{source_tag}`")
                                    if archived_path:
                                        st.caption(f"📦 归档路径: `{archived_path}`")

                                    st.info("💡 前往 🎯 总览看板 即可查看更新后的核销漏斗和支付对账数据")

        if df_std is None:
            st.info("👆 请先上传 CSV 或 JSON 文件开始导入")

    with tab_history:
        st.markdown("### 📋 导入历史记录")
        history_df = _get_import_history(event_id)

        if history_df.height == 0:
            st.info("暂无导入记录，去「数据导入」标签页开始导入吧")
        else:
            display = history_df.rename({
                "import_type": "数据类型",
                "source_file": "源文件标签",
                "record_count": "记录数",
                "first_time": "数据最早时间",
                "last_time": "数据最晚时间",
                "imported_at": "导入时间",
            })
            style_dataframe(display, height=420)

            st.divider()
            total_records = history_df["record_count"].sum() if "record_count" in history_df.columns else 0
            hc1, hc2, hc3 = st.columns(3)
            hc1.metric("总导入批次", history_df.height)
            hc2.metric("总记录数", total_records)
            hc3.metric("数据类型数", history_df.select(["import_type"]).unique().height if "import_type" in history_df.columns else 0)

    with tab_guide:
        st.markdown("### 📖 导入指南")

        st.markdown("#### 一、支持的数据格式")
        st.markdown("""
- **CSV**：逗号分隔，UTF-8 编码，首行表头
- **JSON**：数组格式 `[{...}, {...}]` 或 `{"data": [...]}` 包装
- 中文字段自动映射为标准字段（如「持票人」→ `attendee_name`）
""")

        st.markdown("#### 二、票务平台数据字段说明")
        tickets_guide = pl.DataFrame({
            "字段名": IMPORT_TYPES["tickets"]["suggested_columns"],
            "是否必填": ["否", "否", "**是**", "否", "否", "否", "否", "否", "否", "否", "否", "否", "否", "否", "否", "否", "否", "否"],
            "说明": [
                "订单编号", "门票ID(可自动生成)", "票码(扫码核销用，必填唯一)", "票种ID",
                "购票人姓名", "购票人手机", "购票人邮箱", "持票人姓名", "座位信息",
                "原价", "优惠金额", "实付金额", "支付状态", "票据状态", "购买时间",
                "订单来源", "销售渠道", "赞助商ID",
            ],
        })
        style_dataframe(tickets_guide, height=420)

        st.markdown("#### 三、支付流水字段说明")
        payments_guide = pl.DataFrame({
            "字段名": IMPORT_TYPES["payments"]["suggested_columns"],
            "是否必填": ["否", "**是**", "否", "否", "否", "否", "否", "否", "否", "否", "否"],
            "说明": [
                "支付ID(可自动生成)", "交易流水号(必填，唯一去重)", "关联订单号",
                "支付金额", "支付方式", "支付状态", "支付时间(统一写入 payment_time)",
                "支付网关", "退款金额", "退款时间", "网关原始响应JSON",
            ],
        })
        style_dataframe(payments_guide, height=320)

        st.markdown("#### 四、导入流程")
        st.markdown("""
1. 选择数据类型（票务 / 支付）
2. 上传 CSV 或 JSON 文件
3. 系统自动识别字段并映射为标准列名
4. 预览数据与统计，确认无误
5. 选择目标活动，点击「确认导入到 DuckDB」
6. 数据按表字段对齐写入 DuckDB，原始文件归档 MinIO
7. 前往 🎯 总览看板 查看更新后的核销漏斗
""")

        st.markdown("#### 五、导入写入说明")
        st.info("""
**字段自动对齐**：write_df 会根据表 schema 只取 DataFrame 与表结构交集的列，自动进行类型转换（金额→Float64、时间→TIMESTAMP等），不会因为多余列报错。

**幂等去重**：以主键去重写入（orders.order_id、tickets.ticket_code、payments.transaction_id），重复导入会因唯一约束跳过，不会产生脏数据。

**MinIO 归档路径**：
```
imports/{event_id}/{tickets|payments}/{YYYYMMDD_HHMMSS}_{filename}
```
例：`imports/EVT_001/tickets/20260621_150000_june_event_tickets.csv`
""")

        st.warning("""
- 大文件建议分批次导入，单批次建议不超过 10 万条
- 导入完成后请立即在 🎯 总览看板核对核销漏斗5层数据是否合理
- 所有原始文件永久归档 MinIO，支持审计追溯和重放导入
""")
