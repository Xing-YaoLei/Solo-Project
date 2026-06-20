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
from src.auth.permissions import permission_manager, UserRole
from src.ui.charts import metric_card, style_dataframe, safe_drop_columns


IMPORT_TYPES = {
    "tickets": {
        "label": "🎫 票务平台数据",
        "description": "票务平台导出的门票明细，包含订单、票种、持票人等信息",
        "tables": ["orders", "tickets"],
        "required_columns": ["ticket_code"],
        "suggested_columns": [
            "order_id", "ticket_id", "ticket_code", "ticket_type_id", "ticket_type_name",
            "buyer_name", "buyer_phone", "buyer_email", "attendee_name", "seat_info",
            "original_price", "discount_amount", "final_price", "payment_status",
            "ticket_status", "purchase_time", "order_source", "sales_channel",
            "sponsor_id", "sponsor_name",
        ],
    },
    "payments": {
        "label": "💳 支付流水数据",
        "description": "支付平台导出的交易流水，用于核销漏斗对账",
        "tables": ["payments"],
        "required_columns": ["transaction_id"],
        "suggested_columns": [
            "payment_id", "transaction_id", "order_id", "ticket_id",
            "amount", "currency", "payment_method", "payment_status",
            "paid_time", "gateway", "gateway_order_id", "refund_amount",
            "refund_time", "gateway_response",
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


def _validate_columns(df: pl.DataFrame, required: List[str]) -> Tuple[bool, List[str]]:
    missing = [col for col in required if col not in df.columns]
    return len(missing) == 0, missing


def _map_to_standard_columns(df: pl.DataFrame, import_type: str) -> pl.DataFrame:
    result = df.clone()
    column_maps = {
        "tickets": {
            "票码": "ticket_code",
            "门票编码": "ticket_code",
            "订单号": "order_id",
            "订单ID": "order_id",
            "票种ID": "ticket_type_id",
            "票种": "ticket_type_name",
            "票种名称": "ticket_type_name",
            "购票人": "buyer_name",
            "购票人姓名": "buyer_name",
            "购票手机": "buyer_phone",
            "联系手机": "buyer_phone",
            "购票邮箱": "buyer_email",
            "持票人": "attendee_name",
            "持票人姓名": "attendee_name",
            "座位": "seat_info",
            "座位信息": "seat_info",
            "原价": "original_price",
            "优惠金额": "discount_amount",
            "实付金额": "final_price",
            "支付状态": "payment_status",
            "票据状态": "ticket_status",
            "购买时间": "purchase_time",
            "下单时间": "purchase_time",
            "订单来源": "order_source",
            "销售渠道": "sales_channel",
            "赞助商": "sponsor_name",
            "赞助商ID": "sponsor_id",
        },
        "payments": {
            "交易流水号": "transaction_id",
            "交易ID": "transaction_id",
            "支付ID": "payment_id",
            "订单号": "order_id",
            "门票ID": "ticket_id",
            "金额": "amount",
            "币种": "currency",
            "支付方式": "payment_method",
            "支付状态": "payment_status",
            "支付时间": "paid_time",
            "支付渠道": "gateway",
            "渠道订单号": "gateway_order_id",
            "退款金额": "refund_amount",
            "退款时间": "refund_time",
        },
    }
    mapping = column_maps.get(import_type, {})
    rename_map = {}
    for col in result.columns:
        if col in mapping and mapping[col] not in result.columns:
            rename_map[col] = mapping[col]
    if rename_map:
        result = result.rename(rename_map)
    return result


def _ensure_event_id(df: pl.DataFrame, event_id: Optional[str]) -> pl.DataFrame:
    if event_id and "event_id" not in df.columns:
        return df.with_columns(pl.lit(event_id).alias("event_id"))
    return df


def _import_tickets_data(df: pl.DataFrame, event_id: Optional[str], source_file: str) -> Dict[str, Any]:
    stats = {"orders": 0, "tickets": 0, "skipped": 0, "errors": []}

    orders_cols = [c for c in [
        "order_id", "event_id", "buyer_name", "buyer_phone", "buyer_email",
        "total_amount", "discount_amount", "final_amount", "ticket_count",
        "order_status", "order_source", "sales_channel",
    ] if c in df.columns]

    if "order_id" in df.columns:
        orders_df = df.select(orders_cols).unique(subset=["order_id"])
        orders_df = _ensure_event_id(orders_df, event_id)
        orders_df = orders_df.with_columns([
            pl.col(c).cast(pl.Float64).alias(c)
            for c in ["total_amount", "discount_amount", "final_amount"]
            if c in orders_df.columns
        ])
        try:
            db.write_df(orders_df, "orders", mode="append")
            stats["orders"] = orders_df.height
        except Exception as e:
            stats["errors"].append(f"订单写入失败: {str(e)}")

    tickets_cols = [c for c in [
        "ticket_id", "order_id", "event_id", "ticket_type_id", "sponsor_id",
        "ticket_code", "buyer_name", "buyer_phone", "buyer_email",
        "attendee_name", "seat_info", "original_price", "discount_amount",
        "final_price", "payment_status", "ticket_status", "refund_status",
        "purchase_time", "is_transferable", "source_file",
    ] if c in df.columns]

    if "ticket_code" in df.columns:
        tickets_df = df.select(tickets_cols).unique(subset=["ticket_code"])
        tickets_df = _ensure_event_id(tickets_df, event_id)
        tickets_df = tickets_df.with_columns(pl.lit(source_file).alias("source_file"))
        if "ticket_id" not in tickets_df.columns:
            tickets_df = tickets_df.with_row_index("ticket_id").with_columns(
                pl.concat_str([pl.lit("TKT_"), pl.col("ticket_id").cast(str)]).alias("ticket_id")
            )
        if "payment_status" not in tickets_df.columns and "order_id" in tickets_df.columns and "order_id" in df.columns:
            pass
        try:
            db.write_df(tickets_df, "tickets", mode="append")
            stats["tickets"] = tickets_df.height
        except Exception as e:
            stats["errors"].append(f"门票写入失败: {str(e)}")

    return stats


def _import_payments_data(df: pl.DataFrame, event_id: Optional[str], source_file: str) -> Dict[str, Any]:
    stats = {"payments": 0, "errors": []}

    payments_cols = [c for c in [
        "payment_id", "transaction_id", "order_id", "ticket_id",
        "event_id", "amount", "currency", "payment_method",
        "payment_status", "paid_time", "gateway", "gateway_order_id",
        "refund_amount", "refund_time", "gateway_response", "source_file",
    ] if c in df.columns]

    if "transaction_id" in df.columns:
        payments_df = df.select(payments_cols).unique(subset=["transaction_id"])
        payments_df = _ensure_event_id(payments_df, event_id)
        payments_df = payments_df.with_columns(pl.lit(source_file).alias("source_file"))
        if "payment_id" not in payments_df.columns:
            payments_df = payments_df.with_row_index("payment_id").with_columns(
                pl.concat_str([pl.lit("PAY_"), pl.col("payment_id").cast(str)]).alias("payment_id")
            )
        try:
            db.write_df(payments_df, "payments", mode="append")
            stats["payments"] = payments_df.height
        except Exception as e:
            stats["errors"].append(f"支付流水写入失败: {str(e)}")

    return stats


def _archive_to_minio(file_bytes: bytes, filename: str, import_type: str, event_id: Optional[str]) -> bool:
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        event_prefix = event_id if event_id else "unknown_event"
        object_name = f"imports/{event_prefix}/{import_type}/{timestamp}_{filename}"
        fmt = _detect_format(filename)
        content_type = "application/json" if fmt == "json" else "text/csv"
        minio_client.client.put_object(
            bucket_name=minio_client.bucket,
            object_name=object_name,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type=content_type,
        )
        return True
    except Exception:
        return False


def _get_import_history(event_id: Optional[str] = None) -> pl.DataFrame:
    try:
        sql = """
        SELECT
            'tickets' as import_type,
            source_file,
            COUNT(*) as record_count,
            MIN(purchase_time) as first_time,
            MAX(purchase_time) as last_time
        FROM tickets
        WHERE source_file IS NOT NULL
        """
        if event_id:
            sql += f" AND event_id = '{event_id}'"
        sql += " GROUP BY source_file "

        sql += """
        UNION ALL
        SELECT
            'payments' as import_type,
            source_file,
            COUNT(*) as record_count,
            MIN(paid_time) as first_time,
            MAX(paid_time) as last_time
        FROM payments
        WHERE source_file IS NOT NULL
        """
        if event_id:
            sql += f" AND event_id = '{event_id}'"
        sql += " GROUP BY source_file ORDER BY last_time DESC"

        return db.query_to_df(sql)
    except Exception:
        return pl.DataFrame(schema=["import_type", "source_file", "record_count", "first_time", "last_time"])


def render_import_data_page(event_id: Optional[str] = None) -> None:
    role = permission_manager.get_current_role()

    if not permission_manager.role_has_access(UserRole.TICKET_STAFF, role):
        st.error("🔒 您无权限导入数据，需要票务人员或主办方权限")
        return

    st.markdown("## 📥 数据导入中心")
    st.caption("导入票务平台和支付流水数据到 DuckDB，原始文件自动归档 MinIO 用于审计")

    tab_import, tab_history, tab_guide = st.tabs(["📤 数据导入", "📋 导入历史", "📖 导入指南"])

    with tab_import:
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
        st.caption("支持 CSV 和 JSON 格式，单文件最大 200MB，建议 UTF-8 编码")

        uploaded_file = st.file_uploader(
            "选择文件",
            type=["csv", "json"],
            accept_multiple_files=False,
            key=f"file_upload_{import_type_key}",
        )

        if uploaded_file is not None:
            file_bytes = uploaded_file.getvalue()
            filename = uploaded_file.name
            fmt = _detect_format(filename)

            st.info(f"📄 文件名: **{filename}** | 格式: **{fmt.upper()}** | 大小: **{len(file_bytes)/1024:.1f} KB**")

            df = _read_uploaded_file(uploaded_file, fmt)

            if df is not None and df.height > 0:
                st.success(f"✅ 解析成功，共 {df.height} 条记录，{df.width} 个字段")

                df_std = _map_to_standard_columns(df, import_type_key)

                with st.expander("🔍 字段映射与预览", expanded=True):
                    c1, c2 = st.columns(2)
                    with c1:
                        st.markdown("**原始字段**")
                        st.dataframe(
                            pl.DataFrame({"字段名": df.columns, "示例值": [str(df[c][0])[:50] for c in df.columns]}),
                            height=280,
                            hide_index=True,
                            use_container_width=True,
                        )
                    with c2:
                        st.markdown("**标准化后字段**")
                        st.dataframe(
                            pl.DataFrame({
                                "字段名": df_std.columns,
                                "示例值": [str(df_std[c][0])[:50] for c in df_std.columns],
                            }),
                            height=280,
                            hide_index=True,
                            use_container_width=True,
                        )

                valid, missing = _validate_columns(df_std, import_info["required_columns"])

                if not valid:
                    st.error(f"❌ 缺少必要字段: {', '.join(missing)}")
                    st.info("💡 请确认文件中包含上述必填字段，或使用正确的列名（中文列名会自动映射）")
                else:
                    st.success(f"✅ 字段校验通过，包含必要字段: {', '.join(import_info['required_columns'])}")

                    with st.expander("📊 数据预览（前20条）", expanded=False):
                        preview = df_std.head(20)
                        style_dataframe(preview, height=350)

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
                            st.warning("⚠️ 未找到活动，请先创建活动或选择一个活动")
                            target_event = None

                    archive_minio = st.checkbox(
                        "同时归档原始文件到 MinIO（推荐用于审计追溯）",
                        value=True,
                        key="archive_minio_check",
                    )

                    st.divider()

                    col_btn1, col_btn2 = st.columns([1, 1])
                    with col_btn1:
                        if st.button("🔍 预演导入（不写入）", use_container_width=True, key="preview_import"):
                            with st.spinner("正在分析数据..."):
                                if import_type_key == "tickets":
                                    stats = _import_tickets_data(df_std.clone().head(0), target_event, filename)
                                    order_count = df_std.select(["order_id"]).unique().height if "order_id" in df_std.columns else 0
                                    ticket_count = df_std.select(["ticket_code"]).unique().height if "ticket_code" in df_std.columns else 0
                                    st.info(
                                        f"📊 预演结果:\n"
                                        f"- 预计导入订单: **{order_count}** 条\n"
                                        f"- 预计导入门票: **{ticket_count}** 张\n"
                                        f"- 活动: **{target_event or '未指定'}**"
                                    )
                                elif import_type_key == "payments":
                                    pay_count = df_std.select(["transaction_id"]).unique().height if "transaction_id" in df_std.columns else 0
                                    st.info(
                                        f"📊 预演结果:\n"
                                        f"- 预计导入支付流水: **{pay_count}** 条\n"
                                        f"- 活动: **{target_event or '未指定'}**"
                                    )

                    with col_btn2:
                        if st.button("🚀 确认导入", type="primary", use_container_width=True, key="confirm_import"):
                            with st.spinner("正在导入数据..."):
                                source_tag = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
                                if import_type_key == "tickets":
                                    stats = _import_tickets_data(df_std, target_event, source_tag)
                                elif import_type_key == "payments":
                                    stats = _import_payments_data(df_std, target_event, source_tag)
                                else:
                                    stats = {"errors": ["未知导入类型"]}

                                if archive_minio and not stats.get("errors"):
                                    archived = _archive_to_minio(file_bytes, filename, import_type_key, target_event)
                                    if not archived:
                                        stats["errors"] = stats.get("errors", []) + ["MinIO 归档失败（数据已导入）"]

                                if stats.get("errors"):
                                    for err in stats["errors"]:
                                        st.error(f"❌ {err}")
                                else:
                                    st.success("🎉 数据导入成功！")
                                    if import_type_key == "tickets":
                                        st.metric("导入订单数", stats.get("orders", 0))
                                        st.metric("导入门票数", stats.get("tickets", 0))
                                    elif import_type_key == "payments":
                                        st.metric("导入支付流水", stats.get("payments", 0))
                                    st.caption(f"源文件标签: {source_tag}")

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
                "first_time": "最早时间",
                "last_time": "最晚时间",
            })
            style_dataframe(display, height=400)

            st.divider()
            total_records = history_df["record_count"].sum()
            c1, c2, c3 = st.columns(3)
            c1.metric("总导入文件数", history_df.height)
            c2.metric("总记录数", total_records)
            c3.metric("数据类型数", history_df.select(["import_type"]).unique().height)

    with tab_guide:
        st.markdown("### 📖 导入指南")

        st.markdown("#### 一、支持的数据格式")
        st.markdown("""
- **CSV**：逗号分隔，UTF-8 编码，首行是表头
- **JSON**：JSON 数组格式 `[{...}, {...}]`，或带 `data` 字段的对象
- 中文字段名会自动映射为标准字段（如「持票人」→ `attendee_name`）
""")

        st.markdown("#### 二、票务平台数据字段说明")
        st.dataframe(
            pl.DataFrame({
                "字段名": IMPORT_TYPES["tickets"]["suggested_columns"],
                "说明": [
                    "订单编号", "门票唯一ID", "票码(扫码核销用)", "票种ID", "票种名称",
                    "购票人姓名", "购票人手机", "购票人邮箱", "持票人姓名", "座位号",
                    "原价", "优惠金额", "实付金额", "支付状态",
                    "票据状态", "购买时间", "订单来源", "销售渠道",
                    "赞助商ID", "赞助商名称",
                ],
            }),
            hide_index=True,
            height=350,
            use_container_width=True,
        )

        st.markdown("#### 三、支付流水字段说明")
        st.dataframe(
            pl.DataFrame({
                "字段名": IMPORT_TYPES["payments"]["suggested_columns"],
                "说明": [
                    "支付记录ID", "支付平台交易流水号(必填)", "关联订单号", "关联门票ID",
                    "支付金额", "币种", "支付方式", "支付状态",
                    "支付完成时间", "支付网关", "网关订单号", "退款金额",
                    "退款时间", "网关原始响应JSON",
                ],
            }),
            hide_index=True,
            height=280,
            use_container_width=True,
        )

        st.markdown("#### 四、导入流程")
        st.markdown("""
1. 选择数据类型（票务 / 支付）
2. 上传 CSV 或 JSON 文件
3. 系统自动识别并映射字段
4. 预览数据，确认无误
5. 选择目标活动，点击导入
6. 数据写入 DuckDB，原始文件归档 MinIO
7. 在总览看板查看更新后的核销漏斗
""")

        st.markdown("#### 五、注意事项")
        st.warning("""
- 重复导入同一文件会因主键唯一约束报错（票码、交易流水号去重）
- 大文件建议分批次导入，单批次不超过 10 万条
- 导入后请立即在总览看板核对核销漏斗数据是否合理
- 所有导入原始文件永久归档 MinIO，可随时审计追溯
""")
