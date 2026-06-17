import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import date, timedelta
from src.data.database import DatabaseManager
from src.analysis.conflict_detector import ConflictDetector
from src.analysis.attendance_analyzer import AttendanceAnalyzer

print("Testing analysis modules...")
db = DatabaseManager()

today = date.today()
start = today - timedelta(days=30)
end = today

print("\n=== Conflict Detector ===")
detector = ConflictDetector(db)

summary = detector.get_conflict_summary(start, end)
print("Conflict summary:", summary)

time_conflicts = detector.detect_time_slot_conflicts(start, end)
print(f"Time slot conflicts: {len(time_conflicts)}")

crm_diff = detector.detect_crm_contract_diff(start, end)
print(f"CRM/Contract diffs: {len(crm_diff)}")

reschedule = detector.detect_reschedule_conflicts(start, end)
print(f"Reschedule records: {len(reschedule)}")

attendance_anomalies = detector.detect_attendance_anomalies(start, end)
print(f"Attendance anomalies: {len(attendance_anomalies)}")

data_gaps = detector.detect_data_gaps(start, end)
print(f"Data gaps: {len(data_gaps)}")

alerts = detector.generate_alert_list(start, end)
print(f"Alert list: {len(alerts)}")

print("\n=== Attendance Analyzer ===")
analyzer = AttendanceAnalyzer(db)

daily = analyzer.get_daily_attendance_rate(start, end)
print(f"Daily records: {len(daily)}")
if len(daily) > 0:
    print(daily.head())

by_apt = analyzer.get_attendance_by_apartment(start, end)
print(f"\nBy apartment: {len(by_apt)}")
print(by_apt)

by_slot = analyzer.get_attendance_by_time_slot(start, end)
print(f"\nBy time slot: {len(by_slot)}")
print(by_slot)

mid = start + timedelta(days=15)
comparison = analyzer.compare_periods(start, mid, mid + timedelta(days=1), end)
print(f"\nPeriod comparison:")
print(f"  Previous: {comparison['previous_period']['attendance_rate']}%")
print(f"  Current: {comparison['current_period']['attendance_rate']}%")
print(f"  Improvement: {comparison['improvement']['absolute_diff']:+.2f}%")

impact = analyzer.get_reschedule_impact(start, end)
print(f"\nReschedule impact: {len(impact)}")

gap_stats = analyzer.get_data_gap_stats(start, end)
print(f"Data gap stats: {gap_stats}")

db.close()
print("\nAll tests passed!")
