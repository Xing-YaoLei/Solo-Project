import plotly.graph_objects as go
import polars as pl
from typing import Optional, Dict, Any
from datetime import datetime
import streamlit as st

from data import DuckDBClient
from processing import DataProcessor
from components.anomaly_marker import AnomalyMarker


class CheckinView:
    def __init__(self, db_client: Optional[DuckDBClient] = None):
        self.db = db_client or DuckDBClient()
        self.processor = DataProcessor(self.db)

    def render(self, start_date: str, end_date: str, anomaly_marker: AnomalyMarker) -> None:
        st.header("📋 活动签到视图")
        
        checkins = self.db.get_checkins()
        activities = self.db.get_activities(start_date, end_date)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("总签到次数", len(checkins))
        
        with col2:
            on_time = checkins.filter(pl.col("is_late") == False).height
            on_time_rate = on_time / len(checkins) * 100 if len(checkins) > 0 else 0
            st.metric("准时签到率", f"{on_time_rate:.1f}%")
        
        with col3:
            avg_delay = checkins["delay_minutes"].mean() if len(checkins) > 0 else 0
            st.metric("平均延迟", f"{avg_delay:.1f} 分钟")
        
        with col4:
            late_count = checkins.filter(pl.col("delay_minutes") > 30).height
            st.metric("严重迟到", late_count, delta_color="inverse")
        
        st.subheader("签到趋势")
        daily_checkins = checkins.with_columns(
            pl.col("checkin_time").cast(pl.Date).alias("check_date")
        ).group_by("check_date").agg(
            pl.col("checkin_id").count().alias("total_checkins"),
            (pl.col("is_late").cast(pl.Int64).sum() * 100.0 / pl.col("checkin_id").count()).alias("late_rate")
        ).sort("check_date")
        
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=daily_checkins["check_date"],
            y=daily_checkins["total_checkins"],
            name="签到次数",
            marker_color="#1f77b4"
        ))
        fig.add_trace(go.Scatter(
            x=daily_checkins["check_date"],
            y=daily_checkins["late_rate"],
            name="迟到率(%)",
            yaxis="y2",
            mode="lines+markers",
            marker_color="#d62728"
        ))
        fig.update_layout(
            yaxis2=dict(
                title="迟到率(%)",
                overlaying="y",
                side="right",
                range=[0, 100]
            ),
            yaxis_title="签到次数",
            height=400,
            margin={"l": 20, "r": 20, "t": 20, "b": 20}
        )
        
        fig = anomaly_marker.add_anomaly_markers_to_chart(fig, "check_date")
        st.plotly_chart(fig, use_container_width=True)
        
        st.subheader("签到明细")
        display_checkins = checkins.select([
            "elder_name", "checkin_time", "checkin_method", 
            "terminal_id", "is_late", "delay_minutes", "data_source"
        ]).rename({
            "elder_name": "老人姓名",
            "checkin_time": "签到时间",
            "checkin_method": "签到方式",
            "terminal_id": "终端ID",
            "is_late": "是否迟到",
            "delay_minutes": "延迟(分钟)",
            "data_source": "数据来源"
        })
        
        st.dataframe(display_checkins, use_container_width=True, hide_index=True)

    def close(self):
        self.processor.close()


