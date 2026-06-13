"""测试ETL流水线"""
from src.config import load_config
from src.etl.pipeline import ETLPipeline
from scripts.generate_sample_data import (
    generate_inventory, generate_reviews, generate_appointments,
    generate_recharge, generate_service_cards, generate_schedules,
)
from datetime import date, timedelta

print('加载配置...')
config = load_config()

print('生成示例数据...')
end_date = date.today()
start_date = end_date - timedelta(days=30)

inv_df = generate_inventory(start_date, end_date)
rev_df = generate_reviews(start_date, end_date, 200)
appt_df = generate_appointments(start_date, end_date, 500)
recharge_df = generate_recharge(start_date, end_date, 150)
cards_df = generate_service_cards(start_date, end_date, 120)
schedules_df = generate_schedules(start_date, end_date)

print(f'  库存: {len(inv_df)} 条')
print(f'  点评: {len(rev_df)} 条')
print(f'  预约: {len(appt_df)} 条')
print(f'  充值: {len(recharge_df)} 条')
print(f'  服务卡: {len(cards_df)} 条')
print(f'  排班: {len(schedules_df)} 条')

print('运行ETL流水线...')
with ETLPipeline(config) as pipeline:
    results = pipeline.run_full_pipeline(
        inventory_df=inv_df,
        reviews_df=rev_df,
        appointments_df=appt_df,
        recharge_df=recharge_df,
        service_cards_df=cards_df,
        schedules_df=schedules_df,
    )

print('\nETL执行结果:')
for key, result in results.items():
    print(f'  {key}: batch_id={result["batch_id"]}, rows={result["row_count"]}, anomalies={len(result["anomalies"])}')

print('\n验证数据库...')
stats = pipeline.db.get_summary_stats()
print('数据库记录:')
for table, count in stats.items():
    print(f'  {table}: {count} 条')

print('\n查询消课率指标...')
metrics = pipeline.db.get_attendance_metrics()
print(f'  消课率指标记录: {len(metrics)} 条')
if not metrics.is_empty():
    print(metrics.head(5))

print('\n查询充值分布...')
recharge_dist = pipeline.db.get_recharge_distribution()
print(f'  充值分布: {len(recharge_dist)} 条')
if not recharge_dist.is_empty():
    print(recharge_dist.head(3))

print('\n查询评价标签漏斗...')
tag_funnel = pipeline.db.get_review_tag_funnel()
print(f'  标签数量: {len(tag_funnel)} 条')
if not tag_funnel.is_empty():
    print(tag_funnel.head(5))

print('\n查询服务卡排行...')
card_ranking = pipeline.db.get_service_card_ranking()
print(f'  卡项数量: {len(card_ranking)} 条')
if not card_ranking.is_empty():
    print(card_ranking.head(3))

print('\n查询排班变化...')
schedule_changes = pipeline.db.get_technician_schedule_changes()
print(f'  排班记录: {len(schedule_changes)} 条')
if not schedule_changes.is_empty():
    print(schedule_changes.head(3))

print('\n测试消课率摘要...')
for tech in ["张技师", "李技师"]:
    summary = pipeline.get_attendance_rate_summary(technician=tech)
    if summary:
        print(f'  {tech}: 当前={summary.get("current_rate",0):.1%}, 目标={summary.get("target_rate",0):.0%}')

print('\n✓ 所有测试通过!')
