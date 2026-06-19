from datetime import date, timedelta
from data.queries import DataQueryService
from data.database import SessionLocal
from data.models import InsuranceMaterial

print('=== 保险材料直接数据库查询 ===')
db = SessionLocal()
total = db.query(InsuranceMaterial).count()
print(f'总数: {total}')
if total > 0:
    samples = db.query(InsuranceMaterial).limit(5).all()
    for s in samples:
        print(f'  {s.insurance_company} | {s.damage_type} | {s.claim_status} | 定损:{s.estimated_amount}')
    companies = db.query(InsuranceMaterial.insurance_company).distinct().all()
    print(f'\n保险公司去重后: {[c[0] for c in companies]}')
    damages = db.query(InsuranceMaterial.damage_type).distinct().all()
    print(f'损伤类型去重后: {[d[0] for d in damages]}')
    statuses = db.query(InsuranceMaterial.claim_status).distinct().all()
    print(f'理赔状态去重后: {[s[0] for s in statuses]}')
db.close()

print('\n=== 通过 QueryService 查询 ===')
with DataQueryService() as svc:
    start = date.today() - timedelta(days=90)
    end = date.today()
    stats = svc.get_insurance_stats(start, end)
    print(f'理赔单数: {stats["total_claims"]}')
    print(f'定损总额: {stats["total_estimated"]}')
    print(f'赔付率: {stats["approval_rate"]}%')
    print('公司分布:')
    for c in stats['company_distribution']:
        print(f'  {c["insurance_company"]}: {c["claim_count"]}单')
    detail = svc.get_insurance_detail(start, end)
    print(f'\n明细表记录数: {len(detail)}')
    if len(detail) > 0:
        print(detail.head(2))
