from __future__ import annotations

import streamlit as st
import polars as pl

from app.services.duckdb_service import DuckDBService
from app.services.minio_service import MinIOService
from app.services.pipeline import DataPipeline
from app.services.auth_service import AuthService
from typing import Optional


def render(
    db: DuckDBService, minio: MinIOService | None, pipeline: DataPipeline | None, auth: AuthService, username: str
) -> None:
    st.header("📥 数据导入")

    if not auth.can_import_data(username):
        st.warning("您没有数据导入权限，请联系管理员。")
        return

    if pipeline is None or minio is None:
        st.error("⚠️ 对象存储 (MinIO) 服务不可用，数据导入功能已禁用。请联系管理员启动 MinIO 服务。")
        return

    tab_import, tab_batches, tab_trace = st.tabs(["导入数据", "导入批次", "批次回查"])

    with tab_import:
        _render_import_form(pipeline, username)

    with tab_batches:
        _render_batch_list(db, minio)

    with tab_trace:
        _render_batch_trace(pipeline)


def _render_import_form(pipeline: DataPipeline, username: str) -> None:
    st.subheader("导入数据")

    source_type = st.selectbox(
        "数据来源",
        ["cashier", "inventory", "member", "followup"],
        format_func=lambda x: {
            "cashier": "收银系统",
            "inventory": "库存表",
            "member": "会员记录",
            "followup": "回访记录",
        }[x],
    )

    uploaded_file = st.file_uploader(
        "上传 CSV 文件",
        type=["csv"],
        help="请上传符合数据模板格式的 CSV 文件",
    )

    if uploaded_file is not None:
        import tempfile
        from pathlib import Path

        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            tmp.write(uploaded_file.getvalue())
            tmp_path = Path(tmp.name)

        try:
            if source_type == "cashier":
                result = pipeline.ingest_cashier(tmp_path, username)
            elif source_type == "inventory":
                result = pipeline.ingest_inventory(tmp_path, username)
            elif source_type == "member":
                result = pipeline.ingest_members(tmp_path, username)
            else:
                result = pipeline.ingest_followup(tmp_path, username)

            st.success(
                f"导入成功！批次号: {result['batch_id']}, "
                f"导入行数: {result['rows_ingested']}"
            )
            with st.expander("查看导入详情"):
                st.json(result)
        except Exception as e:
            st.error(f"导入失败: {e}")
        finally:
            tmp_path.unlink(missing_ok=True)


def _render_batch_list(db: DuckDBService, minio: MinIOService) -> None:
    st.subheader("导入批次列表")

    try:
        batches = db.list_import_batches()
        if batches.height == 0:
            st.info("暂无导入批次记录。")
            return

        type_map = {
            "cashier": "收银系统",
            "inventory": "库存表",
            "member": "会员记录",
            "followup": "回访记录",
        }
        display = batches.with_columns(
            pl.col("source_type").map_elements(lambda x: type_map.get(x, x), return_dtype=pl.Utf8).alias("来源类型")
        )
        st.dataframe(display, use_container_width=True, hide_index=True)
    except Exception as e:
        st.error(f"加载批次列表失败: {e}")


def _render_batch_trace(pipeline: DataPipeline) -> None:
    st.subheader("批次回查")

    batch_id = st.text_input("输入批次编号", placeholder="例如: BATCH_cashier_20240101_120000")

    if batch_id:
        if pipeline is None:
            st.error("对象存储不可用，批次回查功能已禁用。请联系管理员启动 MinIO 服务。")
            return

        try:
            trace = pipeline.trace_batch(batch_id)

            col1, col2 = st.columns(2)
            with col1:
                st.markdown("#### 数据源信息")
                if trace["source_type"]:
                    type_label = {
                        "cashier": "收银系统",
                        "inventory": "库存表",
                        "member": "会员记录",
                        "followup": "回访记录",
                    }.get(trace["source_type"], trace["source_type"])
                    st.info(f"批次类型: **{type_label}**")
                else:
                    st.warning("未识别批次类型")

                st.markdown("#### MinIO 存储元数据")
                if trace["minio_metadata"]:
                    for src, meta in trace["minio_metadata"].items():
                        src_label = {
                            "cashier": "收银系统",
                            "inventory": "库存表",
                            "member": "会员记录",
                            "followup": "回访记录",
                        }.get(src, src)
                        with st.expander(f"📦 {src_label}", expanded=True):
                            st.json(meta)
                else:
                    st.info("MinIO 中未找到该批次数据。")

            with col2:
                st.markdown("#### 数据库记录")
                if trace["db_record"]:
                    st.json(trace["db_record"])
                else:
                    st.info("数据库中未找到该批次记录。")

                if trace["available_sources"]:
                    st.markdown("#### 可用的源数据")
                    st.write(f"可追溯的数据源: {', '.join(trace['available_sources'])}")
        except Exception as e:
            st.error(f"批次回查失败: {e}")
