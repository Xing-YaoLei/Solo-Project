import asyncio
import uuid
from datetime import date, datetime
from decimal import Decimal

from app.database import async_session, engine
from app.models import (
    Base,
    CompensationType,
    Order,
    SubsidyRule,
    User,
)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        users = [
            User(id=uuid.UUID("a0000000-0000-0000-0000-000000000001"), name="张管理", phone="13800000001", role="admin", city_code="4401", is_active=True),
            User(id=uuid.UUID("a0000000-0000-0000-0000-000000000002"), name="李运营", phone="13800000002", role="operator", city_code="4401", is_active=True),
            User(id=uuid.UUID("a0000000-0000-0000-0000-000000000003"), name="王财务", phone="13800000003", role="finance", city_code="4401", is_active=True),
            User(id=uuid.UUID("a0000000-0000-0000-0000-000000000004"), name="赵骑手", phone="13800000004", role="rider", city_code="4401", is_active=True),
            User(id=uuid.UUID("a0000000-0000-0000-0000-000000000005"), name="刘骑手", phone="13800000005", role="rider", city_code="4403", is_active=True),
        ]
        session.add_all(users)

        comp_types = [
            CompensationType(id=uuid.UUID("b0000000-0000-0000-0000-000000000001"), name="超时补偿", code="timeout", description="配送超时补偿", default_amount=Decimal("10.00"), is_active=True),
            CompensationType(id=uuid.UUID("b0000000-0000-0000-0000-000000000002"), name="货物损坏", code="damage", description="货物损坏赔偿", default_amount=Decimal("50.00"), is_active=True),
            CompensationType(id=uuid.UUID("b0000000-0000-0000-0000-000000000003"), name="路线异常", code="route_abnormal", description="路线异常额外补贴", default_amount=Decimal("15.00"), is_active=True),
            CompensationType(id=uuid.UUID("b0000000-0000-0000-0000-000000000004"), name="天气补贴", code="weather", description="恶劣天气额外补贴", default_amount=Decimal("20.00"), is_active=True),
        ]
        session.add_all(comp_types)

        rules = [
            SubsidyRule(
                id=uuid.UUID("c0000000-0000-0000-0000-000000000001"),
                name="广州市普通路线补贴",
                city_code="4401",
                route_type="normal",
                min_distance=Decimal("3.00"),
                max_distance=Decimal("10.00"),
                subsidy_per_km=Decimal("1.50"),
                max_subsidy=Decimal("15.00"),
                status="approved",
                effective_start=date(2025, 1, 1),
                effective_end=date(2025, 12, 31),
                created_by=uuid.UUID("a0000000-0000-0000-0000-000000000001"),
            ),
            SubsidyRule(
                id=uuid.UUID("c0000000-0000-0000-0000-000000000002"),
                name="广州市跨城路线补贴",
                city_code="4401",
                route_type="cross_city",
                min_distance=Decimal("10.00"),
                max_distance=Decimal("50.00"),
                subsidy_per_km=Decimal("2.50"),
                max_subsidy=Decimal("80.00"),
                status="approved",
                effective_start=date(2025, 1, 1),
                effective_end=date(2025, 12, 31),
                created_by=uuid.UUID("a0000000-0000-0000-0000-000000000001"),
            ),
            SubsidyRule(
                id=uuid.UUID("c0000000-0000-0000-0000-000000000003"),
                name="深圳市偏远路线补贴",
                city_code="4403",
                route_type="remote",
                min_distance=Decimal("5.00"),
                max_distance=Decimal("30.00"),
                subsidy_per_km=Decimal("2.00"),
                max_subsidy=Decimal("40.00"),
                status="approved",
                effective_start=date(2025, 1, 1),
                effective_end=date(2025, 12, 31),
                created_by=uuid.UUID("a0000000-0000-0000-0000-000000000001"),
            ),
            SubsidyRule(
                id=uuid.UUID("c0000000-0000-0000-0000-000000000004"),
                name="恶劣天气补贴",
                city_code="4401",
                route_type="bad_weather",
                min_distance=Decimal("0.00"),
                max_distance=Decimal("100.00"),
                subsidy_per_km=Decimal("3.00"),
                max_subsidy=Decimal("200.00"),
                status="draft",
                effective_start=date(2025, 6, 1),
                effective_end=date(2025, 9, 30),
                created_by=uuid.UUID("a0000000-0000-0000-0000-000000000002"),
            ),
        ]
        session.add_all(rules)

        orders = [
            Order(
                id=uuid.UUID("d0000000-0000-0000-0000-000000000001"),
                order_no="ORD-20250101-001",
                rider_id=uuid.UUID("a0000000-0000-0000-0000-000000000004"),
                pickup_address="广州市天河区体育西路",
                delivery_address="广州市白云区机场路",
                pickup_lat=Decimal("23.1365000"),
                pickup_lng=Decimal("113.3250000"),
                delivery_lat=Decimal("23.1833000"),
                delivery_lng=Decimal("113.2667000"),
                distance=Decimal("8.50"),
                route_type="normal",
                city_code="4401",
                order_amount=Decimal("25.00"),
                subsidy_amount=Decimal("12.75"),
                status="completed",
                completed_at=datetime(2025, 1, 15, 10, 30),
            ),
            Order(
                id=uuid.UUID("d0000000-0000-0000-0000-000000000002"),
                order_no="ORD-20250101-002",
                rider_id=uuid.UUID("a0000000-0000-0000-0000-000000000004"),
                pickup_address="广州市天河区珠江新城",
                delivery_address="佛山市禅城区祖庙路",
                pickup_lat=Decimal("23.1200000"),
                pickup_lng=Decimal("113.3200000"),
                delivery_lat=Decimal("23.0200000"),
                delivery_lng=Decimal("113.1200000"),
                distance=Decimal("25.00"),
                route_type="cross_city",
                city_code="4401",
                order_amount=Decimal("45.00"),
                subsidy_amount=Decimal("62.50"),
                status="completed",
                completed_at=datetime(2025, 1, 15, 14, 0),
            ),
            Order(
                id=uuid.UUID("d0000000-0000-0000-0000-000000000003"),
                order_no="ORD-20250102-001",
                rider_id=uuid.UUID("a0000000-0000-0000-0000-000000000005"),
                pickup_address="深圳市南山区科技园",
                delivery_address="深圳市大鹏新区",
                pickup_lat=Decimal("22.5400000"),
                pickup_lng=Decimal("113.9500000"),
                delivery_lat=Decimal("22.5900000"),
                delivery_lng=Decimal("114.4700000"),
                distance=Decimal("18.00"),
                route_type="remote",
                city_code="4403",
                order_amount=Decimal("35.00"),
                subsidy_amount=Decimal("36.00"),
                status="completed",
                completed_at=datetime(2025, 1, 16, 9, 0),
            ),
            Order(
                id=uuid.UUID("d0000000-0000-0000-0000-000000000004"),
                order_no="ORD-20250103-001",
                rider_id=uuid.UUID("a0000000-0000-0000-0000-000000000004"),
                pickup_address="广州市番禺区市桥",
                delivery_address="广州市南沙区",
                pickup_lat=Decimal("22.9400000"),
                pickup_lng=Decimal("113.3600000"),
                delivery_lat=Decimal("22.7900000"),
                delivery_lng=Decimal("113.5300000"),
                distance=Decimal("30.00"),
                route_type="normal",
                city_code="4401",
                order_amount=Decimal("40.00"),
                subsidy_amount=Decimal("15.00"),
                status="completed",
                completed_at=datetime(2025, 1, 17, 16, 30),
            ),
        ]
        session.add_all(orders)

        await session.commit()
        print("Seed data inserted successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
