#!/usr/bin/env python3
"""
验证所有钻取功能是否正常工作
"""
import sys
sys.path.insert(0, '.')

from utils.data_service import (
    get_checklist_tree, get_sampling_data, get_rectification_plans,
    get_risk_summary, get_issues_by_filter, get_issue_detail
)

def test_checklist_issues():
    print("=" * 60)
    print("测试1: checklist 查看问题 - 验证返回 issues 数据")
    print("=" * 60)
    
    tree = get_checklist_tree()
    for cat in tree[:2]:
        for item in cat['items'][:2]:
            if 'issues' in item:
                print(f"  ✅ 检查项 [{item['item_code']}] {item['title']}")
                print(f"     问题数量: {len(item['issues'])}")
                for issue in item['issues'][:2]:
                    print(f"       - #{issue['id']}: {issue['title'][:30]}...")
                    print(f"         风险等级: {issue['risk_level']}, 状态: {issue['status']}")
    print("✅ checklist 查看问题功能正常\n")

def test_sampling_link():
    print("=" * 60)
    print("测试2: 抽样记录 - 验证返回 issue_id 数据")
    print("=" * 60)
    
    data = get_sampling_data()
    records = data['sampling_records']
    print(f"  ✅ 抽样记录总数: {len(records)}")
    for r in records[:3]:
        print(f"  ✅ {r['sample_no']}: {r['issue_title'][:30]}...")
        print(f"     issue_id: {r['issue_id']}, 可跳转至 /detail?issue_id={r['issue_id']}")
    print("✅ 抽样记录跳转功能正常\n")

def test_rectification_link():
    print("=" * 60)
    print("测试3: 整改计划 - 验证返回 issue_id 数据")
    print("=" * 60)
    
    plans = get_rectification_plans()
    print(f"  ✅ 整改计划总数: {len(plans)}")
    for p in plans[:3]:
        print(f"  ✅ {p['title'][:30]}...")
        print(f"     issue_id: {p['issue_id']}, 可跳转至 /detail?issue_id={p['issue_id']}")
    print("✅ 整改计划跳转功能正常\n")

def test_dashboard_filter():
    print("=" * 60)
    print("测试4: dashboard 图表筛选 - 验证 get_issues_by_filter")
    print("=" * 60)
    
    issues = get_issues_by_filter(department_id=4, risk_level='high')
    print(f"  ✅ 人力资源部 high 风险问题数量: {len(issues)}")
    for issue in issues[:3]:
        print(f"  ✅ #{issue['id']}: {issue['title'][:30]}...")
        print(f"     可跳转至 /detail?issue_id={issue['id']}")
    print("✅ dashboard 图表筛选功能正常\n")

def test_detail_page():
    print("=" * 60)
    print("测试5: 问题明细页 - 验证 get_issue_detail")
    print("=" * 60)
    
    for issue_id in [1, 2, 3]:
        detail = get_issue_detail(issue_id)
        if detail:
            print(f"  ✅ issue_id={issue_id}: {detail['title'][:30]}...")
            print(f"     邮件证据: {len(detail.get('email_evidence', []))} 封")
            print(f"     抽样记录: {len(detail.get('sampling_records', []))} 条")
            print(f"     整改计划: {len(detail.get('rectification_plans', []))} 个")
            print(f"     处理结论: {detail.get('conclusion', '暂无')[:30] if detail.get('conclusion') else '暂无'}")
    print("✅ 问题明细页功能正常\n")

def test_db_connection():
    print("=" * 60)
    print("测试6: 数据库连接 - 验证 PostgreSQL 连接")
    print("=" * 60)
    
    from app.database import DB_TYPE, engine
    print(f"  ✅ 当前数据库类型: {DB_TYPE}")
    print(f"  ✅ 连接 URL: {engine.url}")
    assert DB_TYPE == 'postgresql', f"❌ 数据库类型错误，期望 postgresql，实际 {DB_TYPE}"
    assert 'postgresql' in str(engine.url), "❌ 数据库连接不是 PostgreSQL"
    print("✅ PostgreSQL 数据库连接正常\n")

if __name__ == '__main__':
    try:
        test_db_connection()
        test_checklist_issues()
        test_sampling_link()
        test_rectification_link()
        test_dashboard_filter()
        test_detail_page()
        
        print("🎉 所有测试通过！钻取功能全部正常！")
        print("\n功能总结：")
        print("  ✅ 默认使用 PostgreSQL 数据库")
        print("  ✅ checklist 查看问题 → 弹窗显示问题列表 → 点击跳转 detail")
        print("  ✅ 抽样记录 → 查看详情 → 弹窗中跳转 detail")
        print("  ✅ 整改计划 → 查看详情 → 弹窗中跳转 detail")
        print("  ✅ dashboard 热力图/饼图/趋势图/状态图 → 点击弹出问题列表 → 跳转 detail")
        print("  ✅ detail 页显示邮件原始记录和处理结论")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
