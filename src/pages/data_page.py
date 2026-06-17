import streamlit as st
import polars as pl
from datetime import date, timedelta
from pathlib import Path
import io

from src.data import DuckDBStore, MinIODataLoader
from src.processing import DataCleaner, DataMatcher
from src.services import CareStandardService
from src.utils import SampleDataGenerator
from src.config import DATA_SOURCES, BASE_DIR


class DataManagementPage:
    def __init__(self, db: DuckDBStore, minio_loader: MinIODataLoader,
                 cleaner: DataCleaner, matcher: DataMatcher,
                 standard_service: CareStandardService):
        self.db = db
        self.minio_loader = minio_loader
        self.cleaner = cleaner
        self.matcher = matcher
        self.standard_service = standard_service

    def render(self):
        st.title("📊 数据管理")
        st.markdown("数据导入、清洗、存储和质量监控")
        
        tab1, tab2, tab3, tab4 = st.tabs([
            "📥 数据导入",
            "🧹 数据清洗",
            "📋 数据查询",
            "🎲 示例数据生成"
        ])
        
        with tab1:
            self._render_data_import()
        
        with tab2:
            self._render_data_cleaning()
        
        with tab3:
            self._render_data_query()
        
        with tab4:
            self._render_sample_data()

    def _render_data_import(self):
        st.markdown("### 📥 数据源状态")
        
        minio_status, minio_msg = self.minio_loader.test_connection()
        
        col1, col2 = st.columns(2)
        
        with col1:
            if minio_status:
                st.success(f"✅ MinIO连接正常: {minio_msg}")
            else:
                st.error(f"❌ MinIO连接失败: {minio_msg}")
        
        with col2:
            db_count = self.db.execute_query("SELECT count(*) as cnt FROM elder_profiles").item()
            st.info(f"📊 数据库已存储 {db_count} 位老人档案")
        
        st.divider()
        
        st.markdown("### 🔄 从MinIO导入数据")
        
        col1, col2 = st.columns(2)
        
        with col1:
            selected_sources = st.multiselect(
                "选择要导入的数据源",
                options=list(DATA_SOURCES.keys()),
                format_func=lambda x: DATA_SOURCES[x].name,
                default=list(DATA_SOURCES.keys())
            )
        
        with col2:
            import_days = st.slider("导入最近多少天的数据", min_value=1, max_value=365, value=90)
        
        if st.button("🚀 开始导入", type="primary", use_container_width=True):
            if not selected_sources:
                st.warning("请至少选择一个数据源")
            else:
                self._import_from_minio(selected_sources, import_days)
        
        st.divider()
        
        st.markdown("### 📁 手动上传文件")
        
        uploaded_file = st.file_uploader(
            "上传CSV或Parquet文件",
            type=["csv", "parquet"],
            accept_multiple_files=False
        )
        
        if uploaded_file:
            file_type = uploaded_file.name.split(".")[-1].lower()
            
            try:
                if file_type == "csv":
                    df = pl.read_csv(uploaded_file)
                else:
                    df = pl.read_parquet(uploaded_file)
                
                st.success(f"✅ 文件读取成功，共 {len(df)} 条记录")
                
                st.markdown("#### 数据预览")
                st.dataframe(df.head(10).to_pandas(), use_container_width=True, hide_index=True)
                
                target_table = st.selectbox(
                    "选择目标表",
                    options=["elder_profiles", "nursing_records", "health_data", "access_records", "medication_list"]
                )
                
                if st.button(f"📥 导入到 {target_table}"):
                    self._insert_to_table(df, target_table)
                    st.success(f"成功导入 {len(df)} 条记录到 {target_table}")
                    
            except Exception as e:
                st.error(f"文件读取失败: {str(e)}")

    def _import_from_minio(self, sources: list, days: int):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        total_sources = len(sources)
        for idx, source_key in enumerate(sources):
            source = DATA_SOURCES[source_key]
            status_text.text(f"正在导入: {source.name}...")
            
            try:
                df = self.minio_loader.read_all_by_prefix(source.file_pattern)
                
                if df.is_empty():
                    st.warning(f"{source.name}: 无数据可导入")
                else:
                    cleaned_df, stats = self._clean_by_source(source_key, df)
                    
                    inserted = self._insert_to_table(cleaned_df, source_key)
                    
                    st.success(f"{source.name}: 导入 {inserted} 条记录 (原始 {stats['total']} 条，清理 {stats.get('removed', 0)} 条)")
                    
            except Exception as e:
                st.error(f"{source.name}: 导入失败 - {str(e)}")
            
            progress_bar.progress((idx + 1) / total_sources)
        
        status_text.text("导入完成！")
        self._recalculate_daily_summary(days)
        st.balloons()

    def _clean_by_source(self, source_key: str, df: pl.DataFrame):
        if source_key == "nursing_records":
            return self.cleaner.clean_nursing_records(df)
        elif source_key == "access_records":
            return self.cleaner.clean_access_records(df)
        elif source_key == "health_devices":
            return self.cleaner.clean_health_data(df)
        else:
            return df, {"total": len(df), "cleaned": len(df), "removed": 0}

    def _insert_to_table(self, df: pl.DataFrame, source_key: str):
        if source_key in ["nursing_records", "health_devices"]:
            table_name = "nursing_records" if source_key == "nursing_records" else "health_data"
            
            if source_key == "nursing_records":
                return self.db.insert_nursing_records(df)
            elif source_key == "health_devices":
                return self.db.insert_health_data(df)
        elif source_key == "access_records":
            return self.db.insert_access_records(df)
        elif source_key == "elder_profiles":
            cleaned, _ = self.cleaner.normalize_elder_profiles(df)
            return self.db.insert_elder_profiles(cleaned)
        elif source_key == "medication_list":
            return self.db.insert_medication_list(df)
        else:
            st.warning(f"未知的数据源: {source_key}")
            return 0

    def _recalculate_daily_summary(self, days: int):
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        nursing_records = self.db.get_nursing_records(start_date=start_date, end_date=end_date)
        elder_profiles = self.db.get_elder_profiles()
        
        if nursing_records.is_empty() or elder_profiles.is_empty():
            return
        
        daily_summary = self.matcher.calculate_daily_care_minutes(nursing_records, elder_profiles)
        
        if daily_summary.is_empty():
            return
        
        active_version = self.standard_service.get_active_version()
        version_code = active_version["version_code"] if active_version else "V1.0_202401"
        
        daily_summary = daily_summary.with_columns(pl.lit(version_code).alias("standard_version"))
        
        inserted = self.db.insert_daily_summary(daily_summary)
        st.info(f"重新计算每日护理汇总，新增/更新 {inserted} 条记录")

    def _render_data_cleaning(self):
        st.markdown("### 🧹 数据清洗规则")
        
        cleaning_rules = [
            {
                "数据源": "护理终端记录",
                "去重规则": "按 [老人ID, 活动代码, 活动开始时间, 护士ID] 去重，保留最新记录",
                "清洗规则": "活动时长需在 1-480 分钟之间，缺失时长根据起止时间计算",
                "字段映射": "活动代码标准化映射，补充活动名称和分类"
            },
            {
                "数据源": "门禁进出记录",
                "去重规则": "按 [人员ID, 时间, 设备ID, 方向] 去重，保留首条记录",
                "清洗规则": "人员ID和时间不能为空",
                "字段映射": "自动补充日期字段"
            },
            {
                "数据源": "健康设备数据",
                "去重规则": "按 [老人ID, 记录时间, 设备类型, 指标类型] 去重，保留最新记录",
                "清洗规则": "指标值不能为空，自动识别跌倒报警",
                "字段映射": "指标类型标准化映射，自动标记异常值"
            },
            {
                "数据源": "老人档案",
                "去重规则": "按 [老人ID] 去重，保留最新记录",
                "清洗规则": "自动计算年龄，护理等级标准化映射",
                "字段映射": "慢性病、过敏史数组格式化"
            }
        ]
        
        st.dataframe(cleaning_rules, use_container_width=True, hide_index=True)
        
        st.divider()
        
        st.markdown("### 📊 清洗统计")
        
        if st.button("🔄 生成清洗报告"):
            report = self.cleaner.get_cleaning_report()
            
            if report:
                for source, stats in report.items():
                    with st.expander(f"📋 {source} 清洗报告"):
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("原始记录数", stats.get("total", 0))
                        with col2:
                            st.metric("清洗后记录数", stats.get("cleaned", 0))
                        with col3:
                            removed = stats.get("removed", 0)
                            removed_pct = (removed / stats["total"] * 100) if stats["total"] > 0 else 0
                            st.metric("移除记录数", removed, f"{removed_pct:.1f}%")
                        
                        if "duplicates_removed" in stats:
                            st.info(f"重复记录: {stats['duplicates_removed']} 条")
                        if "invalid_removed" in stats:
                            st.warning(f"无效记录: {stats['invalid_removed']} 条")
            else:
                st.info("暂无清洗统计数据，请先导入数据")

    def _render_data_query(self):
        st.markdown("### 🔍 数据查询")
        
        query_type = st.selectbox(
            "查询类型",
            ["老人档案", "护理记录", "健康数据", "门禁记录", "用药清单", "自定义SQL"]
        )
        
        if query_type != "自定义SQL":
            col1, col2 = st.columns(2)
            with col1:
                start_date = st.date_input("开始日期", value=date.today() - timedelta(days=7))
            with col2:
                end_date = st.date_input("结束日期", value=date.today())
            
            elder_id = st.text_input("老人ID (可选，留空查询全部)", "")
            
            if st.button("🔍 查询"):
                df = self._query_by_type(query_type, start_date, end_date, elder_id)
                if not df.is_empty():
                    st.success(f"查询到 {len(df)} 条记录")
                    st.dataframe(df.to_pandas(), use_container_width=True, hide_index=True)
                    
                    csv = df.to_pandas().to_csv(index=False).encode('utf-8')
                    st.download_button(
                        "📥 下载CSV",
                        csv,
                        f"{query_type}_{date.today()}.csv",
                        "text/csv",
                        key='download-csv'
                    )
                else:
                    st.info("无符合条件的数据")
        
        else:
            st.markdown("#### 💻 自定义SQL查询")
            st.caption("支持标准SQL语法，可查询任意表")
            
            default_sql = """SELECT 
    ep.elder_id,
    ep.name,
    ep.care_level_name,
    COUNT(nr.id) as activity_count,
    SUM(nr.activity_duration) as total_minutes
FROM elder_profiles ep
LEFT JOIN nursing_records nr ON ep.elder_id = nr.elder_id
WHERE nr.activity_date >= CURRENT_DATE - INTERVAL 7 DAY
GROUP BY ep.elder_id, ep.name, ep.care_level_name
ORDER BY total_minutes DESC
LIMIT 10"""
            
            sql_query = st.text_area("SQL查询语句", value=default_sql, height=150)
            
            if st.button("▶️ 执行查询", type="primary"):
                try:
                    df = self.db.execute_query(sql_query)
                    if not df.is_empty():
                        st.success(f"查询成功，返回 {len(df)} 条记录")
                        st.dataframe(df.to_pandas(), use_container_width=True, hide_index=True)
                    else:
                        st.info("查询无结果")
                except Exception as e:
                    st.error(f"查询执行失败: {str(e)}")

    def _query_by_type(self, query_type: str, start_date: date, end_date: date, elder_id: str):
        elder_filter = elder_id if elder_id else None
        
        if query_type == "老人档案":
            return self.db.get_elder_profiles(elder_filter)
        elif query_type == "护理记录":
            return self.db.get_nursing_records(elder_filter, start_date, end_date)
        elif query_type == "健康数据":
            return self.db.get_health_data(elder_filter, start_date, end_date)
        elif query_type == "门禁记录":
            df = self.db.get_access_records() if not elder_filter else self.db.execute_query(
                "SELECT * FROM access_records WHERE person_id = ? AND access_date BETWEEN ? AND ? ORDER BY timestamp DESC",
                [elder_filter, start_date, end_date]
            )
            return df
        elif query_type == "用药清单":
            return self.db.get_medication_list(elder_filter)
        return pl.DataFrame()

    def _render_sample_data(self):
        st.markdown("### 🎲 示例数据生成器")
        st.warning("此功能仅用于测试和演示，生产环境请勿使用！")
        
        col1, col2 = st.columns(2)
        
        with col1:
            elder_count = st.slider("老人数量", min_value=10, max_value=200, value=50)
        with col2:
            data_days = st.slider("生成数据天数", min_value=7, max_value=365, value=90)
        
        if st.button("🎲 生成示例数据", type="primary", use_container_width=True):
            with st.spinner("正在生成示例数据..."):
                generator = SampleDataGenerator(seed=42)
                data = generator.generate_all_data(elder_count=elder_count, days=data_days)
                
                progress_bar = st.progress(0)
                steps = [
                    ("老人档案", "elder_profiles", data["elder_profiles"]),
                    ("用药清单", "medication_list", data["medication_list"]),
                    ("护理记录", "nursing_records", data["nursing_records"]),
                    ("健康数据", "health_data", data["health_data"]),
                    ("门禁记录", "access_records", data["access_records"]),
                ]
                
                for idx, (name, table, df) in enumerate(steps):
                    if not df.is_empty():
                        cleaned_df, stats = self._clean_by_source(table, df)
                        
                        if table == "elder_profiles":
                            cleaned_df, _ = self.cleaner.normalize_elder_profiles(cleaned_df)
                        
                        inserted = self._insert_to_table(cleaned_df, table)
                        st.success(f"✅ {name}: 生成 {len(df)} 条，导入 {inserted} 条")
                    progress_bar.progress((idx + 1) / len(steps))
                
                self._recalculate_daily_summary(data_days)
                
                st.success("🎉 示例数据生成完成！")
                st.balloons()
        
        st.divider()
        
        st.markdown("### 📊 当前数据统计")
        
        if st.button("🔄 刷新统计"):
            stats = []
            
            tables = [
                ("老人档案", "elder_profiles"),
                ("用药清单", "medication_list"),
                ("护理记录", "nursing_records"),
                ("健康数据", "health_data"),
                ("门禁记录", "access_records"),
                ("每日护理汇总", "daily_care_summary"),
                ("跌倒复盘记录", "fall_review_records"),
            ]
            
            for name, table in tables:
                try:
                    count = self.db.execute_query(f"SELECT count(*) as cnt FROM {table}").item()
                    stats.append({"数据表": name, "记录数": count})
                except Exception:
                    stats.append({"数据表": name, "记录数": 0})
            
            st.dataframe(stats, use_container_width=True, hide_index=True)
            
            if stats:
                total_records = sum(s["记录数"] for s in stats)
                st.info(f"数据库总记录数: {total_records:,} 条")
