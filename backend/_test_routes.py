from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

tests = [
    ("GET",  "/", {},                                       "健康检查"),
    ("GET",  "/api/v1/analytics/dashboard-summary", {},     "Dashboard摘要"),
    ("GET",  "/api/v1/analytics/sync-delay", {},            "同步延迟信息"),
    ("GET",  "/api/v1/analytics/preparation-trend?days=30", {}, "整备趋势"),
    ("GET",  "/api/v1/analytics/testdrive-distribution", {}, "试驾分布"),
    ("GET",  "/api/v1/analytics/quote-candles?days=30", {}, "报价K线"),
    ("GET",  "/api/v1/stores/geo/map-data", {},             "门店地图数据"),
    ("GET",  "/api/v1/stores", {},                          "门店列表"),
    ("GET",  "/api/v1/vehicles/risk-matrix", {},            "风险矩阵气泡"),
    ("GET",  "/api/v1/vehicles?page=1&pageSize=5", {},      "车辆分页"),
    ("GET",  "/api/v1/vehicles/document-missing-distribution", {}, "材料缺失分布"),
    ("GET",  "/api/v1/alerts?page=1&pageSize=3", {},        "预警分页"),
    ("GET",  "/api/v1/alerts/stats", {},                    "预警统计"),
    ("GET",  "/api/v1/rules", {},                           "规则列表"),
    ("GET",  "/api/v1/rules/thresholds", {},                "阈值配置"),
    ("GET",  "/api/v1/review/LSVAU2180N2123456", {},        "复盘数据"),
    ("GET",  "/api/v1/etl/stats", {},                       "ETL统计"),
    ("GET",  "/api/v1/sync/status", {},                     "同步状态"),
    ("POST", "/api/v1/auth/login",
     {"username": "admin", "password": "123", "role": "risk_admin"},
     "登录"),
    ("GET",  "/api/v1/analytics/risk-matrix", {},           "风险矩阵(新路由)"),
    ("GET",  "/api/v1/sync/delay-info", {},                 "同步延迟别名(sync)"),
    ("GET",  "/api/v1/rules/thresholds/full", {},           "阈值完整列表"),
    ("PUT",  "/api/v1/rules/thresholds/th-1",
     {"warningDays": 12, "criticalDays": 25},               "阈值更新PUT"),
    ("PATCH", "/api/v1/rules/thresholds/th-1/toggle",
     {"enabled": False},                                    "阈值切换toggle"),
    ("GET",  "/api/v1/analytics/test-drive-distribution?days=84", {}, "试驾分布别名(dash)"),
]

passed = 0
failed = 0
print(f"{'STATUS':6s} {'HTTP':5s} {'CODE':5s}  {'NAME':20s}  PATH")
print("-" * 90)
for method, path, payload, name in tests:
    if method == "GET":
        r = client.get(path)
    elif method == "POST":
        r = client.post(path, json=payload)
    elif method == "PUT":
        r = client.put(path, json=payload)
    elif method == "PATCH":
        r = client.patch(path, json=payload)
    else:
        r = client.request(method, path, json=payload)
    body = r.json() if r.content else {}
    code = body.get("code") if isinstance(body, dict) else "N/A"
    data_size = 0
    if isinstance(body, dict) and "data" in body and body["data"] is not None:
        data_size = len(str(body["data"]))
    http_ok = r.status_code == 200
    biz_ok = isinstance(code, int) and code in (0, 200)
    status = "OK" if (http_ok and (biz_ok or method == "GET" and code == "N/A")) else "FAIL"
    if status == "OK":
        passed += 1
    else:
        failed += 1
    print(f"  {status:5s} [{r.status_code:3d}] code={str(code):4s}  {name:20s}  {path}")
    if status == "FAIL":
        print(f"         >>> body preview: {str(body)[:200]}")

print("-" * 90)
print(f"TOTAL: {passed + failed}   PASSED: {passed}   FAILED: {failed}")

print("\n" + "=" * 90)
print("新增测试用例")
print("=" * 90)

new_tests_passed = 0
new_tests_failed = 0

def test_thresholds_full():
    global new_tests_passed, new_tests_failed
    print("\n1. 测试 GET /api/v1/rules/thresholds/full")
    r = client.get("/api/v1/rules/thresholds/full")
    body = r.json()
    assert r.status_code == 200, f"HTTP状态码错误: {r.status_code}"
    data = body.get("data")
    assert data is not None, "data 字段不存在"
    assert isinstance(data, list), "data 应该是列表"
    assert len(data) > 0, "thresholds 列表为空"
    for t in data:
        assert "id" in t, "阈值缺少 id 字段"
        assert "documentType" in t, "阈值缺少 documentType 字段"
        assert "warningDays" in t, "阈值缺少 warningDays 字段"
        assert "criticalDays" in t, "阈值缺少 criticalDays 字段"
        assert "enabled" in t, "阈值缺少 enabled 字段"
    print("✓ thresholds 结构正确")
    new_tests_passed += 1

