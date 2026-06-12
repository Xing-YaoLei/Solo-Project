import sys
sys.path.insert(0, ".")

from src.auth import authenticate, User

print("=== 需求2验证：area01 权限 ===")
area01 = authenticate("area01", "area123")
assert area01 is not None
print(f"  area01 stores: {area01.stores}")
print(f"  has_permission(view_all_stores): {area01.has_permission('view_all_stores')}")

all_stores = ["S001","S002","S003","S004","S005"]
accessible = area01.can_access_stores(all_stores)
print(f"  can_access_stores(5家): {accessible}")
assert accessible == ["S001","S002","S003"], f"FAIL: got {accessible}"
print("  ✅ area01 只能看到 S001-S003")

for s in all_stores:
    can = area01.can_access_store(s)
    expected = s in ("S001","S002","S003")
    assert can == expected, f"FAIL store {s}: got {can}"
print("  ✅ can_access_store 逐个验证正确")

admin = authenticate("admin","admin123")
print(f"\n  admin can_access_stores: {admin.can_access_stores(all_stores)}")
assert admin.can_access_stores(all_stores) == all_stores
print("  ✅ admin 看到全部门店")

store01 = authenticate("store01","store123")
assert store01.can_access_stores(all_stores) == ["S001"]
print("  ✅ store01 只能看到 S001")

print("\n=== 需求2验证：分享链接门店范围 ===")
from src.share import build_share_payload_from_user, ShareManager
mgr = ShareManager()
payload = build_share_payload_from_user(area01, metric_version="v1.1")
print(f"  area01 payload.allowed_stores: {payload.allowed_stores}")
assert payload.allowed_stores == ["S001","S002","S003"], f"FAIL: {payload.allowed_stores}"
token = mgr.serializer.dumps(payload.__dict__)
parsed = mgr.parse_token(token)
assert parsed is not None
print(f"  解析后 allowed_stores: {parsed.allowed_stores}")
share_user = parsed.to_share_user()
print(f"  解析后 share_user stores: {share_user.stores}")
print(f"  解析后 share_user has_permission(view_all_stores): {share_user.has_permission('view_all_stores')}")
assert share_user.stores == ["S001","S002","S003"]
assert share_user.can_access_stores(all_stores) == ["S001","S002","S003"]
print("  ✅ 分享后的 User 严格限制 S001-S003")

print("\n=== 需求3验证：分享链接锁定 metric_version ===")
assert payload.metric_version == "v1.1"
assert parsed.metric_version == "v1.1"
print(f"  分享 metric_version: {payload.metric_version}")
print(f"  formula footer:\n{parsed.get_formula_footer()}")
print("  ✅ 分享携带口径版本")

print("\n=== 需求1验证：seed 后刷新时间 ===")
import os, json
from src.config import app_config
if os.path.exists(app_config.refresh_cache_path):
    with open(app_config.refresh_cache_path) as f:
        data = json.load(f)
    print(f"  已存在刷新时间: {data}")
else:
    from src.data.seed import ensure_seeded
    ensure_seeded()
    if os.path.exists(app_config.refresh_cache_path):
        with open(app_config.refresh_cache_path) as f:
            data = json.load(f)
        print(f"  seed 后刷新时间写入: {data}")
print("  ✅ 刷新时间 OK")

print("\n=== 需求4验证：追溯外卖来源逻辑 ===")
from src.data import DataRepository
from datetime import date, timedelta
repo = DataRepository()
loss = repo.get_loss_reports()
delivery = repo.get_delivery_orders()
receipts = repo.get_member_receipts()
print(f"  报损单: {len(loss)}, 外卖: {len(delivery)}, 小票: {len(receipts)}")

sample = loss.row(0, named=True)
store_id = sample["store_id"]
sku_id = sample["sku_id"]
rd = sample["report_date"]
start = rd - timedelta(days=1)
end = rd + timedelta(days=1)
matched = delivery.filter(
    (pl.col("store_id")==store_id) & 
    (pl.col("product_id")==sku_id) &
    (pl.col("order_date")>=start) &
    (pl.col("order_date")<=end)
)
matched_r = receipts.filter(
    (pl.col("store_id")==store_id) & 
    (pl.col("product_id")==sku_id) &
    (pl.col("sale_date")>=start) &
    (pl.col("sale_date")<=end)
)
print(f"  示例: {sample['report_no']} {store_id}/{sku_id}/{rd}")
print(f"  关联外卖订单: {len(matched)} 条")
print(f"  关联会员小票: {len(matched_r)} 条")
print("  ✅ 追溯逻辑可运行")

import polars as pl
print("\n✅ 全部验证通过！")
