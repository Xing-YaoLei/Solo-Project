import sys

try:
    from config import settings
    print('✅ config 导入成功')
    print(f'   漏斗阶段: {settings.FUNNEL_STAGES}')
    print(f'   转化率阈值: {settings.CONVERSION_RATE_THRESHOLD}')
except Exception as e:
    print(f'❌ config 导入失败: {e}')
    sys.exit(1)

try:
    from database import db
    print('✅ database 导入成功')
except Exception as e:
    print(f'❌ database 导入失败: {e}')
    sys.exit(1)

try:
    from minio_storage import minio_mgr
    print('✅ minio_storage 导入成功')
    print(f'   MinIO可用: {minio_mgr.available}')
except Exception as e:
    print(f'❌ minio_storage 导入失败: {e}')
    sys.exit(1)

try:
    from version_control import version_ctrl
    print('✅ version_control 导入成功')
except Exception as e:
    print(f'❌ version_control 导入失败: {e}')
    sys.exit(1)

try:
    from test_data_generator import data_gen
    print('✅ test_data_generator 导入成功')
except Exception as e:
    print(f'❌ test_data_generator 导入失败: {e}')
    sys.exit(1)

try:
    from analytics import analytics
    print('✅ analytics 导入成功')
except Exception as e:
    print(f'❌ analytics 导入失败: {e}')
    sys.exit(1)

print('\n✅ 所有模块导入成功！开始生成测试数据...')
data_gen.generate_all()

print('\n✅ 测试数据生成完成！')

df = analytics.get_conversion_rates()
print(f'✅ 转化率数据查询成功: {df.height} 条记录')

oversold = analytics.detect_oversold_packages()
print(f'✅ 超卖检测完成: {oversold.height} 条超卖记录')

consistency = analytics.get_cs_message_consistency_check()
print(f'✅ 客服口径检查完成: {consistency.height} 条记录')

tasks = analytics.check_conversion_threshold_and_create_task()
print(f'✅ 阈值检查完成: 生成 {len(tasks)} 个备注任务')

verify = analytics.get_verification_overview()
print(f'✅ 核销总览查询完成: {verify.height} 条记录')

linkage = analytics.get_deposit_inventory_linkage()
print(f'✅ 押金库存联动查询完成: {linkage.height} 条记录')

abnormal = analytics.get_channel_abnormal_analysis()
print(f'✅ 渠道异常分析完成: {abnormal.height} 条异常记录')

trend = analytics.get_conversion_trend(days=30)
print(f'✅ 转化率趋势查询完成: {trend.height} 条记录')

remark_tasks = analytics.get_pending_remark_tasks()
print(f'✅ 备注任务查询完成: {remark_tasks.height} 条任务')

print('\n🎉 系统验证全部通过！')
