import logging
from datetime import datetime, timedelta
from sqlalchemy import func

from ..celery_app import celery_app
from ..database import SessionLocal
from ..models import CommunityTicket, MemberProfile, PlagiarismCase
from ..enums import TicketStatus, PlagiarismStatus

logger = logging.getLogger(__name__)


@celery_app.task(name="refresh_summary_cache")
def refresh_summary_cache():
    db = SessionLocal()
    try:
        total_members = db.query(func.count(MemberProfile.id)).scalar() or 0
        total_tickets = db.query(func.count(CommunityTicket.id)).scalar() or 0
        total_plagiarism_cases = db.query(func.count(PlagiarismCase.id)).scalar() or 0

        pending_tickets = db.query(func.count(CommunityTicket.id)).filter(
            CommunityTicket.status.in_([
                TicketStatus.PENDING_REVIEW,
                TicketStatus.REVIEWING,
                TicketStatus.SUPPLEMENT_NEEDED,
                TicketStatus.ESCALATED_REVIEW,
                TicketStatus.PROCESSING,
            ])
        ).scalar() or 0

        active_plagiarism = db.query(func.count(PlagiarismCase.id)).filter(
            PlagiarismCase.status.in_([
                PlagiarismStatus.REPORTED,
                PlagiarismStatus.INVESTIGATING,
                PlagiarismStatus.CONFIRMED,
                PlagiarismStatus.APPEALED,
            ])
        ).scalar() or 0

        logger.info(
            "[refresh_summary_cache] 汇总统计 - 会员总数: %d, 单据总数: %d, 待处理单据: %d, "
            "抄袭案例总数: %d, 进行中抄袭案例: %d",
            total_members, total_tickets, pending_tickets,
            total_plagiarism_cases, active_plagiarism
        )
        return {
            "total_members": total_members,
            "total_tickets": total_tickets,
            "pending_tickets": pending_tickets,
            "total_plagiarism_cases": total_plagiarism_cases,
            "active_plagiarism_cases": active_plagiarism,
        }
    finally:
        db.close()


@celery_app.task(name="auto_close_completed_tickets")
def auto_close_completed_tickets():
    db = SessionLocal()
    try:
        threshold_date = datetime.utcnow() - timedelta(days=30)
        tickets_to_close = db.query(CommunityTicket).filter(
            CommunityTicket.status == TicketStatus.COMPLETED,
            CommunityTicket.updated_at <= threshold_date
        ).all()

        closed_count = 0
        for ticket in tickets_to_close:
            ticket.status = TicketStatus.CLOSED
            ticket.closed_at = datetime.utcnow()
            ticket.close_remark = f"系统自动关闭：单据已完成超过30天（原更新时间：{ticket.updated_at.strftime('%Y-%m-%d %H:%M:%S')}）"
            closed_count += 1

        db.commit()
        logger.info(
            "[auto_close_completed_tickets] 自动关闭完成超过30天的单据，共处理 %d 条",
            closed_count
        )
        return {"closed_count": closed_count}
    finally:
        db.close()


@celery_app.task(name="check_supplement_timeout")
def check_supplement_timeout():
    db = SessionLocal()
    try:
        threshold_date = datetime.utcnow() - timedelta(days=7)
        timeout_tickets = db.query(CommunityTicket).filter(
            CommunityTicket.status == TicketStatus.SUPPLEMENT_NEEDED,
            CommunityTicket.updated_at <= threshold_date
        ).all()

        timeout_count = len(timeout_tickets)
        for ticket in timeout_tickets:
            logger.warning(
                "[check_supplement_timeout] 单据 %s (ID:%d) 需要补资料已超过7天，"
                "最后更新时间：%s，请跟进提醒会员提交补充资料",
                ticket.ticket_no, ticket.id,
                ticket.updated_at.strftime("%Y-%m-%d %H:%M:%S")
            )

        logger.info(
            "[check_supplement_timeout] 检查完成，共有 %d 条单据补资料超时",
            timeout_count
        )
        return {"timeout_count": timeout_count}
    finally:
        db.close()


@celery_app.task(name="send_plagiarism_notification")
def send_plagiarism_notification(case_id: int, case_no: str):
    db = SessionLocal()
    try:
        case = db.query(PlagiarismCase).filter(PlagiarismCase.id == case_id).first()
        if not case:
            logger.warning(
                "[send_plagiarism_notification] 抄袭案例不存在，case_id: %d, case_no: %s",
                case_id, case_no
            )
            return {"success": False, "reason": "case_not_found"}

        member = db.query(MemberProfile).filter(MemberProfile.id == case.member_id).first()
        member_name = member.name if member else "未知会员"
        member_phone = member.phone if member else "无手机号"

        logger.info(
            "[send_plagiarism_notification] 发送抄袭案例通知 - 案例编号: %s, "
            "会员: %s (手机号: %s), 作业名称: %s, 状态: %s, 严重程度: %s",
            case_no, member_name, member_phone,
            case.assignment_name, case.status.value, case.severity.value
        )
        logger.info(
            "[send_plagiarism_notification] 通知详情 - 相似度: %s, 课程: %s, "
            "描述摘要: %s",
            f"{case.similarity_score}%" if case.similarity_score else "未检测",
            case.course_name or "未指定",
            (case.description[:50] + "...") if case.description and len(case.description) > 50 else (case.description or "无")
        )
        return {
            "success": True,
            "case_no": case_no,
            "member_name": member_name,
            "status": case.status.value,
        }
    finally:
        db.close()
