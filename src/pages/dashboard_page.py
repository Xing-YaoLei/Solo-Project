import streamlit as st
import polars as pl
from datetime import date, timedelta
from typing import Dict

from src.data import DuckDBStore
from src.services import ThresholdService, FallReviewService, CareStandardService
from src.widgets import ChartWidgets


class DashboardPage:
    def __init__(self, db: DuckDBStore, threshold_service: ThresholdService,
                 fall_service: FallReviewService, standard_service: CareStandardService):
        self.db = db
        self.threshold_service = threshold_service
        self.fall_service = fall_service
        self.standard_service = standard_service

    def render(self):
        st.title("🏥 养老护理康复活动趋势看板")
        
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            date_range = st.date_input(
                "选择分析时间段",
                value=(date.today() - timedelta(days=30), date.today()),
                max_value=date.today()
            )
        with col2:
            st.markdown("#### 口径版本")
            active_version = self.standard_service.get_active_version()
            if active_version:
                st.info(f"当前版本: {active_version['version_name']}")
        with col3:
            if st.button("🔄 刷新数据", use_container_width=True):
                st.rerun()
        
        start_date, end_date = date_range
        if start_date > end_date:
            st.error("开始日期不能晚于结束日期")
            return
        
        summary_data = self._calculate_summary(start_date, end_date)
        ChartWidgets.render_kpi_cards(summary_data)
        
        st.divider()
        
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "📊 总体概览",
            "👴 老人档案",
            "🏃 康复活动",
            "✅ 护理达标",
            "⚠️ 跌倒复盘"
        ])
        
        with tab1:
            self._render_overview_tab(start_date, end_date)
        
        with tab2:
            self._render_elder_profiles_tab()
        
        with tab3:
            self._render_rehab_tab(start_date, end_date)
        
        with tab4:
            self._render_compliance_tab(start_date, end_date)
        
        with tab5:
            self._render_fall_review_tab(start_date, end_date)

    def _calculate_summary(self, start_date: date, end_date: date) -> Dict:
        elders = self.db.get_elder_profiles()
        total_elders = len(elders)
        
        today = date.today()
        today_activities = self.db.get_nursing_records(start_date=today, end_date=today)
        
        yesterday = today - timedelta(days=1)
        yesterday_activities = self.db.get_nursing_records(start_date=yesterday, end_date=yesterday)
        
        activities_yoy = 0
        if len(yesterday_activities) > 0:
            activities_yoy = (len(today_activities) - len(yesterday_activities)) / len(yesterday_activities) * 100
        
        daily_summary = self.db.get_daily_summary(start_date=start_date, end_date=end_date)
        compliance_rate = 0
        compliance_trend = 0
        if not daily_summary.is_empty():
            compliant = daily_summary.filter(pl.col("is_care_达标") == True)
            compliance_rate = len(compliant) / len(daily_summary) * 100
            
            mid_date = start_date + (end_date - start_date) / 2
            first_half = daily_summary.filter(pl.col("activity_date") < mid_date)
            second_half = daily_summary.filter(pl.col("activity_date") >= mid_date)
            if not first_half.is_empty() and not second_half.is_empty():
                rate1 = len(first_half.filter(pl.col("is_care_达标") == True)) / len(first_half) * 100
                rate2 = len(second_half.filter(pl.col("is_care_达标") == True)) / len(second_half) * 100
                compliance_trend = rate2 - rate1
        
        monthly_falls = self.db.get_fall_events(
            start_date=date.today().replace(day=1),
            end_date=date.today()
        )
        last_month_start = (date.today().replace(day=1) - timedelta(days=1)).replace(day=1)
        last_month_end = date.today().replace(day=1) - timedelta(days=1)
        last_month_falls = self.db.get_fall_events(start_date=last_month_start, end_date=last_month_end)
        
        falls_yoy = 0
        if len(last_month_falls) > 0:
            falls_yoy = (len(monthly_falls) - len(last_month_falls)) / len(last_month_falls) * 100
        
        return {
            "total_elders": total_elders,
            "today_activities": len(today_activities),
            "activities_yoy": activities_yoy,
            "compliance_rate": compliance_rate,
            "compliance_trend": compliance_trend,
            "monthly_falls": len(monthly_falls),
            "falls_yoy": falls_yoy
        }

    def _render_overview_tab(self, start_date: date, end_date: date):
        elders = self.db.get_elder_profiles()
        nursing_records = self.db.get_nursing_records(start_date=start_date, end_date=end_date)
        
        col1, col2 = st.columns(2)
        
        with col1:
            ChartWidgets.render_care_level_distribution(elders)
        
        nursing_with_level = None
        with col2:
            if not nursing_records.is_empty():
                elders_join = elders.select(["elder_id", "care_level_name"])
                nursing_with_level = nursing_records.join(elders_join, on="elder_id", how="left")
                ChartWidgets.render_activity_category_breakdown(nursing_with_level)
            else:
                st.info("暂无护理记录数据")
        
        st.divider()
        
        if nursing_with_level is not None and not nursing_with_level.is_empty():
            ChartWidgets.render_quality_distribution(nursing_with_level)
        else:
            st.info("暂无护理质量数据")
        
        st.divider()
        
        health_data = self.db.get_health_data(start_date=start_date, end_date=end_date)
        ChartWidgets.render_health_dashboard(health_data, start_date, end_date)

    def _render_elder_profiles_tab(self):
        elders = self.db.get_elder_profiles()
        
        if elders.is_empty():
            st.info("暂无老人档案数据")
            return
        
        col1, col2 = st.columns([1, 3])
        
        with col1:
            search_term = st.text_input("🔍 搜索老人姓名/ID", "")
            care_level_filter = st.multiselect(
                "护理等级筛选",
                options=elders["care_level_name"].unique().to_list(),
                default=elders["care_level_name"].unique().to_list()
            )
            
            filtered_elders = elders
            if search_term:
                filtered_elders = filtered_elders.filter(
                    (pl.col("name").str.contains(search_term)) | 
                    (pl.col("elder_id").str.contains(search_term))
                )
            if care_level_filter:
                filtered_elders = filtered_elders.filter(
                    pl.col("care_level_name").is_in(care_level_filter)
                )
            
            st.markdown(f"**找到 {len(filtered_elders)} 位老人**")
            
            elder_options = [f"{row['elder_id']} - {row['name']}" for row in filtered_elders.iter_rows(named=True)]
            selected_idx = st.selectbox(
                "选择老人",
                options=range(len(elder_options)),
                format_func=lambda x: elder_options[x]
            ) if elder_options else None
            
            if selected_idx is not None:
                selected_elder_id = filtered_elders[selected_idx]["elder_id"][0]
                elder_data = filtered_elders[selected_idx].to_dicts()[0]
                
                medication_data = self.db.get_medication_list(elder_id=selected_elder_id)
                health_data = self.db.get_health_data(elder_id=selected_elder_id)
                
                with col2:
                    ChartWidgets.render_elder_profile_card(elder_data, medication_data, health_data)

    def _render_rehab_tab(self, start_date: date, end_date: date):
        rehab_data = self.db.get_rehab_trend_data(start_date, end_date)
        ChartWidgets.render_rehab_trend(rehab_data, self.threshold_service)
        
        st.divider()
        
        nursing_records = self.db.get_nursing_records(
            start_date=start_date,
            end_date=end_date,
            activity_code="rehab_exercise"
        )
        
        if not nursing_records.is_empty():
            elders = self.db.get_elder_profiles().select(["elder_id", "care_level_name"])
            nursing_with_level = nursing_records.join(elders, on="elder_id", how="left")
            
            st.markdown("#### 康复活动明细")
            
            rehab_summary = nursing_with_level.group_by(["care_level_name", "activity_name"]).agg([
                pl.count("activity_code").alias("活动次数"),
                pl.sum("activity_duration").alias("总时长(分钟)"),
                pl.mean("activity_duration").alias("平均时长(分钟)"),
                pl.mean("quality_score").alias("平均质量分")
            ]).sort(["care_level_name", "活动次数"], descending=[False, True])
            
            st.dataframe(
                rehab_summary.to_pandas(),
                use_container_width=True,
                hide_index=True
            )
            
            st.markdown("#### 康复活动多样性分析")
            elder_rehab_diversity = nursing_with_level.group_by(["elder_id", "care_level_name"]).agg([
                pl.n_unique("activity_code").alias("活动类型数"),
                pl.sum("activity_duration").alias("总时长(分钟)")
            ])
            
            validation_results = []
            for row in elder_rehab_diversity.iter_rows(named=True):
                validation = self.threshold_service.validate_rehab_activity(
                    weekly_minutes=row["总时长(分钟)"] / max(1, (end_date - start_date).days / 7),
                    activity_types_count=row["活动类型数"]
                )
                validation_results.append({
                    **row,
                    "时长达标": validation["minutes_compliant"],
                    "多样性达标": validation["diversity_compliant"],
                    "总体达标": validation["overall_compliant"]
                })
            
            diversity_df = pl.DataFrame(validation_results)
            st.dataframe(
                diversity_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config={
                    "时长达标": st.column_config.CheckboxColumn("时长达标"),
                    "多样性达标": st.column_config.CheckboxColumn("多样性达标"),
                    "总体达标": st.column_config.CheckboxColumn("总体达标")
                }
            )

    def _render_compliance_tab(self, start_date: date, end_date: date):
        compliance_data = self.db.get_care_compliance_summary(start_date, end_date)
        ChartWidgets.render_care_compliance_trend(compliance_data)
        
        st.divider()
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 各护理等级达标情况")
            if not compliance_data.is_empty():
                level_summary = compliance_data.group_by(["care_level", "care_level_name"]).agg([
                    pl.sum("total_elders").alias("总人次"),
                    pl.sum("compliant_elders").alias("达标人次"),
                    (pl.sum("compliant_elders") / pl.sum("total_elders") * 100).alias("达标率(%)").round(1),
                    pl.mean("avg_completion_rate").alias("平均完成率(%)").round(1),
                    pl.mean("avg_quality_score").alias("平均质量分").round(1)
                ]).sort("care_level")
                
                st.dataframe(
                    level_summary.to_pandas(),
                    use_container_width=True,
                    hide_index=True
                )
        
        with col2:
            st.markdown("#### 未达标老人预警")
            daily_summary = self.db.get_daily_summary(start_date=start_date, end_date=end_date)
            
            if not daily_summary.is_empty():
                elders = self.db.get_elder_profiles().select(["elder_id", "name", "care_level_name"])
                
                non_compliant = daily_summary.filter(
                    pl.col("is_care_达标") == False
                ).join(elders, on="elder_id", how="left")
                
                non_compliant_summary = non_compliant.group_by(["elder_id", "name", "care_level_name"]).agg([
                    pl.count("activity_date").alias("未达标天数"),
                    pl.mean("care_completion_rate").alias("平均完成率(%)").round(1)
                ]).sort("未达标天数", descending=True).head(10)
                
                st.dataframe(
                    non_compliant_summary.to_pandas(),
                    use_container_width=True,
                    hide_index=True
                )

    def _render_fall_review_tab(self, start_date: date, end_date: date):
        fall_events = self.db.get_fall_events(start_date=start_date, end_date=end_date)
        fall_reviews = self.db.get_fall_reviews()
        
        ChartWidgets.render_fall_analysis(fall_events, fall_reviews)
        
        st.divider()
        
        pending_falls = self.fall_service.get_pending_fall_events(days=30)
        
        if not pending_falls.is_empty():
            st.markdown("#### ⏳ 待复盘跌倒事件")
            
            elders = self.db.get_elder_profiles().select(["elder_id", "name", "care_level_name"])
            pending_with_info = pending_falls.join(elders, on="elder_id", how="left")
            
            st.dataframe(
                pending_with_info.select([
                    "elder_id", "name", "care_level_name", "record_time", 
                    "device_type", "metric_value"
                ]).to_pandas(),
                use_container_width=True,
                hide_index=True
            )
            
            st.markdown("#### 📝 创建复盘记录")
            
            fall_options = [
                f"{row['elder_id']} - {row['name']} - {row['record_time']}"
                for row in pending_with_info.iter_rows(named=True)
            ]
            
            if fall_options:
                selected_fall = st.selectbox(
                    "选择跌倒事件",
                    options=range(len(fall_options)),
                    format_func=lambda x: fall_options[x]
                )
                
                if selected_fall is not None:
                    selected_row = pending_with_info[selected_fall]
                    elder_id = selected_row["elder_id"][0]
                    fall_time = selected_row["record_time"][0]
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        fall_location = st.selectbox(
                            "跌倒地点",
                            ["房间", "走廊", "卫生间", "餐厅", "活动室", "其他"]
                        )
                        fall_severity = st.selectbox(
                            "严重程度",
                            ["轻微", "中度", "严重"]
                        )
                    
                    with col2:
                        reviewed_by = st.text_input("复盘人", "管理员")
                    
                    review_notes = st.text_area(
                        "复盘备注",
                        height=100,
                        placeholder="请输入本次跌倒事件的复盘分析、改进措施等..."
                    )
                    
                    compliance_analysis = self.fall_service.analyze_fall_care_compliance(
                        elder_id, fall_time
                    )
                    
                    with st.expander("📊 护理响应合规性分析", expanded=True):
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric(
                                "响应时间",
                                f"{compliance_analysis.get('response_time', 'N/A')}分钟",
                                delta=f"阈值: {compliance_analysis.get('response_time_threshold', 15)}分钟",
                                delta_color="normal" if compliance_analysis.get("response_time_compliant") else "inverse"
                            )
                        with col2:
                            st.metric(
                                "质量评分",
                                f"{compliance_analysis.get('quality_score', 'N/A')}分",
                                delta=f"阈值: {compliance_analysis.get('quality_threshold', 80)}分",
                                delta_color="normal" if compliance_analysis.get("quality_compliant") else "inverse"
                            )
                        with col3:
                            overall_status = "✅ 达标" if compliance_analysis.get("overall_compliant") else "❌ 未达标"
                            st.metric("整体达标", overall_status)
                        
                        if compliance_analysis.get("issues"):
                            st.markdown("#### 存在问题:")
                            for issue in compliance_analysis["issues"]:
                                st.warning(issue)
                    
                    if st.button("💾 保存复盘记录", type="primary", use_container_width=True):
                        try:
                            review_id = self.fall_service.create_review_record(
                                elder_id=elder_id,
                                fall_time=fall_time,
                                fall_location=fall_location,
                                fall_severity=fall_severity,
                                review_notes=review_notes,
                                reviewed_by=reviewed_by
                            )
                            st.success(f"复盘记录已保存！记录ID: {review_id}")
                            
                            with st.expander("📄 查看完整复盘材料", expanded=True):
                                material = self.fall_service.generate_review_material(elder_id, fall_time)
                                st.json(material, expanded=False)
                            
                            st.rerun()
                        except Exception as e:
                            st.error(f"保存失败: {str(e)}")
        else:
            st.success("🎉 最近30天内无待复盘的跌倒事件")
        
        st.divider()
        
        st.markdown("#### 📋 已完成复盘记录")
        completed_reviews = self.fall_service.db.get_fall_reviews(status="completed")
        if not completed_reviews.is_empty():
            elders = self.db.get_elder_profiles().select(["elder_id", "name", "care_level_name"])
            reviews_with_info = completed_reviews.join(elders, on="elder_id", how="left")
            
            st.dataframe(
                reviews_with_info.select([
                    "elder_id", "name", "care_level_name", "fall_time",
                    "fall_location", "fall_severity", "response_time",
                    "quality_score", "is_care_compliant", "review_status"
                ]).to_pandas(),
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("暂无已完成的复盘记录")
