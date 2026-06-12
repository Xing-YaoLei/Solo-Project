import sys, os, tempfile
sys.path.insert(0, ".")

# 用临时数据库避免冲突
tmpdir = tempfile.mkdtemp()
os.environ["DUCKDB_PATH"] = f"{tmpdir}/test.db"
from src.config import AppConfig, app_config
import importlib, src.config
src.config.app_config = AppConfig(duckdb_path=f"{tmpdir}/test.db", refresh_cache_path=f"{tmpdir}/rt.json")
for mod in list(sys.modules):
    if "src.data" in mod or "src.auth" in mod or "src.business" in mod or "src.share" in mod:
        del sys.modules[mod]

from src.auth import authenticate, User
from src.data.duckdb_manager import DuckDBManager
import importlib, src.data.duckdb_manager as ddm
importlib.reload(ddm)
DuckDBManager._instance = None

from src.data.seed import seed_all_data
from src.auth import init_default_users
print(f"数据库: {src.config.app_config.duckdb_path}")

init_default_users()
seed_all_data()

print("\n=== 需求2验证：area01 权限 ===")
area01 = authenticate("area01", "area123")
assert area01 is not None
print(f"  area01 stores: {area01.stores}")
print(f"  has_permission(view_all_stores): {area01.has_permission('view_all_stores')}")
all_stores = ["S001","S002","S003","S004","S005"]
accessible = area01.can_access_stores(all_stores)
print(f"  can_access_stores(5家): {accessible}")
assert accessible == ["S001","S002","S003"]
print("  ✅ area01 只能看到 S001-S003")

admin = authenticate("admin","admin123")
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
assert payload.allowed_stores == ["S001","S002","S003"]
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
footer = parsed.get_formula_footer()
assert "v1.1" in footer
print(f"  formula footer:\n{footer}")
print("  ✅ 分享携带口径版本，footer 版本号一致")

print("\n=== 需求1验证：seed 后刷新时间 ===")
import json
from src.config import app_config
cache_path = src.config.app_config.refresh_cache_path
assert os.path.exists(cache_path), f"{cache_path} not exists"
with open(cache_path) as f:
    data = json.load(f)
print(f"  seed 后刷新时间写入: {data}")
assert "last_refresh" in data
print("  ✅ 刷新时间写入成功")

print("\n=== 需求4验证：追溯外卖来源逻辑 ===")
DuckDBManager._instance = None
import importlib, src.data.repository as rmod
importlib.reload(rmod)
from src.data.repository import DataRepository
repo = DataRepository()
import polars as pl
from datetime import date, timedelta
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

print("\n✅ 全部验证通过！")
