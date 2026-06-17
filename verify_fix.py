import urllib.request, json

def fetch(url):
    print(f'GET {url}')
    return json.loads(urllib.request.urlopen(url).read())

print('=== 1. 验证 calendar patient_id 筛选 ===')
cal_zhai = fetch('http://localhost:8000/api/drilldown/calendar?year=2025&month=3&patient_id=6')
days_zhai = [d for d in cal_zhai if d['session_count'] > 0]
print(f'患者ID=6 郑国强 3月有会话天数: {len(days_zhai)}/{len(cal_zhai)}')

cal_all = fetch('http://localhost:8000/api/drilldown/calendar?year=2025&month=3')
days_all = [d for d in cal_all if d['session_count'] > 0]
print(f'全院3月有会话天数: {len(days_all)}/{len(cal_all)}')

print()
print('=== 2. 验证 calendar prescription_id 筛选 ===')
cal_rx = fetch('http://localhost:8000/api/drilldown/calendar?year=2025&month=3&prescription_id=18')
sessions_rx = sum(d['session_count'] for d in cal_rx)
print(f'处方ID=18 (郑国强 肌力强化训练) 3月会话数: {sessions_rx}')
for d in cal_rx[:5]:
    if d['session_count'] > 0:
        first = d['details'][0] if d['details'] else {}
        eq = [e['equipment_name'] for e in first.get('equipment_records', [])]
        print(f"  {d['date']}: {d['session_count']}个, 会话1 status={first.get('status')} 设备={eq}")

print()
print('=== 3. 验证设备追溯接口(按session_id精确查询) ===')
sess_id = None
for d in cal_rx:
    if d['details'] and d['details'][0].get('equipment_records'):
        sess_id = d['details'][0]['id']
        break
if sess_id:
    print(f'使用会话ID={sess_id}查询设备')
    eq_list = fetch(f'http://localhost:8000/api/drilldown/equipment?session_id={sess_id}')
    for r in eq_list:
        print(f'  设备={r["equipment_name"]}, 患者={r["patient_name"]}, 治疗师={r["therapist_name"]}')
        print(f'  参数={json.dumps(r["parameters"], ensure_ascii=False) if r["parameters"] else None}')
else:
    print('未找到带设备的会话，使用任意session_id查询')
    eq_list = fetch('http://localhost:8000/api/drilldown/equipment?start_date=2025-01-01&end_date=2025-12-31')
    print(f'设备追溯记录数: {len(eq_list)}')

print()
print('=== 4. 全链路API冒烟测试 (dashboard趋势+summary) ===')
trend = fetch('http://localhost:8000/api/settlement/trend?start_date=2025-01-01&end_date=2025-12-31')
print(f'结算趋势点数: {len(trend)}')
print(f'  首月: {trend[0]["period"]} 总额={trend[0]["total_amount"]} 拒付={trend[0]["rejected_amount"]}')
summary = fetch('http://localhost:8000/api/settlement/summary?start_date=2025-01-01&end_date=2025-12-31')
print(f'总计: 总额={summary["total_settled"]}, 拒付率={summary["rejection_rate"]}%, 训练完成率={summary["completion_rate"]}%')
