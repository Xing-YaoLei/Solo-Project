import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from app.data_service import DataService
from app.charts import (
    create_arrival_status_chart,
    create_reminder_funnel_chart,
    create_timeslot_heatmap,
    create_capacity_change_chart,
    create_kpi_cards,
    create_zone_rate_bar,
    create_pending_reminder_bar,
)

today = date.today()
week_ago = today - timedelta(days=7)

print("=== 数据服务验证 ===")
df = DataService.get_funnel_data(week_ago, today)
print(f"漏斗数据: {len(df)} 行")
print(f"列: {list(df.columns)}")
print()

df_status = DataService.get_arrival_status_distribution(df)
print("到场状态分布:")
print(df_status.to_string(index=False))
print()

df_funnel = DataService.get_funnel_summary(df)
print("漏斗汇总:")
print(df_funnel.to_string(index=False))
print()

kpi = create_kpi_cards(df)
print(f"KPI 指标: 预约={kpi[0]}, 到场={kpi[1]}, 消费={kpi[2]}, 到场率={kpi[3]}")
print()

df_rank = DataService.get_calendar_timeslot_rank(df)
print(f"时段排行: {len(df_rank)} 条, TOP 3:")
print(df_rank.head(3).to_string(index=False))
print()

df_cap = DataService.get_capacity_changes(week_ago, today)
print(f"容量规则: {len(df_cap)} 条")
print()

df_zone = DataService.get_zone_detail_rates(df)
print(f"区域明细: {len(df_zone)} 行, TOP 3:")
print(df_zone[['zone','total_checked_in','avg_checkin_rate','avg_conversion_rate']].head(3).to_string(index=False))
print()

df_pending = DataService.get_reminder_list(df)
print(f"待提醒名单: {len(df_pending)} 条")
if len(df_pending) > 0:
    print("TOP 3:")
    print(df_pending[['zone','time_slot','pending_reminder','checkin_rate']].head(3).to_string(index=False))

df_batches = DataService.get_recent_batches(5)
print(f"\n最近批次: {len(df_batches)} 条")
if len(df_batches) > 0:
    print(df_batches[['批次号','来源','记录数','状态']].head().to_string(index=False))

print()
print("✅ 所有数据服务验证通过！")
print()

fig1 = create_arrival_status_chart(df_status)
fig2 = create_reminder_funnel_chart(df_funnel)
fig3 = create_timeslot_heatmap(df_rank)
fig4 = create_capacity_change_chart(df_cap)
fig5 = create_zone_rate_bar(df_zone)
fig6 = create_pending_reminder_bar(df_pending)

print("✅ 所有图表渲染成功！")
print()
print("图表验证:")
print(f"  到场状态分布图: {len(fig1.data)} traces")
print(f"  漏斗图: {len(fig2.data)} traces")
print(f"  时段热力图: {len(fig3.data)} traces")
print(f"  容量变化图: {len(fig4.data)} traces")
print(f"  区域指标图: {len(fig5.data)} traces")
print(f"  待提醒图: {len(fig6.data)} traces")

print()
print("🎉 系统完全可用！现在可以启动 Dash 仪表盘。")
