import sys
sys.path.insert(0, '.')

print('测试导入各模块...')

try:
    from config.settings import REGIONS, DOC_TYPES, RISK_WORDS
    print('  ✓ config.settings')
except Exception as e:
    print(f'  ✗ config.settings: {e}')

try:
    from src.data.mock_data import generate_all_data
    print('  ✓ src.data.mock_data')
except Exception as e:
    print(f'  ✗ src.data.mock_data: {e}')

try:
    from src.data.pipeline import pipeline_manager
    pipeline_manager.load_mock_status()
    print('  ✓ src.data.pipeline')
except Exception as e:
    print(f'  ✗ src.data.pipeline: {e}')

try:
    from src.data.data_loader import data_loader
    print('  ✓ src.data.data_loader')
except Exception as e:
    print(f'  ✗ src.data.data_loader: {e}')

try:
    from src.utils.analyzer import risk_analyzer
    print('  ✓ src.utils.analyzer')
except Exception as e:
    print(f'  ✗ src.utils.analyzer: {e}')

try:
    from src.utils.ui_components import render_metric_card
    print('  ✓ src.utils.ui_components')
except Exception as e:
    print(f'  ✗ src.utils.ui_components: {e}')

print('\n所有模块导入测试完成！')
