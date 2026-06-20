import os
import sys
import json

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

if os.path.exists("data/analytics.duckdb"):
    os.remove("data/analytics.duckdb")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 60)
print("API 验证测试")
print("=" * 60)

print("\n1. /health 健康检查")
response = client.get("/health")
print(f"   状态码: {response.status_code}")
print(f"   返回: {json.dumps(response.json(), ensure_ascii=False, indent=4)[:200]}")
assert response.status_code == 200
assert response.json()["status"] == "healthy"
print("   ✅ 通过")

print("\n2. /api/verification/definition 核销规则列表")
response = client.get("/api/verification/definition")
print(f"   状态码: {response.status_code}")
data = response.json()["data"]
print(f"   规则数量: {len(data)}")
if data:
    print(f"   第一条规则:")
    print(f"     id: {data[0]['id']}")
    print(f"     title: {data[0]['title']}")
    print(f"     formula: {data[0]['formula'][:50]}...")
    print(f"     data_source: {data[0]['data_source'][:50]}...")
    print(f"     exception_rules 数量: {len(data[0]['exception_rules'])}")
    print(f"     example: {data[0]['example'][:50]}...")
assert response.status_code == 200
assert isinstance(data, list)
assert len(data) == 5
assert "id" in data[0]
assert "title" in data[0]
assert "formula" in data[0]
assert "data_source" in data[0]
assert "exception_rules" in data[0]
assert "example" in data[0]
print("   ✅ 通过")

print("\n3. /api/refund/distribution 退票分布")
response = client.get("/api/refund/distribution")
print(f"   状态码: {response.status_code}")
data = response.json()["data"]
print(f"   数据点数量: {len(data)}")
if data:
    sample = data[0]
    print(f"   样本点:")
    print(f"     date: {sample['date']}")
    print(f"     refund_count: {sample['refund_count']}")
    print(f"     refund_amount: {sample['refund_amount']}")
    print(f"     disputed_count: {sample['disputed_count']}")
    print(f"     disputed_points 类型: {type(sample['disputed_points']).__name__}")
    print(f"     disputed_points 数量: {len(sample['disputed_points'])}")
    if sample["disputed_points"]:
        dp = sample["disputed_points"][0]
        print(f"     争议点详情:")
        print(f"       id: {dp['id']}")
        print(f"       refund_id: {dp['refund_id']}")
        print(f"       amount: {dp['amount']}")
        print(f"       reason: {dp['reason']}")
        print(f"       is_disputed: {dp['is_disputed']}")
assert response.status_code == 200
assert isinstance(data, list)
if data and data[0]["disputed_points"]:
    dp = data[0]["disputed_points"][0]
    assert "id" in dp
    assert "refund_id" in dp
    assert "amount" in dp
    assert "reason" in dp
    assert "is_disputed" in dp
print("   ✅ 通过")

print("\n4. /api/sponsorship/list 赞助权益列表")
response = client.get("/api/sponsorship/list")
print(f"   状态码: {response.status_code}")
data = response.json()["data"]
print(f"   总数: {data['page_info']['total']}")
print(f"   当前页数量: {len(data['items'])}")
if data["items"]:
    item = data["items"][0]
    print(f"   第一条:")
    print(f"     id: {item['id']}")
    print(f"     sponsor_name: {item['sponsor_name']}")
    print(f"     benefit_type: {item['benefit_type']}")
    print(f"     completion_rate: {item['completion_rate']}")
assert response.status_code == 200
assert "items" in data
assert "page_info" in data
print("   ✅ 通过")

print("\n5. /api/refund/{id}/mark-processed 标记退票已处理")
from app.repositories import duckdb_repository
from app.database import get_duckdb

with get_duckdb() as conn:
    disputed = conn.execute(
        "SELECT id FROM refunds WHERE is_disputed = true LIMIT 1"
    ).fetchone()

if disputed:
    refund_id = str(disputed[0])
    print(f"   测试退票ID: {refund_id}")
    response = client.post(
        f"/api/refund/{refund_id}/mark-processed",
        json={"note": "已与用户沟通，争议解除"}
    )
    print(f"   状态码: {response.status_code}")
    data = response.json()["data"]
    print(f"   is_disputed: {data['is_disputed']}")
    print(f"   dispute_note: {data['dispute_note']}")
    assert response.status_code == 200
    assert data["is_disputed"] == False
    assert "处理备注" in (data["dispute_note"] or "")
    print("   ✅ 通过")
else:
    print("   ⚠️ 没有找到争议退票，跳过")

print("\n6. 验证 sync_logs id 为字符串类型")
from app.repositories import duckdb_repository
result = duckdb_repository.sync_logs(page_size=5)
if result.items:
    log_id = result.items[0].id
    print(f"   日志ID: {log_id}")
    print(f"   ID类型: {type(log_id).__name__}")
    assert isinstance(log_id, str)
    assert len(log_id) > 10
    print("   ✅ 通过")

print("\n7. 验证 DuckDB 文件持久化")
import os
db_path = os.path.join(os.getcwd(), "data", "analytics.duckdb")
print(f"   数据库路径: {db_path}")
print(f"   文件是否存在: {os.path.exists(db_path)}")
assert os.path.exists(db_path)
print("   ✅ 通过")

print("\n" + "=" * 60)
print("🎉 所有 API 验证测试通过!")
print("=" * 60)
