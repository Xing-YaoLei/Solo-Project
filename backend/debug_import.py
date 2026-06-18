import os, sys, traceback
os.environ.setdefault("PYTHONPATH", os.path.dirname(os.path.abspath(__file__)))

print("逐步导入测试:")
print("1. 导入 config...")
from app.core.config import settings
print("   OK")
print(f"   DATABASE_URL = {settings.SQLALCHEMY_DATABASE_URL}")

print("2. 导入 database...")
try:
    from app.core.database import engine, Base, SessionLocal
    print("   OK")
except Exception as e:
    print(f"   FAIL: {e}")
    traceback.print_exc()
    sys.exit(1)
