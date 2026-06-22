import logging
from typing import Any, Dict, Optional

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="notify_status_change")
def notify_status_change_task(
    entity_type: str,
    entity_id: int,
    old_status: Optional[str],
    new_status: str,
    changed_by: int,
    changed_by_name: Optional[str] = None,
    recipients: Optional[list] = None,
    extra_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    try:
        message = (
            f"【状态变更通知】\n"
            f"实体类型: {entity_type}\n"
            f"实体ID: {entity_id}\n"
            f"状态变更: {old_status or '无'} → {new_status}\n"
            f"操作人: {changed_by_name or f'用户{changed_by}'}"
        )
        if extra_data:
            for key, value in extra_data.items():
                message += f"\n{key}: {value}"

        logger.info(f"发送状态变更通知: {message}")

        if recipients:
            for recipient in recipients:
                logger.info(f"通知接收人: {recipient}")

        return {
            "status": "success",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "message_sent": True,
            "recipients_count": len(recipients) if recipients else 0
        }
    except Exception as e:
        logger.error(f"发送状态变更通知失败: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "entity_type": entity_type,
            "entity_id": entity_id
        }


@celery_app.task(name="notify_exception_created")
def notify_exception_created_task(
    exception_id: int,
    exception_type: str,
    sampling_id: int,
    responsible_person: Optional[str] = None,
    root_cause: Optional[str] = None
) -> Dict[str, Any]:
    try:
        type_map = {
            "evidence_missing": "证据缺失",
            "non_compliance": "不合规",
            "other": "其他"
        }
        type_display = type_map.get(exception_type, exception_type)

        message = (
            f"【异常单创建通知】\n"
            f"异常单ID: {exception_id}\n"
            f"异常类型: {type_display}\n"
            f"关联抽样ID: {sampling_id}\n"
            f"负责人: {responsible_person or '未指定'}\n"
            f"原因: {root_cause or '请查看详情'}"
        )

        logger.info(f"发送异常单创建通知: {message}")

        return {
            "status": "success",
            "exception_id": exception_id,
            "message_sent": True
        }
    except Exception as e:
        logger.error(f"发送异常单创建通知失败: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "exception_id": exception_id
        }


@celery_app.task(name="notify_rectification_deadline")
def notify_rectification_deadline_task(
    rectification_id: int,
    title: str,
    deadline: str,
    responsible_person: Optional[str] = None,
    vendor_name: Optional[str] = None,
    days_left: int = 0
) -> Dict[str, Any]:
    try:
        if days_left <= 0:
            urgency = "【已逾期】"
        elif days_left <= 3:
            urgency = "【紧急 - 3天内到期】"
        elif days_left <= 7:
            urgency = "【提醒 - 一周内到期】"
        else:
            urgency = "【提醒】"

        message = (
            f"{urgency}整改计划截止日期提醒\n"
            f"计划ID: {rectification_id}\n"
            f"标题: {title}\n"
            f"截止日期: {deadline}\n"
            f"剩余天数: {days_left}天\n"
            f"负责人: {responsible_person or '未指定'}\n"
            f"供应商: {vendor_name or '未关联'}"
        )

        logger.info(f"发送整改截止日期提醒: {message}")

        return {
            "status": "success",
            "rectification_id": rectification_id,
            "days_left": days_left,
            "message_sent": True
        }
    except Exception as e:
        logger.error(f"发送整改截止日期提醒失败: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "rectification_id": rectification_id
        }
