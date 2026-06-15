import sys
sys.path.insert(0, '.')
print('Python version:', sys.version)
print('='*50)

all_ok = True

try:
    from config import app_config, db_config, minio_config
    print('✅ config.py imported successfully')
    print('  App title:', app_config.title)
    print('  Regions:', app_config.regions[:3], '...')
except Exception as e:
    print('❌ config.py import failed:', e)
    all_ok = False

print('='*50)

try:
    from src.storage.duckdb_client import DuckDBClient
    print('✅ duckdb_client.py imported successfully')
except Exception as e:
    print('❌ duckdb_client.py import failed:', e)
    all_ok = False

try:
    from src.storage.minio_client import MinIOClient
    print('✅ minio_client.py imported successfully')
except Exception as e:
    print('❌ minio_client.py import failed:', e)
    all_ok = False

print('='*50)

try:
    from src.sync.base_sync import BaseSyncPipeline, SyncNode
    print('✅ base_sync.py imported successfully')
except Exception as e:
    print('❌ base_sync.py import failed:', e)
    all_ok = False

try:
    from src.sync.employment_sync import EmploymentSyncPipeline
    print('✅ employment_sync.py imported successfully')
except Exception as e:
    print('❌ employment_sync.py import failed:', e)
    all_ok = False

try:
    from src.sync.live_platform_sync import LivePlatformSyncPipeline
    print('✅ live_platform_sync.py imported successfully')
except Exception as e:
    print('❌ live_platform_sync.py import failed:', e)
    all_ok = False

try:
    from src.sync.question_bank_sync import QuestionBankSyncPipeline
    print('✅ question_bank_sync.py imported successfully')
except Exception as e:
    print('❌ question_bank_sync.py import failed:', e)
    all_ok = False

try:
    from src.sync.sync_manager import SyncManager
    print('✅ sync_manager.py imported successfully')
except Exception as e:
    print('❌ sync_manager.py import failed:', e)
    all_ok = False

print('='*50)

try:
    from src.analysis.metrics import MetricAnalyzer
    print('✅ metrics.py imported successfully')
except Exception as e:
    print('❌ metrics.py import failed:', e)
    all_ok = False

try:
    from src.analysis.anomaly_detection import AnomalyDetector
    print('✅ anomaly_detection.py imported successfully')
except Exception as e:
    print('❌ anomaly_detection.py import failed:', e)
    all_ok = False

try:
    from src.analysis.refund_analysis import RefundAnalyzer
    print('✅ refund_analysis.py imported successfully')
except Exception as e:
    print('❌ refund_analysis.py import failed:', e)
    all_ok = False

print('='*50)

try:
    from src.data_generator import MockDataGenerator
    print('✅ data_generator.py imported successfully')
except Exception as e:
    print('❌ data_generator.py import failed:', e)
    all_ok = False

print('='*50)

try:
    from src.ui_components import (
        render_risk_gauge, render_metric_card, render_trend_chart,
        render_bar_chart, render_pie_chart, render_colored_dataframe,
        render_yoy_mom_indicator, render_audit_trail, get_color_risk
    )
    print('✅ ui_components.py imported successfully')
except Exception as e:
    print('❌ ui_components.py import failed:', e)
    all_ok = False

print('='*50)
if all_ok:
    print('🎉 All imports passed!')
else:
    print('⚠️  Some imports failed, please check the errors above.')
print('='*50)
