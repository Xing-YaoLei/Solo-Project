"""快速验证：分享载荷序列化（含 date 对象） + parse 回来正确"""
import sys, os, tempfile
sys.path.insert(0, os.path.dirname(__file__))
os.environ["DUCKDB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")

from datetime import date
from src.auth.permissions import User
from src.share import ShareManager, build_share_payload_from_user

area01 = User(username="area01", role="area_manager", stores=["S001", "S002", "S003"])
filters = {
    "start_date": date(2026, 5, 15),
    "end_date": date(2026, 6, 13),
    "store_ids": ["S001", "S002", "S003"],
    "metric_version": "v2.0",
    "freq": "day",
    "show_only_passed": True,
}
payload = build_share_payload_from_user(
    user=area01, metric_version="v2.0", filters=filters, charts=["trend"], ttl_hours=24
)
assert payload.allowed_stores == ["S001", "S002", "S003"], f"stores={payload.allowed_stores}"
assert payload.metric_version == "v2.0"

mgr = ShareManager()
token = mgr.dumps_payload(payload)
print("TOKEN OK (len={}): {}...".format(len(token), token[:50]))

parsed = mgr.parse_token(token)
assert parsed is not None, "parse failed"
assert parsed.allowed_stores == ["S001", "S002", "S003"]
assert parsed.metric_version == "v2.0"
assert isinstance(parsed.filters["start_date"], date), f"start_date类型错了: {type(parsed.filters['start_date'])}"
assert parsed.filters["start_date"] == date(2026, 5, 15)
assert parsed.filters["end_date"] == date(2026, 6, 13)
assert parsed.charts == ["trend"]

# to_share_user 验证 stores 正确注入
share_user = parsed.to_share_user()
assert share_user.stores == ["S001", "S002", "S003"]
assert share_user.has_permission("view_all_stores") == False, "分享用户不应有 view_all_stores"
assert share_user.can_access_store("S001") == True
assert share_user.can_access_store("S004") == False
print("✅ 分享序列化 / 解析 / 权限 全部正确")
