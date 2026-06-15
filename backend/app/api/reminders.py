from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from ..core.database import get_db
from ..models import ReminderRule

router = APIRouter(prefix="/api/reminders", tags=["提醒规则"])


class ReminderRuleCreate(BaseModel):
    name: str
    type: str
    trigger_days: int
    template: str
    channel: str = "sms"


@router.get("/rules")
def get_reminder_rules(
    type: Optional[str] = Query(None, description="规则类型"),
    is_active: bool = Query(True, description="是否启用"),
    db: Session = Depends(get_db)
):
    """获取提醒规则列表 - 图表区：提醒规则独立展示"""
    query = db.query(ReminderRule)
    if type:
        query = query.filter(ReminderRule.type == type)
    if is_active is not None:
        query = query.filter(ReminderRule.is_active == is_active)
    rules = query.all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "trigger_days": r.trigger_days,
            "template": r.template,
            "channel": r.channel,
            "is_active": r.is_active
        }
        for r in rules
    ]


@router.post("/rules")
def create_reminder_rule(
    data: ReminderRuleCreate,
    db: Session = Depends(get_db)
):
    """创建提醒规则"""
    rule = ReminderRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"id": rule.id, "name": rule.name}


@router.put("/rules/{rule_id}")
def update_reminder_rule(
    rule_id: int,
    data: ReminderRuleCreate,
    db: Session = Depends(get_db)
):
    """更新提醒规则"""
    rule = db.query(ReminderRule).filter(ReminderRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    for key, value in data.dict().items():
        setattr(rule, key, value)
    db.commit()
    return {"message": "更新成功"}


@router.delete("/rules/{rule_id}")
def delete_reminder_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """删除提醒规则"""
    rule = db.query(ReminderRule).filter(ReminderRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    db.delete(rule)
    db.commit()
    return {"message": "删除成功"}
