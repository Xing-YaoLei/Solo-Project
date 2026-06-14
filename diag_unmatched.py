import sys, os
sys.path.insert(0, '.')
os.environ['DB_TYPE'] = 'sqlite'

from datetime import date, timedelta
from data_processing import get_conflicts_df, get_appointments_df
from utils.db_adapter import SessionLocal, Appointment, CourseSchedule

end = date.today()
start = end - timedelta(days=60)

conflicts = get_conflicts_df(start, end)
cap = conflicts[conflicts['conflict_type'] == 'capacity_exceeded']
appts = get_appointments_df(start, end)

# 诊断：为什么有些 schedule_no_1 匹配不到
unmatched = []
matched = []
for _, row in cap.iterrows():
    sch_no = row['schedule_no_1']
    related = appts[appts['schedule_no'] == sch_no]
    if len(related) == 0:
        unmatched.append(row)
    else:
        matched.append(row)

print(f"matched: {len(matched)}, unmatched: {len(unmatched)}")

# 用 DB 直接查 unmatched 示例
s = SessionLocal()
if unmatched:
    sample_sch_no = unmatched[0]['schedule_no_1']
    sample_date = unmatched[0]['conflict_date']
    print(f"\nUnmatched 示例: schedule_no_1={sample_sch_no}, conflict_date={sample_date}")
    
    # 查 course_schedule
    sch = s.query(CourseSchedule).filter(CourseSchedule.schedule_no == sample_sch_no).first()
    if sch:
        print(f"  CourseSchedule 存在: id={sch.id}, date={sch.course_date}, actual={sch.actual_capacity}, max={sch.max_capacity}")
        # 直接查 appointment 用 schedule_id
        appt_count = s.query(Appointment).filter(Appointment.schedule_id == sch.id).count()
        print(f"  DB 中 appointment with schedule_id={sch.id}: {appt_count} 条")
        
        # 查 appointments 所有日期范围
        all_appt = s.query(Appointment).filter(Appointment.schedule_id == sch.id).all()
        for a in all_appt[:3]:
            print(f"    appt: {a.appointment_no} date={a.appointment_date}")
    
    # 看看 date 是否在 appts 范围内
    appt_dates = set()
    for d in sorted(appts['appointment_date'].unique()):
        appt_dates.add(str(d))
    print(f"  appt 包含日期 {sample_date}: {str(sample_date) in appt_dates}")

# 额外：看 unmatched 的 conflict_date 分布
unmatched_df = cap[cap['schedule_no_1'].isin([u['schedule_no_1'] for u in unmatched])]
print(f"\nunmatched conflict_date 范围: {unmatched_df['conflict_date'].min()} ~ {unmatched_df['conflict_date'].max()}")
print(f"appointments_df date 范围: {appts['appointment_date'].min()} ~ {appts['appointment_date'].max()}")

s.close()
