import pandas as pd
import io
from datetime import datetime
from config import Config


class ReportExporter:
    INDICATOR_CALIBER = {
        "avg_first_review_hours": {
            "name": "平均初审时长",
            "definition": "从申请提交时刻起到初审完成时刻的时长平均值，单位小时",
            "formula": "SUM(初审完成时间 - 申请提交时间) / 完成初审的申请数",
            "threshold": "<= 8小时",
        },
        "avg_schedule_hours": {
            "name": "平均排课时长",
            "definition": "从初审通过时刻起到排课完成时刻的时长平均值，单位小时",
            "formula": "SUM(排课完成时间 - 初审通过时间) / 完成排课的申请数",
            "threshold": "<= 24小时",
        },
        "avg_final_review_hours": {
            "name": "平均终审时长",
            "definition": "从排课完成时刻起到终审完成时刻的时长平均值，单位小时",
            "formula": "SUM(终审完成时间 - 排课完成时间) / 完成终审的申请数",
            "threshold": "<= 24小时",
        },
        "avg_total_hours": {
            "name": "平均总时长",
            "definition": "从申请提交时刻起到终审通过（或选课成功）时刻的时长平均值",
            "formula": "SUM(终审/成功时间 - 申请提交时间) / 成功申请数",
            "threshold": "<= 72小时",
        },
        "funnel_conversion_rate": {
            "name": "漏斗整体转化率",
            "definition": "选课成功申请数 / 提交申请数 × 100%",
            "formula": "选课成功数 ÷ 已提交数 × 100%",
            "threshold": ">= 80%",
        },
        "conflict_rate": {
            "name": "教室冲突率",
            "definition": "存在教室冲突的排课数 / 总排课数 × 100%",
            "formula": "冲突排课数 ÷ 总排课数 × 100%",
            "threshold": "<= 5%",
        },
    }

    def __init__(self, data_service):
        self.ds = data_service

    def _make_header_df(self, filters_desc):
        rows = [["高校教务选课排课漏斗分析报表"]]
        rows.append([f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        rows.append([""])
        rows.append(["一、筛选范围"])
        for k, v in filters_desc.items():
            rows.append([f"  {k}: {v}"])
        rows.append([""])
        rows.append(["二、指标口径说明"])
        rows.append(["指标名称", "定义", "计算公式", "参考阈值"])
        for k, v in self.INDICATOR_CALIBER.items():
            rows.append([v["name"], v["definition"], v["formula"], v["threshold"]])
        rows.append([""])
        padded = [r + [""] * (8 - len(r)) for r in rows]
        return pd.DataFrame(padded, columns=["A", "B", "C", "D", "E", "F", "G", "H"])

    def export_duration_report(self, academic_term, college, status, has_conflict,
                                start_date, end_date, output_path=None):
        filters_desc = {
            "学期": academic_term or "全部学期",
            "学院": college or "全部学院",
            "申请状态": status or "全部状态",
            "是否含冲突": "是" if has_conflict == 1 else ("否" if has_conflict == 0 else "全部"),
            "提交日期范围": f"{start_date or '不限'} 至 {end_date or '不限'}",
        }

        apps = self.ds.get_applications(
            academic_term=academic_term, college=college, status=status,
            has_conflict=has_conflict
        )
        duration_stats = self.ds.get_duration_stats(academic_term=academic_term, college=college)
        funnel = self.ds.get_funnel_data(academic_term=academic_term, college=college)
        conflicts = self.ds.get_conflicts(academic_term=academic_term)
        anomalies = self.ds.get_anomalies()

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            header_df = self._make_header_df(filters_desc)
            header_df.to_excel(writer, sheet_name="说明", index=False, header=False)

            self._write_sheet(writer, "审核时长总览", self._summary_df(apps, funnel))
            self._write_sheet(writer, "时长分布明细", duration_stats)
            self._write_sheet(writer, "申请清单(含时长)", apps)
            self._write_sheet(writer, "漏斗阶段转化", funnel)
            self._write_sheet(writer, "教室冲突清单", conflicts)
            self._write_sheet(writer, "异常清单", anomalies.head(100))
            self._write_sheet(writer, "指标口径", self._caliber_df())

            ws = writer.sheets["说明"]
            ws.set_column("A:H", 28)
            for sheet_name in writer.sheets:
                if sheet_name != "说明":
                    ws = writer.sheets[sheet_name]
                    ws.set_column(0, 50, 16)
                    for col_idx in range(50):
                        ws.set_column(col_idx, col_idx, 16)

        output.seek(0)
        if output_path:
            with open(output_path, "wb") as f:
                f.write(output.read())
            return output_path
        return output

    def _summary_df(self, apps, funnel):
        if apps.empty:
            return pd.DataFrame(columns=["指标", "数值", "说明"])
        rows = []
        rows.append(["总申请数", len(apps), "筛选条件下的申请总数"])
        if "first_review_duration" in apps.columns:
            a = apps[apps["first_review_duration"] > 0]
            rows.append(["平均初审时长(小时)", round(a["first_review_duration"].mean(), 2) if len(a) else 0, "单位：小时"])
        if "schedule_duration" in apps.columns:
            a = apps[apps["schedule_duration"] > 0]
            rows.append(["平均排课时长(小时)", round(a["schedule_duration"].mean(), 2) if len(a) else 0, "单位：小时"])
        if "final_review_duration" in apps.columns:
            a = apps[apps["final_review_duration"] > 0]
            rows.append(["平均终审时长(小时)", round(a["final_review_duration"].mean(), 2) if len(a) else 0, "单位：小时"])
        if "total_duration" in apps.columns:
            a = apps[apps["total_duration"] > 0]
            rows.append(["平均总时长(小时)", round(a["total_duration"].mean(), 2) if len(a) else 0, "单位：小时"])
        if "status" in apps.columns:
            succ = (apps["status"] == "选课成功").sum()
            submit = len(apps)
            rows.append(["整体成功率(%)", round(succ / submit * 100, 2) if submit else 0, "选课成功 / 总申请数"])
        if "has_conflict" in apps.columns:
            rows.append(["含冲突申请数", int(apps["has_conflict"].sum()), "has_conflict=1的申请"])
        rows.append(["数据导出时间", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ""])
        return pd.DataFrame(rows, columns=["指标", "数值", "说明"])

    def _caliber_df(self):
        rows = []
        for k, v in self.INDICATOR_CALIBER.items():
            rows.append([v["name"], v["definition"], v["formula"], v["threshold"]])
        return pd.DataFrame(rows, columns=["指标名称", "定义", "计算公式", "参考阈值"])

    def _write_sheet(self, writer, name, df):
        if df is None or df.empty:
            pd.DataFrame([["无数据"]]).to_excel(writer, sheet_name=name, index=False, header=False)
        else:
            df.to_excel(writer, sheet_name=name, index=False)
