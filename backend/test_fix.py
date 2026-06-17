import sys, os
sys.path.insert(0, ".")

if os.path.exists("./data/promo_analytics.duckdb"):
    os.remove("./data/promo_analytics.duckdb")

from sqlalchemy import func, case
from app.db.session import SessionLocal
from app import models, schemas
from app.services.duckdb_service import duckdb_service
from app.api.config import _build_response

db = SessionLocal()
results = []

# 测试1: CASE表达式
test1_result = "FAIL"
try:
    result = db.query(
        func.SUM(case((models.SalesRecord.cashier_delay_minutes > 30, 1), else_=0)).label("cnt")
    ).scalar()
    test1_result = f"PASS (count={result})"
except Exception as e:
    test1_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("CASE表达式", test1_result))

# 测试2: DuckDB刷新
test2_result = "FAIL"
try:
    count = duckdb_service.refresh_data(db)
    test2_result = f"PASS (refreshed {count} records)"
except Exception as e:
    test2_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("DuckDB刷新", test2_result))

# 测试3: 漏斗查询
test3_result = "FAIL"
try:
    data = duckdb_service.query_funnel_data()
    test3_result = f"PASS ({len(data)} records)"
except Exception as e:
    test3_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("漏斗查询", test3_result))

# 测试4: 销售走势查询
test4_result = "FAIL"
try:
    trend = duckdb_service.query_sales_trend()
    test4_result = f"PASS ({len(trend)} records)"
except Exception as e:
    test4_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("销售走势查询", test4_result))

# 测试5: 陈列影响分析
test5_result = "FAIL"
try:
    funnel_data = duckdb_service.query_funnel_data()
    if funnel_data:
        pid = funnel_data[0]["promotion_id"]
        impact = duckdb_service.detect_display_impact_ranges(pid)
        test5_result = f"PASS ({len(impact)} periods)"
    else:
        test5_result = "PASS (no data)"
except Exception as e:
    test5_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("陈列影响分析", test5_result))

# 测试6: 阈值API返回change_logs
test6_result = "FAIL"
try:
    configs = db.query(models.ThresholdConfig).order_by(models.ThresholdConfig.id).all()
    test_config = configs[0]
    history = (
        db.query(models.ThresholdChangeLog)
        .filter(models.ThresholdChangeLog.config_id == test_config.id)
        .all()
    )
    resp = _build_response(test_config, history)
    resp_dict = resp.model_dump()
    
    has_change_logs = "change_logs" in resp_dict
    has_value_type = "value_type" in resp_dict
    has_min = "min_value" in resp_dict
    has_max = "max_value" in resp_dict
    no_history = "history" not in resp_dict
    
    if has_change_logs and has_value_type and has_min and has_max and no_history:
        test6_result = f"PASS (change_logs={len(resp_dict['change_logs'])}, value_type={resp_dict['value_type']})"
    else:
        test6_result = f"FAIL: keys={list(resp_dict.keys())[:5]}"
except Exception as e:
    test6_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("阈值API字段", test6_result))

# 测试7: Pydantic schema检查
test7_result = "FAIL"
try:
    fields = list(schemas.ThresholdConfig.model_fields.keys())
    if "change_logs" in fields and "history" not in fields:
        test7_result = f"PASS"
    else:
        test7_result = f"FAIL (fields={fields})"
except Exception as e:
    test7_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("Schema字段", test7_result))

# 测试8: 实际漏斗报表下载接口
test8_result = "FAIL"
try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    response = client.get("/api/v1/download/funnel-report")
    if response.status_code == 200:
        test8_result = f"PASS (size={len(response.content)} bytes)"
        with open("/tmp/test_funnel_report.xlsx", "wb") as f:
            f.write(response.content)
    else:
        test8_result = f"FAIL (status={response.status_code}, body={response.text[:200]})"
except Exception as e:
    test8_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("漏斗报表下载API", test8_result))

# 测试9: 实际销售走势下载接口
test9_result = "FAIL"
try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    funnel_data = duckdb_service.query_funnel_data()
    pid = funnel_data[0]["promotion_id"] if funnel_data else 1
    response = client.get(f"/api/v1/download/sales-trend-report?promotion_id={pid}")
    if response.status_code == 200:
        test9_result = f"PASS (size={len(response.content)} bytes)"
        with open("/tmp/test_sales_trend.xlsx", "wb") as f:
            f.write(response.content)
    else:
        test9_result = f"FAIL (status={response.status_code}, body={response.text[:200]})"
except Exception as e:
    test9_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("销售走势下载API", test9_result))

# 测试10: 阈值审计报表下载
test10_result = "FAIL"
try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    response = client.get("/api/v1/download/threshold-audit-report")
    if response.status_code == 200:
        test10_result = f"PASS (size={len(response.content)} bytes)"
    else:
        test10_result = f"FAIL (status={response.status_code}, body={response.text[:200]})"
except Exception as e:
    test10_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("阈值审计报表下载", test10_result))

# 测试11: refresh接口
test11_result = "FAIL"
try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    response = client.post("/api/v1/refresh?triggered_by=test_user")
    if response.status_code == 200:
        data = response.json()
        test11_result = f"PASS (status={data.get('status')}, processed={data.get('records_processed')}, exceptions={data.get('exceptions_found')})"
    else:
        test11_result = f"FAIL (status={response.status_code})"
except Exception as e:
    test11_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("refresh接口", test11_result))

# 测试12: thresholds GET接口
test12_result = "FAIL"
try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    response = client.get("/api/v1/thresholds/")
    if response.status_code == 200:
        data = response.json()
        first = data[0] if data else {}
        has_cl = "change_logs" in first
        has_vt = "value_type" in first
        has_min = "min_value" in first
        has_max = "max_value" in first
        no_hist = "history" not in first
        if has_cl and has_vt and has_min and has_max and no_hist:
            test12_result = f"PASS ({len(data)} configs, first change_logs={len(first.get('change_logs', []))})"
        else:
            test12_result = f"FAIL: change_logs={has_cl}, history={not no_hist}, keys={list(first.keys())[:8]}"
    else:
        test12_result = f"FAIL (status={response.status_code})"
except Exception as e:
    test12_result = f"FAIL: {type(e).__name__}: {e}"
results.append(("thresholds GET接口", test12_result))

# 输出结果
print("\n" + "="*70)
print("TEST RESULTS")
print("="*70)
all_pass = True
for name, result in results:
    status = "✅" if result.startswith("PASS") else "❌"
    if "FAIL" in result:
        all_pass = False
    print(f"{status} {name}: {result}")

print("="*70)
if all_pass:
    print("🎉 ALL TESTS PASSED!")
else:
    print("⚠️  SOME TESTS FAILED")
    sys.exit(1)

db.close()
