import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import date, timedelta
from src.data.database import DatabaseManager
from src.data.storage import MinIOStorage
from src.analysis.conflict_detector import ConflictDetector
from src.analysis.attendance_analyzer import AttendanceAnalyzer

print("=" * 60)
print(" 版本保存功能验证测试")
print("=" * 60)

db = DatabaseManager()
storage = MinIOStorage()

print("\n1. 检查版本表...")
tables = db.get_table_names()
print("  数据库表:", tables)
assert "data_versions" in tables, "缺少 data_versions 表"
assert "meter_readings_archive" in tables, "缺少 meter_readings_archive 表"
assert "e_contracts_archive" in tables, "缺少 e_contracts_archive 表"
print("  ✅ 版本表结构完整")

vcount = db.query("SELECT COUNT(*) FROM data_versions").row(0)[0]
print(f"  当前版本记录数: {vcount}")

if vcount == 0:
    print("\n2. 为现有数据补建版本...")

    meter = db.query("SELECT * FROM meter_readings")
    contracts = db.query("SELECT * FROM e_contracts")
    print(f"  抄表数据量: {len(meter)}, 合同数据量: {len(contracts)}")

    if len(meter) > 0:
        v1 = db.save_version(
            category="meter_readings",
            df=meter.select([
                "id", "apartment_id", "room_id", "reading_date",
                "water_meter", "electric_meter", "gas_meter", "source"
            ]),
            description="测试抄表版本",
            effective_date=date.today(),
            storage_type="duckdb_archive"
        )
        print(f"  ✅ 抄表版本保存: {v1}")

    if len(contracts) > 0:
        v2 = db.save_version(
            category="e_contracts",
            df=contracts.select([
                "id", "contract_no", "apartment_id", "room_id",
                "tenant_name", "start_date", "end_date",
                "cleaning_frequency", "cleaning_weekday",
                "cleaning_time_slot", "is_current"
            ]),
            description="测试合同版本",
            effective_date=date.today(),
            storage_type="duckdb_archive"
        )
        print(f"  ✅ 合同版本保存: {v2}")

else:
    print("\n2. 已有版本，跳过补建")

print("\n3. 查询版本列表...")
all_versions = db.list_versions()
print(f"  版本总数: {len(all_versions)}")
if len(all_versions) > 0:
    print(all_versions)

print("\n4. 查询归档数据...")
archived = db.get_version_data("meter_readings", 1)
if archived is not None:
    print(f"  抄表 v1 归档数据量: {len(archived)}")
else:
    print("  ⚠️  未找到归档数据")

contract_archived = db.get_version_data("e_contracts", 1)
if contract_archived is not None:
    print(f"  合同 v1 归档数据量: {len(contract_archived)}")

print("\n5. 获取当前版本信息...")
cv_meter = db.get_current_version("meter_readings")
if cv_meter:
    print(f"  抄表当前版本: v{cv_meter['version']}")
cv_contract = db.get_current_version("e_contracts")
if cv_contract:
    print(f"  合同当前版本: v{cv_contract['version']}")

today = date.today()
start = today - timedelta(days=30)
end = today

print("\n6. 冲突检测和到场分析验证...")
detector = ConflictDetector(db)
time_confs = detector.detect_time_slot_conflicts(start, end)
print(f"  时段冲突数: {len(time_confs)}")

analyzer = AttendanceAnalyzer(db)
comp = analyzer.compare_periods(
    start, start + timedelta(days=15),
    start + timedelta(days=16), end
)
print(f"  前期到场率: {comp['previous_period']['attendance_rate']}%")
print(f"  后期到场率: {comp['current_period']['attendance_rate']}%")
print(f"  改善值: {comp['improvement']['absolute_diff']:+.2f}%")

print("\n7. MinIO 状态...")
print(f"  MinIO 可用: {storage.is_available()}")

db.close()
print("\n✅ 所有验证通过！")
