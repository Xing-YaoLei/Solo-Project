import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Dict, Optional
from datetime import date, timedelta

from src.config import CARE_LEVELS, ACTIVITY_TYPES


class ChartWidgets:
    @staticmethod
    def render_kpi_cards(summary_data: Dict):
        cols = st.columns(4)
        
        kpi_configs = [
            {
                "label": "在院老人数",
                "value": summary_data.get("total_elders", 0),
                "delta": None,
                "icon": "👴",
                "color": "#1f77b4"
            },
            {
                "label": "今日护理活动数",
                "value": summary_data.get("today_activities", 0),
                "delta": summary_data.get("activities_yoy", 0),
                "icon": "📋",
                "color": "#2ca02c"
            },
            {
                "label": "护理达标率",
                "value": f"{summary_data.get('compliance_rate', 0):.1f}%",
                "delta": summary_data.get("compliance_trend", 0),
                "icon": "✅",
                "color": "#ff7f0e"
            },
            {
                "label": "本月跌倒事件",
                "value": summary_data.get("monthly_falls", 0),
                "delta": summary_data.get("falls_yoy", 0),
                "icon": "⚠️",
                "color": "#d62728"
            }
        ]
        
        for idx, (col, config) in enumerate(zip(cols, kpi_configs)):
            with col:
                st.markdown(f"""
                    <div style="padding: 15px; border-radius: 10px; 
                              border-left: 5px solid {config['color']};
                              background-color: #f8f9fa; margin-bottom: 10px;">
                        <div style="font-size: 24px; margin-bottom: 5px;">{config['icon']} {config['label']}</div>
                        <div style="font-size: 32px; font-weight: bold; color: {config['color']};">{config['value']}</div>
                        {f'<div style="font-size: 14px; color: {"#2ca02c" if config["delta"] and config["delta"] >= 0 else "#d62728"};">'
                         f'{"↑" if config["delta"] and config["delta"] >= 0 else "↓"} {abs(config["delta"]) if config["delta"] else 0:.1f}%</div>' 
                         if config["delta"] is not None else ''}
                    </div>
                """, unsafe_allow_html=True)

    @staticmethod
    def render_elder_profile_card(elder_data: Dict, medication_data: pl.DataFrame, health_data: pl.DataFrame):
        st.markdown("### 👤 老人档案")
        
        col1, col2 = st.columns([1, 2])
        
        with col1:
            avatar = "👨" if elder_data.get("gender") == "男" else "👩"
            st.markdown(f"""
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          border-radius: 15px; color: white;">
                    <div style="font-size: 60px;">{avatar}</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 10px;">{elder_data.get("name", "-")}</div>
                    <div style="font-size: 14px; opacity: 0.9;">{elder_data.get("elder_id", "-")}</div>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("#### 基础信息")
            info_items = [
                ("年龄", f'{elder_data.get("age", "-")}岁'),
                ("性别", elder_data.get("gender", "-")),
                ("护理等级", elder_data.get("care_level_name", "-")),
                ("房间", elder_data.get("room_number", "-")),
                ("床位", elder_data.get("bed_number", "-")),
                ("入院日期", str(elder_data.get("admission_date", "-"))),
            ]
            for label, value in info_items:
                st.markdown(f"**{label}:** {value}")
            
            if elder_data.get("chronic_diseases"):
                st.markdown("#### 慢性病")
                for disease in elder_data["chronic_diseases"]:
                    st.markdown(f"- {disease}")
            
            if elder_data.get("allergies"):
                st.markdown("#### 过敏史")
                for allergy in elder_data["allergies"]:
                    st.markdown(f"- {allergy}")
        
        with col2:
            st.markdown("#### 💊 用药清单")
            if not medication_data.is_empty():
                med_display = medication_data.select([
                    "medication_name", "dosage", "frequency", "administration_time",
                    "prescribing_doctor", "start_date", "is_active"
                ])
                st.dataframe(
                    med_display.to_pandas(),
                    use_container_width=True,
                    column_config={
                        "medication_name": "药品名称",
                        "dosage": "剂量",
                        "frequency": "频次",
                        "administration_time": "服药时间",
                        "prescribing_doctor": "开方医生",
                        "start_date": "开始日期",
                        "is_active": "状态"
                    },
                    hide_index=True
                )
            else:
                st.info("暂无用药记录")
            
            st.markdown("#### 📊 最近7天健康趋势")
            if not health_data.is_empty():
                health_7d = health_data.filter(
                    pl.col("record_time") >= (pl.col("record_time").max() - timedelta(days=7))
                )
                
                if not health_7d.is_empty():
                    metric_cols = ["heart_rate", "bp_systolic", "blood_oxygen", "blood_glucose"]
                    metric_names = {
                        "heart_rate": "心率",
                        "bp_systolic": "收缩压",
                        "blood_oxygen": "血氧",
                        "blood_glucose": "血糖"
                    }
                    
                    for metric in metric_cols:
                        metric_data = health_7d.filter(pl.col("metric_type") == metric)
                        if not metric_data.is_empty():
                            st.markdown(f"**{metric_names[metric]}**")
                            fig = px.line(
                                metric_data.to_pandas(),
                                x="record_time",
                                y="metric_value",
                                markers=True,
                                title=f"{metric_names[metric]}趋势"
                            )
                            fig.update_layout(height=200, margin=dict(l=10, r=10, t=30, b=10))
                            st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("暂无健康数据")

    @staticmethod
    def render_care_level_distribution(elder_profiles: pl.DataFrame):
        st.markdown("### 🎚️ 护理等级分布")
        
        if elder_profiles.is_empty():
            st.info("暂无数据")
            return
        
        level_counts = elder_profiles.group_by(["care_level", "care_level_name"]).agg(
            pl.count("elder_id").alias("count")
        ).sort("care_level")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            fig_pie = px.pie(
                level_counts.to_pandas(),
                values="count",
                names="care_level_name",
                title="护理等级占比",
                hole=0.4,
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            fig_pie.update_layout(height=350)
            st.plotly_chart(fig_pie, use_container_width=True)
        
        with col2:
            level_data = level_counts.to_pandas()
            level_data["care_level_name"] = level_data["care_level_name"].astype(str)
            
            fig_bar = px.bar(
                level_data,
                x="care_level_name",
                y="count",
                text="count",
                title="各护理等级人数",
                color="care_level_name",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            fig_bar.update_layout(height=350, showlegend=False)
            fig_bar.update_traces(textposition="outside")
            st.plotly_chart(fig_bar, use_container_width=True)

    @staticmethod
    def render_rehab_trend(rehab_data: pl.DataFrame, threshold_service):
        st.markdown("### 🏃 康复活动趋势")
        
        if rehab_data.is_empty():
            st.info("暂无康复活动数据")
            return
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            rehab_pivot = rehab_data.pivot(
                index="activity_date",
                columns="care_level_name",
                values="total_minutes",
                aggregate_function="sum"
            ).sort("activity_date")
            
            fig = px.line(
                rehab_pivot.to_pandas().set_index("activity_date"),
                markers=True,
                title="各护理等级每日康复时长趋势",
                labels={"value": "总时长(分钟)", "variable": "护理等级"}
            )
            fig.update_layout(height=400, hovermode="x unified")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.markdown("#### 康复活动统计")
            total_minutes = int(rehab_data["total_minutes"].sum())
            total_sessions = int(rehab_data["activity_count"].sum())
            avg_quality = rehab_data["avg_quality"].mean()
            
            weekly_target = threshold_service.get_threshold_value("rehab_minutes_per_week")
            diversity_target = threshold_service.get_threshold_value("rehab_activity_diversity")
            
            metrics = [
                ("累计康复时长", f"{total_minutes}分钟"),
                ("累计活动次数", f"{total_sessions}次"),
                ("平均质量评分", f"{avg_quality:.1f}分"),
                ("每周达标要求", f"{weekly_target}分钟"),
                ("活动多样性要求", f"{diversity_target}种")
            ]
            
            for label, value in metrics:
                st.markdown(f"**{label}:** {value}")

    @staticmethod
    def render_care_compliance_trend(compliance_data: pl.DataFrame):
        st.markdown("### ✅ 护理达标趋势")
        
        if compliance_data.is_empty():
            st.info("暂无达标数据")
            return
        
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=("达标率趋势", "达标人数 vs 总人数"),
            vertical_spacing=0.15,
            shared_xaxes=True
        )
        
        compliance_pivot = compliance_data.group_by("activity_date").agg([
            pl.sum("total_elders").alias("total"),
            pl.sum("compliant_elders").alias("compliant"),
            (pl.sum("compliant_elders") / pl.sum("total_elders") * 100).alias("compliance_rate")
        ]).sort("activity_date").to_pandas()
        
        fig.add_trace(
            go.Scatter(
                x=compliance_pivot["activity_date"],
                y=compliance_pivot["compliance_rate"],
                mode="lines+markers",
                name="达标率(%)",
                line=dict(color="#2ca02c", width=3),
                fill="tonexty"
            ),
            row=1, col=1
        )
        
        fig.add_trace(
            go.Bar(
                x=compliance_pivot["activity_date"],
                y=compliance_pivot["total"],
                name="总人数",
                marker_color="#1f77b4"
            ),
            row=2, col=1
        )
        
        fig.add_trace(
            go.Bar(
                x=compliance_pivot["activity_date"],
                y=compliance_pivot["compliant"],
                name="达标人数",
                marker_color="#2ca02c"
            ),
            row=2, col=1
        )
        
        fig.update_layout(
            height=500,
            barmode="overlay",
            showlegend=True,
            hovermode="x unified"
        )
        fig.update_yaxes(title_text="达标率(%)", row=1, col=1)
        fig.update_yaxes(title_text="人数", row=2, col=1)
        
        st.plotly_chart(fig, use_container_width=True)

    @staticmethod
    def render_activity_category_breakdown(nursing_records: pl.DataFrame):
        st.markdown("### 📊 护理活动分类统计")
        
        if nursing_records.is_empty():
            st.info("暂无护理记录")
            return
        
        category_summary = nursing_records.group_by(["activity_category", "care_level_name"]).agg([
            pl.count("activity_code").alias("count"),
            pl.sum("activity_duration").alias("total_minutes"),
            pl.mean("quality_score").alias("avg_quality")
        ]).sort(["activity_category", "care_level_name"]).to_pandas()
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.treemap(
                category_summary,
                path=["activity_category", "care_level_name"],
                values="total_minutes",
                color="avg_quality",
                color_continuous_scale="RdYlGn",
                title="各护理类别时长分布（按质量评分着色）",
                hover_data=["count", "avg_quality"]
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            category_totals = category_summary.groupby("activity_category").agg({
                "count": "sum",
                "total_minutes": "sum"
            }).reset_index()
            
            fig = px.sunburst(
                category_totals,
                names="activity_category",
                parents=[""] * len(category_totals),
                values="total_minutes",
                title="护理活动时长占比",
                color_discrete_sequence=px.colors.qualitative.Pastel
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    @staticmethod
    def render_quality_distribution(nursing_records: pl.DataFrame):
        st.markdown("### ⭐ 护理质量评分分布")
        
        if nursing_records.is_empty():
            st.info("暂无数据")
            return
        
        quality_data = nursing_records.select(["quality_score", "activity_category", "care_level_name"]).to_pandas()
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.histogram(
                quality_data,
                x="quality_score",
                color="activity_category",
                nbins=20,
                title="质量评分分布直方图",
                marginal="box",
                labels={"quality_score": "质量评分", "count": "次数"}
            )
            fig.update_layout(height=400, barmode="overlay")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            fig = px.box(
                quality_data,
                x="care_level_name",
                y="quality_score",
                color="activity_category",
                title="各护理等级质量评分分布"
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    @staticmethod
    def render_fall_analysis(fall_events: pl.DataFrame, fall_reviews: pl.DataFrame):
        st.markdown("### ⚠️ 跌倒事件分析")
        
        col1, col2, col3 = st.columns(3)
        
        total_falls = len(fall_events)
        reviewed = len(fall_reviews)
        compliant = len(fall_reviews.filter(pl.col("is_care_compliant") == True)) if not fall_reviews.is_empty() else 0
        
        with col1:
            st.metric("跌倒事件总数", total_falls)
        with col2:
            st.metric("已复盘数", reviewed, f"{reviewed/total_falls*100:.1f}%" if total_falls > 0 else "0%")
        with col3:
            st.metric("护理达标数", compliant, f"{compliant/reviewed*100:.1f}%" if reviewed > 0 else "0%")
        
        if not fall_reviews.is_empty():
            col1, col2 = st.columns(2)
            
            with col1:
                severity_data = fall_reviews.group_by("fall_severity").agg(
                    pl.count("id").alias("count")
                ).to_pandas()
                
                fig = px.pie(
                    severity_data,
                    values="count",
                    names="fall_severity",
                    title="跌倒严重程度分布",
                    color_discrete_sequence=["#ffcccc", "#ff6666", "#cc0000"]
                )
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                response_data = fall_reviews.select(["response_time", "quality_score"]).to_pandas()
                
                fig = px.scatter(
                    response_data,
                    x="response_time",
                    y="quality_score",
                    title="响应时间 vs 质量评分",
                    labels={"response_time": "响应时间(分钟)", "quality_score": "质量评分"},
                    trendline="ols"
                )
                st.plotly_chart(fig, use_container_width=True)

    @staticmethod
    def render_health_dashboard(health_data: pl.DataFrame, start_date: date, end_date: date):
        st.markdown("### ❤️ 健康数据概览")
        
        if health_data.is_empty():
            st.info("暂无健康数据")
            return
        
        filtered = health_data.filter(
            (pl.col("record_date") >= start_date) & 
            (pl.col("record_date") <= end_date)
        )
        
        if filtered.is_empty():
            st.warning("所选时间段无数据")
            return
        
        metric_types = ["heart_rate", "bp_systolic", "bp_diastolic", "blood_oxygen", 
                        "blood_glucose", "temperature", "sleep_score", "activity_steps"]
        metric_names = {
            "heart_rate": "心率",
            "bp_systolic": "收缩压",
            "bp_diastolic": "舒张压",
            "blood_oxygen": "血氧",
            "blood_glucose": "血糖",
            "temperature": "体温",
            "sleep_score": "睡眠评分",
            "activity_steps": "步数"
        }
        metric_units = {
            "heart_rate": "次/分",
            "bp_systolic": "mmHg",
            "bp_diastolic": "mmHg",
            "blood_oxygen": "%",
            "blood_glucose": "mmol/L",
            "temperature": "℃",
            "sleep_score": "分",
            "activity_steps": "步"
        }
        
        cols = st.columns(4)
        for idx, metric in enumerate(metric_types[:4]):
            metric_data = filtered.filter(pl.col("metric_type") == metric)
            if not metric_data.is_empty():
                values = metric_data["metric_value"]
                with cols[idx]:
                    st.metric(
                        f"{metric_names[metric]} ({metric_units[metric]})",
                        f"{values.mean():.1f}",
                        f"[{values.min():.1f} ~ {values.max():.1f}]"
                    )
        
        cols = st.columns(4)
        for idx, metric in enumerate(metric_types[4:]):
            metric_data = filtered.filter(pl.col("metric_type") == metric)
            if not metric_data.is_empty():
                values = metric_data["metric_value"]
                with cols[idx]:
                    st.metric(
                        f"{metric_names[metric]} ({metric_units[metric]})",
                        f"{values.mean():.1f}",
                        f"[{values.min():.1f} ~ {values.max():.1f}]"
                    )
        
        st.markdown("#### 健康指标趋势")
        selected_metric = st.selectbox(
            "选择查看的健康指标",
            options=metric_types,
            format_func=lambda x: f"{metric_names[x]} ({metric_units[x]})"
        )
        
        trend_data = filtered.filter(pl.col("metric_type") == selected_metric)
        if not trend_data.is_empty():
            daily_avg = trend_data.group_by("record_date").agg(
                pl.mean("metric_value").alias("avg_value"),
                pl.min("metric_value").alias("min_value"),
                pl.max("metric_value").alias("max_value")
            ).sort("record_date").to_pandas()
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=daily_avg["record_date"],
                y=daily_avg["avg_value"],
                mode="lines+markers",
                name="平均值",
                line=dict(color="#1f77b4", width=3)
            ))
            fig.add_trace(go.Scatter(
                x=daily_avg["record_date"],
                y=daily_avg["max_value"],
                mode="lines",
                name="最大值",
                line=dict(color="#ff7f0e", width=1, dash="dash")
            ))
            fig.add_trace(go.Scatter(
                x=daily_avg["record_date"],
                y=daily_avg["min_value"],
                mode="lines",
                name="最小值",
                line=dict(color="#2ca02c", width=1, dash="dash"),
                fill="tonexty"
            ))
            
            fig.update_layout(
                height=400,
                title=f"{metric_names[selected_metric]} 日趋势",
                yaxis_title=metric_units[selected_metric],
                hovermode="x unified"
            )
            st.plotly_chart(fig, use_container_width=True)
