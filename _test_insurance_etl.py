from datetime import date, timedelta
from tasks.etl_tasks import etl_insurance_task, etl_full_pipeline_task
from data.database import SessionLocal
from data.models import InsuranceMaterial, ETLLog

print('=== 测试1：模拟来自外部保险系统的原始数据 ===')
external_insurance_data = [
    {
        'order_no': 'WO1001',
        'insurance_company': 'picc',
        'policy_no': 'pol-882345-001',
        'claim_no': 'cl-992345-001',
        'damage_type': '追尾',
        'accident_date': date.today() - timedelta(days=3),
        'damage_description': '后保险杠追尾受损严重',
        'estimated_amount': '5,800.00',
        'approved_amount': '5,500.00',
        'claim_status': 'received',
        'source_system': 'insurance_api',
        'source_id': 'EXT-INS-001',
    },
    {
        'order_no': 'WO1002',
        'insurance_company': '平安',
        'policy_no': 'POL 772346 002',
        'claim_no': 'CL 662346 002',
        'damage_type': '剐蹭',
        'accident_date': date.today() - timedelta(days=5),
        'damage_description': '左侧车门剐蹭掉漆',
        'estimated_amount': 2200,
        'approved_amount': 2000,
        'claim_status': '审核',
        'source_system': 'insurance_api',
        'source_id': 'EXT-INS-002',
    },
    {
        'order_no': 'WO1003',
        'insurance_company': '太保',
        'policy_no': 'POL552347003',
        'claim_no': 'CL442347003',
        'damage_type': '水淹',
        'accident_date': date.today() - timedelta(days=10),
        'damage_description': '暴雨天气车辆被淹',
        'estimated_amount': 28000,
        'approved_amount': 25000,
        'claim_status': '已赔付',
        'source_system': 'insurance_api',
        'source_id': 'EXT-INS-003',
    },
]

print(f'输入数据: {len(external_insurance_data)} 条')
for d in external_insurance_data:
    print(f"  {d['source_id']}: {d['insurance_company']} | {d['damage_type']} | {d['claim_status']}")

print('\n=== 测试2：调用 etl_insurance_task 同步执行 ===')
result = etl_insurance_task(source_system='insurance_api', source_data=external_insurance_data)
print(f'ETL执行结果: {result}')

print('\n=== 测试3：验证数据写入数据库 ===')
db = SessionLocal()
try:
    total = db.query(InsuranceMaterial).filter(
        InsuranceMaterial.source_system == 'insurance_api'
    ).count()
    print(f'写入 insurance_api 系统的记录数: {total}')

    records = db.query(InsuranceMaterial).filter(
        InsuranceMaterial.source_system == 'insurance_api'
    ).all()
    for r in records:
        print(f"  {r.source_id}: {r.insurance_company} | {r.damage_type} | {r.claim_status} | "
              f"定损={r.estimated_amount} | 核赔={r.approved_amount}")

    print('\n清洗口径匹配验证:')
    companies = db.query(InsuranceMaterial.insurance_company).filter(
        InsuranceMaterial.source_system == 'insurance_api'
    ).distinct().all()
    print(f'  保险公司(标准化后): {[c[0] for c in companies]}')
    damages = db.query(InsuranceMaterial.damage_type).filter(
        InsuranceMaterial.source_system == 'insurance_api'
    ).distinct().all()
    print(f'  损伤类型(标准化后): {[d[0] for d in damages]}')
    statuses = db.query(InsuranceMaterial.claim_status).filter(
        InsuranceMaterial.source_system == 'insurance_api'
    ).distinct().all()
    print(f'  理赔状态(标准化后): {[s[0] for s in statuses]}')

    print('\nETL日志验证:')
    logs = db.query(ETLLog).filter(
        ETLLog.task_name == 'etl_insurance'
    ).order_by(ETLLog.id.desc()).limit(3).all()
    for log in logs:
        print(f"  {log.id}: {log.task_name} | {log.source_system} | {log.status} | "
              f"input={log.records_input}, output={log.records_output}, "
              f"dedup={log.records_deduplicated}, invalid={log.records_invalid}")
finally:
    db.close()

print('\n=== 测试4：etl_full_pipeline_task 派发保险任务检查 ===')
from celery import Signature
full_result = etl_full_pipeline_task(source_systems=['insurance'])
print(f'全量流水线派发结果(insurance系统):')
for k, v in full_result.items():
    if isinstance(v, dict) and 'error' not in v:
        print(f'  {k}:')
        for task_name, task_id in v.items():
            print(f'    {task_name}: {task_id}')
    else:
        print(f'  {k}: {v}')

print('\n✅ 保险材料ETL任务测试完成！')