class RiskEventView:
    def __init__(self, db_client: Optional[DuckDBClient] = None):
        self.db = db_client or DuckDBClient()
        self.processor = DataProcessor(self.db)

    def render(self, start_date: str, end_date: str, anomaly_marker: AnomalyMarker) -> None:
        st.header("🚨 风险事件视图")
        
        risk_events = self.db.get_risk_events()
        
        if len(risk_events) == 0:
            st.info("暂无风险事件记录")
            return
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("总风险事件", len(risk_events))
        
        with col2:
            high_risk = risk_events.filter(
                (pl.col("risk_level") == "高风险") | (pl.col("risk_level") == "极高风险")
            ).height
            st.metric("高风险事件", high_risk, delta_color="inverse")
        
        with col3:
            falls = risk_events.filter(pl.col("event_type") == "跌倒").height
            st.metric("跌倒事件", falls, delta_color="inverse")
        
        with col4:
            followup = risk_events.filter(pl.col("follow_up_required") == True).height
            st.metric("需跟进事件", followup)
        
        st.subheader("风险事件分布")
        
        col1, col2 = st.columns(2)
        
        with col1:
            type_summary = risk_events.group_by("event_type").agg(
                pl.count("event_id").alias("count")
            ).sort("count", descending=True)
            
            fig1 = go.Figure(go.Pie(
                labels=type_summary["event_type"],
                values=type_summary["count"],
                hole=0.4
            ))
            fig1.update_layout(title="事件类型分布", height=350)
            st.plotly_chart(fig1, use_container_width=True)
        
        with col2:
            level_summary = risk_events.group_by("risk_level").agg(
                pl.count("event_id").alias("count")
            )
            
            fig2 = go.Figure(go.Bar(
                x=level_summary["risk_level"],
                y=level_summary["count"],
                marker_color=["#2ca02c", "#ff7f0e", "#d62728", "#7f7f7f"]
            ))
            fig2.update_layout(title="风险等级分布", height=350, yaxis_title="事件数")
            st.plotly_chart(fig2, use_container_width=True)
        
        st.subheader("跌倒影响趋势分析")
        fall_events = risk_events.filter(pl.col("event_type") == "跌倒")
        
        if len(fall_events) > 0:
            fall_impact = anomaly_marker.anomalies.get("fall_impact", pl.DataFrame())
            
            if len(fall_impact) > 0:
                st.warning(f"⚠️ 检测到 {len(fall_impact)} 位老人跌倒后康复活动受影响")
                
                for row in fall_impact.iter_rows(named=True):
                    with st.expander(
                        f"🚨 {row['elder_name']} - {row['fall_date']} 跌倒",
                        expanded=True
                    ):
                        st.markdown(f"**跌倒时间**: {row['fall_time']}")
                        st.markdown(f"**风险等级**: {row['risk_level']}")
                        st.markdown(f"**影响时间段**: {row['fall_date']} 至 {row['impact_end_date']}")
                        st.markdown(f"**影响天数**: {row['impact_days']} 天")
                        st.markdown(f"**受影响活动数**: {row['affected_activities']}")
                        st.markdown(f"**未达标活动数**: {row['non_compliant_count']}")
                        st.markdown(f"**事件描述**: {row['description']}")
                        
                        st.markdown("**📝 复盘说明（与异常点不分开）**")
                        review_key = f"fall_review_{row['event_id']}"
                        if review_key not in st.session_state:
                            st.session_state[review_key] = ""
                        
                        review = st.text_area(
                            "复盘说明",
                            value=st.session_state[review_key],
                            key=f"fall_text_{row['event_id']}",
                            height=80,
                            placeholder="请输入本次跌倒事件的复盘说明..."
                        )
                        st.session_state[review_key] = review
                        
                        conclusion_key = f"fall_conclusion_{row['event_id']}"
                        if conclusion_key not in st.session_state:
                            st.session_state[conclusion_key] = ""
                        
                        conclusion = st.text_input(
                            "处理结论",
                            value=st.session_state[conclusion_key],
                            key=f"fall_conclusion_{row['event_id']}",
                            placeholder="处理结论（显示在图表旁边）"
                        )
                        st.session_state[conclusion_key] = conclusion
                        
                        if st.button("保存处理结论", key=f"save_fall_{row['event_id']}"):
                            st.success("✅ 处理结论已保存到图表旁边")
        
        st.subheader("风险事件明细")
        display_events = risk_events.select([
            "event_time", "elder_name", "event_type", "risk_level",
            "location", "description", "handler", "handle_result", "follow_up_required"
        ]).rename({
            "event_time": "事件时间",
            "elder_name": "老人姓名",
            "event_type": "事件类型",
            "risk_level": "风险等级",
            "location": "发生地点",
            "description": "事件描述",
            "handler": "处理人",
            "handle_result": "处理结果",
            "follow_up_required": "是否需跟进"
        }).sort("事件时间", descending=True)
        
        st.dataframe(display_events, use_container_width=True, hide_index=True)

    def close(self):
        self.processor.close()


