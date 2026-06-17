import json
import urllib.request

BASE = "http://localhost:3002"

def get(path):
    with urllib.request.urlopen(BASE + path) as resp:
        return json.loads(resp.read())

print("===== 1. 路线详情（当天订单）=====")
routes_data = get("/api/routes/list")
first_route = routes_data["data"]["list"][0]
route_id = first_route["id"]
route_name = first_route["routeName"]
print(f"路线: {route_name} ({route_id})")

details = get(f"/api/routes/{route_id}/details")
d = details["data"]
print(f"样本数: {len(d['samples'])} (当天订单，应该是个位数)")
print(f"meta: {d['meta']}")
print(f"stats: {d['stats']}")

print("\n===== 2. 该路线的装载清单 =====")
loading = get(f"/api/loading-list?routeId={route_id}")
items = loading["data"]["list"]
stats = loading["data"]["stats"]
print(f"总条目: {len(items)}")
print(f"stats: {stats}")
if items:
    item = items[0]
    print(f"第一条: material={item['materialName']}, recordId={item['originalRecordId']}, qty={item['quantity']}, loadedQty={item['loadedQuantity']}")

print("\n===== 3. 原始记录绑定验证 =====")
if items:
    rec_id = items[0]["originalRecordId"]
    rec_data = get(f"/api/loading-list/{rec_id}/original")
    if rec_data["success"]:
        r = rec_data["data"]
        print("success: True")
        print(f"物料名: {r['materialName']}")
        print(f"数量: {r['quantity']}")
        print(f"录入人: {r['enteredBy']}")
        print(f"来源: {r['source']}")
        print(f"批号: {r['rawData']['batchNo']}")
        print(f"和装载明细物料一致: {r['materialName'] == items[0]['materialName']}")
    else:
        print(f"失败: {rec_data['message']}")

print("\n===== 4. CRM差异 & 支付流水 同一批订单验证 =====")
diffs = get("/api/data-compare/differences?limit=100")
pays = get("/api/data-compare/payments")

diff_orders = set(x["orderId"] for x in diffs["data"]["list"])
pay_orders = set(x["orderId"] for x in pays["data"]["list"])

print(f"CRM差异订单数: {len(diff_orders)}")
print(f"支付流水订单数: {len(pay_orders)}")
print(f"两者重叠订单数: {len(diff_orders & pay_orders)}")
print("（应该全部重叠，因为都基于同一批差异订单）")
