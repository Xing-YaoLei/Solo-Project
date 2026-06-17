import plotly.graph_objects as go
import polars as pl
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date
import streamlit as st
import logging

logger = logging.getLogger(__name__)


class AnomalyMarker:
    def __init__(self, anomalies: Dict[str, pl.DataFrame], db_client=None):
        self.anomalies = anomalies or {}
        self.db = db_client
        self.colors = {
            "terminal_delay": "#d62728",
            "charging_missing": "#ff7f0e",
            "device_caliber_change": "#9467bd",
            "fall_impact": "#e377c2"
        }
        self.icons = {
            "terminal_delay": "⏰",
            "charging_missing": "💰",
            "device_caliber_change": "📡",
            "fall_impact": "🚨"
        }
        self.labels = {
            "terminal_delay": "护理终端延迟",
            "charging_missing": "收费系统缺失",
            "device_caliber_change": "健康设备口径变化",
            "fall_impact": "跌倒影响趋势"
        }

    def has_anomalies(self) -> bool:
        return any(len(df) > 0 for df in self.anomalies.values())

    def get_anomaly_summary(self) -> List[Dict[str, Any]]:
        summary = []
        for key, df in self.anomalies.items():
            try:
                if df is not None and len(df) > 0:
                    summary.append({
                        "type": key,
                        "label": self.labels.get(key, key),
                        "icon": self.icons.get(key, "⚠️"),
                        "color": self.colors.get(key, "#ff7f0e"),
                        "count": len(df),
                        "description": self._get_overview_description(key, df)
                    })
            except Exception as e:
                logger.warning(f"Failed to process anomaly {key}: {e}")
                continue
        return summary

    def _get_overview_description(self, anomaly_type: str, df: pl.DataFrame) -> str:
        count = len(df) if df is not None else 0
        descriptions = {
            "terminal_delay": f"检测到 {count} 条签到记录延迟超过 24 小时",
            "charging_missing": f"检测到 {count} 条已完成活动缺少收费系统记录",
            "device_caliber_change": f"检测到 {count} 天健康设备数据异常波动",
            "fall_impact": f"检测到 {count} 位老人跌倒后康复活动受影响"
        }
        return descriptions.get(anomaly_type, f"检测到 {count} 条异常记录")

    def render_anomaly_alerts(self, show_details: bool = True) -> None:
        summary = self.get_anomaly_summary()
        
        if not summary:
            st.success("✅ 数据正常，未检测到异常")
            return
        
        st.warning(f"⚠️ 检测到 {len(summary)} 类数据异常，请关注")
        
        for item in summary:
            with st.expander(
                f"{item['icon']} {item['label']} ({item['count']} 条)",
                expanded=True
            ):
                st.markdown(f"<span style='color:{item['color']}'>{item['description']}</span>", 
                           unsafe_allow_html=True)
                
                if show_details:
                    df = self.anomalies[item["type"]]
                    display_df = self._format_anomaly_df(item["type"], df)
                    st.dataframe(display_df, use_container_width=True, hide_index=True)
                    
                    self._render_review_section(item["type"], df)

    def _format_anomaly_df(self, anomaly_type: str, df: pl.DataFrame) -> pl.DataFrame:
        if anomaly_type == "terminal_delay":
            return df.select([
                "elder_name", "checkin_time", "terminal_id", "delay_minutes", "data_source"
            ]).rename({
                "elder_name": "老人姓名",
                "checkin_time": "签到时间",
                "terminal_id": "终端ID",
                "delay_minutes": "延迟(分钟)",
                "data_source": "数据来源"
            })
        
        elif anomaly_type == "charging_missing":
            return df.select([
                "elder_name", "activity_name", "plan_date", "checkin_time", "status"
            ]).rename({
                "elder_name": "老人姓名",
                "activity_name": "活动名称",
                "plan_date": "活动日期",
                "checkin_time": "签到时间",
                "status": "活动状态"
            })
        
        elif anomaly_type == "device_caliber_change":
            return df.select([
                "check_date", "checkin_count", "prev_count", "count_change_pct",
                "avg_delay", "prev_avg_delay", "delay_change_pct"
            ]).rename({
                "check_date": "日期",
                "checkin_count": "当日签到数",
                "prev_count": "前一日签到数",
                "count_change_pct": "数量变化(%)",
                "avg_delay": "平均延迟(分钟)",
                "prev_avg_delay": "前日延迟(分钟)",
                "delay_change_pct": "延迟变化(%)"
            })
        
        elif anomaly_type == "fall_impact":
            return df.select([
                "elder_name", "fall_time", "fall_date", "impact_end_date",
                "impact_days", "affected_activities", "non_compliant_count", "risk_level"
            ]).rename({
                "elder_name": "老人姓名",
                "fall_time": "跌倒时间",
                "fall_date": "跌倒日期",
                "impact_end_date": "影响结束日期",
                "impact_days": "影响天数",
                "affected_activities": "受影响活动数",
                "non_compliant_count": "未达标活动数",
                "risk_level": "风险等级"
            })
        
        return df

    def _render_review_section(self, anomaly_type: str, df: pl.DataFrame) -> None:
        st.markdown("**📝 复盘说明（已保存至数据库）**")
        
        for idx, row in enumerate(df.iter_rows(named=True)):
            anomaly_id = self._get_anomaly_id(anomaly_type, row, idx)
            
            saved_data = {}
            if self.db:
                saved_data = self.db.get_anomaly_review(anomaly_id) or {}
            
            col1, col2 = st.columns([3, 1])
            with col1:
                review = st.text_area(
                    f"异常 {idx + 1} - 复盘说明",
                    value=saved_data.get("review_notes", ""),
                    key=f"textarea_{anomaly_id}",
                    height=80,
                    placeholder="请输入复盘说明，不要与异常点分开..."
                )
            
            with col2:
                conclusion = st.text_input(
                    "处理结论",
                    value=saved_data.get("handle_conclusion", ""),
                    key=f"input_{anomaly_id}",
                    placeholder="处理结论"
                )
                
                is_resolved = saved_data.get("is_resolved", False)
                resolved = st.checkbox(
                    "已解决",
                    value=is_resolved,
                    key=f"resolved_{anomaly_id}"
                )
                
                if st.button("💾 保存", key=f"save_{anomaly_id}", type="primary"):
                    if self.db:
                        success = self.db.save_anomaly_review(
                            anomaly_id=anomaly_id,
                            review_notes=review,
                            handle_conclusion=conclusion,
                            resolved=resolved
                        )
                        if success:
                            st.success("✅ 复盘说明和处理结论已保存到数据库，将显示在图表旁边")
                            st.rerun()
                        else:
                            st.error("❌ 保存失败，请重试")
                    else:
                        st.warning("⚠️ 数据库连接不可用，无法保存")
            
            if saved_data.get("handle_conclusion"):
                st.info(
                    f"💡 已保存的处理结论：{saved_data['handle_conclusion']}"
                    f"{' ✅' if saved_data.get('is_resolved') else ''}"
                )

    def _get_anomaly_id(self, anomaly_type: str, row: Dict[str, Any], idx: int) -> str:
        if anomaly_type == "terminal_delay":
            return f"delay_{row.get('checkin_id', idx)}"
        elif anomaly_type == "charging_missing":
            return f"charging_{row.get('activity_id', idx)}"
        elif anomaly_type == "device_caliber_change":
            return f"device_{row.get('check_date', idx)}"
        elif anomaly_type == "fall_impact":
            return f"fall_{row.get('event_id', idx)}"
        return f"{anomaly_type}_{idx}"

    def add_anomaly_markers_to_chart(self, fig: go.Figure, 
                                      x_field: str = "plan_date") -> go.Figure:
        fall_anomalies = self.anomalies.get("fall_impact", pl.DataFrame())
        
        if len(fall_anomalies) == 0:
            return fig
        
        for row in fall_anomalies.iter_rows(named=True):
            fall_date = row.get("fall_date")
            impact_end = row.get("impact_end_date")
            
            if fall_date and impact_end:
                fig.add_vrect(
                    x0=fall_date,
                    x1=impact_end,
                    fillcolor="#fce4ec",
                    opacity=0.5,
                    layer="below",
                    line_width=0,
                    annotation_text=f"🚨 {row['elder_name']}跌倒影响期",
                    annotation_position="top left"
                )
        
        return fig

    def get_saved_conclusions(self, anomaly_type: str) -> List[Dict[str, Any]]:
        if not self.db:
            return []
        
        conclusions = []
        df = self.anomalies.get(anomaly_type, pl.DataFrame())
        
        if df is None or len(df) == 0:
            return []
        
        for idx, row in enumerate(df.iter_rows(named=True)):
            anomaly_id = self._get_anomaly_id(anomaly_type, row, idx)
            try:
                saved = self.db.get_anomaly_review(anomaly_id)
                if saved and saved.get("handle_conclusion"):
                    conclusions.append({
                        "anomaly_id": anomaly_id,
                        "conclusion": saved["handle_conclusion"],
                        "is_resolved": saved.get("is_resolved", False),
                        "description": self._get_single_anomaly_description(anomaly_type, row)
                    })
            except Exception as e:
                logger.warning(f"Failed to get saved conclusion for {anomaly_id}: {e}")
                continue
        
        return conclusions
    
    def _get_single_anomaly_description(self, anomaly_type: str, row: Dict[str, Any]) -> str:
        try:
            if anomaly_type == "terminal_delay":
                return f"签到延迟 - {row.get('elder_name', '未知')} - {row.get('checkin_time', row.get('check_time', '未知'))}"
            elif anomaly_type == "charging_missing":
                return f"收费缺失 - {row.get('activity_name', '未知')} - {row.get('plan_date', '未知')}"
            elif anomaly_type == "device_caliber_change":
                return f"口径变化 - {row.get('check_date', '未知')}"
            elif anomaly_type == "fall_impact":
                return f"跌倒影响 - {row.get('elder_name', '未知')} - {row.get('fall_date', '未知')}"
        except Exception:
            pass
        return f"异常记录 - {anomaly_type}"

    def get_all_saved_conclusions(self) -> List[Dict[str, Any]]:
        all_conclusions = []
        for anomaly_type in ["terminal_delay", "charging_missing", "device_caliber_change", "fall_impact"]:
            try:
                conclusions = self.get_saved_conclusions(anomaly_type)
                all_conclusions.extend(conclusions)
            except Exception as e:
                logger.warning(f"Failed to get conclusions for {anomaly_type}: {e}")
                continue
        return all_conclusions

    def render_saved_conclusions_near_chart(self, max_items: int = 5) -> None:
        st.markdown("**💡 已保存的处理结论（显示在图表旁边）**")
        
        try:
            all_conclusions = self.get_all_saved_conclusions()
        except Exception as e:
            logger.error(f"Failed to get saved conclusions: {e}")
            st.caption("暂无已保存的处理结论")
            return
        
        if not all_conclusions:
            st.caption("暂无已保存的处理结论，请在下方异常检测区域录入")
            return
        
        for conc in all_conclusions[:max_items]:
            status_icon = "✅" if conc.get("is_resolved") else "⏳"
            with st.container():
                st.info(
                    f"{status_icon} **{conc.get('description', '异常')}**\n\n"
                    f"处理结论: {conc.get('conclusion', '')}"
                )

    def get_affected_periods(self) -> List[Tuple[date, date, str]]:
        periods = []
        fall_anomalies = self.anomalies.get("fall_impact", pl.DataFrame())
        
        for row in fall_anomalies.iter_rows(named=True):
            fall_date = row.get("fall_date")
            impact_end = row.get("impact_end_date")
            if fall_date and impact_end:
                periods.append((
                    fall_date,
                    impact_end,
                    f"{row['elder_name']}跌倒影响"
                ))
        
        return periods
