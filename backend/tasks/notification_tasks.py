from celery_app import celery
import logging

logger = logging.getLogger(__name__)


@celery.task(bind=True, name="send_status_change_notification")
def send_status_change_notification(
    self,
    related_type: str,
    related_id: int,
    old_status: str,
    new_status: str,
    operator: str = None,
):
    try:
        logger.info(
            f"状态变更通知: {related_type} #{related_id} "
            f"从 {old_status} 变为 {new_status}, 操作人: {operator}"
        )
        return {"status": "success", "message": "通知发送成功"}
    except Exception as e:
        logger.error(f"发送状态变更通知失败: {e}")
        self.retry(exc=e, countdown=60, max_retries=3)


@celery.task(bind=True, name="send_exception_alert")
def send_exception_alert(
    self,
    exception_id: int,
    exception_no: str,
    title: str,
    type: str,
    affected_customers: int,
    estimated_loss: float,
):
    try:
        logger.warning(
            f"异常单告警: {exception_no} - {title}, "
            f"类型: {type}, 影响客户: {affected_customers}人, "
            f"预估损失: {estimated_loss}元"
        )
        return {"status": "success", "message": "告警发送成功"}
    except Exception as e:
        logger.error(f"发送异常告警失败: {e}")
        self.retry(exc=e, countdown=300, max_retries=3)
