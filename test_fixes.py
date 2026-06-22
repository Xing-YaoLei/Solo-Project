import sys
sys.path.insert(0, '.')
print("Testing data service only...")

from utils.data_service import get_risk_summary, get_issue_detail, get_checklist_tree, get_supplier_ranking
print("Data service imported successfully")

from datetime import datetime, timedelta

ranking = get_supplier_ranking('absolute', 10)
print(f"\nSupplier ranking (count: {len(ranking)}):")
for r in ranking[:5]:
    print(f"  - {r['supplier_name']}: ¥{r['total_amount']:,.0f}, {r['issue_count']} issues, {r['transaction_count']} transactions")

ranking_pct = get_supplier_ranking('percentage', 10)
print(f"\nSupplier ranking percentage:")
for r in ranking_pct[:3]:
    print(f"  - {r['supplier_name']}: {r['percentage']}%")

detail_data = get_issue_detail(1)
if detail_data:
    print(f"Issue 1 title: {detail_data['title']}")
    print(f"Rectification plan: {detail_data['rectification_plan'] is not None}")
    if detail_data['rectification_plan']:
        print(f"  Plan owner: {detail_data['rectification_plan']['owner']}")
        print(f"  Plan progress: {detail_data['rectification_plan']['progress']}%")
        print(f"  Plan status: {detail_data['rectification_plan']['status']}")
        print(f"  Start date: {detail_data['rectification_plan']['start_date']}")

summary = get_risk_summary((datetime.now() - timedelta(days=180), datetime.now()))
print(f"\nTotal issues: {summary['total_issues']}")
print(f"Sampling coverage: {summary['sampling_coverage']}%")
print(f"Missing evidence: {summary['missing_evidence']}")
print(f"Risk dist: {summary['risk_distribution']}")
print(f"Status dist: {summary['status_distribution']}")
print(f"Overdue plans: {summary['overdue_plans']}")
print(f"Pending rectification: {summary['pending_rectification']}")

tree = get_checklist_tree()
print(f"\nChecklist categories: {len(tree)}")
for cat in tree:
    print(f"  - {cat['name']}: {len(cat['items'])} items, {cat['total_issues']} issues, {cat['completion_rate']}%")

print("\nALL DATA TESTS PASSED!")
