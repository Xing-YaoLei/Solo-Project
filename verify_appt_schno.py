import sys, os, traceback
sys.path.insert(0, '.')
os.environ['DB_TYPE'] = 'sqlite'

from datetime import date, timedelta
from data_processing import get_conflicts_df, get_appointments_df

end = date.today()
start = end - timedelta(days=60)

try:
    appts = get_appointments_df(start, end)
    cols = list(appts.columns)
    print("COLUMNS:", cols)
    has_sch = 'schedule_no' in cols
    notnull = appts['schedule_no'].notna().sum() if has_sch else 0
    print(f"HAS schedule_no: {has_sch}")
    print(f"schedule_no notnull: {notnull} / {len(appts)}")
    print(f"NEW cols present: course_type={'course_type' in cols}, course_name={'course_name' in cols}")
    print(f"NEW cols present: max_capacity={'max_capacity' in cols}, actual_capacity={'actual_capacity' in cols}")

    conflicts = get_conflicts_df(start, end)
    cap = conflicts[conflicts['conflict_type'] == 'capacity_exceeded']
    print(f"\ncapacity_exceeded conflicts: {len(cap)}")

    if len(cap) > 0:
        n_ok = 0
        n_empty = 0
        for _, row in cap.iterrows():
            sch_no = row['schedule_no_1']
            related = appts[appts['schedule_no'] == sch_no]
            if len(related) > 0:
                n_ok += 1
            else:
                n_empty += 1

        print(f"超容冲突有匹配预约: {n_ok}")
        print(f"超容冲突无匹配预约: {n_empty}")

        sample = cap.iloc[0]
        sch_no = sample['schedule_no_1']
        related = appts[appts['schedule_no'] == sch_no]
        print(f"\n示例超容 {sample['schedule_no_1']} {sample['description']}:")
        print(f"匹配预约数: {len(related)}")
        if len(related) > 0:
            r = related.iloc[0]
            print(f"  appointment_no={r['appointment_no']}")
            print(f"  member_name={r['member_name']} coach={r['coach_name']}")
            print(f"  status={r['status']} course={r['course_name']} ({r['course_type']})")
            print(f"  capacity: {r['actual_capacity']}/{r['max_capacity']}")

    print("\n✅ DONE")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    traceback.print_exc()
