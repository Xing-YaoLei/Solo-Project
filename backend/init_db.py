import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.core.auth import hash_password
from app import models  # noqa: F401
from app.models import User, UserRole, Station, StationStatus


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        existing_users = db.query(User).count()
        if existing_users == 0:
            print("Seeding initial data...")
            admin = User(
                username="admin",
                full_name="系统管理员",
                role=UserRole.ADMIN,
                hashed_password=hash_password("admin123"),
            )
            tech = User(
                username="tech",
                full_name="张技师",
                role=UserRole.TECHNICIAN,
                hashed_password=hash_password("tech123"),
            )
            parts_user = User(
                username="parts",
                full_name="李库管",
                role=UserRole.PARTS,
                hashed_password=hash_password("parts123"),
            )
            db.add_all([admin, tech, parts_user])

            for i in range(1, 7):
                station = Station(
                    name=f"工位 {i:02d}",
                    type="机电维修" if i <= 4 else "钣金喷漆",
                    status=StationStatus.IDLE,
                )
                db.add(station)

            db.commit()
            print("Seeded 3 users (admin/tech/parts) and 6 stations.")
            print("Default passwords: admin123 / tech123 / parts123")
        else:
            print(f"Database already has {existing_users} users, skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
