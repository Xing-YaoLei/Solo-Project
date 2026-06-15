from sqlalchemy.orm import Session
from typing import List

from app.models.metrics import CaliberVersion
from app.schemas.caliber import CaliberVersionCreate, CaliberVersion as CaliberVersionSchema


class CaliberService:
    def __init__(self, db: Session):
        self.db = db

    def get_versions(self) -> List[CaliberVersionSchema]:
        versions = self.db.query(CaliberVersion).order_by(
            CaliberVersion.effective_date.desc()
        ).all()
        return [
            CaliberVersionSchema(
                version=v.version,
                effectiveDate=v.effective_date,
                formula=v.formula,
                description=v.description,
                changeReason=v.change_reason,
                isActive=v.is_active,
                createdAt=v.created_at
            )
            for v in versions
        ]

    def create_version(self, data: CaliberVersionCreate) -> CaliberVersionSchema:
        existing = self.db.query(CaliberVersion).filter(
            CaliberVersion.version == data.version
        ).first()
        if existing:
            raise ValueError(f"版本号 {data.version} 已存在")

        version = CaliberVersion(
            version=data.version,
            effective_date=data.effectiveDate,
            formula=data.formula,
            description=data.description,
            change_reason=data.changeReason,
            is_active=False
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)

        return CaliberVersionSchema(
            version=version.version,
            effectiveDate=version.effective_date,
            formula=version.formula,
            description=version.description,
            changeReason=version.change_reason,
            isActive=version.is_active,
            createdAt=version.created_at
        )

    def activate_version(self, version: str) -> CaliberVersionSchema:
        self.db.query(CaliberVersion).update(
            {CaliberVersion.is_active: False}
        )

        target = self.db.query(CaliberVersion).filter(
            CaliberVersion.version == version
        ).first()
        if not target:
            raise ValueError(f"版本 {version} 不存在")

        target.is_active = True
        self.db.commit()
        self.db.refresh(target)

        return CaliberVersionSchema(
            version=target.version,
            effectiveDate=target.effective_date,
            formula=target.formula,
            description=target.description,
            changeReason=target.change_reason,
            isActive=target.is_active,
            createdAt=target.created_at
        )
