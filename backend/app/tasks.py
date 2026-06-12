from app.celery_app import celery_app
from app.database import SessionLocal
from app import models
from app.config import settings
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.detect_abnormal_loss")
def detect_abnormal_loss():
    db = SessionLocal()
    try:
        now = datetime.now()
        month_start = datetime(now.year, now.month, 1)
        
        stores = db.query(models.Store).filter(models.Store.is_active == True).all()
        
        for store in stores:
            if store.monthly_sales_target <= 0:
                continue
            
            month_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
                and_(
                    models.LossReport.store_id == store.id,
                    models.LossReport.loss_date >= month_start,
                    models.LossReport.status != models.LossStatus.REJECTED
                )
            ).scalar() or 0
            
            loss_rate = month_loss / store.monthly_sales_target * 100
            
            if loss_rate > settings.LOSS_RATE_THRESHOLD:
                existing_alert = db.query(models.AbnormalAlert).filter(
                    and_(
                        models.AbnormalAlert.store_id == store.id,
                        models.AbnormalAlert.alert_type == models.AbnormalType.HIGH_LOSS_RATE,
                        func.date(models.AbnormalAlert.created_at) == now.date()
                    )
                ).first()
                
                if not existing_alert:
                    alert = models.AbnormalAlert(
                        alert_type=models.AbnormalType.HIGH_LOSS_RATE,
                        alert_message=f"门店[{store.name}]本月损耗率已达{loss_rate:.2f}%，超过阈值{settings.LOSS_RATE_THRESHOLD}%",
                        threshold_value=settings.LOSS_RATE_THRESHOLD,
                        actual_value=round(loss_rate, 2),
                        store_id=store.id
                    )
                    db.add(alert)
                    logger.info(f"Abnormal loss alert created for store {store.name}: {loss_rate:.2f}%")
        
        recent_reports = db.query(models.LossReport).filter(
            models.LossReport.loss_date >= now - timedelta(days=7),
            models.LossReport.is_abnormal == False
        ).all()
        
        for report in recent_reports:
            if report.cost_amount > 5000:
                report.is_abnormal = True
                report.abnormal_type = models.AbnormalType.LARGE_AMOUNT
                
                alert = models.AbnormalAlert(
                    alert_type=models.AbnormalType.LARGE_AMOUNT,
                    alert_message=f"报损单[{report.report_no}]金额达{report.cost_amount}元，超过大额阈值",
                    threshold_value=5000,
                    actual_value=report.cost_amount,
                    loss_report_id=report.id,
                    store_id=report.store_id
                )
                db.add(alert)
        
        db.commit()
        logger.info("Abnormal loss detection completed")
        return {"status": "success", "message": "Abnormal detection completed"}
    
    except Exception as e:
        logger.error(f"Error in detect_abnormal_loss: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.generate_daily_report")
def generate_daily_report():
    db = SessionLocal()
    try:
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        day_start = datetime(yesterday.year, yesterday.month, yesterday.day)
        day_end = day_start + timedelta(days=1)
        
        stores = db.query(models.Store).filter(models.Store.is_active == True).all()
        
        for store in stores:
            day_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
                and_(
                    models.LossReport.store_id == store.id,
                    models.LossReport.loss_date >= day_start,
                    models.LossReport.loss_date < day_end,
                    models.LossReport.status != models.LossStatus.REJECTED
                )
            ).scalar() or 0
            
            day_report_count = db.query(models.LossReport).filter(
                and_(
                    models.LossReport.store_id == store.id,
                    models.LossReport.loss_date >= day_start,
                    models.LossReport.loss_date < day_end
                )
            ).count()
            
            abnormal_count = db.query(models.LossReport).filter(
                and_(
                    models.LossReport.store_id == store.id,
                    models.LossReport.loss_date >= day_start,
                    models.LossReport.loss_date < day_end,
                    models.LossReport.is_abnormal == True
                )
            ).count()
            
            day_sales = store.monthly_sales_target / 30
            loss_rate = round(day_loss / day_sales * 100, 2) if day_sales > 0 else 0
            
            stat = models.LossStatistics(
                stat_date=day_start,
                stat_type="daily",
                total_loss_amount=float(day_loss),
                total_sales=day_sales,
                loss_rate=loss_rate,
                report_count=day_report_count,
                abnormal_count=abnormal_count,
                store_id=store.id
            )
            db.add(stat)
        
        db.commit()
        logger.info("Daily report generated successfully")
        return {"status": "success", "message": "Daily report generated"}
    
    except Exception as e:
        logger.error(f"Error in generate_daily_report: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.send_notification")
def send_notification(user_id: int, message: str, notification_type: str = "info"):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            logger.info(f"Notification sent to {user.username} ({user.email}): {message}")
            return {"status": "success", "user": user.username, "message": message}
        return {"status": "error", "message": "User not found"}
    except Exception as e:
        logger.error(f"Error in send_notification: {str(e)}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.check_follow_up_due")
def check_follow_up_due():
    db = SessionLocal()
    try:
        now = datetime.now()
        
        todo_items = db.query(models.TodoItem).filter(
            and_(
                models.TodoItem.is_completed == False,
                models.TodoItem.due_date <= now
            )
        ).all()
        
        for todo in todo_items:
            if todo.loss_report and todo.loss_report.status == models.LossStatus.REVIEWED:
                todo.loss_report.status = models.LossStatus.FOLLOWING
                logger.info(f"Report {todo.loss_report.report_no} moved to FOLLOWING status due to overdue follow-up")
        
        db.commit()
        return {"status": "success", "processed": len(todo_items)}
    except Exception as e:
        logger.error(f"Error in check_follow_up_due: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.generate_monthly_report")
def generate_monthly_report(year: int, month: int):
    db = SessionLocal()
    try:
        month_start = datetime(year, month, 1)
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        
        total_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
            and_(
                models.LossReport.loss_date >= month_start,
                models.LossReport.loss_date < next_month,
                models.LossReport.status != models.LossStatus.REJECTED
            )
        ).scalar() or 0
        
        total_sales = db.query(func.sum(models.Store.monthly_sales_target)).filter(
            models.Store.is_active == True
        ).scalar() or 0
        
        overall_loss_rate = round(total_loss / total_sales * 100, 2) if total_sales > 0 else 0
        
        stat = models.LossStatistics(
            stat_date=month_start,
            stat_type="monthly",
            total_loss_amount=float(total_loss),
            total_sales=total_sales,
            loss_rate=overall_loss_rate,
            report_count=db.query(models.LossReport).filter(
                models.LossReport.loss_date >= month_start,
                models.LossReport.loss_date < next_month
            ).count(),
            abnormal_count=db.query(models.LossReport).filter(
                and_(
                    models.LossReport.loss_date >= month_start,
                    models.LossReport.loss_date < next_month,
                    models.LossReport.is_abnormal == True
                )
            ).count()
        )
        db.add(stat)
        db.commit()
        
        logger.info(f"Monthly report for {year}-{month} generated: total_loss={total_loss}, rate={overall_loss_rate}%")
        return {
            "status": "success",
            "period": f"{year}-{month:02d}",
            "total_loss": float(total_loss),
            "loss_rate": overall_loss_rate
        }
    except Exception as e:
        logger.error(f"Error in generate_monthly_report: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
