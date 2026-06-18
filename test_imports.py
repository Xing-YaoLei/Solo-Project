import sys
sys.path.insert(0, ".")

print("Testing module imports...\n")

try:
    import config
    print("✅ config.py OK")
except Exception as e:
    print(f"❌ config.py FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    from data_layer import DuckDBEngine, PolarsProcessor, MinIOStorage, DataRepository
    print("✅ data_layer OK")
except Exception as e:
    print(f"❌ data_layer FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    from sync_pipeline import SyncPipeline, DesignExportSync, PaymentRecordSync, PurchaseOrderSync
    print("✅ sync_pipeline OK")
except Exception as e:
    print(f"❌ sync_pipeline FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    from ui_components import render_error_fallback, render_kpi_card, safe_render_chart
    print("✅ ui_components OK")
except Exception as e:
    print(f"❌ ui_components FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    import data_generator
    print("✅ data_generator OK")
except Exception as e:
    print(f"❌ data_generator FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n🎉 所有模块导入成功！")
