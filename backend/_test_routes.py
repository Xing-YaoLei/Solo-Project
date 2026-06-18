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
]

passed = 0
failed = 0
print(f"{'STATUS':6s} {'HTTP':5s} {'CODE':5s}  {'NAME':20s}  PATH")
print("-" * 90)
for method, path, payload, name in tests:
    if method == "GET":
        r = client.get(path)
    else:
        r = client.post(path, json=payload)
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
print(f"\nSwagger UI available at: http://localhost:8000/docs")
