import io
import polars as pl
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Optional, List
import streamlit as st
import xlsxwriter

from config import get_compliance_rules_text
from data import DuckDBClient, MinIOClient
from processing import DataProcessor, ComplianceCalculator


class DownloadHandler:
    def __init__(self, db_client: Optional[DuckDBClient] = None, 
                 minio_client: Optional[MinIOClient] = None,
                 use_streamlit: bool = True):
        self.db = db_client or DuckDBClient()
        self.processor = DataProcessor(self.db)
        self.calculator = ComplianceCalculator(self.db)
        self.minio = minio_client
        self.minio_available = minio_client is not None and minio_client.is_available()
        self.use_streamlit = use_streamlit
        
        if self.use_streamlit:
            if self.minio_available:
                st.success("✅ MinIO 存储已连接，报表将自动备份到对象存储")
            else:
                st.info("ℹ️ MinIO 未连接，报表仅提供本地下载")

    def generate_report_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        activities = self.db.get_activities(start_date, end_date)
        checkins = self.db.get_checkins()
        risk_events = self.db.get_risk_events()
        elders = self.db.get_elders()
        anomalies = self.processor.detect_all_anomalies()
        funnel_stages = self.processor.calculate_funnel_stages(start_date, end_date)
        compliance_summary = self.calculator.get_compliance_summary(start_date, end_date)
        daily_trend = self.processor.get_daily_trend(start_date, end_date)
        elder_ranking = self.processor.get_elder_compliance_ranking(start_date, end_date)
        type_summary = self.processor.get_activity_type_summary(start_date, end_date)
        risk_summary = self.processor.get_risk_event_summary(start_date, end_date)
        tasks = self.db.get_compliance_tasks()
        
        return {
            "activities": activities,
            "checkins": checkins,
            "risk_events": risk_events,
            "elders": elders,
            "anomalies": anomalies,
            "funnel_stages": funnel_stages,
            "compliance_summary": compliance_summary,
            "daily_trend": daily_trend,
            "elder_ranking": elder_ranking,
            "type_summary": type_summary,
            "risk_summary": risk_summary,
            "tasks": tasks,
            "report_params": {
                "start_date": start_date,
                "end_date": end_date,
                "generate_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        }

    def export_to_excel(self, data: Dict[str, Any]) -> bytes:
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter',
                'bg_color': '#1f77b4',
                'font_color': 'white'
            })
            
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#d6d6d6',
                'border': 1
            })
            
            data_format = workbook.add_format({
                'border': 1,
                'align': 'left'
            })
            
            self._write_summary_sheet(writer, data, title_format, header_format, data_format)
            
            self._write_dataframe_sheet(writer, data["daily_trend"], "每日趋势", header_format, data_format)
            
            self._write_dataframe_sheet(writer, data["activities"], "康复活动明细", header_format, data_format)
            
            self._write_dataframe_sheet(writer, data["checkins"], "活动签到明细", header_format, data_format)
            
            self._write_dataframe_sheet(writer, data["elder_ranking"], "老人达标排名", header_format, data_format)
            
            self._write_dataframe_sheet(writer, data["type_summary"], "活动类型汇总", header_format, data_format)
            
            self._write_dataframe_sheet(writer, data["risk_events"], "风险事件记录", header_format, data_format)
            
            self._write_anomalies_sheet(writer, data["anomalies"], header_format, data_format)
            
            self._write_tasks_sheet(writer, data["tasks"], header_format, data_format)
            
            self._write_elders_sheet(writer, data["elders"], header_format, data_format)
            
            self._write_compliance_rules_sheet(writer, workbook)
        
        output.seek(0)
        excel_data = output.getvalue()
        
        if self.minio_available:
            start_date = data["report_params"]["start_date"]
            end_date = data["report_params"]["end_date"]
            
            metadata = self.minio.upload_report(
                report_data=excel_data,
                report_type="funnel_report",
                start_date=start_date,
                end_date=end_date
            )
            
            if metadata:
                st.success(f"✅ 报表已备份到 MinIO 对象存储")
                st.info(f"📦 存储路径: `{metadata['object_name']}`")
                st.session_state["last_minio_upload"] = metadata
        
        return excel_data
    
    def render_history_reports(self) -> None:
        if not self.minio_available:
            return
        
        with st.expander("📦 MinIO 历史报表存储", expanded=False):
            st.markdown("**已存储的历史报表**")
            
            reports = self.minio.list_reports("funnel_report")
            
            if reports:
                for idx, report in enumerate(reports[:10]):
                    with st.container():
                        col1, col2, col3 = st.columns([3, 2, 1])
                        with col1:
                            st.markdown(f"**报表 #{idx + 1}**")
                            st.caption(f"期间: {report.get('start_date', 'N/A')} ~ {report.get('end_date', 'N/A')}")
                        with col2:
                            st.caption(f"生成时间: {report.get('created_at', 'N/A')}")
                            size_kb = report.get('size_bytes', 0) / 1024
                            st.caption(f"大小: {size_kb:.1f} KB")
                        with col3:
                            object_name = report.get('object_name', '')
                            if object_name and st.button("⬇️ 下载", key=f"dl_hist_{idx}"):
                                try:
                                    data = self.minio.client.get_object(
                                        self.minio.bucket,
                                        object_name
                                    )
                                    excel_bytes = data.read()
                                    st.download_button(
                                        label="📥 确认下载报表",
                                        data=excel_bytes,
                                        file_name=f"历史报表_{report.get('start_date', '')}_{report.get('end_date', '')}.xlsx",
                                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                        key=f"confirm_dl_{idx}",
                                        type="primary"
                                    )
                                except Exception as e:
                                    st.error(f"下载失败: {e}")
                        st.divider()
            else:
                st.info("暂无历史报表")

    def _write_summary_sheet(self, writer, data: Dict[str, Any], 
                              title_format, header_format, data_format):
        df = pd.DataFrame()
        df.to_excel(writer, sheet_name="报表汇总", index=False)
        
        worksheet = writer.sheets["报表汇总"]
        
        worksheet.merge_range('A1:D1', f"养老护理康复活动漏斗报表", title_format)
        worksheet.merge_range('A2:D2', 
                             f"统计期间: {data['report_params']['start_date']} 至 {data['report_params']['end_date']}",
                             title_format)
        worksheet.merge_range('A3:D3', 
                             f"生成时间: {data['report_params']['generate_time']}",
                             title_format)
        
        row = 5
        summary = data["compliance_summary"]
        
        worksheet.write(row, 0, "核心指标", header_format)
        worksheet.write(row, 1, "数值", header_format)
        worksheet.write(row, 2, "说明", header_format)
        row += 1
        
        metrics = [
            ("总活动数", summary["total_activities"], "本期计划康复活动总数"),
            ("达标活动数", summary["compliant_count"], "符合护理标准的活动数"),
            ("护理达标率", f"{summary['compliance_rate']}%", "达标活动/总活动"),
            ("达标等级", summary["level"], f"阈值 {summary['threshold']}%"),
            ("参与老人数", summary["elder_count"], "有活动记录的老人数"),
            ("低于阈值老人数", summary["below_threshold_count"], "达标率低于阈值的老人")
        ]
        
        for metric_name, metric_value, metric_desc in metrics:
            worksheet.write(row, 0, metric_name, data_format)
            worksheet.write(row, 1, str(metric_value), data_format)
            worksheet.write(row, 2, metric_desc, data_format)
            row += 1
        
        row += 2
        worksheet.write(row, 0, "漏斗阶段", header_format)
        worksheet.write(row, 1, "人数", header_format)
        worksheet.write(row, 2, "占比", header_format)
        worksheet.write(row, 3, "说明", header_format)
        row += 1
        
        for stage in data["funnel_stages"]:
            worksheet.write(row, 0, stage.stage_name, data_format)
            worksheet.write(row, 1, stage.count, data_format)
            worksheet.write(row, 2, f"{stage.rate:.2f}%", data_format)
            worksheet.write(row, 3, stage.notes, data_format)
            row += 1
        
        worksheet.set_column('A:A', 20)
        worksheet.set_column('B:B', 15)
        worksheet.set_column('C:C', 15)
        worksheet.set_column('D:D', 40)

    def _write_dataframe_sheet(self, writer, df: pl.DataFrame, sheet_name: str,
                                header_format, data_format):
        if len(df) == 0:
            pd_df = pd.DataFrame(columns=["无数据"])
            pd_df.to_excel(writer, sheet_name=sheet_name, index=False)
            return
        
        pd_df = df.to_pandas()
        pd_df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        worksheet = writer.sheets[sheet_name]
        
        for col_num, value in enumerate(pd_df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        for row_num in range(len(pd_df)):
            for col_num in range(len(pd_df.columns)):
                cell_value = pd_df.iloc[row_num, col_num]
                if pd.isna(cell_value):
                    cell_value = ""
                worksheet.write(row_num + 1, col_num, str(cell_value), data_format)
        
        for col_num, col_name in enumerate(pd_df.columns):
            max_len = max(
                pd_df[col_name].astype(str).str.len().max(),
                len(str(col_name))
            )
            worksheet.set_column(col_num, col_num, min(max_len + 2, 30))

    def _write_anomalies_sheet(self, writer, anomalies: Dict[str, pl.DataFrame],
                                header_format, data_format):
        row = 0
        df = pd.DataFrame()
        df.to_excel(writer, sheet_name="异常记录", index=False)
        worksheet = writer.sheets["异常记录"]
        
        anomaly_labels = {
            "terminal_delay": "护理终端延迟",
            "charging_missing": "收费系统缺失",
            "device_caliber_change": "健康设备口径变化",
            "fall_impact": "跌倒影响趋势"
        }
        
        for key, anomaly_df in anomalies.items():
            worksheet.merge_range(row, 0, row, 5, anomaly_labels[key], header_format)
            row += 1
            
            if len(anomaly_df) > 0:
                pd_df = anomaly_df.to_pandas()
                
                for col_num, value in enumerate(pd_df.columns.values):
                    worksheet.write(row, col_num, value, header_format)
                row += 1
                
                for row_idx in range(len(pd_df)):
                    for col_num in range(len(pd_df.columns)):
                        cell_value = pd_df.iloc[row_idx, col_num]
                        if pd.isna(cell_value):
                            cell_value = ""
                        worksheet.write(row, col_num, str(cell_value), data_format)
                    row += 1
            else:
                worksheet.write(row, 0, "无异常记录", data_format)
                row += 1
            
            row += 1
        
        worksheet.set_column('A:Z', 15)

    def _write_tasks_sheet(self, writer, tasks: pl.DataFrame, header_format, data_format):
        self._write_dataframe_sheet(writer, tasks, "达标任务", header_format, data_format)

    def _write_elders_sheet(self, writer, elders: pl.DataFrame, header_format, data_format):
        self._write_dataframe_sheet(writer, elders, "老人档案", header_format, data_format)

    def _write_compliance_rules_sheet(self, writer, workbook):
        rules_text = get_compliance_rules_text()
        
        df = pd.DataFrame()
        df.to_excel(writer, sheet_name="护理达标计算规则", index=False)
        worksheet = writer.sheets["护理达标计算规则"]
        
        rules_format = workbook.add_format({
            'font_size': 11,
            'align': 'left',
            'valign': 'top',
            'text_wrap': True
        })
        
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 14,
            'align': 'center',
            'bg_color': '#2ca02c',
            'font_color': 'white'
        })
        
        worksheet.merge_range('A1:D1', "护理达标计算规则说明", title_format)
        
        for row_num, line in enumerate(rules_text.split('\n'), start=2):
            worksheet.write(row_num, 0, line, rules_format)
        
        worksheet.set_column('A:A', 80)
        worksheet.set_row(0, 30)

    def render_download_button(self, start_date: str, end_date: str) -> None:
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.info("📥 下载报表将包含所有数据明细、统计汇总和护理达标计算规则")
        
        with col2:
            if st.button("📊 生成并下载报表", type="primary", use_container_width=True):
                with st.spinner("正在生成报表..."):
                    data = self.generate_report_data(start_date, end_date)
                    excel_data = self.export_to_excel(data)
                    
                    filename = f"养老护理康复活动报表_{start_date}_{end_date}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
                    
                    st.download_button(
                        label="💾 下载 Excel 报表",
                        data=excel_data,
                        file_name=filename,
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        use_container_width=True
                    )
                    
                    st.success("✅ 报表生成成功！包含数据明细、统计汇总和护理达标计算规则")

    def close(self):
        self.processor.close()
        self.calculator.close()
