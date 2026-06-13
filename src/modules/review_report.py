"""
复盘材料生成模块：围绕消课率和耗材异常，生成可导出的复盘内容
"""
import io
import json
import logging
from datetime import datetime, date, timedelta
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any, Tuple

import polars as pl

from src.data import duckdb_manager
from src.modules.risk_engine import RiskEngine, ThresholdConfig, AlertRecord

logger = logging.getLogger(__name__)


@dataclass
class ReviewSection:
    """复盘章节"""
    title: str
    content: str
    data_summary: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)


@dataclass
class ReviewReport:
    """复盘报告"""
    report_id: str
    title: str
    store_id: Optional[str]
    period_start: date
    period_end: date
    generated_at: datetime
    sections: List[ReviewSection] = field(default_factory=list)
    overall_risk_level: str = "LOW"
    executive_summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "title": self.title,
            "store_id": self.store_id,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "generated_at": self.generated_at.isoformat(),
            "sections": [asdict(s) for s in self.sections],
            "overall_risk_level": self.overall_risk_level,
            "executive_summary": self.executive_summary,
        }

    def to_markdown(self) -> str:
        """导出为Markdown格式"""
        lines = []
        lines.append(f"# {self.title}")
        lines.append("")
        lines.append(f"**报告ID**: {self.report_id}  ")
        lines.append(f"**生成时间**: {self.generated_at.strftime('%Y-%m-%d %H:%M:%S')}  ")
        lines.append(f"**复盘周期**: {self.period_start} ~ {self.period_end}  ")
        if self.store_id:
            lines.append(f"**门店**: {self.store_id}  ")
        lines.append(f"**整体风险等级**: :{'red' if self.overall_risk_level == 'HIGH' else 'orange' if self.overall_risk_level == 'MEDIUM' else 'green'}[**{self.overall_risk_level}**]")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 📋 执行摘要")
        lines.append("")
        lines.append(self.executive_summary)
        lines.append("")

        for i, section in enumerate(self.sections, 1):
            lines.append(f"## {i}. {section.title}")
            lines.append("")
            lines.append(section.content)
            lines.append("")
            if section.data_summary:
                lines.append("### 📊 关键数据")
                lines.append("")
                lines.append("| 指标 | 数值 |")
                lines.append("|------|------|")
                for k, v in section.data_summary.items():
                    lines.append(f"| {k} | {v} |")
                lines.append("")
            if section.recommendations:
                lines.append("### 💡 改进建议")
                lines.append("")
                for j, rec in enumerate(section.recommendations, 1):
                    lines.append(f"{j}. {rec}")
                lines.append("")
        return "\n".join(lines)

    def to_csv_bytes(self) -> bytes:
        """导出关键数据为CSV格式"""
        all_rows = []
        for section in self.sections:
            for k, v in section.data_summary.items():
                all_rows.append({
                    "section": section.title,
                    "metric": k,
                    "value": str(v),
                })
        if not all_rows:
            return b""
        df = pl.DataFrame(all_rows)
        buffer = io.BytesIO()
        df.write_csv(buffer)
        return buffer.getvalue()