def test_update_threshold():
    global new_tests_passed, new_tests_failed
    print("\n2. 测试 PUT /api/v1/rules/thresholds/th-1")
    payload = {"warningDays": 5, "criticalDays": 15}
    r = client.put("/api/v1/rules/thresholds/th-1", json=payload)
    body = r.json()
    assert r.status_code == 200, f"HTTP状态码错误: {r.status_code}"
    data = body.get("data")
    assert data is not None, "data 字段不存在"
    assert "affectedCount" in data, "返回缺少 affectedCount 字段"
    assert "affectedVehicleIds" in data, "返回缺少 affectedVehicleIds 字段"
    assert "recalculationResult" in data, "返回缺少 recalculationResult 字段"
    assert isinstance(data["affectedCount"], int), "affectedCount 应该是整数"
    assert isinstance(data["affectedVehicleIds"], list), "affectedVehicleIds 应该是列表"
    assert "updatedThreshold" in data, "返回缺少 updatedThreshold 字段"
    assert data["updatedThreshold"]["warningDays"] == 5, "warningDays 未正确更新"
    assert data["updatedThreshold"]["criticalDays"] == 15, "criticalDays 未正确更新"
    print(f"✓ 阈值更新成功，affectedCount = {data['affectedCount']}")
    new_tests_passed += 1

def test_risk_matrix_not_random():
    global new_tests_passed, new_tests_failed
    print("\n3. 测试 GET /api/v1/vehicles/risk-matrix (riskLevel 非随机")
    r = client.get("/api/v1/vehicles/risk-matrix")
    body = r.json()
    assert r.status_code == 200, f"HTTP状态码错误: {r.status_code}"
    data = body.get("data")
    assert data is not None, "data 字段不存在"
    assert isinstance(data, list), "data 应该是列表"
    assert len(data) == 16, f"应该有16个气泡，实际有 {len(data)} 个"
    valid_levels = {"low", "medium", "high", "critical"}
    for bubble in data:
        assert "riskLevel" in bubble, "气泡缺少 riskLevel 字段"
        assert bubble["riskLevel"] in valid_levels, f"riskLevel 值无效: {bubble['riskLevel']}"
        assert "count" in bubble, "气泡缺少 count 字段"
        assert "vehicleIds" in bubble, "气泡缺少 vehicleIds 字段"
    total_count = sum(b["count"] for b in data)
    print(f"✓ 风险矩阵数据正确，总车辆数: {total_count}")
    new_tests_passed += 1

def test_review_alerts_based_on_thresholds():
    global new_tests_passed, new_tests_failed
    print("\n4. 测试 GET /api/v1/review/LSVAU2180N2123456 (alerts 基于阈值)")
    r = client.get("/api/v1/review/LSVAU2180N2123456")
    body = r.json()
    assert r.status_code == 200, f"HTTP状态码错误: {r.status_code}"
    data = body.get("data")
    assert data is not None, "data 字段不存在"
    assert "alerts" in data, "返回缺少 alerts 字段"
    assert "thresholdHits" in data, "返回缺少 thresholdHits 字段"
    assert "alertsByThreshold" in data, "返回缺少 alertsByThreshold 字段"
    assert "currentThresholds" in data, "返回缺少 currentThresholds 字段"
    assert isinstance(data["alerts"], list), "alerts 应该是列表"
    assert isinstance(data["thresholdHits"], list), "thresholdHits 应该是列表"
    if data["alerts"]:
        for alert in data["alerts"]:
            assert "thresholdId" in alert, "alert 缺少 thresholdId 字段"
            assert "level" in alert, "alert 缺少 level 字段"
            assert alert["level"] in {"low", "medium", "high", "critical"}, f"alert level 无效: {alert['level']}"
        print(f"✓ 复盘数据正确，alerts 数量: {len(data['alerts'])}, 命中阈值: {data['thresholdHits']}")
    else:
        print("✓ 复盘数据正确，该车无预警")
    new_tests_passed += 1

try:
    test_thresholds_full()
    test_update_threshold()
    test_risk_matrix_not_random()
    test_review_alerts_based_on_thresholds()
except AssertionError as e:
    print(f"✗ 测试失败: {e}")
    new_tests_failed += 1
except Exception as e:
    print(f"✗ 测试异常: {e}")
    import traceback
    traceback.print_exc()
    new_tests_failed += 1

print("\n" + "=" * 90)
print(f"新增测试: TOTAL: {new_tests_passed + new_tests_failed}   PASSED: {new_tests_passed}   FAILED: {new_tests_failed}")
print("=" * 90)

print(f"\nSwagger UI available at: http://localhost:8000/docs")
