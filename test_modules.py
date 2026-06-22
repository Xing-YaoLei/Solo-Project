from data_layer import dw
from mock_data import generate_all_data
from analytics import DataReconciliation, ConversionAnalytics, VersionAnalytics

print("=" * 50)
print("数据层测试")
print("=" * 50)

data = generate_all_data()
for name, df in data.items():
    dw.register_polars(name, df)

print("数据表:", dw.list_tables())
result = dw.query("SELECT COUNT(*) as cnt FROM curated.case_system")
print("案件系统记录数:", result["cnt"][0])

print()
print("=" * 50)
print("口径对照测试")
print("=" * 50)

rec = DataReconciliation(data["case_system"], data["payment_flow"], data["email_attachments"])
report = rec.calibre_conflict_report()
print("口径概览:", report["summary"])
print("冲突字段数:", len(report["conflict_fields"]))
gaps = rec.audit_rejection_gaps()
print("审核退回缺口数:", gaps.height)
gap_summary = rec.gap_summary()
print("缺口类型数:", gap_summary.height)

print()
print("=" * 50)
print("转化分析测试")
print("=" * 50)

conv = ConversionAnalytics(data["publish_schedule"])
trend = conv.conversion_trend("month")
print("月度趋势行数:", trend.height)
yoy = conv.yo_y_comparison("month")
print("同比对比行数:", yoy.height)
mom = conv.mom_comparison("month")
print("环比对比行数:", mom.height)
target = conv.target_comparison("month")
print("目标对比行数:", target.height)
abnormal = conv.abnormal_points()
print("异常点数:", abnormal.height)

print()
print("=" * 50)
print("版本分析测试")
print("=" * 50)

ver = VersionAnalytics(data["version_history"], data["case_system"])
overview = ver.version_overview()
print("平均版本数:", overview["avg_versions"])
print("版本分布行数:", overview["distribution"].height)
by_type = ver.version_by_type()
print("按类型统计行数:", by_type.height)
review_stats = ver.review_outcome_analysis()
print("审核结果分布行数:", review_stats.height)
tag_corr = ver.tag_review_correlation()
print("标签-审核关联系数行数:", tag_corr.height)

print()
print("=" * 50)
print("所有测试通过!")
print("=" * 50)
