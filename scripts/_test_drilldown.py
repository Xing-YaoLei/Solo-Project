#!/usr/bin/env python3
"""测试下钻链路"""
import sys
sys.path.insert(0, '.')
from datetime import datetime, date, timedelta
from data.queries import (
    get_all_properties, get_room_status_calendar, get_ota_orders,
    get_payment_transactions, get_door_lock_records, get_cleaning_tasks,
    calculate_occupancy_rate, get_data_anomalies
)

props_df = get_all_properties()
print(f'房源数: {len(props_df)}')
if props_df.empty:
    print('❌ 无房源')
    sys.exit(1)

prop_id = str(props_df['id'].iloc[0])
print(f'测试房源ID: {prop_id}')

today = date.today()
start_date = today - timedelta(days=15)
end_date = today + timedelta(days=15)

# 1. 测试房态日历（热力图数据）
calendar_df = get_room_status_calendar(start_date, end_date, [prop_id])
print(f'\n1. 房态日历: {len(calendar_df)} 条')
if not calendar_df.empty:
    row = calendar_df.iloc[0]
    print(f'   property_id={row["property_id"]}, date={row["status_date"]}, room_type={row["room_type"]}')
    print(f'   热力图customdata参数完整 ✓')

# 2. 模拟下钻：拿一个有数据的日期
selected_date = None
room_type = None
pids = [prop_id]
if not calendar_df.empty and 'occupancy_status' in calendar_df.columns:
    occupied = calendar_df[calendar_df['occupancy_status'] == 'occupied']
    if not occupied.empty:
        test_row = occupied.iloc[0]
        sd = test_row['status_date']
        selected_date = sd.date() if hasattr(sd, 'date') else sd
        room_type = test_row['room_type']
        print(f'\n模拟下钻: date={selected_date}, room_type={room_type}')

if selected_date:
    # 3. 测试渠道订单
    orders_df = get_ota_orders(start_date, end_date, pids)
    if not orders_df.empty:
        orders_df = orders_df[(orders_df['check_in_date'] <= selected_date) & (orders_df['check_out_date'] > selected_date)]
        if room_type and 'room_type' in orders_df.columns:
            orders_df = orders_df[orders_df['room_type'] == room_type]
    print(f'2. 渠道订单: {len(orders_df)} 条 {"✓" if not orders_df.empty else "⚠"}')

    # 4. 测试保洁任务
    cleaning_df = get_cleaning_tasks(selected_date, selected_date, pids)
    if not cleaning_df.empty and room_type and 'room_type' in cleaning_df.columns:
        cleaning_df = cleaning_df[cleaning_df['room_type'] == room_type]
    print(f'3. 保洁任务: {len(cleaning_df)} 条 {"✓" if not cleaning_df.empty else "⚠"}')

    # 5. 测试OTA订单原始样本
    has_raw_ota = False
    if not orders_df.empty and 'raw_data' in orders_df.columns:
        has_raw_ota = True
    print(f'4. OTA订单原始样本: {"✓ 可用" if has_raw_ota else "⚠ 无raw_data"}')

    # 6. 测试收款流水原始样本
    pay_df = get_payment_transactions(
        datetime.combine(selected_date, datetime.min.time()),
        datetime.combine(selected_date, datetime.max.time()),
        pids
    )
    print(f'5. 收款流水原始样本: {len(pay_df)} 条 {"✓" if not pay_df.empty else "⚠"}')

    # 7. 测试门锁记录原始样本
    lock_df = get_door_lock_records(
        datetime.combine(selected_date, datetime.min.time()),
        datetime.combine(selected_date, datetime.max.time()),
        pids
    )
    print(f'6. 门锁记录原始样本: {len(lock_df)} 条 {"✓" if not lock_df.empty else "⚠"}')

# 8. 测试KPI/趋势图使用的入住率数据
occ_df = calculate_occupancy_rate(start_date, end_date, pids, 'day')
print(f'\n7. 入住率数据: {len(occ_df)} 条')
if not occ_df.empty:
    print(f'   列名: {list(occ_df.columns)}')
    avg_occ = float(occ_df['occupancy_rate'].mean()) / 100.0
    total_nights = int(occ_df['occupied_count'].sum())
    total_conflicts = int(occ_df['conflict_count'].sum())
    print(f'   avg_occ={avg_occ*100:.1f}%, nights={total_nights}, conflicts={total_conflicts}')
    print(f'   KPI数据完整 ✓')

# 9. 测试异常图数据
anom_df = get_data_anomalies(is_resolved=False)
print(f'\n8. 异常数据: {len(anom_df)} 条 {"✓" if not anom_df.empty else "⚠"}')

print('\n✅ 下钻链路验证完成')
