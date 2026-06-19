import sys
sys.path.insert(0, '.')

from src.utils.config import load_config
from src.data_layer.data_repository import DataRepository
from src.business_logic.conversion_rate import ConversionRateCalculator
from datetime import date

config = load_config()
repo = DataRepository(config, use_minio=False)
calc = ConversionRateCalculator(repo)

start_date = date(2026, 1, 1)
end_date = date(2026, 6, 20)

print("=== Loading data ===")
orders = repo.get_ota_orders(start_date=start_date, end_date=end_date)
inventory = repo.get_package_inventory(start_date=start_date, end_date=end_date)
print(f"Orders: {len(orders)}")
print(f"Inventory: {len(inventory)}")
print(f"Order columns: {orders.columns}")
print(f"Inventory columns: {inventory.columns}")

print("\n=== Testing formula building ===")
versions = repo.get_conversion_rate_versions(is_active=True)
print(f"Versions: {len(versions)}")
for v in versions.iter_rows(named=True):
    print(f"  - {v['version_code']}: {v['version_name']}")
    print(f"    num: {v['numerator_formula']}")
    print(f"    den: {v['denominator_formula']}")

print("\n=== Testing calculation with single version ===")
try:
    result = calc.calculate_conversion(orders, inventory, "v1.0")
    print(f"Result v1.0: {result}")
except Exception as e:
    print(f"ERROR v1.0: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing calculation with all versions ===")
for v in versions.iter_rows(named=True):
    vc = v["version_code"]
    try:
        result = calc.calculate_conversion(orders, inventory, vc)
        cr = result["conversion_rate"][0] if not result.is_empty() else "N/A"
        print(f"  {vc}: OK, rate={cr}")
    except Exception as e:
        print(f"  {vc}: FAILED - {type(e).__name__}: {e}")

print("\n=== Testing compare_versions ===")
try:
    result = calc.compare_versions(
        orders, inventory, ["v1.0", "v1.1", "v2.0", "v2.1"]
    )
    print(f"Compare result: {len(result)} rows")
    print(result)
except Exception as e:
    print(f"ERROR compare: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing explain_difference ===")
try:
    result = calc.explain_difference(orders, inventory, "v1.0", "v2.0")
    print(f"Diff v1.0 vs v2.0:")
    print(f"  rate1: {result['metrics_1']['conversion_rate']}")
    print(f"  rate2: {result['metrics_2']['conversion_rate']}")
    print(f"  abs_diff: {result['absolute_difference']}")
    print(f"  rel_diff: {result['relative_difference']}")
    print(f"  summary: {result['summary']}")
    print(f"  reasons: {len(result['differences'])} items")
    for d in result['differences']:
        print(f"    - {d['field']}: {d['value_1']} vs {d['value_2']}")
except Exception as e:
    print(f"ERROR explain: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

repo.close()
print("\n=== DONE ===")
