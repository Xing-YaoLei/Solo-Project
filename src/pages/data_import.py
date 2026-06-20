import os
import streamlit as st
from pathlib import Path
from src.data.data_loader import DataLoader
from src.data.minio_client import MinIOClient
from src.utils.config import Config
from src.data.mock_data import load_data_into_duckdb, generate_all_data, save_data_to_csv
from src.data.duckdb_manager import DuckDBManager


def render_data_import():
    st.markdown("## 📥 数据导入中心")
    st.info(
        "支持从本地 CSV 文件或 MinIO 对象存储导入报名表和支付流水。"
        "导入后数据自动进入 DuckDB 供分析。"
    )

    loader = DataLoader()
    minio = MinIOClient()
    ddb = DuckDBManager()

    st.markdown("---")
    st.markdown("### 📊 当前数据状态")

    tables = ddb.list_tables()
    status_cols = st.columns(len(tables)) if tables else [st.container()]
    for i, table in enumerate(tables):
        with status_cols[i]:
            count = ddb.get_row_count(table)
            st.metric(table, f"{count:,} 行")

    st.markdown("---")

    tab_local, tab_minio, tab_mock = st.tabs(["💾 本地 CSV", "☁️ MinIO 对象存储", "🎲 生成模拟数据"])

    with tab_local:
        _render_local_import(loader, ddb)

    with tab_minio:
        _render_minio_import(loader, minio, ddb)

    with tab_mock:
        _render_mock_data()


def _render_local_import(loader: DataLoader, ddb: DuckDBManager):
    st.markdown("#### 上传 CSV 文件")
    st.caption("支持的表：registrations（报名表）、payments（支付流水）、checkin_codes（签到码）等")

    uploaded_file = st.file_uploader(
        "选择 CSV 文件",
        type=["csv"],
        key="local_csv_upload"
    )

    table_options = [
        "registrations",
        "payments",
        "checkin_codes",
        "seats",
        "sponsors",
        "refunds",
        "refund_notes",
        "platform_raw_records"
    ]

    target_table = st.selectbox(
        "导入到数据表",
        options=table_options,
        key="local_target_table"
    )

    col1, col2 = st.columns(2)
    with col1:
        if_exists = st.selectbox(
            "写入模式",
            options=["replace", "append"],
            format_func=lambda x: "替换（覆盖全部）" if x == "replace" else "追加（累加）",
            key="local_if_exists"
        )
    with col2:
        auto_convert_time = st.checkbox(
            "自动转换时间列",
            value=True,
            key="local_auto_time"
        )

    if st.button("📤 开始导入", type="primary", key="local_import_btn", use_container_width=True):
        if uploaded_file is None:
            st.error("请先选择 CSV 文件")
        else:
            with st.spinner("正在导入数据..."):
                Config.ensure_data_dir()
                save_path = Path(Config.DATA_DIR) / f"{target_table}_{int(__import__('time').time())}.csv"
                with open(save_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())

                try:
                    if if_exists == "replace":
                        ddb.create_table_from_csv(target_table, str(save_path))
                    else:
                        if not ddb.table_exists(target_table):
                            ddb.create_table_from_csv(target_table, str(save_path))
                        else:
                            ddb.execute(
                                f"INSERT INTO {target_table} SELECT * FROM read_csv_auto('{save_path}')"
                            )
                            if auto_convert_time:
                                time_cols = ["registration_time", "payment_time", "checkin_time",
                                           "generated_at", "sent_at", "request_time", "resolved_time",
                                           "created_at", "synced_at"]
                                for col in time_cols:
                                    try:
                                        ddb.execute(f"ALTER TABLE {target_table} ALTER COLUMN {col} TYPE TIMESTAMP USING CAST({col} AS TIMESTAMP)")
                                    except Exception:
                                        pass

                    count = ddb.get_row_count(target_table)
                    st.success(f"✅ 导入成功！{target_table} 共 {count:,} 行")
                    st.balloons()
                except Exception as e:
                    st.error(f"❌ 导入失败：{str(e)}")

    st.markdown("---")
    st.markdown("#### 预览本地数据目录")
    data_dir = Path(Config.DATA_DIR)
    if data_dir.exists():
        csv_files = sorted(data_dir.glob("*.csv"))
        if csv_files:
            for f in csv_files:
                size_kb = f.stat().st_size / 1024
                st.caption(f"📄 {f.name} ({size_kb:.1f} KB)")
        else:
            st.caption("暂无本地 CSV 文件")


