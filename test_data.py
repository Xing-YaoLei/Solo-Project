import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import date, timedelta
from src.data.database import DatabaseManager
from src.utils.mock_data import MockDataGenerator

print("Testing database...")
db = DatabaseManager()

print("Tables:", db.get_table_names())

today = date.today()
start = today - timedelta(days=30)
end = today

print("Clearing existing data...")
for table in db.get_table_names():
    db.con.execute(f"DELETE FROM {table}")

print("Generating mock data...")
gen = MockDataGenerator()
counts = gen.populate_database(db, start, end)

print("Generated counts:", counts)

print("Testing query...")
result = db.query("SELECT COUNT(*) as cnt FROM crm_schedules")
print("CRM schedules count:", result)

result2 = db.query("SELECT * FROM attendance_records LIMIT 5")
print("Attendance sample:", result2)

db.close()
print("Done!")
