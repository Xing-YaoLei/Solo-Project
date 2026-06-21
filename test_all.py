import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import polars as pl
from config.settings import REGIONS

print("=" * 60)
print("测试 1: 数据加载和模拟数据")
print("=" * 60)

from src.data.data_loader import data_loader
print("数据加载器初始化成功")

tables = data_loader.list_tables()
print(f"可用表: {tables}")

for table in tables:
    df = data_loader.query(f"SELECT * FROM {table} LIMIT 5")
    print(f"  {table}: {df.shape[0]} 行, {df.shape[1]} 列")

print()

print("=" * 60)
print("测试 2: 取数链路管理")
print("=" * 60)

from src.data.pipeline import pipeline_manager
print("链路管理器初始化成功")

all_pipelines = pipeline_manager.get_all_pipelines_status()
print(f"数据源数量: {len(all_pipelines)}")
for p in all_pipelines:
    print(f"  {p['source_name']}: {p['overall_status']} (延迟: {p['is_delayed']})")
    print(f"    步骤数: {len(p['steps'])}")
    for step in p['steps']:
        print(f"      - {step.name}: {step.status}")

print()

print("=" * 60)
print("测试 3: 风险分析器 - 总览统计")
print("=" * 60)

from src.utils.analyzer import risk_analyzer
print("分析器初始化成功")

date_range = (
    datetime(2026, 5, 21),
    datetime(2026, 6, 20),
)

overview = risk_analyzer.get_overview_stats(date_range)
print(f"总览指标: {list(overview.keys())}")
for k, v in overview.items():
    print(f"  {k}: {v}")

print()

print("=" * 60)
print("测试 4: 日度趋势")
print("=" * 60)

trend = risk_analyzer.get_daily_trend(30)
print(f"趋势数据: {trend.shape[0]} 行, {trend.shape[1]} 列")
print(f"列: {trend.columns}")
print(f"日期类型: {type(trend['date'][0])}")
print(f"前3行:")
print(trend.head(3))

print()

print("=" * 60)
print("测试 5: 同环比计算")
print("=" * 60)

yoy_mom = risk_analyzer.get_review_yoy_mom(date_range[0], date_range[1])
print(f"同环比指标数: {len(yoy_mom)}")
for k, v in yoy_mom.items():
    print(f"  {k}: 当前={v.get('current')}, 环比={v.get('mom_change_pct')}%")

print()

print("=" * 60)
print("测试 6: 区域对比")
print("=" * 60)

region = risk_analyzer.get_region_comparison(date_range)
print(f"区域数据: {region.shape[0]} 行")
print(region.head())

print()

print("=" * 60)
print("测试 7: 文书类型对比")
print("=" * 60)

doc_type = risk_analyzer.get_doc_type_comparison(date_range)
print(f"文书类型数据: {doc_type.shape[0]} 行")
print(doc_type.head())

print()

print("=" * 60)
print("测试 8: 内容转化漏斗")
print("=" * 60)

funnel = risk_analyzer.get_content_conversion_funnel(date_range)
print(f"漏斗阶段数: {funnel.shape[0]}")
print(funnel)

print()

print("=" * 60)
print("测试 9: 风险词分布")
print("=" * 60)

risk_words = risk_analyzer.get_risk_word_distribution(date_range)
print(f"风险词数: {risk_words.shape[0]}")
print(risk_words.head(10))

print()

print("=" * 60)
print("测试 10: 退回样本")
print("=" * 60)

samples = risk_analyzer.get_returned_samples(limit=5)
print(f"退回样本数: {samples.shape[0]}")
print(f"列: {samples.columns}")
print(samples.head())

print()

print("=" * 60)
print("测试 11: 互动记录明细")
print("=" * 60)

if not samples.is_empty():
    doc_id = samples['doc_id'][0]
    print(f"测试文书ID: {doc_id}")
    interaction = risk_analyzer.get_interaction_detail(doc_id)
    print(f"互动记录数: {interaction.shape[0]}")
    print(interaction.head())
else:
    print("无退回样本")

print()

print("=" * 60)
print("测试 12: 同步延迟信息")
print("=" * 60)

delay_info = risk_analyzer.get_sync_delay_info()
print(f"延迟信息数: {len(delay_info)}")
for d in delay_info:
    print(f"  {d['source_name']}: 延迟={d['delay_hours']}小时, 是否延迟={d['is_delayed']}")

print()

print("=" * 60)
print("测试 13: 发布排期对比")
print("=" * 60)

schedule = risk_analyzer.get_publish_schedule_comparison(30)
print(f"排期对比数据: {schedule.shape[0]} 行")
print(schedule.head())

print()

print("=" * 60)
print("测试 14: UI 组件 - 折线图（含延迟标注）")
print("=" * 60)

from src.utils.ui_components import (
    plot_line_chart,
    plot_bar_chart,
    plot_funnel,
    plot_pie_chart,
)

try:
    fig = plot_line_chart(
        trend,
        "date",
        ["submit_count", "return_count", "publish_count"],
        title="测试趋势图",
        y_title="数量",
        delay_points=[datetime(2026, 6, 19).date()],
    )
    print("折线图创建成功！")
except Exception as e:
    print(f"折线图创建失败: {e}")
    import traceback
    traceback.print_exc()

print()

print("=" * 60)
print("测试 15: UI 组件 - 柱状图")
print("=" * 60)

try:
    fig = plot_bar_chart(region, "region", "return_rate", title="测试柱状图")
    print("柱状图创建成功！")
except Exception as e:
    print(f"柱状图创建失败: {e}")
    import traceback
    traceback.print_exc()

print()

print("=" * 60)
print("测试 16: UI 组件 - 漏斗图")
print("=" * 60)

try:
    fig = plot_funnel(funnel, "stage", "count", title="测试漏斗图")
    print("漏斗图创建成功！")
except Exception as e:
    print(f"漏斗图创建失败: {e}")
    import traceback
    traceback.print_exc()

print()

print("=" * 60)
print("测试 17: UI 组件 - 饼图")
print("=" * 60)

try:
    fig = plot_pie_chart(doc_type, "doc_type", "total_docs", title="测试饼图")
    print("饼图创建成功！")
except Exception as e:
    print(f"饼图创建失败: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("所有测试完成！")
print("=" * 60)