class ElderProfileView:
    def __init__(self, db_client: Optional[DuckDBClient] = None):
        self.db = db_client or DuckDBClient()
        self.processor = DataProcessor(self.db)

    def render(self, start_date: str, end_date: str, anomaly_marker: AnomalyMarker) -> None:
        st.header("👴 老人档案视图")
        
        elders = self.db.get_elders()
        activities = self.db.get_activities(start_date, end_date)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("在院老人数", len(elders))
        
        with col2:
            avg_age = elders["age"].mean() if len(elders) > 0 else 0
            st.metric("平均年龄", f"{avg_age:.1f} 岁")
        
        with col3:
            high_care = elders.filter(pl.col("care_level") == "特级护理").height
            st.metric("特级护理", high_care)
        
        with col4:
            active_elders = activities["elder_id"].n_unique() if len(activities) > 0 else 0
            st.metric("参与康复活动", active_elders)
        
        st.subheader("老人护理达标排名")
        elder_ranking = self.processor.get_elder_compliance_ranking(start_date, end_date, limit=len(elders))
        
        if len(elder_ranking) > 0:
            display_ranking = elder_ranking.select([
                "elder_name", "total_activities", "compliant_count", "compliance_rate"
            ]).rename({
                "elder_name": "老人姓名",
                "total_activities": "活动总数",
                "compliant_count": "达标数",
                "compliance_rate": "达标率(%)"
            })
            
            st.dataframe(
                display_ranking,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "达标率(%)": st.column_config.ProgressColumn(
                        "达标率(%)",
                        format="%.2f",
                        min_value=0,
                        max_value=100
                    )
                }
            )
        else:
            st.info("暂无足够数据计算排名")
        
        st.subheader("老人档案详情")
        
        elder_names = elders["name"].to_list()
        selected_elder = st.selectbox("选择老人查看详情", elder_names)
        
        if selected_elder:
            elder_info = elders.filter(pl.col("name") == selected_elder)
            
            if len(elder_info) > 0:
                elder_data = elder_info.row(0, named=True)
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown(f"**姓名**: {elder_data['name']}")
                    st.markdown(f"**性别**: {elder_data['gender']}")
                    st.markdown(f"**年龄**: {elder_data['age']} 岁")
                    st.markdown(f"**房间号**: {elder_data['room_number']}")
                    st.markdown(f"**入院日期**: {elder_data['admission_date']}")
                
                with col2:
                    st.markdown(f"**健康等级**: {elder_data['health_level']}")
                    st.markdown(f"**护理等级**: {elder_data['care_level']}")
                    st.markdown(f"**病史**: {elder_data['medical_history']}")
                    st.markdown(f"**联系人**: {elder_data['contact_person']}")
                    st.markdown(f"**联系电话**: {elder_data['contact_phone']}")
                
                if elder_data["notes"]:
                    st.markdown(f"**备注**: {elder_data['notes']}")
                
                st.markdown("---")
                st.subheader("近期康复活动")
                
                elder_activities = activities.filter(pl.col("elder_name") == selected_elder)
                
                if len(elder_activities) > 0:
                    display_activities = elder_activities.select([
                        "plan_date", "activity_name", "activity_type", 
                        "status", "is_compliant", "non_compliant_reason", "therapist"
                    ]).rename({
                        "plan_date": "活动日期",
                        "activity_name": "活动名称",
                        "activity_type": "活动类型",
                        "status": "活动状态",
                        "is_compliant": "是否达标",
                        "non_compliant_reason": "未达标原因",
                        "therapist": "治疗师"
                    }).sort("活动日期", descending=True)
                    
                    st.dataframe(display_activities, use_container_width=True, hide_index=True)
                    
                    compliance_rate = (
                        elder_activities.filter(pl.col("is_compliant") == True).height / 
                        len(elder_activities) * 100
                    )
                    st.metric("护理达标率", f"{compliance_rate:.2f}%")
                else:
                    st.info("该老人近期无康复活动记录")
                
                st.subheader("近期风险事件")
                elder_risks = self.db.get_risk_events().filter(pl.col("elder_name") == selected_elder)
                
                if len(elder_risks) > 0:
                    display_risks = elder_risks.select([
                        "event_time", "event_type", "risk_level", 
                        "description", "handle_result"
                    ]).rename({
                        "event_time": "事件时间",
                        "event_type": "事件类型",
                        "risk_level": "风险等级",
                        "description": "事件描述",
                        "handle_result": "处理结果"
                    }).sort("事件时间", descending=True)
                    
                    st.dataframe(display_risks, use_container_width=True, hide_index=True)
                else:
                    st.info("该老人近期无风险事件记录")

    def close(self):
        self.processor.close()
