from datetime import datetime
from celery import shared_task

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import (
    Course, CourseMember, ProgressRecord, Notification,
    User, UserRole, NotificationStatus
)


@celery_app.task(name="check_progress_behind")
def check_progress_behind():
    db = SessionLocal()
    try:
        course_members = db.query(CourseMember).all()
        notifications_created = 0

        admins_and_managers = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.MANAGER])
        ).all()

        for cm in course_members:
            expected = cm.expected_progress_rate
            actual = cm.actual_progress_rate
            gap = expected - actual

            if gap >= 5:
                course = db.query(Course).filter(Course.id == cm.course_id).first()
                if not course:
                    continue

                member = db.query(User).filter(User.id == cm.member_id).first()
                sender_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
                from_user_id = sender_admin.id if sender_admin else course.trainer_id

                notify_user_ids = set()
                notify_user_ids.add(course.trainer_id)
                for u in admins_and_managers:
                    notify_user_ids.add(u.id)

                for to_user_id in notify_user_ids:
                    existing = db.query(Notification).filter(
                        Notification.course_id == cm.course_id,
                        Notification.member_id == cm.member_id,
                        Notification.to_user_id == to_user_id,
                        Notification.status.in_([
                            NotificationStatus.PENDING,
                            NotificationStatus.PROCESSING
                        ])
                    ).first()

                    if existing:
                        continue

                    role_tag = "相关角色"
                    to_user = db.query(User).filter(User.id == to_user_id).first()
                    if to_user:
                        role_map = {
                            "admin": "管理员",
                            "manager": "运营经理",
                            "trainer": "教练",
                            "member": "学员",
                        }
                        role_tag = role_map.get(to_user.role, "相关角色")

                    notification = Notification(
                        course_id=cm.course_id,
                        from_user_id=from_user_id,
                        to_user_id=to_user_id,
                        member_id=cm.member_id,
                        title=f"进度落后提醒【{role_tag}】- {course.name}",
                        content=(
                            f"学员【{member.full_name if member else '未知'}】在课程【{course.name}】中"
                            f"进度落后{round(gap, 2)}%。预期进度: {expected}%, 实际进度: {actual}%。"
                            f"请及时跟进处理。"
                        ),
                        expected_progress=expected,
                        actual_progress=actual,
                        gap_hours=gap
                    )
                    db.add(notification)
                    notifications_created += 1

        db.commit()
        return {
            "message": "进度落后检测完成",
            "notifications_created": notifications_created,
            "notified_roles_count": len(admins_and_managers) + 1,
            "scanned_members": len(course_members)
        }
    finally:
        db.close()


@celery_app.task(name="update_expected_progress")
def update_expected_progress():
    db = SessionLocal()
    try:
        from datetime import date
        today = date.today()
        updated = 0

        courses = db.query(Course).filter(
            Course.start_date.isnot(None),
            Course.end_date.isnot(None)
        ).all()

        for course in courses:
            if course.start_date <= today <= course.end_date:
                total_days = (course.end_date - course.start_date).days
                if total_days > 0:
                    elapsed_days = (today - course.start_date).days
                    expected = round(min(100.0, (elapsed_days / total_days) * 100), 2)
                    for cm in course.members:
                        cm.expected_progress_rate = expected
                    updated += len(course.members)

        db.commit()
        return {
            "message": "预期进度更新完成",
            "updated_count": updated
        }
    finally:
        db.close()


@celery_app.task(name="send_notification_reminder")
def send_notification_reminder():
    db = SessionLocal()
    try:
        pending_notifications = db.query(Notification).filter(
            Notification.status == NotificationStatus.PENDING
        ).all()

        result = []
        for notif in pending_notifications:
            hours_pending = (datetime.utcnow() - notif.created_at).total_seconds() / 3600
            if hours_pending >= 24:
                result.append({
                    "notification_id": notif.id,
                    "to_user_id": notif.to_user_id,
                    "hours_pending": round(hours_pending, 1)
                })

        return {
            "message": "通知待处理提醒检查完成",
            "pending_over_24h": len(result),
            "details": result
        }
    finally:
        db.close()
