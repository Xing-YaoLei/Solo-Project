import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import DATABASE_URL
from app.models import Event, TicketType, Order, Seat, VerificationTicket


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_factory() as session:
        event = Event(
            id=uuid.uuid4(),
            name="2026夏季音乐节",
            venue="城市体育馆",
            event_date=datetime(2026, 8, 15, 19, 0),
            status="ongoing",
        )
        session.add(event)
        await session.flush()

        vip = TicketType(
            id=uuid.uuid4(),
            event_id=event.id,
            name="VIP",
            price=1280.00,
            quota=100,
            sold_count=67,
            rules={"max_per_order": 4, "entry_time": "18:00", "includes": ["前排座位", "签名会"]},
            status="active",
        )
        standard = TicketType(
            id=uuid.uuid4(),
            event_id=event.id,
            name="标准票",
            price=580.00,
            quota=500,
            sold_count=342,
            rules={"max_per_order": 6, "entry_time": "19:00"},
            status="active",
        )
        student = TicketType(
            id=uuid.uuid4(),
            event_id=event.id,
            name="学生票",
            price=280.00,
            quota=200,
            sold_count=198,
            rules={"max_per_order": 1, "entry_time": "19:00", "requires_student_id": True},
            status="sold_out",
        )
        session.add_all([vip, standard, student])
        await session.flush()

        orders = []
        sources = ["online", "offline", "import", "manual"]
        names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"]
        for i in range(8):
            tt = [vip, standard, student][i % 3]
            order = Order(
                id=uuid.uuid4(),
                order_no=f"ORD-2026-{1001 + i}",
                event_id=event.id,
                ticket_type_id=tt.id,
                buyer_name=names[i],
                buyer_phone=f"1380000{1001 + i}",
                buyer_email=f"{names[i]}@example.com" if i % 2 == 0 else None,
                quantity=1 + (i % 3),
                total_amount=tt.price * (1 + (i % 3)),
                status="paid" if i < 6 else "disputed" if i == 6 else "pending_payment",
                source=sources[i % 4],
                source_reference=f"SRC-{2001 + i}",
            )
            orders.append(order)
        session.add_all(orders)
        await session.flush()

        sections = ["A区", "B区", "C区"]
        for sec_idx, section in enumerate(sections):
            for row_num in range(1, 6):
                for seat_num in range(1, 11):
                    seat = Seat(
                        id=uuid.uuid4(),
                        event_id=event.id,
                        section=section,
                        row=str(row_num),
                        number=str(seat_num),
                        seat_label=f"{section}-{row_num}排-{seat_num}号",
                        status="occupied" if (sec_idx * 50 + (row_num - 1) * 10 + seat_num) <= 100 else "available",
                        order_id=orders[(sec_idx * 50 + (row_num - 1) * 10 + seat_num - 1) % len(orders)].id if (sec_idx * 50 + (row_num - 1) * 10 + seat_num) <= 100 else None,
                        ticket_type_id=[vip, standard, student][sec_idx % 3].id,
                    )
                    session.add(seat)
        await session.flush()

        verifications = []
        statuses = ["pending", "in_progress", "disputed", "supplementing", "escalated", "closed_normal", "closed_dispute"]
        assignees = ["张核销", "李核销", "王核销"]
        for i in range(7):
            vt = VerificationTicket(
                id=uuid.uuid4(),
                ticket_no=f"VF-2026-{3001 + i}",
                event_id=event.id,
                order_id=orders[i].id,
                seat_id=None,
                ticket_type_id=orders[i].ticket_type_id,
                status=statuses[i],
                assignee=assignees[i % 3],
                source=sources[i % 4],
                source_reference=f"REF-{4001 + i}",
                verification_code=f"VC{5001 + i}AB",
                verified_at=datetime.utcnow() - timedelta(hours=2) if i >= 1 else None,
                closed_at=datetime.utcnow() - timedelta(hours=1) if i >= 5 else None,
                conclusion="正常完成" if i == 5 else "争议退款" if i == 6 else None,
                dispute_reason="观众要求退款，认为座位与票种不符" if i >= 2 and i <= 4 else None,
                supplement_note="已补充购票截图和现场照片" if i == 3 else None,
                escalation_target="运营总监" if i == 4 else None,
            )
            verifications.append(vt)
        session.add_all(verifications)

        await session.commit()
        print("Seed data inserted successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
