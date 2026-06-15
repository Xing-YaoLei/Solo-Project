import sys
sys.path.insert(0, '.')

from src.data.database import db
from src.utils.filters import build_filter_conditions

# 测试默认筛选
filters = {
    'term_id': '全部',
    'dept_id': '全部',
    'course_id': '全部',
    'grade': '全部',
    'order_status': '全部',
    'publisher': '全部',
    'data_source': '全部',
    'price_min': 0.0,
    'price_max': 200.0,
    'search_text': ''
}

where_sql, params = build_filter_conditions(filters)
print('where_sql:', repr(where_sql))
print('params:', params)
print()

sql = f"""
SELECT 
    o.order_id,
    o.course_id,
    c.course_name,
    c.course_code,
    d.dept_name,
    o.term_id,
    t.term_name,
    o.textbook_isbn,
    o.textbook_name,
    o.publisher,
    o.price,
    o.quantity,
    o.order_status,
    o.data_source,
    o.created_at,
    o.updated_at,
    c.student_count,
    c.grade,
    c.major
FROM textbook_order o
JOIN course c ON o.course_id = c.course_id
JOIN department d ON c.dept_id = d.dept_id
JOIN academic_term t ON o.term_id = t.term_id
{where_sql}
ORDER BY o.created_at DESC
LIMIT 5
"""

print('SQL:', sql[:200], '...')
print()

try:
    result = db.query(sql, params if params else None)
    print(f'✅ 查询成功！返回 {len(result)} 条记录')
    print()
    if not result.is_empty():
        print('前几条记录:')
        for row in result.to_dicts():
            print(f'  {row["order_id"]}: {row["textbook_name"]} - {row["course_name"]}')
except Exception as e:
    print(f'❌ 查询失败: {e}')
    import traceback
    traceback.print_exc()

print()
print('=' * 50)
print()

# 测试带筛选条件的查询
filters2 = {
    'term_id': '2024-2025-2',
    'dept_id': 'DEPT001',
    'course_id': '全部',
    'grade': '全部',
    'order_status': 'approved',
    'publisher': '全部',
    'data_source': '全部',
    'price_min': 0.0,
    'price_max': 200.0,
    'search_text': ''
}

where_sql2, params2 = build_filter_conditions(filters2)
print('带筛选条件的 where_sql:', repr(where_sql2))
print('params:', params2)
print()

sql2 = f"""
SELECT COUNT(*) as count
FROM textbook_order o
JOIN course c ON o.course_id = c.course_id
JOIN department d ON c.dept_id = d.dept_id
{where_sql2}
"""

try:
    result2 = db.query(sql2, params2 if params2 else None)
    print(f'✅ 带筛选条件的查询成功！匹配 {result2["count"][0]} 条记录')
except Exception as e:
    print(f'❌ 带筛选条件的查询失败: {e}')

print()
print('=' * 50)
print()

# 测试评教分析接口
from src.analysis.evaluation_analysis import evaluation_analysis

print('测试评教分析接口...')
try:
    coverage = evaluation_analysis.get_evaluation_coverage('2024-2025-2', {'dept_id': '全部', 'course_id': '全部'})
    print(f'✅ get_evaluation_coverage: {coverage}')
    print()
    
    improvement = evaluation_analysis.analyze_coverage_improvement('2024-2025-2')
    print(f'✅ analyze_coverage_improvement: {improvement}')
    print()
    
    dept_coverage = evaluation_analysis.get_coverage_by_department('2024-2025-2')
    print(f'✅ get_coverage_by_department: {len(dept_coverage)} 个院系')
    print()
    
    term_trend = evaluation_analysis.get_term_trend()
    print(f'✅ get_term_trend: {len(term_trend)} 个学期')
    print()
    
    correlation = evaluation_analysis.get_correlation_analysis('2024-2025-2')
    print(f'✅ get_correlation_analysis keys: {list(correlation.keys()) if correlation else "空"}')
    
except Exception as e:
    print(f'❌ 评教分析接口测试失败: {e}')
    import traceback
    traceback.print_exc()

print()
print('=' * 50)
print()

# 测试缺口分析
from src.data.gap_analyzer import gap_analyzer

print('测试缺口分析（包含 no_student_application）...')
try:
    gaps = gap_analyzer.analyze_gaps('2024-2025-2')
    print(f'✅ 识别到 {len(gaps)} 个缺口')
    gap_types = {}
    for gap in gaps:
        gap_type = gap['gap_type']
        gap_types[gap_type] = gap_types.get(gap_type, 0) + 1
    print('缺口类型分布:')
    for gap_type, count in gap_types.items():
        print(f'  {gap_type}: {count} 个')
    
    if 'no_student_application' in gap_types:
        print(f'✅ 成功识别到 {gap_types["no_student_application"]} 个 no_student_application 缺口！')
    else:
        print('⚠️  未识别到 no_student_application 缺口（可能需要重新生成数据）')
        
except Exception as e:
    print(f'❌ 缺口分析测试失败: {e}')
    import traceback
    traceback.print_exc()

print()
print('=' * 50)
print()

# 测试导出服务
from src.export.export_utils import export_service

print('测试导出服务...')
try:
    # 获取一些测试数据
    test_df = db.query("SELECT * FROM textbook_order LIMIT 10")
    test_filters = {'term_id': '2024-2025-2', 'dept_id': 'DEPT001'}
    
    # 测试 Excel 导出
    file_bytes, file_name, storage_path = export_service.export_textbooks(test_df, test_filters, 'excel', save_to_storage=False)
    print(f'✅ Excel 导出成功: {file_name}, 大小: {len(file_bytes)} bytes')
    
    # 测试 PDF 导出
    file_bytes, file_name, storage_path = export_service.export_textbooks(test_df, test_filters, 'pdf', save_to_storage=False)
    print(f'✅ PDF 导出成功: {file_name}, 大小: {len(file_bytes)} bytes')
    
except Exception as e:
    print(f'❌ 导出服务测试失败: {e}')
    import traceback
    traceback.print_exc()

print()
print('=' * 50)
print('所有测试完成！')
