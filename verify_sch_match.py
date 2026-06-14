import sys, os
sys.path.insert(0, '.')
os.environ['DB_TYPE'] = 'sqlite'

from datetime import date, timedelta
from data_processing import get_conflicts_df, get_appointments_df

end = date.today()
start = end - timedelta(days=60)

conflicts = get_conflicts_df(start, end)
appts = get_appointments_df(start, end)

cap = conflicts[conflicts['conflict_type'] == 'capacity_exceeded']

# 取前 10 条有匹配的
n_found = 0
for _, row in cap.iterrows():
    sch_no = row['schedule_no_1']
    related = appts[appts['schedule_no'] == sch_no]
    if len(related) > 0:
        print(f"\n✅ 有匹配的预约 appointment appointment 冲突 {row['conflict_no']} schedule_no_1={sch_no} desc={row['description']}")
        print(f"   匹配预约数: {len(related)}")
        r = related.iloc[0]
        print(f"   预约: {r['appointment_no']} 会员={r['member_name']} 教练={r['coach_name']} 状态={r['status']} 课程={r['course_name']} 容量={r['actual_capacity']}/{r['max_capacity']}")
        n_found += 1
        if n_found >= 3:
            break

n_matched = (cap['schedule_no_1'].isin(appts['schedule_no'])).sum()
print(f"\n总超容: {len(cap)} 条，匹配: {n_matched} 条")
