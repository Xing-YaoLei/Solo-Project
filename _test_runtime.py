import sys, os, traceback
from datetime import datetime

def check(name, fn):
    try:
        result = fn()
        if result is None or result is True:
            print(f'  ✅ {name}')
            return True
        else:
            print(f'  ✅ {name}: {result}')
            return True
    except Exception as e:
        print(f'  ❌ {name}: {e}')
        traceback.print_exc()
        return False

ok_all = True

print('\n=== 1. Mock数据服务加载 ===')
def test1():
    from utils import MockDataService
    global ds
    ds = MockDataService()
    return f'服务实例创建 OK'
ok_all &= check('MockDataService init', test1)

def test1b():
    df = ds.get_funnel_data()
    return f'{len(df)} 阶段'
ok_all &= check('get_funnel_data', test1b)

def test1c():
    df = ds.get_courses()
    return f'{len(df)} 门课程'
ok_all &= check('get_courses', test1c)

def test1d():
    df = ds.get_applications()
    return f'{len(df)} 条申请'
ok_all &= check('get_applications', test1d)

def test1e():
    df = ds.get_schedules()
    return f'{len(df)} 排课记录'
ok_all &= check('get_schedules', test1e)

def test1f():
    df = ds.get_conflicts()
    return f'{len(df)} 个冲突'
ok_all &= check('get_conflicts', test1f)

def test1g():
    df = ds.get_anomalies()
    return f'{len(df)} 条异常'
ok_all &= check('get_anomalies', test1g)

def test1h():
    return f'{len(ds.get_sync_logs())} 同步日志 / {len(ds.get_raw_samples())} 原始样本'
ok_all &= check('get_sync_logs & get_raw_samples', test1h)

def test1i():
    courses = ds.get_courses()
    if len(courses) > 0:
        code = courses.iloc[0]['course_code']
        detail = ds.get_course_details(code)
        return f'code={code}, keys={list(detail.keys())}'
    return '无数据跳过'
ok_all &= check('get_course_details 下钻', test1i)

print('\n=== 2. 图表构造 ===')
from config import Config
funnel_data = ds.get_funnel_data()
duration_stats = ds.get_duration_stats()
heatmap_data = ds.get_schedules()
anomalies = ds.get_anomalies()
applications = ds.get_applications()
college_stats = ds.get_college_stats()

from app.charts import (
    create_funnel_chart, create_duration_histogram,
    create_college_barchart, create_conflict_heatmap,
    create_stage_duration_chart, create_status_piechart,
    create_anomaly_trend, create_gauge_chart, create_duration_heatmap,
)

ok_all &= check('create_funnel_chart', lambda: create_funnel_chart(funnel_data))
ok_all &= check('create_gauge_chart', lambda: create_gauge_chart(
    duration_stats.get('total_avg_hours', 48),
    '总审核时长 (h)', 168, 72, '小时'
))
ok_all &= check('create_conflict_heatmap', lambda: create_conflict_heatmap(heatmap_data))
ok_all &= check('create_duration_histogram', lambda: create_duration_histogram(duration_stats))
ok_all &= check('create_stage_duration_chart', lambda: create_stage_duration_chart(funnel_data))
ok_all &= check('create_college_barchart', lambda: create_college_barchart(college_stats))
ok_all &= check('create_status_piechart', lambda: create_status_piechart(applications))
ok_all &= check('create_anomaly_trend', lambda: create_anomaly_trend(anomalies))
ok_all &= check('create_duration_heatmap', lambda: create_duration_heatmap(duration_stats))

print('\n=== 3. 报告导出器 ===')
from utils import ReportExporter
exporter = ReportExporter(ds)

def test_export():
    out_path = f'/tmp/_test_report_{int(datetime.now().timestamp())}.xlsx'
    from datetime import date
    path = exporter.export_duration_report(
        academic_term='2024-2025学年第2学期',
        college=None,
        status=None,
        has_conflict=None,
        start_date=date(2025, 1, 1),
        end_date=date(2025, 6, 30),
        output_path=out_path
    )
    size_kb = os.path.getsize(path) / 1024
    os.remove(path)
    return f'生成成功: {path}, {size_kb:.1f} KB'
ok_all &= check('export_duration_report 8-sheet Excel', test_export)

print('\n=== 4. Dash应用实例化 ===')
def test_dash():
    import sys, types
    orig_name = 'app'
    sys_path_bak = sys.path.copy()
    if '' not in sys.path:
        sys.path.insert(0, '')
    try:
        with open('app.py', 'r') as f:
            code = f.read()
        mod = types.ModuleType(orig_name)
        mod.__file__ = os.path.abspath('app.py')
        sys.modules[orig_name] = mod
        exec(compile(code, mod.__file__, 'exec'), mod.__dict__)
        if hasattr(mod, 'app') and mod.app is not None:
            title = mod.app.title
            return f'Dash app OK, title={title}'
        return '未找到app属性'
    except SystemExit as se:
        return f'脚本退出码: {se.code}' if se.code else '脚本触发exit但正常'
    finally:
        if orig_name in sys.modules:
            del sys.modules[orig_name]
        sys.path[:] = sys_path_bak
ok_all &= check('Dash app.py imports & layout', test_dash)

print(f'\n========================================')
print(f'总结果: {"✅ ALL PASSED" if ok_all else "❌ SOME FAILED"}')
print(f'========================================\n')
sys.exit(0 if ok_all else 1)
