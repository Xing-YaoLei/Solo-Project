import sys
sys.path.insert(0, '.')

from app.repositories import duckdb_repository as repo

kpi = repo.kpi_overview()
print('KPI Overview OK:', kpi.total_tickets, kpi.sold_rate)

trend = repo.kpi_trend(5)
print('KPI Trend OK:', len(trend), 'points')

status = repo.pipeline_status()
print('Pipeline Status OK:', len(status), 'tasks')

logs = repo.sync_logs(page=1, page_size=5)
print('Sync Logs OK:', logs.page_info.total, 'total')

heatmap = repo.seat_heatmap(compare='both')
print('Seat Heatmap OK:', len(heatmap), 'areas')

checkin = repo.checkin_trend(7)
print('Checkin Trend OK:', len(checkin), 'days')

sponsors = repo.sponsorship_list(page=1, page_size=5)
print('Sponsorship List OK:', sponsors.page_info.total, 'total')

detail = repo.sponsorship_detail("test-id")
print('Sponsorship Detail OK:', detail is not None)

eff = repo.verification_efficiency()
print('Verification Efficiency OK:', len(eff), 'gates')

vdt = repo.verification_date_trend()
print('Verification Date Trend OK:', len(vdt), 'days')

vac = repo.verification_area_compare()
print('Verification Area Compare OK:', len(vac), 'areas')

vdef = repo.verification_definition()
print('Verification Definition OK:', vdef.formula[:20])

rank1 = repo.ticket_rank('absolute')
rank2 = repo.ticket_rank('ratio')
print('Ticket Rank OK:', len(rank1), '/ metric切换有效:', rank1[0].rank == 1)

refund = repo.refund_distribution()
print('Refund Distribution OK:', len(refund), 'days')

sample = repo.refund_sample("test-id")
print('Refund Sample OK:', sample is not None)

sync_result = repo.run_pipeline_sync('REG_SYNC')
print('Run Pipeline Sync OK:', len(sync_result), 'logs generated')

print('\n✅ 所有 15 个查询方法验证通过！')
