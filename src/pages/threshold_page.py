import streamlit as st
from typing import Dict

from src.data import DuckDBStore
from src.services import ThresholdService


class ThresholdPage:
    def __init__(self, db: DuckDBStore, threshold_service: ThresholdService):
        self.db = db
        self.threshold_service = threshold_service

    def render(self):
        st.title("⚙️ 阈值配置管理")
        st.markdown("""
        本页面用于配置系统各项阈值参数，无需技术人员即可调整。
        修改后将立即生效，并自动记录修改人。
        """)
        
        categories = self.threshold_service.get_categories()
        
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "🚨 应急处理",
            "✅ 护理达标",
            "🏃 康复活动",
            "❤️ 健康监测",
            "🧹 数据清洗"
        ])
        
        category_tab_map = {
            "应急处理": tab1,
            "护理达标": tab2,
            "康复活动": tab3,
            "健康监测": tab4,
            "数据清洗": tab5
        }
        
        all_thresholds = self.threshold_service.get_all_thresholds()
        
        for category, tab in category_tab_map.items():
            with tab:
                self._render_category_thresholds(category, all_thresholds)

    def _render_category_thresholds(self, category: str, all_thresholds):
        category_thresholds = [t for t in all_thresholds if t["category"] == category]
        
        if not category_thresholds:
            st.info("该分类暂无阈值配置")
            return
        
        st.markdown(f"### {category}阈值配置")
        
        modified = False
        
        for threshold in category_thresholds:
            key = threshold["key"]
            name = threshold["name"]
            description = threshold["description"]
            current_value = threshold["value"]
            default_value = threshold["default_value"]
            unit = threshold.get("unit")
            min_val = threshold.get("min_value")
            max_val = threshold.get("max_value")
            
            col1, col2, col3 = st.columns([3, 2, 1])
            
            with col1:
                st.markdown(f"**{name}**")
                st.caption(description)
                if unit:
                    st.caption(f"单位: {unit}")
            
            with col2:
                label = f"当前值{f' ({unit})' if unit else ''}"
                
                if min_val is not None and max_val is not None:
                    step = 1 if max_val - min_val > 20 else 0.5
                    new_value = st.slider(
                        label,
                        min_value=float(min_val),
                        max_value=float(max_val),
                        value=float(current_value),
                        step=step,
                        key=f"slider_{key}"
                    )
                else:
                    new_value = st.number_input(
                        label,
                        value=float(current_value),
                        step=1.0,
                        key=f"input_{key}"
                    )
            
            with col3:
                st.markdown("**默认值**")
                st.info(f"{default_value} {unit or ''}")
                
                if float(new_value) != float(current_value):
                    modified = True
                    if st.button("💾 保存", key=f"save_{key}", type="primary"):
                        try:
                            self.threshold_service.update_threshold(
                                key=key,
                                value=new_value,
                                updated_by=st.session_state.get("username", "admin")
                            )
                            st.success(f"{name} 已更新为 {new_value} {unit or ''}")
                            st.rerun()
                        except ValueError as e:
                            st.error(str(e))
        
        if modified:
            st.warning("有未保存的修改，请点击对应配置的保存按钮")
        
        st.divider()
        
        with st.expander("📋 查看完整阈值列表", expanded=False):
            st.dataframe(
                [{
                    "配置名称": t["name"],
                    "当前值": f"{t['value']} {t.get('unit', '')}",
                    "默认值": f"{t['default_value']} {t.get('unit', '')}",
                    "范围": f"{t.get('min_value', '-')} ~ {t.get('max_value', '-')}",
                    "分类": t["category"]
                } for t in all_thresholds],
                use_container_width=True,
                hide_index=True
            )
        
        st.divider()
        
        with st.expander("🔄 恢复默认值", expanded=False):
            st.warning("此操作将所有阈值恢复为默认值，请谨慎操作！")
            
            if st.button("⚠️ 恢复所有默认值", type="secondary"):
                restored_count = 0
                for threshold in all_thresholds:
                    if threshold["value"] != threshold["default_value"]:
                        try:
                            self.threshold_service.update_threshold(
                                key=threshold["key"],
                                value=threshold["default_value"],
                                updated_by=st.session_state.get("username", "system_restore")
                            )
                            restored_count += 1
                        except Exception as e:
                            st.error(f"恢复 {threshold['name']} 失败: {str(e)}")
                
                if restored_count > 0:
                    st.success(f"已恢复 {restored_count} 个阈值为默认值")
                    st.rerun()
                else:
                    st.info("所有阈值已是默认值")
