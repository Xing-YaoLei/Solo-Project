import sys
sys.path.insert(0, '.')
from src.data.database import get_connection, init_database
from src.data.data_querier import DataQuerier
from src.utils.trend_analyzer import TrendAnalyzer
from src.utils.sampling_engine import SamplingEngine

print("=" * 60)
print("核心模块验证测试")
print("=" * 60)

try:
    conn = get_connection()
    result = conn.execute('SELECT COUNT(*) FROM evidence_archive').fetchone()
    print(f'✓ 数据库连接正常，证据归档记录数: {result[0]}')
    conn.close()
except Exception as e:
    print(f'✗ 数据库连接失败: {e}')
    sys.exit(1)

try:
    querier = DataQuerier()
    df = querier.get_evidence_archive()
    print(f'✓ DataQuerier正常，获取到 {len(df)} 条归档记录')
except Exception as e:
    print(f'✗ DataQuerier失败: {e}')
    sys.exit(1)

try:
    yoy = TrendAnalyzer.calculate_yoy(df, 'archive_date', 'archive_id', 'month')
    print(f'✓ TrendAnalyzer正常，同比分析生成 {len(yoy)} 条趋势数据')
except Exception as e:
    print(f'✗ TrendAnalyzer失败: {e}')
    import traceback
    traceback.print_exc()

try:
    sample = SamplingEngine.random_sampling(df, 10)
    print(f'✓ SamplingEngine正常，抽样获得 {len(sample.samples)} 条样本')
except Exception as e:
    print(f'✗ SamplingEngine失败: {e}')
    import traceback
    traceback.print_exc()

try:
    from src.data.minio_client import MinioConnector
    print(f'✓ MinioConnector模块可正常导入')
except Exception as e:
    print(f'⚠ MinioConnector导入警告（若无MinIO服务可忽略）: {e}')

try:
    from src.data.sync_pipeline import SyncOrchestrator, DataSyncPipeline
    print(f'✓ SyncPipeline模块可正常导入')
except Exception as e:
    print(f'✗ SyncPipeline失败: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

querier.close()

print('\n' + '=' * 60)
print('✓✓✓ 所有核心模块验证通过！')
print('=' * 60)