def _render_minio_import(loader: DataLoader, minio: MinIOClient, ddb: DuckDBManager):
    if not minio.connected:
        st.warning(
            "⚠️ MinIO 未连接。请在 .env 中配置正确的连接信息：\n"
            "- MINIO_ENDPOINT\n"
            "- MINIO_ACCESS_KEY\n"
            "- MINIO_SECRET_KEY\n"
            "- MINIO_BUCKET"
        )
        return

    st.markdown(f"#### MinIO 存储桶：`{minio.bucket}`")

    if st.button("🔄 刷新对象列表", key="minio_refresh"):
        st.rerun()

    objects = minio.list_objects()

    if not objects:
        st.info("存储桶为空，请先上传 CSV 文件")
    else:
        st.caption(f"找到 {len(objects)} 个对象")
        selected_obj = st.selectbox(
            "选择对象",
            options=objects,
            key="minio_object_select"
        )

        table_options = [
            "registrations",
            "payments",
            "checkin_codes",
            "seats",
            "sponsors",
            "refunds",
            "refund_notes",
            "platform_raw_records"
        ]
        target_table = st.selectbox(
            "导入到数据表",
            options=table_options,
            key="minio_target_table"
        )

        if_exists = st.selectbox(
            "写入模式",
            options=["replace", "append"],
            format_func=lambda x: "替换" if x == "replace" else "追加",
            key="minio_if_exists"
        )

        if st.button("☁️ 从 MinIO 导入", type="primary", key="minio_import_btn", use_container_width=True):
            with st.spinner("正在从 MinIO 下载并导入..."):
                try:
                    Config.ensure_data_dir()
                    local_path = Path(Config.DATA_DIR) / Path(selected_obj).name
                    minio.download_file(selected_obj, str(local_path))

                    if if_exists == "replace":
                        ddb.create_table_from_csv(target_table, str(local_path))
                    else:
                        if not ddb.table_exists(target_table):
                            ddb.create_table_from_csv(target_table, str(local_path))
                        else:
                            ddb.execute(
                                f"INSERT INTO {target_table} SELECT * FROM read_csv_auto('{str(local_path)}')"
                            )

                    count = ddb.get_row_count(target_table)
                    st.success(f"✅ 导入成功！{target_table} 共 {count:,} 行")
                    st.balloons()
                except Exception as e:
                    st.error(f"❌ 导入失败：{str(e)}")


def _render_mock_data():
    st.markdown("#### 生成模拟测试数据")
    st.caption("一键生成完整的活动票务数据，用于演示和测试")

    col1, col2 = st.columns(2)
    with col1:
        st.metric("报名表", "~460 行")
    with col2:
        st.metric("支付流水", "~390 行")

    col3, col4 = st.columns(2)
    with col3:
        st.metric("签到码", "~390 个")
    with col4:
        st.metric("退票记录", "~30 笔")

    st.caption("还包含：座位表、赞助商、退票备注、多平台原始记录")

    if st.button("🎲 重新生成全部数据", type="primary", key="regenerate_mock", use_container_width=True):
        with st.spinner("正在生成模拟数据..."):
            data = generate_all_data()
            save_data_to_csv(data)
            load_data_into_duckdb(data)
            st.success("✅ 模拟数据已重新生成！")
            st.balloons()
