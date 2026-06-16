import pandas as pd
import numpy as np
from datetime import date, timedelta
from io import StringIO
from database.db import SessionLocal
from etl.metrics_calculator import MetricsCalculator
from etl.anomaly_detector import AnomalyDetector
from config.settings import settings


class DataService:
    def __init__(self):
        self.db = SessionLocal()
        self.metrics_calculator = MetricsCalculator(self.db)
        self.anomaly_detector = AnomalyDetector(self.db, settings.ANOMALY_THRESHOLDS)

    def __del__(self):
        try:
            self.db.close()
        except:
            pass

    def get_risk_monitor_data(self, days=30):
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        metrics_df = self.metrics_calculator.get_metrics_dataframe(start_date, end_date)
        anomalies_df = self.anomaly_detector.get_anomalies_with_reviews(start_date, end_date)

        return metrics_df, anomalies_df

    def get_treatment_calendar(self, days=14):
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
        return self.metrics_calculator.get_treatment_calendar_data(start_date, end_date)

    def get_equipment_status(self):
        return self.metrics_calculator.get_equipment_status_data()

    def get_nursing_logs(self, days=7):
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
        return self.metrics_calculator.get_nursing_log_data(start_date, end_date)

    def get_metrics_definitions(self):
        return settings.METRICS_DEFINITIONS

    def generate_download_csv(self, metrics_df, anomalies_df, include_definitions=True):
        output = StringIO()

        output.write("# 康复评估风险监测数据导出\n")
        output.write(f"# 生成时间: {date.today().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.write(f"# 数据范围: {metrics_df['date'].min()} 至 {metrics_df['date'].max()}\n")
        output.write("\n")

        if include_definitions:
            output.write("===== 指标定义 =====\n")
            output.write("指标名称,计算公式,描述,数据来源\n")
            for key, definition in settings.METRICS_DEFINITIONS.items():
                output.write(f"{definition['name']},{definition['formula']},{definition['description']},{'/'.join(definition['data_sources'])}\n")
            output.write("\n")

            output.write("===== 训练完成率计算规则 =====\n")
            output.write("1. 统计周期内所有活跃治疗计划\n")
            output.write("2. 计划治疗次数 = sum(每个计划的planned_sessions)\n")
            output.write("3. 完成治疗次数 = sum(每个计划的completed_sessions)\n")
            output.write("4. 训练完成率 = 完成治疗次数 / 计划治疗次数 * 100%\n")
            output.write("5. 仅统计周期内状态为active的计划\n")
            output.write("\n")

        output.write("===== 每日指标数据 =====\n")
        metrics_df.to_csv(output, index=False, encoding="utf-8-sig")
        output.write("\n")

        if not anomalies_df.empty:
            output.write("===== 异常标记与复盘记录 =====\n")
            output.write("注意：复盘说明与异常点关联展示，不分开存储\n")
            anomalies_export = anomalies_df[[
                "date", "anomaly_type", "severity", "description",
                "is_resolved", "review_count", "review_contents", "reviewers"
            ]].copy()
            anomalies_export.columns = [
                "异常日期", "异常类型", "严重程度", "异常描述",
                "是否解决", "复盘次数", "复盘内容", "复盘人员"
            ]
            anomalies_export.to_csv(output, index=False, encoding="utf-8-sig")

        csv_content = output.getvalue()
        output.close()
        return csv_content

    def refresh_all_data(self):
        from tasks.scheduled_tasks import run_full_refresh
        run_full_refresh.delay()
        return True

    def get_summary_stats(self, metrics_df):
        if metrics_df.empty:
            return {}

        latest = metrics_df.iloc[-1]
        previous = metrics_df.iloc[-2] if len(metrics_df) >= 2 else latest

        return {
            "latest_risk_score": latest["综合风险评分"],
            "risk_score_change": latest["综合风险评分"] - previous["综合风险评分"],
            "avg_completion_rate": metrics_df["训练完成率"].mean(),
            "avg_delay_rate": metrics_df["收费表延迟率"].mean(),
            "avg_record_completeness": metrics_df["病历完整度"].mean(),
            "total_anomalies": metrics_df["异常数量"].sum(),
            "unresolved_anomalies": int(metrics_df["异常数量"].iloc[-3:].sum()),
        }
