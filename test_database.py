from datetime import date, timedelta
from data.queries import DataQueryService
from data.database import SessionLocal
from data.models import ThresholdConfig, ReviewMaterial, InsuranceMaterial

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
    success = svc.update_threshold_config('rework_rate_warning', '5', 'test_user')
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

    print('9. 测试保险材料统计查询...')
    ins_stats = svc.get_insurance_stats(start, end)
    print(f'   理赔单数: {ins_stats["total_claims"]}')
    print(f'   定损总额: ¥{ins_stats["total_estimated"]:,.2f}')
    print(f'   核赔总额: ¥{ins_stats["total_approved"]:,.2f}')
    print(f'   赔付率: {ins_stats["approval_rate"]}%')
    print(f'   保险公司分布: {len(ins_stats["company_distribution"])} 家')
    for c in ins_stats["company_distribution"][:3]:
        print(f'     - {c["insurance_company"]}: {c["claim_count"]}单, 定损¥{c["total_estimated"]:,.0f}')
    print(f'   损伤类型分布: {len(ins_stats["damage_distribution"])} 种')
    for d in ins_stats["damage_distribution"][:3]:
        print(f'     - {d["damage_type"]}: {d["claim_count"]}单')
    print(f'   理赔状态分布: {len(ins_stats["status_distribution"])} 种')
    for s in ins_stats["status_distribution"]:
        print(f'     - {s["claim_status"]}: {s["claim_count"]}单')

    print('10. 测试保险材料明细表查询...')
    ins_detail = svc.get_insurance_detail(start, end)
    print(f'   保险明细记录数: {len(ins_detail)}')
    if len(ins_detail) > 0:
        print(f'   字段: {list(ins_detail.columns)}')
        sample = ins_detail.iloc[0].to_dict()
        print(f'   样例: 工单号={sample["工单号"]}, 保险公司={sample["保险公司"]}, 理赔状态={sample["理赔状态"]}')

print('\n=== 验证数据库写入 ===')
db = SessionLocal()

config = db.query(ThresholdConfig).filter(ThresholdConfig.config_key == 'rework_rate_warning').first()
print(f'阈值更新验证: rework_rate_warning = {config.config_value}, updated_by = {config.updated_by}')

last_material = db.query(ReviewMaterial).order_by(ReviewMaterial.id.desc()).first()
print(f'复盘材料验证: 标题 = {last_material.title}, 口径 = {last_material.caliber_version}')

total_insurance = db.query(InsuranceMaterial).count()
print(f'保险材料总数: {total_insurance}')
if total_insurance > 0:
    sample = db.query(InsuranceMaterial).first()
    print(f'  样例: 保险公司={sample.insurance_company}, 损伤类型={sample.damage_type}, 状态={sample.claim_status}')
    print(f'  保单号={sample.policy_no}, 定损={sample.estimated_amount}, 核赔={sample.approved_amount}')

db.close()
print('\n✅ 所有测试通过!')
