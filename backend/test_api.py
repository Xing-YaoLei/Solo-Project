import sys
sys.path.insert(0, '.')
import httpx

BASE = "http://localhost:8000"

def test(path, name=""):
    try:
        r = httpx.get(BASE + path, timeout=10)
        data = r.json()
        d = data.get('data', data)
        print(f"[{name or path}]")
        print(f"  HTTP {r.status_code}, code={data.get('code', 'n/a')}")
        if isinstance(d, dict):
            for k,v in list(d.items())[:6]:
                if isinstance(v, list):
                    print(f"  {k}: list len={len(v)}")
                elif isinstance(v, dict):
                    print(f"  {k}: {list(v.keys())[:8]}")
                else:
                    print(f"  {k}: {v}")
        elif isinstance(d, list):
            print(f"  list len={len(d)}")
            if d: print(f"  first item keys: {list(d[0].keys())[:10]}")
        print()
        return True
    except Exception as e:
        print(f"[{name or path}] ERROR: {e}\n")
        return False

print("=" * 55)
print("Testing Coffee Equipment Monitoring API endpoints")
print("=" * 55 + "\n")

ok = 0
total = 0

total += 1; ok += test("/health", "Health Check")
total += 1; ok += test("/api/analytics/overview/dashboard", "Dashboard Overview")
total += 1; ok += test("/api/analytics/clean-risk/timeseries?start_date=2026-05-01&end_date=2026-06-14", "Risk Timeseries")
total += 1; ok += test("/api/analytics/top-risks?limit=5", "Top Risks")
total += 1; ok += test("/api/equipment/stores/", "Stores List")
total += 1; ok += test("/api/equipment/?store_id=1", "Equipments (store 1)")
total += 1; ok += test("/api/inventory/versions", "Inventory Versions")
total += 1; ok += test("/api/inventory/compare?version_id_1=1&version_id_2=2", "Inventory Compare")
total += 1; ok += test("/api/pos/versions", "POS Versions")
total += 1; ok += test("/api/pos/compare?version_id_1=1&version_id_2=2", "POS Compare")
total += 1; ok += test("/api/pos/conflicts?start_date=2026-05-01&end_date=2026-06-14", "Member-POS Conflicts")
total += 1; ok += test("/api/faults/overview", "Faults Overview")
total += 1; ok += test("/api/faults/?store_id=1&page_size=3", "Faults List")
total += 1; ok += test("/api/tasks/stats/workflow", "Task Workflow Stats")
total += 1; ok += test("/api/inspection/trends?period_type=weekly", "Inspection Trends")
total += 1; ok += test("/api/inspection/comparison", "Inspection Comparison")
total += 1; ok += test("/api/analytics/data-status", "Data Status")

print("=" * 55)
print(f"Result: {ok}/{total} tests passed")
print("=" * 55)
