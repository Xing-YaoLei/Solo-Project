from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..models import User, UserRole, DispatchRule
from ..schemas import DispatchRuleCreate, DispatchRuleUpdate


def get_dispatch_rule(db: Session, rule_id: int) -> Optional[DispatchRule]:
    return db.query(DispatchRule).filter(DispatchRule.id == rule_id).first()


def get_dispatch_rules(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    is_active: Optional[bool] = None,
    category: Optional[str] = None,
) -> tuple[List[DispatchRule], int]:
    query = db.query(DispatchRule)

    if is_active is not None:
        query = query.filter(DispatchRule.is_active == is_active)
    if category:
        query = query.filter(DispatchRule.category == category)

    total = query.count()
    rules = query.order_by(DispatchRule.created_at.desc()).offset(skip).limit(limit).all()
    return rules, total


def create_dispatch_rule(db: Session, rule_in: DispatchRuleCreate) -> DispatchRule:
    db_rule = DispatchRule(**rule_in.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def update_dispatch_rule(db: Session, rule_id: int, rule_in: DispatchRuleUpdate) -> Optional[DispatchRule]:
    db_rule = get_dispatch_rule(db, rule_id)
    if not db_rule:
        return None

    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)

    db.commit()
    db.refresh(db_rule)
    return db_rule


def delete_dispatch_rule(db: Session, rule_id: int) -> bool:
    db_rule = get_dispatch_rule(db, rule_id)
    if not db_rule:
        return False

    db.delete(db_rule)
    db.commit()
    return True
