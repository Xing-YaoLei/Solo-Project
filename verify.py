import sys
sys.path.insert(0, '.')

from datetime import date, timedelta
from src.data.simulator import DataSimulator
from src.data.repository import DataRepository
from src.data.duckdb_manager import DuckDBManager
from src.pipeline.manager import PipelineManager
from src.charts.chart_builder import ChartBuilder
from src.utils.export_manager import ExportManager
from src.config import Config


def test_data_layer():
    print("=== 测试数据层 ===")
    db = DuckDBManager()
    print("✓ DuckDB 连接成功")

    simulator = DataSimulator()
    counts = simulator.initialize_all_data(days=30)
    print(f"✓ 模拟数据生成完成:")
    for k, v in counts.items():
        print(f"  - {k}: {v} 条")

    return True


def test_repository():
    print("\n=== 测试数据仓库 ===")
    repo = DataRepository()

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    funnel = repo.get_complaints_funnel(start_date, end_date)
    print(f"✓ 投诉漏斗数据: {len(funnel)} 条")

    daily = repo.get_daily_trend(start_date, end_date)
    print(f"✓ 每日趋势数据: {len(daily)} 条")

    region = repo.get_complaints_by_region(start_date, end_date)
    print(f"✓ 区域对比数据: {len(region)} 条")

    tag = repo.get_complaints_by_tag(start_date, end_date)
    print(f"✓ 标签分布数据: {len(tag)} 条")

    close_hours = repo.get_close_hours_distribution(start_date, end_date)
    print(f"✓ 关闭时长分布: {len(close_hours)} 条")

    followup = repo.get_followup_results(start_date, end_date)
    print(f"✓ 回访结果数据: {len(followup)} 条")

    resp = repo.get_responsibility_distribution(start_date, end_date)
    print(f"✓ 责任归属数据: {len(resp)} 条")

    timeout = repo.get_timeout_complaints(24, start_date, end_date)
    print(f"✓ 超时投诉数据: {len(timeout)} 条")

    current, previous = repo.get_yo_y_data(start_date, end_date)
    print(f"✓ 同比数据: 本期 {len(current)} 天, 同期 {len(previous)} 天")

    return True


def test_pipeline():
    print("\n=== 测试取数链路 ===")
    pipeline = PipelineManager()

    steps = pipeline.get_step_info()
    print(f"✓ 取数步骤: {len(steps)} 步")
    for step in steps:
        print(f"  - {step['name']} ({step['id']})")

    end_date = date.today()
    start_date = end_date - timedelta(days=7)

    result = pipeline.run_single_step("step1_orders", start_date, end_date)
    print(f"✓ 单步执行测试: {result['status']}, 记录数: {result.get('records_count', 0)}")

    runs = pipeline.get_recent_runs(limit=5)
    print(f"✓ 近期运行记录: {len(runs)} 条")

    return True


def test_charts():
    print("\n=== 测试图表构建 ===")
    chart_builder = ChartBuilder()
    repo = DataRepository()

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    funnel = repo.get_complaints_funnel(start_date, end_date)
    fig = chart_builder.funnel_chart(funnel)
    print(f"✓ 漏斗图构建成功")

    daily = repo.get_daily_trend(start_date, end_date)
    fig = chart_builder.daily_trend_chart(daily)
    print(f"✓ 趋势图构建成功")

    tag = repo.get_complaints_by_tag(start_date, end_date)
    fig = chart_builder.tag_distribution_chart(tag)
    print(f"✓ 标签分布图构建成功")

    return True


def test_export():
    print("\n=== 测试导出功能 ===")
    export_mgr = ExportManager()
    repo = DataRepository()

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    filters = {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "region": "全部",
        "threshold": 24
    }

    filter_hash = export_mgr.generate_filter_hash(filters)
    print(f"✓ 筛选哈希生成: {filter_hash}")

    share_str = export_mgr.build_shareable_filter_string(filters)
    print(f"✓ 分享字符串生成: {share_str[:30]}...")

    parsed = export_mgr.parse_shareable_filter_string(share_str)
    print(f"✓ 分享字符串解析: {'成功' if parsed else '失败'}")

    daily = repo.get_daily_trend(start_date, end_date)
    csv_data = export_mgr.export_to_csv(daily, filters, "测试报表")
    print(f"✓ CSV 导出成功, 大小: {len(csv_data)} 字节")

    return True


def test_config():
    print("\n=== 测试配置 ===")
    print(f"✓ 景区名称: {Config.SCENIC_NAME}")
    print(f"✓ 景区区域: {Config.SCENIC_REGIONS}")
    print(f"✓ 投诉标签: {len(Config.COMPLAINT_TAGS)} 个")
    print(f"✓ 责任部门: {len(Config.RESPONSIBILITY_DEPARTMENTS)} 个")
    print(f"✓ 取数步骤: {len(Config.PIPELINE_STEPS)} 步")
    return True


def main():
    print("🚀 景区投诉漏斗报表系统 - 验证测试\n")

    import os
    db_path = "./data/complaints.duckdb"
    if os.path.exists(db_path):
        os.remove(db_path)
        print("🧹 清理旧数据库文件\n")

    try:
        test_config()
        test_data_layer()
        test_repository()
        test_pipeline()
        test_charts()
        test_export()

        print("\n✅ 所有测试通过！系统运行正常。")
        return 0
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
