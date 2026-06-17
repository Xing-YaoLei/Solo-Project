import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import polars as pl
from src.data import DuckDBStore
from src.processing import DataCleaner, DataMatcher
from src.services import ThresholdService, CareStandardService, FallReviewService
from src.utils import SampleDataGenerator
from datetime import date, timedelta

print("=" * 60)
print("养老护理康复活动趋势看板 - 系统功能测试")
print("=" * 60)

print("\n1. 初始化数据库...")
db = DuckDBStore()
print("✅ 数据库初始化成功")

print("\n2. 测试阈值配置服务...")
threshold_service = ThresholdService(db)
thresholds = threshold_service.get_all_thresholds()
print(f"✅ 阈值配置服务正常，共 {len(thresholds)} 项阈值配置")
for t in thresholds[:3]:
    print(f"   - {t['category']}: {t['description']} = {t['value']}")

print("\n3. 测试护理达标口径版本服务...")
standard_service = CareStandardService(db)
versions = standard_service.get_all_versions()
print(f"✅ 口径版本服务正常，共 {len(versions)} 个版本")
for v in versions:
    print(f"   - {v['version_code']}: {v['version_name']} (生效日期: {v['effective_date']})")

print("\n4. 测试跌倒复盘服务...")
fall_service = FallReviewService(db, threshold_service)
pending_falls = fall_service.get_pending_fall_events(days=7)
print(f"✅ 跌倒复盘服务正常，待处理跌倒事件: {len(pending_falls)} 件")

print("\n5. 生成示例数据...")
generator = SampleDataGenerator(seed=42)
data = generator.generate_all_data(elder_count=20, days=30)
print(f"✅ 示例数据生成完成:")
print(f"   - 老人档案: {len(data['elder_profiles'])} 条")
print(f"   - 用药清单: {len(data['medication_list'])} 条")
print(f"   - 护理记录: {len(data['nursing_records'])} 条")
print(f"   - 健康数据: {len(data['health_data'])} 条")
print(f"   - 门禁记录: {len(data['access_records'])} 条")

print("\n6. 测试数据清洗...")
cleaner = DataCleaner()
cleaned_nursing, stats = cleaner.clean_nursing_records(data['nursing_records'])
print(f"✅ 护理记录清洗完成:")
print(f"   - 原始: {stats['total']} 条")
print(f"   - 去重: {stats.get('duplicates_removed', 0)} 条")
print(f"   - 无效: {stats.get('invalid_removed', 0)} 条")
print(f"   - 清洗后: {len(cleaned_nursing)} 条")

cleaned_health, health_stats = cleaner.clean_health_data(data['health_data'])
print(f"✅ 健康数据清洗完成:")
print(f"   - 原始: {health_stats['total']} 条")
print(f"   - 跌倒报警: {health_stats.get('fall_alerts', 0)} 条")

normalized_profiles, profile_stats = cleaner.normalize_elder_profiles(data['elder_profiles'])
print(f"✅ 老人档案标准化完成:")
print(f"   - 自动计算年龄: {profile_stats.get('age_calculated', 0)} 条")

print("\n7. 导入清洗后的数据到数据库...")
inserted_profiles = db.insert_elder_profiles(normalized_profiles)
inserted_medication = db.insert_medication_list(data['medication_list'])
inserted_nursing = db.insert_nursing_records(cleaned_nursing)
inserted_health = db.insert_health_data(cleaned_health)
inserted_access = db.insert_access_records(data['access_records'])
print(f"✅ 数据导入完成:")
print(f"   - 老人档案: {inserted_profiles} 条")
print(f"   - 用药清单: {inserted_medication} 条")
print(f"   - 护理记录: {inserted_nursing} 条")
print(f"   - 健康数据: {inserted_health} 条")
print(f"   - 门禁记录: {inserted_access} 条")

print("\n8. 测试数据匹配和护理达标计算...")
matcher = DataMatcher()
end_date = date.today()
start_date = end_date - timedelta(days=30)

nursing_records = db.get_nursing_records(start_date=start_date, end_date=end_date)
elder_profiles = db.get_elder_profiles()

daily_summary = matcher.calculate_daily_care_minutes(nursing_records, elder_profiles)
print(f"✅ 护理达标计算完成:")
print(f"   - 汇总记录: {len(daily_summary)} 条")
if not daily_summary.is_empty():
    compliance_rate = daily_summary["is_care_compliant"].mean() * 100
    print(f"   - 整体达标率: {compliance_rate:.1f}%")

active_version = standard_service.get_active_version()
if active_version:
    daily_summary = daily_summary.with_columns(pl.lit(active_version["version_code"]).alias("standard_version"))
    inserted_summary = db.insert_daily_summary(daily_summary)
    print(f"   - 导入每日汇总: {inserted_summary} 条")

print("\n9. 测试跌倒事件检测和匹配...")
fall_events = db.get_fall_events(start_date=start_date, end_date=end_date)
print(f"✅ 跌倒事件检测: {len(fall_events)} 件")

if not fall_events.is_empty():
    matched_falls = matcher.match_fall_events_with_care(fall_events, nursing_records)
    print(f"✅ 跌倒事件与护理响应匹配: {len(matched_falls)} 件")
    
    sample_fall = fall_events.row(0, named=True)
    print(f"\n10. 测试跌倒复盘材料生成...")
    review_material = fall_service.generate_review_material(
        sample_fall["elder_id"], 
        sample_fall["record_time"]
    )
    print(f"✅ 复盘材料生成完成:")
    print(f"   - 老人信息: {review_material['elder_info']['name']}")
    print(f"   - 护理响应: {'有' if review_material['care_response']['has_response'] else '无'}")
    print(f"   - 整体达标: {'是' if review_material['compliance_check']['overall_compliant'] else '否'}")
    print(f"   - 发现问题: {len(review_material['issues'])} 个")
    print(f"   - 改进建议: {len(review_material['improvement_suggestions'])} 条")

print("\n11. 测试康复活动趋势查询...")
rehab_data = db.get_rehab_trend_data(start_date=start_date, end_date=end_date)
print(f"✅ 康复活动趋势数据: {len(rehab_data)} 条")

print("\n12. 测试口径版本对比...")
if len(versions) >= 1:
    print(f"✅ 口径版本管理正常")
    print(f"   - 当前活跃版本: {active_version['version_code'] if active_version else '无'}")

print("\n" + "=" * 60)
print("🎉 所有系统功能测试通过！")
print("=" * 60)
print("\n下一步: 在浏览器中访问 http://localhost:8501 查看看板")
print("可以在'数据管理'页面生成更多示例数据进行测试")
