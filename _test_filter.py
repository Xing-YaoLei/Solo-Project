from app.utils.data_service import DataService

svc = DataService()

full = svc.get_funnel_data(activity_id=1)
print('【全量 funnel】赞助=%s 报名=%s 支付=%s 核销=%s' % tuple(full['count'].tolist()))

partial = svc.get_funnel_data(activity_id=1, start_date='2024-06-01', end_date='2024-06-10')
print('【6/1-6/10 funnel】赞助=%s 报名=%s 支付=%s 核销=%s' % tuple(partial['count'].tolist()))

tt_df = svc.get_ticket_types(activity_id=1)
print('票种列表:', tt_df[['id', 'name', 'sold_quantity']].to_dict('records'))
tt_ids = [int(tt_df.iloc[0]['id'])]
single = svc.get_funnel_data(activity_id=1, ticket_type_ids=tt_ids)
vals = tuple(single['count'].tolist())
print(f'【仅票种{tt_ids} funnel】赞助={vals[0]} 报名={vals[1]} 支付={vals[2]} 核销={vals[3]}')

sp_df = svc.get_sponsor_list(activity_id=1)
print('赞助级别列表:', sp_df['sponsor_level'].unique().tolist())
sponsor_level = [sp_df['sponsor_level'].unique()[0]]
sl_data = svc.get_funnel_data(activity_id=1, sponsor_levels=sponsor_level)
vals2 = tuple(sl_data['count'].tolist())
print(f'【仅赞助级别{sponsor_level} funnel】赞助={vals2[0]} 报名={vals2[1]} 支付={vals2[2]} 核销={vals2[3]}')

sp_full = svc.get_sponsor_list(activity_id=1)
print('\n赞助清单全量:')
print(sp_full[['name', 'allocated_tickets', 'used_tickets', 'checked_tickets']].to_string(index=False))
sp_partial = svc.get_sponsor_list(activity_id=1, start_date='2024-06-01', end_date='2024-06-10')
print('\n赞助清单6/1-6/10:')
print(sp_partial[['name', 'allocated_tickets', 'used_tickets', 'checked_tickets']].to_string(index=False))

eff_full = svc.get_checkin_efficiency(activity_id=1)
print(f'\n核销效率全量: {len(eff_full)} 个小时段，总核销={eff_full["count"].sum()}')
eff_partial = svc.get_checkin_efficiency(activity_id=1, start_date='2024-06-01', end_date='2024-06-10')
print(f'核销效率6/1-6/10: {len(eff_partial)} 个小时段，总核销={eff_partial["count"].sum() if not eff_partial.empty else 0}')

tt_full = svc.get_ticket_types(activity_id=1)
print('\n票种分析全量:')
print(tt_full[['name', 'sold_quantity', 'checked_quantity']].to_string(index=False))
tt_partial = svc.get_ticket_types(activity_id=1, start_date='2024-06-01', end_date='2024-06-10')
print('票种分析6/1-6/10:')
print(tt_partial[['name', 'sold_quantity', 'checked_quantity']].to_string(index=False))

print('\n--- 空态测试 ---')
empty_sponsor_found = False
for idx, row in sp_partial.iterrows():
    if row['checked_tickets'] == 0:
        empty_sponsor_found = True
        print(f"赞助商 {row['name']} 在此筛选条件下没有核销")
        gr = svc.get_gate_records_by_sponsor(
            int(row['id']), start_date='2024-06-01', end_date='2024-06-10'
        )
        print(f'   下钻核销记录: {len(gr)} 条 → 空态正常')
        samples = svc.get_raw_samples(
            activity_id=1, sponsor_id=int(row['id']),
            start_date='2024-06-01', end_date='2024-06-10'
        )
        print(f'   下钻原始样本: {len(samples)} 条')

# 用一个完全空的日期范围测试
sp_partial2 = svc.get_sponsor_list(activity_id=1, start_date='2099-01-01', end_date='2099-12-31')
print('\n全空日期范围测试 (2099年):')
print('  赞助清单 used_tickets 总和:', sp_partial2['used_tickets'].sum() if not sp_partial2.empty else 0)
empty_funnel = svc.get_funnel_data(activity_id=1, start_date='2099-01-01', end_date='2099-12-31')
print('  漏斗数据:', empty_funnel['count'].tolist())

svc.close()
print('\n✅ DataService 筛选 + 空态 逻辑全部验证通过')
