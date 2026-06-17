import urllib.request, json

def fetch(url):
    return json.loads(urllib.request.urlopen(url).read())

print('=== 第1层: 评估量表 ===')
assessments = fetch('http://localhost:8000/api/drilldown/assessments?start_date=2025-01-01&end_date=2025-12-31')
linked = [a for a in assessments if a['has_linked_prescription']]
print(f'评估总数={len(assessments)}, 已关联处方={len(linked)}')
a = linked[0]
print(f'  评估ID={a["id"]}, 患者={a["patient_name"]}, 量表={a["scale_name"]}, 关联处方ID={a["linked_prescription_id"]}')

print()
print('=== 第2层: 训练处方 ===')
prescriptions = fetch('http://localhost:8000/api/drilldown/prescriptions?start_date=2025-01-01&end_date=2025-12-31')
p = prescriptions[0]
print(f'处方ID={p["id"]}, 患者={p["patient_name"]}, 评估ID={p["assessment_id"]}')
print(f'  处方名={p["prescription_name"]}, 总会话={p["total_sessions"]}, 完成={p["completed_sessions"]}, 完成率={p["completion_rate"]}%')

print()
print('=== 第3层: 治疗日历(2025年3月) ===')
calendar = fetch('http://localhost:8000/api/drilldown/calendar?year=2025&month=3')
days_with_sessions = [d for d in calendar if d['scheduled_count'] > 0]
print(f'有会话天数={len(days_with_sessions)}/{len(calendar)}')
for d in days_with_sessions[:3]:
    print(f'  日期={d["date"]}, 预约={d["scheduled_count"]}, 完成={d["completed_count"]}')
    for s in d['details'][:2]:
        eq_recs = s.get('equipment_records', [])
        eq_names = [e['equipment_name'] for e in eq_recs] if eq_recs else []
        print(f'    会话: {s.get("time","")} {s.get("project_name","")} {s.get("status","")} 设备={eq_names}')
        if eq_recs:
            for e in eq_recs[:1]:
                params = json.dumps(e.get("parameters"), ensure_ascii=False) if e.get("parameters") else None
                print(f'      设备: ID={e["id"]} 名称={e["equipment_name"]} 时长={e.get("duration")}分 参数={params}')

print()
print('=== 第4-5层: 设备追溯(含患者/治疗师/参数) ===')
equipments = fetch('http://localhost:8000/api/drilldown/equipment?start_date=2025-01-01&end_date=2025-12-31')
print(f'设备追溯记录总数: {len(equipments)}')
for r in equipments[:3]:
    params = json.dumps(r["parameters"], ensure_ascii=False) if r["parameters"] else None
    print(f'  设备={r["equipment_name"]}, 患者={r["patient_name"]}, 治疗师={r["therapist_name"]}')
    print(f'    治疗日期={r["treatment_date"]}, 项目={r["project_name"]}, 时长={r.get("duration")}分')
    print(f'    参数={params}')
