import streamlit as st
import polars as pl
from datetime import date, timedelta
from typing import Dict

from src.data import DuckDBStore
from src.services import CareStandardService
from src.config import CARE_LEVELS


class StandardVersionPage:
    def __init__(self, db: DuckDBStore, standard_service: CareStandardService):
        self.db = db
        self.standard_service = standard_service

    def render(self):
        st.title("📜 护理达标口径版本管理")
        st.markdown("""
        本页面管理护理达标口径的历史版本，支持版本对比、影响分析，
        便于复盘时解释数字变化的原因。
        """)
        
        tab1, tab2, tab3 = st.tabs([
            "🔍 版本概览",
            "➕ 创建新版本",
            "📊 版本影响分析"
        ])
        
        with tab1:
            self._render_version_overview()
        
        with tab2:
            self._render_create_version()
        
        with tab3:
            self._render_version_analysis()

    def _render_version_overview(self):
        versions = self.standard_service.get_all_versions()
        
        if not versions:
            st.info("暂无版本记录")
            return
        
        active_version = self.standard_service.get_active_version()
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.markdown("### 📋 版本列表")
            
            for idx, version in enumerate(versions):
                is_active = active_version and version["id"] == active_version["id"]
                
                with st.expander(
                    f"{version['version_name']} {'✅ (当前生效)' if is_active else ''}",
                    expanded=idx == 0
                ):
                    col_info1, col_info2, col_info3 = st.columns(3)
                    
                    with col_info1:
                        st.markdown(f"**版本代码:** {version['version_code']}")
                        st.markdown(f"**生效日期:** {version['effective_date']}")
                    
                    with col_info2:
                        st.markdown(f"**创建人:** {version.get('created_by', '-')}")
                        st.markdown(f"**创建时间:** {version.get('created_at', '-')}")
                    
                    with col_info3:
                        status = "✅ 生效中" if is_active else "⏸️ 已失效"
                        st.markdown(f"**状态:** {status}")
                    
                    st.markdown("**描述:**")
                    st.info(version.get("description", "无描述"))
                    
                    st.markdown("**各护理等级每日标准时长 (分钟):**")
                    
                    level_data = []
                    for level_code, level_info in CARE_LEVELS.items():
                        minutes = version.get("care_level_minutes", {}).get(level_code, "-")
                        level_data.append({
                            "护理等级": level_info.name,
                            "标准时长(分钟)": minutes,
                            "等级说明": level_info.description
                        })
                    
                    st.dataframe(level_data, use_container_width=True, hide_index=True)
                    
                    if not is_active:
                        if st.button("🔄 启用此版本", key=f"activate_{version['id']}"):
                            self._activate_version(version["version_code"])
                            st.success(f"已启用版本: {version['version_name']}")
                            st.rerun()
        
        with col2:
            if active_version:
                st.markdown("### ✅ 当前生效版本")
                st.success(f"**{active_version['version_name']}**")
                st.markdown(f"代码: {active_version['version_code']}")
                st.markdown(f"生效日期: {active_version['effective_date']}")

    def _activate_version(self, version_code: str):
        versions = self.standard_service.get_all_versions()
        target_version = next((v for v in versions if v["version_code"] == version_code), None)
        
        if not target_version:
            raise ValueError("版本不存在")
        
        self.db.con.execute("UPDATE care_standard_versions SET is_active = FALSE")
        self.db.con.execute(
            "UPDATE care_standard_versions SET is_active = TRUE WHERE version_code = ?",
            [version_code]
        )

    def _render_create_version(self):
        active_version = self.standard_service.get_active_version()
        current_minutes = self.standard_service.get_version_minutes()
        
        st.markdown("### ➕ 创建新版本")
        st.info("创建新版本将自动成为当前生效版本，旧版本自动失效。")
        
        col1, col2 = st.columns(2)
        
        with col1:
            version_code = st.text_input(
                "版本代码",
                value=f"V{len(self.standard_service.get_all_versions()) + 1}.0_{date.today().strftime('%Y%m')}",
                placeholder="例如: V2.0_202406"
            )
            version_name = st.text_input(
                "版本名称",
                placeholder="例如: 养老护理达标标准V2.0"
            )
            description = st.text_area(
                "版本描述",
                placeholder="请详细说明本次版本变更的原因、调整内容等...",
                height=100
            )
            effective_date = st.date_input(
                "生效日期",
                value=date.today(),
                min_value=date.today()
            )
            created_by = st.text_input("创建人", value="管理员")
        
        with col2:
            st.markdown("### ⚙️ 各等级标准时长 (分钟/天)")
            
            new_minutes = {}
            for level_code, level_info in CARE_LEVELS.items():
                current = current_minutes.get(level_code, level_info.daily_care_minutes)
                
                col_label, col_input = st.columns([1, 1])
                with col_label:
                    st.markdown(f"**{level_info.name}**")
                    st.caption(level_info.description)
                with col_input:
                    new_val = st.number_input(
                        f"{level_info.name}标准时长",
                        min_value=0,
                        max_value=480,
                        value=current,
                        step=5,
                        key=f"level_{level_code}",
                        label_visibility="collapsed"
                    )
                    new_minutes[level_code] = new_val
        
        st.divider()
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("#### 与当前版本对比")
            comparison_data = []
            has_changes = False
            for level_code, level_info in CARE_LEVELS.items():
                old_val = current_minutes.get(level_code, level_info.daily_care_minutes)
                new_val = new_minutes[level_code]
                diff = new_val - old_val
                if diff != 0:
                    has_changes = True
                comparison_data.append({
                    "护理等级": level_info.name,
                    "当前值": old_val,
                    "新值": new_val,
                    "变化量": diff
                })
            
            if not has_changes:
                st.info("与当前版本无差异")
            else:
                st.dataframe(
                    comparison_data,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "变化量": st.column_config.NumberColumn(
                            "变化量",
                            format="%+d"
                        )
                    }
                )
        
        with col2:
            st.markdown("#### 预计影响分析")
            if has_changes:
                st.warning("创建后可在'版本影响分析'标签页查看详细的历史数据回溯分析")
            else:
                st.info("无变化，无需分析")
        
        with col3:
            st.markdown("#### 操作")
            if st.button("📝 创建新版本", type="primary", use_container_width=True, disabled=not has_changes):
                if not version_code or not version_name:
                    st.error("请填写版本代码和名称")
                else:
                    try:
                        version_id = self.standard_service.create_new_version(
                            version_code=version_code,
                            version_name=version_name,
                            description=description,
                            care_level_minutes=new_minutes,
                            effective_date=effective_date,
                            created_by=created_by
                        )
                        st.success(f"版本创建成功！版本ID: {version_id}")
                        st.rerun()
                    except Exception as e:
                        st.error(f"创建失败: {str(e)}")

    def _render_version_analysis(self):
        st.markdown("### 📊 版本影响分析")
        st.markdown("选择两个版本，分析口径变更对历史达标率的影响")
        
        versions = self.standard_service.get_all_versions()
        version_codes = [v["version_code"] for v in versions]
        version_names = {v["version_code"]: v["version_name"] for v in versions}
        
        if len(versions) < 2:
            st.info("至少需要两个版本才能进行对比分析")
            return
        
        col1, col2 = st.columns(2)
        
        with col1:
            before_version = st.selectbox(
                "基准版本 (变更前)",
                options=version_codes,
                format_func=lambda x: f"{x} - {version_names[x]}",
                index=min(1, len(version_codes) - 1)
            )
        
        with col2:
            after_version = st.selectbox(
                "对比版本 (变更后)",
                options=version_codes,
                format_func=lambda x: f"{x} - {version_names[x]}",
                index=0
            )
        
        if before_version == after_version:
            st.warning("请选择两个不同的版本")
            return
        
        col1, col2 = st.columns(2)
        with col1:
            analysis_start = st.date_input(
                "分析开始日期",
                value=date.today() - timedelta(days=30)
            )
        with col2:
            analysis_end = st.date_input(
                "分析结束日期",
                value=date.today()
            )
        
        if st.button("🔍 执行分析", type="primary", use_container_width=True):
            with st.spinner("正在分析版本影响..."):
                result = self.standard_service.explain_compliance_change(
                    start_date=analysis_start,
                    end_date=analysis_end,
                    before_version=before_version,
                    after_version=after_version
                )
                
                if "error" in result:
                    st.error(result["error"])
                else:
                    self._display_analysis_result(result)

    def _display_analysis_result(self, result: Dict):
        st.divider()
        st.markdown("### 📋 分析结果")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                "变更前达标率",
                f"{result['overall_impact']['before_compliance_rate']}%",
                help=f"基于 {result['version_comparison']['version_1']['name']} 口径"
            )
        
        with col2:
            st.metric(
                "变更后达标率",
                f"{result['overall_impact']['after_compliance_rate']}%",
                delta=f"{result['overall_impact']['absolute_change']:+.1f}pp",
                help=f"基于 {result['version_comparison']['version_2']['name']} 口径"
            )
        
        with col3:
            st.metric(
                "分析覆盖天数",
                f"{result['overall_impact']['total_daily_records']} 人天"
            )
        
        st.divider()
        
        st.markdown("### 📝 变化解释")
        for explanation in result["explanation"]:
            st.info(explanation)
        
        st.divider()
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 各护理等级标准对比")
            comparison = result["version_comparison"]["comparison"]
            comparison_df = pl.DataFrame([
                {
                    "护理等级": v["level_name"],
                    f"{result['version_comparison']['version_1']['code']} (分钟)": v["version_1_minutes"],
                    f"{result['version_comparison']['version_2']['code']} (分钟)": v["version_2_minutes"],
                    "变化量": v["difference"],
                    "变化率(%)": v["change_percent"]
                }
                for v in comparison.values()
            ])
            st.dataframe(
                comparison_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config={
                    "变化量": st.column_config.NumberColumn(format="%+d"),
                    "变化率(%)": st.column_config.NumberColumn(format="%+.1f%%")
                }
            )
        
        with col2:
            st.markdown("#### 各护理等级达标率变化")
            level_impact = result["level_breakdown"]
            impact_df = pl.DataFrame([
                {
                    "护理等级": v["level_name"],
                    "样本数": v["total_count"],
                    "变更前达标率(%)": v["before_rate"],
                    "变更后达标率(%)": v["after_rate"],
                    "变化(pp)": v["rate_change"]
                }
                for v in level_impact.values()
            ])
            st.dataframe(
                impact_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config={
                    "变化(pp)": st.column_config.NumberColumn(format="%+.1f")
                }
            )
        
        st.divider()
        
        st.markdown("#### 📈 达标率变化可视化")
        
        import plotly.graph_objects as go
        
        level_names = [v["level_name"] for v in level_impact.values()]
        before_rates = [v["before_rate"] for v in level_impact.values()]
        after_rates = [v["after_rate"] for v in level_impact.values()]
        
        fig = go.Figure()
        fig.add_trace(go.Bar(
            name=result['version_comparison']['version_1']['name'],
            x=level_names,
            y=before_rates,
            marker_color='#1f77b4'
        ))
        fig.add_trace(go.Bar(
            name=result['version_comparison']['version_2']['name'],
            x=level_names,
            y=after_rates,
            marker_color='#2ca02c'
        ))
        
        fig.update_layout(
            title='各护理等级达标率对比',
            xaxis_title='护理等级',
            yaxis_title='达标率(%)',
            barmode='group',
            yaxis_range=[0, 100],
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
