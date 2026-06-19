from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from ..database import get_db
from ..models import TimeSlot, CapacityRule, User
from ..schemas import (
    TimeSlotCreate, TimeSlotUpdate, TimeSlotResponse,
    CapacityRuleCreate, CapacityRuleUpdate, CapacityRuleResponse
)

router = APIRouter(prefix="/api/time-slots", tags=["时段管理"])


@router.get("", response_model=List[TimeSlotResponse])
def get_time_slots(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TimeSlot)
    if start_date:
        query = query.filter(TimeSlot.date >= start_date)
    if end_date:
        query = query.filter(TimeSlot.date <= end_date)
    if is_active is not None:
        query = query.filter(TimeSlot.is_active == is_active)
    return query.order_by(TimeSlot.date, TimeSlot.start_time).all()


@router.get("/{slot_id}", response_model=TimeSlotResponse)
def get_time_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="时段不存在")
    return slot


@router.post("", response_model=TimeSlotResponse)
def create_time_slot(slot: TimeSlotCreate, db: Session = Depends(get_db)):
    if slot.remaining_capacity is None:
        slot.remaining_capacity = slot.capacity
    db_slot = TimeSlot(**slot.model_dump())
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot


@router.put("/{slot_id}", response_model=TimeSlotResponse)
def update_time_slot(slot_id: int, slot: TimeSlotUpdate, db: Session = Depends(get_db)):
    db_slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="时段不存在")
    update_data = slot.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_slot, key, value)
    db.commit()
    db.refresh(db_slot)
    return db_slot


@router.delete("/{slot_id}")
def delete_time_slot(slot_id: int, db: Session = Depends(get_db)):
    db_slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="时段不存在")
    db.delete(db_slot)
    db.commit()
    return {"message": "删除成功"}


@router.get("/{slot_id}/capacity-rules", response_model=List[CapacityRuleResponse])
def get_slot_capacity_rules(slot_id: int, db: Session = Depends(get_db)):
    return db.query(CapacityRule).filter(
        CapacityRule.time_slot_id == slot_id,
        CapacityRule.is_active == True
    ).order_by(CapacityRule.priority.desc()).all()


@router.post("/{slot_id}/capacity-rules", response_model=CapacityRuleResponse)
def create_capacity_rule(slot_id: int, rule: CapacityRuleCreate, db: Session = Depends(get_db)):
    db_rule = CapacityRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.put("/capacity-rules/{rule_id}", response_model=CapacityRuleResponse)
def update_capacity_rule(rule_id: int, rule: CapacityRuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(CapacityRule).filter(CapacityRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="容量规则不存在")
    update_data = rule.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rule, key, value)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.delete("/capacity-rules/{rule_id}")
def delete_capacity_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(CapacityRule).filter(CapacityRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="容量规则不存在")
    db.delete(db_rule)
    db.commit()
    return {"message": "删除成功"}
