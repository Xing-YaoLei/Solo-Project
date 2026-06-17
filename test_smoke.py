from src.config import Role, CAPACITY_RULES
from src.data_sync.duckdb_store import DuckDBStore
from src.data_sync.pipeline import SyncPipeline, SyncNode
from src.models.cleaning_schedule import CleaningScheduleModel
from src.models.payment_flow import PaymentFlowModel
from src.models.e_contract import EContractModel
from src.models.meter_reading import MeterReadingModel
from src.auth.permission import PermissionManager, DataFilter, UserContext
from src.reports.cleaning_funnel import CleaningFunnelReport
from src.sample_data import seed_sample_data
from datetime import date, timedelta

print("All imports OK")

info = seed_sample_data()
print("Sample data seeded:", info)

db = DuckDBStore()
schedules = db.query("SELECT COUNT(*) AS cnt FROM cleaning_schedules")
payments = db.query("SELECT COUNT(*) AS cnt FROM payment_flows")
contracts = db.query("SELECT COUNT(*) AS cnt FROM e_contracts")
meters = db.query("SELECT COUNT(*) AS cnt FROM meter_readings")
users = db.query("SELECT COUNT(*) AS cnt FROM users")

print(f"Schedules: {schedules['cnt'][0]}")
print(f"Payments: {payments['cnt'][0]}")
print(f"Contracts: {contracts['cnt'][0]}")
print(f"Meter readings: {meters['cnt'][0]}")
print(f"Users: {users['cnt'][0]}")

pm = PermissionManager(db)
admin = pm.get_user("admin")
print(f"Admin user: {admin.username}, role={admin.role}, has view_sensitive={admin.has_permission('view_sensitive')}")

report = CleaningFunnelReport(admin)
end_date = date.today()
start_date = end_date - timedelta(days=30)
funnel_df, _ = report.build_funnel(start_date, end_date)
print(f"Funnel built, rows={len(funnel_df)}")

arrival_df, _ = report.build_arrival_rate_trend(start_date, end_date)
print(f"Arrival rate trend, rows={len(arrival_df)}")

mom = report.compare_metrics("arrival_rate", start_date, end_date, compare_type="mom")
print(f"MoM arrival_rate: current={mom['current']}%, prev={mom['previous']}%, diff={mom['diff_pct']:+.2f}%")

conflict_target = end_date - timedelta(days=5)
conflicts, _ = report.build_conflict_chart(conflict_target)
print(f"Conflicts on {conflict_target}: {len(conflicts)}")

cap = report.build_capacity_explanation(end_date)
print(f"Capacity: {cap['total_cleaners_on_duty']} cleaners on duty, avg {cap['avg_tasks_per_cleaner']} tasks, {cap['overloaded_cleaners']} overloaded")

reminders = report.build_reminder_list(start_date, end_date)
print(f"Reminders needed: {len(reminders)}")

tenant_user = pm.get_user("tenant_001")
tenant_report = CleaningFunnelReport(tenant_user)
tenant_funnel, _ = tenant_report.build_funnel(start_date, end_date)
print(f"Tenant filtered funnel rows: {len(tenant_funnel)}")

dfilter = DataFilter(tenant_user)
raw = db.query("SELECT * FROM payment_flows LIMIT 5")
filtered = dfilter.apply_all(raw)
print(f"Payment cols visible to tenant: {filtered.columns}")

token = pm.create_share_link("admin", Role.EXTERNAL, expires_days=7)
print(f"Share token created: {token}")
share_user = pm.validate_share_link(token)
print(f"Share user validated: {share_user.username}, role={share_user.role}")

db.close()
print("ALL SMOKE TESTS PASSED")
