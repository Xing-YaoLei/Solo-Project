import polars as pl
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import streamlit as st
import uuid

from config import config
from data import DuckDBClient, ComplianceTask
from processing import ComplianceCalculator


class TaskGenerator:
    def __init__(self, db_client: Optional[DuckDBClient] = None):
        self.db = db_client or DuckDBClient()
        self.calculator = ComplianceCalculator(self.db)
        self.threshold = config.thresholds.compliance_threshold

    def generate_tasks_if_needed(self, start_date: str, end_date: str) -> List[ComplianceTask]:
        summary = self.calculator.get_compliance_summary(start_date, end_date)
        
        if summary["below_threshold_count"] > 0:
            tasks = self.calculator.generate_compliance_tasks(start_date, end_date)
            return tasks
        
        return []

    def render_tasks_panel(self) -> None:
        pending_tasks = self.db.get_compliance_tasks(status="pending")
        resolved_tasks = self.db.get_compliance_tasks(status="resolved")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader(f"📋 待处理任务 ({len(pending_tasks)})")
            
            if len(pending_tasks) == 0:
                st.info("暂无待处理任务")
            else:
                for idx, row in enumerate(pending_tasks.iter_rows(named=True)):
                    with st.expander(
                        f"⚠️ {row['elder_name']} - 护理达标率 {row['compliance_rate']}% (阈值 {row['threshold']}%)",
                        expanded=idx == 0
                    ):
                        self._render_single_task(row)
        
        with col2:
            st.subheader(f"✅ 已处理任务 ({len(resolved_tasks)})")
            
            if len(resolved_tasks) == 0:
                st.info("暂无已处理任务")
            else:
                for row in resolved_tasks.iter_rows(named=True):
                    with st.expander(
                        f"✅ {row['elder_name']} - 达标率 {row['compliance_rate']}%",
                        expanded=False
                    ):
                        st.markdown(f"**创建时间**: {row['create_time']}")
                        st.markdown(f"**处理人**: {row['handler']}")
                        st.markdown(f"**处理时间**: {row['resolve_time']}")
                        st.markdown(f"**处理结论**: {row['resolution']}")

    def _render_single_task(self, task: Dict[str, Any]) -> None:
        st.markdown(f"**任务ID**: {task['task_id']}")
        st.markdown(f"**老人ID**: {task['elder_id']}")
        st.markdown(f"**任务类型**: {task['task_type']}")
        st.markdown(f"**创建时间**: {task['create_time']}")
        st.markdown(f"**截止时间**: {task['due_time']}")
        st.markdown(f"**任务说明**: {task['notes']}")
        
        st.markdown("---")
        st.markdown("**处理任务**")
        
        col1, col2 = st.columns(2)
        with col1:
            handler = st.text_input(
                "处理人",
                key=f"handler_{task['task_id']}",
                placeholder="请输入处理人姓名"
            )
        
        with col2:
            status = st.selectbox(
                "任务状态",
                ["pending", "in_progress", "resolved", "cancelled"],
                index=0,
                key=f"status_{task['task_id']}"
            )
        
        resolution = st.text_area(
            "处理结论",
            key=f"resolution_{task['task_id']}",
            height=80,
            placeholder="请输入处理结论，该结论将显示在图表旁边..."
        )
        
        if st.button("保存处理结果", key=f"save_task_{task['task_id']}", type="primary"):
            if self.db.update_compliance_task(
                task_id=task['task_id'],
                resolution=resolution,
                status=status
            ):
                st.success("✅ 任务处理结果已保存，结论将显示在图表旁边")
                st.rerun()
            else:
                st.error("❌ 保存失败，请重试")

    def get_pending_tasks_summary(self) -> Dict[str, Any]:
        pending_tasks = self.db.get_compliance_tasks(status="pending")
        in_progress_tasks = self.db.get_compliance_tasks(status="in_progress")
        
        high_priority = pending_tasks.filter(
            (pl.col("compliance_rate") < 70) &
            (pl.col("due_time") < datetime.now())
        )
        
        return {
            "total_pending": len(pending_tasks),
            "in_progress": len(in_progress_tasks),
            "overdue": len(high_priority),
            "threshold": self.threshold
        }

    def render_task_badges(self) -> None:
        summary = self.get_pending_tasks_summary()
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                "⏳ 待处理任务",
                summary["total_pending"],
                delta=f"阈值 {summary['threshold']}%"
            )
        
        with col2:
            st.metric(
                "🔄 处理中",
                summary["in_progress"]
            )
        
        with col3:
            st.metric(
                "⚠️ 已逾期",
                summary["overdue"],
                delta_color="inverse"
            )

    def display_task_conclusions_near_chart(self) -> None:
        resolved_tasks = self.db.get_compliance_tasks(status="resolved")
        
        if len(resolved_tasks) == 0:
            return
        
        st.markdown("---")
        st.markdown("**📝 处理结论记录（显示在图表旁边）**")
        
        for row in resolved_tasks.iter_rows(named=True):
            if row.get("resolution"):
                st.info(
                    f"👤 {row['elder_name']} | "
                    f"📊 达标率: {row['compliance_rate']}% | "
                    f"💡 结论: {row['resolution']} | "
                    f"🕐 {row['resolve_time']}"
                )

    def close(self):
        self.calculator.close()
