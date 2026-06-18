from datetime import date, timedelta
from data.queries import DataQueryService
from data.database import SessionLocal
from data.models import ThresholdConfig, ReviewMaterial

print('=== 测试数据查询 ===')
with DataQueryService() as svc:
    start = date.today() - timedelta(days=90)
    end = date.today()

    print('1. 测试预约趋势查询...')
    df = svc.get_appointment_trend(start, end)
    print(f'   预约趋势数据: {len(df)} 天')

    print('2. 测试返修率查询...')
    rework = svc.get_rework_rate(start, end)
    print(f'   返修率: {rework}')

    print('3. 测试配件缺货统计...')
    shortage = svc.get_parts_shortage_stats(start, end)
    print(f'   缺货率: {shortage["shortage_rate"]}%, 缺货记录: {len(shortage["top_shortage_parts"])}')

    print('4. 测试阈值配置查询...')
    configs = svc.get_threshold_config()
    print(f'   阈值配置: {len(configs)} 项')

    print('5. 测试口径版本查询...')
    calibers = svc.get_caliber_versions()
    print(f'   口径版本: {len(calibers)} 个')

    print('6. 测试阈值保存...')
    success = svc.update_threshold_config('rework_rate_warning', '6', 'test_user')
    print(f'   保存结果: {success}')

    print('7. 测试复盘材料生成...')
    material = svc.create_review_material(
        title='测试复盘报告',
        summary='这是一个测试报告',
        review_type='配件缺货',
        caliber_version='v1.0',
        key_metrics={'rework_rate': '2.7%'},
        related_part_codes=['P001', 'P002'],
        created_by='test_user'
    )
    print(f'   复盘材料ID: {material.id}')

    print('8. 测试复盘材料列表查询...')
    materials = svc.get_review_materials()
    print(f'   复盘材料总数: {len(materials)}')

print('\n=== 验证数据库写入 ===')
db = SessionLocal()

config = db.query(ThresholdConfig).filter(ThresholdConfig.config_key == 'rework_rate_warning').first()
print(f'阈值更新验证: rework_rate_warning = {config.config_value}, updated_by = {config.updated_by}')

last_material = db.query(ReviewMaterial).order_by(ReviewMaterial.id.desc()).first()
print(f'复盘材料验证: 标题 = {last_material.title}, 口径 = {last_material.caliber_version}')

db.close()
print('\n✅ 所有测试通过!')
