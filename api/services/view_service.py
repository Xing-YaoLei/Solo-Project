import json
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import SavedView
from api.schemas import SavedViewOut, SavedViewCreate


async def list_views(db: AsyncSession) -> List[SavedViewOut]:
    stmt = select(SavedView).order_by(SavedView.updated_at.desc())
    result = await db.execute(stmt)
    rows = result.scalars().all()

    out: List[SavedViewOut] = []
    for v in rows:
        filters = None
        try:
            parsed = json.loads(v.config)
            if isinstance(parsed, dict) and "filters" in parsed:
                filters = parsed["filters"]
        except Exception:
            pass
        out.append(SavedViewOut(
            id=v.id,
            name=v.name,
            owner="当前用户",
            is_shared=True,
            config=v.config,
            filters=filters,
            created_at=v.created_at,
            updated_at=v.updated_at,
        ))
    return out


async def create_view(db: AsyncSession, data: SavedViewCreate) -> SavedViewOut:
    now = datetime.now()
    view = SavedView(
        name=data.name,
        config=data.config,
        created_at=now,
        updated_at=now,
    )
    db.add(view)
    await db.commit()
    await db.refresh(view)

    filters = None
    try:
        parsed = json.loads(view.config)
        if isinstance(parsed, dict) and "filters" in parsed:
            filters = parsed["filters"]
    except Exception:
        pass

    return SavedViewOut(
        id=view.id,
        name=view.name,
        owner=data.owner or "当前用户",
        is_shared=data.is_shared or False,
        config=view.config,
        filters=filters,
        created_at=view.created_at,
        updated_at=view.updated_at,
    )


async def get_view(db: AsyncSession, view_id: int) -> Optional[SavedViewOut]:
    stmt = select(SavedView).where(SavedView.id == view_id)
    result = await db.execute(stmt)
    view = result.scalar_one_or_none()
    if not view:
        return None

    filters = None
    try:
        parsed = json.loads(view.config)
        if isinstance(parsed, dict) and "filters" in parsed:
            filters = parsed["filters"]
    except Exception:
        pass

    return SavedViewOut(
        id=view.id,
        name=view.name,
        owner="当前用户",
        is_shared=True,
        config=view.config,
        filters=filters,
        created_at=view.created_at,
        updated_at=view.updated_at,
    )
