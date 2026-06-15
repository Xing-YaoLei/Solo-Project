from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from datetime import date, timedelta
from ..models import ReviewMaterial, Course, Region, AlertThreshold, NoteTask
from .funnel_service import FunnelService
from .alert_service import AlertService
import uuid


class ReviewService:
    """复盘材料服务 - 生成、管理复盘报告"""

    def __init__(self, db: Session):
        self.db = db
        self.funnel_service = FunnelService(db)
        self.alert_service = AlertService(db)

    def generate_review_material(
        self,
        type: str = "weekly",
        course_id: Optional[int] = None,
        region_id: Optional[int] = None,
        created_by: str = "system"
    ) -> ReviewMaterial:
        """生成复盘材料 - 围绕完成率形成复盘报告"""
        period_start, period_end = self._calculate_period(type)

        material_no = f"RM{date.today().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"

        funnel_data = self.funnel_service.get_funnel_overview(
            course_id=course_id,
            region_id=region_id,
            date_from=period_start,
            date_to=period_end
        )

        alerts = self.alert_service.check_alerts(course_id=course_id, region_id=region_id)
        key_issues = self._analyze_key_issues(funnel_data, alerts)
        improvements = self._generate_improvements(key_issues)

        charts_data = self._collect_charts_data(course_id, region_id, period_start, period_end)

        title_parts = []
        if course_id:
            course = self.db.query(Course).filter(Course.id == course_id).first()
            if course:
                title_parts.append(course.name)
        if region_id:
            region = self.db.query(Region).filter(Region.id == region_id).first()
            if region:
                title_parts.append(region.name)

        type_names = {
            "weekly": "周度",
            "monthly": "月度",
            "course": "课程",
            "region": "区域"
        }
        title = f"{''.join(title_parts)}{type_names.get(type, '')}教材发放复盘"

        review = ReviewMaterial(
            material_no=material_no,
            title=title,
            type=type,
            period_start=period_start,
            period_end=period_end,
            course_id=course_id,
            region_id=region_id,
            completion_rate=funnel_data['completion_rate'],
            alert_count=len(alerts),
            summary=self._generate_summary(funnel_data, alerts, type),
            key_issues=key_issues,
            improvements=improvements,
            charts_data=charts_data,
            status="draft",
            created_by=created_by
        )

        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_review_materials(
        self,
        type: Optional[str] = None,
        status: Optional[str] = None,
        course_id: Optional[int] = None
    ) -> List[ReviewMaterial]:
        """获取复盘材料列表"""
        query = self.db.query(ReviewMaterial)
        if type:
            query = query.filter(ReviewMaterial.type == type)
        if status:
            query = query.filter(ReviewMaterial.status == status)
        if course_id:
            query = query.filter(ReviewMaterial.course_id == course_id)
        return query.order_by(ReviewMaterial.created_at.desc()).all()

    def get_review_detail(self, review_id: int) -> Optional[ReviewMaterial]:
        """获取复盘材料详情"""
        return self.db.query(ReviewMaterial).filter(ReviewMaterial.id == review_id).first()

    def update_review_status(self, review_id: int, status: str) -> Optional[ReviewMaterial]:
        """更新复盘材料状态"""
        review = self.db.query(ReviewMaterial).filter(ReviewMaterial.id == review_id).first()
        if not review:
            return None
        review.status = status
        self.db.commit()
        self.db.refresh(review)
        return review

    def _calculate_period(self, type: str) -> tuple:
        """计算统计周期"""
        today = date.today()
        if type == "weekly":
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
        elif type == "monthly":
            start = today.replace(day=1)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1) - timedelta(days=1)
            else:
                end = start.replace(month=start.month + 1) - timedelta(days=1)
        else:
            start = today - timedelta(days=30)
            end = today
        return start, end

    def _analyze_key_issues(
        self,
        funnel_data: Dict[str, Any],
        alerts: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """分析关键问题"""
        issues = []

        if funnel_data['completion_rate'] < 80:
            issues.append({
                "type": "completion",
                "severity": "high" if funnel_data['completion_rate'] < 60 else "medium",
                "title": "完成率偏低",
                "description": f"当前完成率为 {funnel_data['completion_rate']}%，低于80%的基准线",
                "data": {"actual": funnel_data['completion_rate'], "target": 80}
            })

        if funnel_data.get('returned', 0) > 0:
            issues.append({
                "type": "return",
                "severity": "medium",
                "title": "存在退回情况",
                "description": f"共有 {funnel_data['returned']} 本教材被退回",
                "data": {"count": funnel_data['returned']}
            })

        for alert in alerts:
            issues.append({
                "type": "alert",
                "severity": alert['level'],
                "title": alert['threshold_name'],
                "description": f"实际值 {alert['actual_value']}，阈值 {alert['threshold_value']}",
                "data": alert
            })

        return issues

    def _generate_improvements(self, issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """生成改进措施建议"""
        improvements = []
        for issue in issues:
            if issue['type'] == 'completion':
                improvements.append({
                    "issue": issue['title'],
                    "suggestion": "建议：1. 排查未发放原因；2. 优化发放渠道；3. 增加提醒频次",
                    "owner": "教务组",
                    "deadline_days": 7
                })
            elif issue['type'] == 'return':
                improvements.append({
                    "issue": issue['title'],
                    "suggestion": "建议：1. 分析退回原因；2. 优化地址信息收集；3. 加强发放前确认",
                    "owner": "物流组",
                    "deadline_days": 5
                })
            elif issue['type'] == 'alert':
                improvements.append({
                    "issue": issue['title'],
                    "suggestion": "建议：立即处理该预警，避免影响扩大",
                    "owner": "运营组",
                    "deadline_days": 3
                })
        return improvements

    def _collect_charts_data(
        self,
        course_id: Optional[int],
        region_id: Optional[int],
        period_start: date,
        period_end: date
    ) -> Dict[str, Any]:
        """收集图表数据快照"""
        trend = self.funnel_service.get_funnel_trend(
            course_id=course_id,
            region_id=region_id,
            days=30
        )

        chapter_funnel = []
        if course_id:
            chapter_funnel = self.funnel_service.get_chapter_funnel(
                course_id=course_id,
                region_id=region_id
            )

        return {
            "trend": trend,
            "chapter_funnel": chapter_funnel
        }

    def _generate_summary(
        self,
        funnel_data: Dict[str, Any],
        alerts: List[Dict[str, Any]],
        type: str
    ) -> str:
        """生成复盘摘要"""
        summary_parts = [
            f"本期共报名 {funnel_data['total_enrolled']} 人，",
            f"已发放 {funnel_data['distributed']} 人，",
            f"已签收 {funnel_data['received']} 人，",
            f"完成率 {funnel_data['completion_rate']}%。"
        ]
        if alerts:
            summary_parts.append(f"触发预警 {len(alerts)} 个，需重点关注。")
        else:
            summary_parts.append("无预警触发，整体运行平稳。")

        return "".join(summary_parts)


def get_review_service(db: Session) -> ReviewService:
    return ReviewService(db)