class ReviewReportGenerator:
    """复盘报告生成器：围绕消课率和耗材异常形成复盘材料"""

    def __init__(self, threshold_config: Optional[ThresholdConfig] = None):
        self.risk_engine = RiskEngine(threshold_config)
        self.thresholds = self.risk_engine.thresholds

    def generate_report(
        self,
        store_id: Optional[str] = None,
        period_days: int = 30,
        period_end: Optional[date] = None,
        custom_start: Optional[date] = None,
        custom_end: Optional[date] = None,
    ) -> ReviewReport:
        """生成完整复盘报告"""
        if custom_start and custom_end:
            p_start, p_end = custom_start, custom_end
        else:
            p_end = period_end or datetime.now().date()
            p_start = p_end - timedelta(days=period_days)

        report = ReviewReport(
            report_id=f"REVIEW_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            title=f"美业门店顾客回访复盘报告 ({p_start} ~ {p_end})",
            store_id=store_id,
            period_start=p_start,
            period_end=p_end,
            generated_at=datetime.now(),
        )

        consumption_section = self._build_consumption_section(store_id, p_start, p_end)
        report.sections.append(consumption_section)

        material_section = self._build_material_section(store_id, p_start, p_end)
        report.sections.append(material_section)

        review_section = self._build_review_section(store_id, p_start, p_end)
        report.sections.append(review_section)

        visit_section = self._build_visit_section(store_id, p_start, p_end)
        report.sections.append(visit_section)

        alert_section = self._build_alerts_section(store_id, p_start, p_end)
        report.sections.append(alert_section)

        report.overall_risk_level = self._calculate_overall_risk(report.sections)
        report.executive_summary = self._build_executive_summary(report)

        return report

    def _build_consumption_section(
        self, store_id: Optional[str], start: date, end: date
    ) -> ReviewSection:
        """消课率复盘章节"""
        params = []
        sql = """
            SELECT ci.customer_id, ci.course_name, ci.assigned_technician,
                   ci.total_sessions, ci.used_sessions, ci.remaining_sessions,
                   ci.purchase_date, ci.expiry_date
            FROM course_items ci
            WHERE ci.purchase_date <= ?
        """
        params.append(end)
        if store_id:
            sql += " AND ci.store_id = ?"
            params.append(store_id)
        df = duckdb_manager.query(sql, params)

        threshold = self.thresholds.low_course_consumption_rate

        summary: Dict[str, Any] = {
            "卡项总数": df.height,
            "涉及客户数": 0,
            "总购买次数": 0,
            "已消课次数": 0,
            "整体消课率": "0%",
            "消课率达标率": "0%",
            "低于阈值卡项数": 0,
            "即将到期卡项数": 0,
        }

        if df.height > 0:
            df = df.with_columns([
                pl.when(pl.col("total_sessions") > 0)
                .then(pl.col("used_sessions") / pl.col("total_sessions"))
                .otherwise(0.0).alias("consumption_rate"),
            ])
            total = int(df["total_sessions"].sum() or 0)
            used = int(df["used_sessions"].sum() or 0)
            overall_rate = (used / total * 100) if total > 0 else 0
            low_rate_count = df.filter(pl.col("consumption_rate") < threshold).height
            today = datetime.now().date()
            expiring = df.filter(
                (pl.col("expiry_date").is_not_null()) &
                (pl.col("expiry_date") >= today) &
                (pl.col("expiry_date") <= today + timedelta(days=30))
            ).height

            summary.update({
                "涉及客户数": df["customer_id"].n_unique(),
                "总购买次数": total,
                "已消课次数": used,
                "整体消课率": f"{overall_rate:.1f}%",
                "消课率达标率": f"{(1 - low_rate_count / df.height) * 100:.1f}%" if df.height > 0 else "0%",
                "低于阈值卡项数": low_rate_count,
                "即将到期卡项数": expiring,
            })

        content_parts = [
            "### 一、消课率整体分析",
            "",
            f"本周期内，门店整体消课率为 **{summary['整体消课率']}**，",
            f"阈值设定为 **{threshold * 100:.0f}%**。",
        ]
        rate_val = float(str(summary["整体消课率"]).replace("%", "")) / 100
        if rate_val >= threshold:
            content_parts.append("消课情况良好，大部分卡项处于健康状态。")
        else:
            content_parts.append(
                f"⚠️ 消课率低于阈值，有 **{summary['低于阈值卡项数']}** 张卡项消课不达标，需重点关注。"
            )
        content_parts.append("")
        if int(summary["即将到期卡项数"]) > 0:
            content_parts.append(
                f"⚠️ 另有 **{summary['即将到期卡项数']}** 张卡项将在30天内到期，需提醒客户尽快预约消课。"
            )
            content_parts.append("")

        recommendations = []
        if rate_val < threshold:
            recommendations.append("对消课率低于阈值的客户进行主动回访，了解卡项闲置原因，可赠送小项目激活消课意愿")
            recommendations.append("设计套餐升级或组合优惠，引导客户在卡项有效期内完成服务")
        if int(summary["即将到期卡项数"]) > 0:
            recommendations.append("建立卡项到期提醒机制，提前30/15/7天分阶段提醒客户预约")
        recommendations.append("技师培训：在服务中主动推荐关联项目，提升单客消课频次")
        if int(summary["低于阈值卡项数"]) > 0:
            recommendations.append("重点分析低消课率卡项的分布，排查是否存在项目体验问题或预约排期困难")

        return ReviewSection(
            title="🎯 消课率复盘",
            content="\n".join(content_parts),
            data_summary=summary,
            recommendations=recommendations,
        )

    def _build_material_section(
        self, store_id: Optional[str], start: date, end: date
    ) -> ReviewSection:
        """耗材异常复盘章节"""
        params = []
        sql = """
            SELECT mu.material_name, mu.material_code, mu.technician_name,
                   mu.usage_quantity, mu.standard_usage_quantity, mu.is_abnormal,
                   mu.anomaly_reason, mu.transaction_date, mu.service_name,
                   CASE WHEN mu.usage_ratio IS NOT NULL THEN mu.usage_ratio
                        ELSE mu.usage_quantity / NULLIF(mu.standard_usage_quantity, 0)
                   END as ratio
            FROM material_usage mu
            WHERE mu.transaction_date BETWEEN ? AND ?
        """
        params.extend([start, end])
        if store_id:
            sql += " AND mu.store_id = ?"
            params.append(store_id)
        df = duckdb_manager.query(sql, params)

        threshold = self.thresholds.high_material_usage_ratio

        summary: Dict[str, Any] = {
            "耗材使用总记录数": df.height,
            "异常记录数": 0,
            "异常率": "0%",
            "涉及异常耗材种类数": 0,
            "涉及异常技师数": 0,
            "平均超标倍数": "0x",
        }

        abnormal_df = None
        if df.height > 0:
            abnormal_df = df.filter(pl.col("is_abnormal"))
            abnormal_count = abnormal_df.height
            summary.update({
                "异常记录数": abnormal_count,
                "异常率": f"{abnormal_count / df.height * 100:.1f}%" if df.height > 0 else "0%",
                "涉及异常耗材种类数": abnormal_df["material_code"].n_unique() if abnormal_count > 0 else 0,
                "涉及异常技师数": abnormal_df["technician_name"].n_unique() if abnormal_count > 0 else 0,
            })
            if abnormal_count > 0 and "ratio" in abnormal_df.columns:
                avg_ratio = abnormal_df["ratio"].filter(pl.col("ratio").is_not_null()).mean()
                if avg_ratio:
                    summary["平均超标倍数"] = f"{avg_ratio:.1f}x"

        content_parts = [
            "### 二、耗材使用异常分析",
            "",
            f"本周期内共记录耗材使用 **{summary['耗材使用总记录数']}** 次，",
            f"检测到异常 **{summary['异常记录数']}** 次（超标阈值：{threshold}x），异常率为 **{summary['异常率']}**。",
            "",
        ]

        if abnormal_df is not None and abnormal_df.height > 0:
            top_materials = (
                abnormal_df.group_by("material_name")
                .agg(pl.count().alias("cnt"))
                .sort("cnt", descending=True)
                .head(5)
            )
            if top_materials.height > 0:
                content_parts.append("**异常次数最多的耗材 TOP 5：**")
                content_parts.append("")
                for row in top_materials.iter_rows(named=True):
                    content_parts.append(f"- {row['material_name']}: {row['cnt']}次异常")
                content_parts.append("")

            tech_issues = (
                abnormal_df.group_by("technician_name")
                .agg(pl.count().alias("cnt"))
                .sort("cnt", descending=True)
                .filter(pl.col("cnt") >= 2)
            )
            if tech_issues.height > 0:
                content_parts.append("**多次出现耗材异常的技师：**")
                content_parts.append("")
                for row in tech_issues.iter_rows(named=True):
                    tn = row["technician_name"] or "未知"
                    content_parts.append(f"- {tn}: {row['cnt']}次异常")
                content_parts.append("")

        recommendations = []
        if int(summary["异常记录数"]) > 0:
            recommendations.append("复核异常耗材的标准用量设定，评估是否需要根据实际操作调整标准")
            recommendations.append("对多次出现异常的技师进行1对1培训，核对操作流程是否规范")
            recommendations.append("排查异常耗材是否存在供应链质量问题，或是否有新技师不熟悉操作")
            if float(summary["平均超标倍数"].replace("x", "")) >= 2:
                recommendations.append("⚠️ 超标倍数严重，建议排查是否存在耗材丢失或私用情况")
        recommendations.append("建立耗材使用登记复核制度，服务完成后由店长或主管抽查确认用量")
        recommendations.append("对高价值耗材引入扫码出库机制，精确追踪每一份耗材去向")

        return ReviewSection(
            title="📦 耗材异常复盘",
            content="\n".join(content_parts),
            data_summary=summary,
            recommendations=recommendations,
        )

    def _build_review_section(
        self, store_id: Optional[str], start: date, end: date
    ) -> ReviewSection:
        """评价分析复盘章节"""
        params = []
        sql = """
            SELECT r.rating, r.tags, r.review_content, r.technician_name,
                   r.service_name, r.is_delayed, r.delay_hours, r.service_date,
                   r.customer_id
            FROM reviews r
            WHERE r.service_date BETWEEN ? AND ?
        """
        params.extend([start, end])
        if store_id:
            sql += " AND r.store_id = ?"
            params.append(store_id)
        df = duckdb_manager.query(sql, params)

        neg_threshold = self.thresholds.negative_review_ratio
        delay_threshold = self.thresholds.review_delay_hours

        summary: Dict[str, Any] = {
            "评价总数": df.height,
            "平均评分": "0.0",
            "好评率(4-5星)": "0%",
            "差评率(1-3星)": "0%",
            "延迟点评数": 0,
            "延迟点评占比": "0%",
        }

        if df.height > 0:
            avg_r = float(df["rating"].mean() or 0)
            good = df.filter(pl.col("rating") >= 4).height
            bad = df.filter(pl.col("rating") <= 3).height
            delayed = df.filter(pl.col("is_delayed")).height
            summary.update({
                "平均评分": f"{avg_r:.2f}",
                "好评率(4-5星)": f"{good / df.height * 100:.1f}%",
                "差评率(1-3星)": f"{bad / df.height * 100:.1f}%",
                "延迟点评数": delayed,
                "延迟点评占比": f"{delayed / df.height * 100:.1f}%" if df.height > 0 else "0%",
            })

        content_parts = [
            "### 三、客户评价分析",
            "",
            f"本周期共收到 **{summary['评价总数']}** 条有效评价，",
            f"平均评分 **{summary['平均评分']}** 分，好评率 **{summary['好评率(4-5星)']}**。",
            "",
        ]

        bad_rate = float(summary["差评率(1-3星)"].replace("%", "")) / 100
        if bad_rate >= neg_threshold:
            content_parts.append(
                f"⚠️ 差评率 {bad_rate * 100:.1f}% 超过阈值 {neg_threshold * 100:.0f}%，需高度重视服务质量问题。"
            )
            content_parts.append("")
        if int(summary["延迟点评数"]) > 0:
            content_parts.append(
                f"ℹ️ 有 **{summary['延迟点评数']}** 条点评为延迟点评（超过 {delay_threshold}h），"
                f"在趋势分析时请注意时间错位影响。"
            )
            content_parts.append("")

        recommendations = []
        if bad_rate >= neg_threshold:
            recommendations.append("逐条分析差评原因，归类为技术问题/服务态度/环境问题等，针对性改进")
            recommendations.append("对收到差评的技师进行单独沟通和技能提升培训")
            recommendations.append("建立差评快速响应机制，24小时内联系客户道歉并提供补偿方案")
        recommendations.append("引导客户服务后立即点评，给予小礼品或积分奖励，减少延迟点评占比")
        recommendations.append("好评内容整理为案例库，作为新员工培训素材和门店宣传素材")

        return ReviewSection(
            title="⭐ 客户评价复盘",
            content="\n".join(content_parts),
            data_summary=summary,
            recommendations=recommendations,
        )

    def _build_visit_section(
        self, store_id: Optional[str], start: date, end: date
    ) -> ReviewSection:
        """客户回访复盘章节"""
        params = []
        sql = """
            SELECT t.customer_id,
                   MAX(CAST(t.transaction_date AS DATE)) as last_visit,
                   COUNT(*) as visit_count,
                   SUM(CASE WHEN t.transaction_type IN ('CONSUMPTION','PRODUCT')
                            THEN t.amount ELSE 0 END) as total_spent
            FROM cashier_transactions t
            WHERE CAST(t.transaction_date AS DATE) <= ?
        """
        params.append(end)
        if store_id:
            sql += " AND t.store_id = ?"
            params.append(store_id)
        sql += " GROUP BY t.customer_id"
        df = duckdb_manager.query(sql, params)

        overdue_days = self.thresholds.overdue_visit_days
        today = datetime.now().date()

        summary: Dict[str, Any] = {
            "活跃客户总数": df.height,
            "逾期未回访客户数": 0,
            "逾期占比": "0%",
            "平均到店间隔(天)": "-",
            "平均客单价": "-",
        }

        if df.height > 0:
            df = df.with_columns([
                ((today - pl.col("last_visit")).dt.total_days()).alias("days_since"),
            ])
            overdue = df.filter(pl.col("days_since") > overdue_days).height
            avg_spent = df["total_spent"].mean() or 0

            period_days = (end - start).days or 1
            total_visits = df["visit_count"].sum() or 0
            avg_interval = (df.height * period_days / total_visits) if total_visits > 0 else 0

            summary.update({
                "逾期未回访客户数": overdue,
                "逾期占比": f"{overdue / df.height * 100:.1f}%",
                "平均到店间隔(天)": f"{avg_interval:.0f}" if avg_interval > 0 else "-",
                "平均客单价": f"¥{avg_spent:.0f}" if avg_spent > 0 else "-",
            })

        content_parts = [
            "### 四、客户回访追踪",
            "",
            f"截至 {today}，系统中有 **{summary['活跃客户总数']}** 位活跃客户，",
            f"其中 **{summary['逾期未回访客户数']}** 位超过 {overdue_days} 天未到店（逾期占比 {summary['逾期占比']}）。",
            "",
            f"平均到店间隔约 **{summary['平均到店间隔(天)']}** 天，平均客单价 **{summary['平均客单价']}**。",
            "",
        ]

        recommendations = []
        if int(summary["逾期未回访客户数"]) > 0:
            recommendations.append(
                f"立即启动对 {summary['逾期未回访客户数']} 位逾期客户的回访，先由专属技师微信/电话关怀，再由店长跟进"
            )
            recommendations.append("设计客户激活方案：对逾期客户推送专属优惠券或免费护理体验")
        recommendations.append("建立客户生命周期管理看板，按到店频率分为高频/中频/低频客户，差异化回访策略")
        recommendations.append("每次服务完成后由前台当场预约下次到店时间，提高客户粘性")

        return ReviewSection(
            title="📞 客户回访复盘",
            content="\n".join(content_parts),
            data_summary=summary,
            recommendations=recommendations,
        )

    def _build_alerts_section(
        self, store_id: Optional[str], start: date, end: date
    ) -> ReviewSection:
        """预警汇总章节"""
        sql = """
            SELECT alert_type, alert_level, alert_message, trigger_date, is_resolved,
                   customer_id, store_id
            FROM risk_alerts
            WHERE CAST(trigger_date AS DATE) BETWEEN ? AND ?
        """
        params = [start, end]
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        df = duckdb_manager.query(sql, params)

        summary: Dict[str, Any] = {
            "预警总数": df.height,
            "高级预警": 0,
            "中级预警": 0,
            "低级预警": 0,
            "已处理率": "0%",
        }

        if df.height > 0:
            high = df.filter(pl.col("alert_level") == "HIGH").height
            med = df.filter(pl.col("alert_level") == "MEDIUM").height
            low = df.filter(pl.col("alert_level") == "LOW").height
            resolved = df.filter(pl.col("is_resolved")).height
            summary.update({
                "高级预警": high,
                "中级预警": med,
                "低级预警": low,
                "已处理率": f"{resolved / df.height * 100:.1f}%" if df.height > 0 else "0%",
            })

        content_parts = [
            "### 五、风险预警汇总",
            "",
            f"本周期共触发 **{summary['预警总数']}** 条风险预警，",
            f"其中：:red[高级 {summary['高级预警']}] / :orange[中级 {summary['中级预警']}] / :blue[低级 {summary['低级预警']}]，",
            f"已处理率 **{summary['已处理率']}**。",
            "",
        ]

        recommendations = []
        if int(summary["高级预警"]) > 0:
            recommendations.append("优先处理所有未解决的高级预警，必要时由店长亲自跟进")
        if df.height > 0 and int(summary["已处理率"].replace("%", "")) < 50:
            recommendations.append("建立预警处理责任制，每条预警分配到人，要求24小时内响应")
        recommendations.append("每周复盘预警触发情况，持续优化预警阈值参数，降低误报率")
        recommendations.append("将高频预警类型纳入门店月度考核指标")

        return ReviewSection(
            title="🚨 风险预警汇总",
            content="\n".join(content_parts),
            data_summary=summary,
            recommendations=recommendations,
        )

    def _calculate_overall_risk(self, sections: List[ReviewSection]) -> str:
        """计算整体风险等级"""
        high_count = 0
        med_count = 0
        for s in sections:
            ds = s.data_summary
            if "低于阈值卡项数" in ds and int(ds["低于阈值卡项数"]) > 10:
                high_count += 1
            if "异常记录数" in ds and int(ds["异常记录数"]) > 20:
                high_count += 1
            if "差评率(1-3星)" in ds:
                rate = float(str(ds["差评率(1-3星)"]).replace("%", ""))
                if rate >= 15:
                    high_count += 1
                elif rate >= 10:
                    med_count += 1
            if "逾期未回访客户数" in ds and int(ds["逾期未回访客户数"]) > 50:
                med_count += 1
            if "高级预警" in ds and int(ds["高级预警"]) > 5:
                high_count += 1

        if high_count >= 2:
            return "HIGH"
        elif high_count >= 1 or med_count >= 2:
            return "MEDIUM"
        return "LOW"

    def _build_executive_summary(self, report: ReviewReport) -> str:
        """构建执行摘要"""
        parts = [
            f"本复盘报告覆盖 {report.period_start} 至 {report.period_end} 期间门店运营数据，",
            f"整体风险等级评估为 **{report.overall_risk_level}**。",
            "",
        ]

        for section in report.sections:
            if "整体消课率" in section.data_summary:
                parts.append(f"- 消课率方面：整体消课率 {section.data_summary['整体消课率']}；")
            if "异常率" in section.data_summary:
                parts.append(f"- 耗材方面：异常率 {section.data_summary['异常率']}；")
            if "平均评分" in section.data_summary:
                parts.append(f"- 评价方面：平均评分 {section.data_summary['平均评分']}分；")
            if "逾期未回访客户数" in section.data_summary:
                parts.append(f"- 回访方面：{section.data_summary['逾期未回访客户数']}位客户逾期未回访；")
            if "预警总数" in section.data_summary:
                parts.append(f"- 预警方面：共{section.data_summary['预警总数']}条预警。")

        parts.append("")
        parts.append("建议业务团队根据各章节改进建议逐项落实，下周期重点关注上述薄弱环节。")

        return "\n".join(parts)

    def get_consumer_risk_details(
        self,
        store_id: Optional[str] = None,
        min_rate: Optional[float] = None,
    ) -> pl.DataFrame:
        """获取消课风险客户明细（供展示用）"""
        threshold = min_rate or self.thresholds.low_course_consumption_rate
        sql = """
            SELECT ci.customer_id, ci.store_id, ci.course_name, ci.assigned_technician,
                   ci.total_sessions, ci.used_sessions, ci.remaining_sessions,
                   ci.purchase_date, ci.expiry_date,
                   CASE WHEN ci.total_sessions > 0
                        THEN ROUND(ci.used_sessions * 100.0 / ci.total_sessions, 1)
                        ELSE 0 END as consumption_rate_pct
            FROM course_items ci
            WHERE (ci.used_sessions * 1.0 / NULLIF(ci.total_sessions, 0)) < ?
               OR ci.total_sessions IS NOT NULL
        """
        params = [threshold]
        if store_id:
            sql += " AND ci.store_id = ?"
            params.append(store_id)
        sql += " ORDER BY consumption_rate_pct ASC, ci.expiry_date ASC"
        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            return df
        return df.filter(pl.col("consumption_rate_pct") < threshold * 100)

    def get_material_abnormal_details(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> pl.DataFrame:
        """获取耗材异常明细"""
        sql = """
            SELECT mu.material_name, mu.material_code, mu.technician_name,
                   mu.service_name, mu.usage_quantity, mu.standard_usage_quantity,
                   ROUND(
                       CASE WHEN mu.usage_ratio IS NOT NULL THEN mu.usage_ratio
                            ELSE mu.usage_quantity * 1.0 / NULLIF(mu.standard_usage_quantity, 0)
                       END, 2) as ratio,
                   mu.transaction_date, mu.order_id, mu.anomaly_reason
            FROM material_usage mu
            WHERE mu.is_abnormal = TRUE
        """
        params = []
        if store_id:
            sql += " AND mu.store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND mu.transaction_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND mu.transaction_date <= ?"
            params.append(date_to)
        sql += " ORDER BY mu.transaction_date DESC, ratio DESC"
        return duckdb_manager.query(sql, params)
