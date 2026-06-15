import asyncio
from app.database import AsyncSessionLocal
from app.models import Notification, Student
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Notification).options(selectinload(Notification.recipient)).limit(1))
        notif = result.scalar_one_or_none()
        if notif:
            d = notif.__dict__
            print('Has _sa_instance_state:', '_sa_instance_state' in d)
            print('Keys:', sorted(d.keys()))

        result2 = await db.execute(select(Student).options(selectinload(Student.advisor)).limit(1))
        stu = result2.scalar_one_or_none()
        if stu:
            d2 = stu.__dict__
            print('Student has _sa_instance_state:', '_sa_instance_state' in d2)

asyncio.run(test())
