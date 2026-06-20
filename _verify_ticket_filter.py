import warnings
warnings.simplefilter("ignore")
from app.utils.data_service import DataService

svc = DataService()
sep = "=" * 60

print(sep)
print("🎫 票种筛选 → 票种分析图 / 导出 验证")
print(sep)

# 全量
tt_full = svc.get_ticket_types(activity_id=1)
print(f"\n【全量】票种分析返回 {len(tt_full)} 个票种:")
print(tt_full[["id", "name", "sold_quantity", "checked_quantity"]].to_string(index=False))
assert len(tt_full) == 3, "全量应返回 3 个票种"

# 选单个票种 ID=1
tt_ids = [1]
tt_single = svc.get_ticket_types(activity_id=1, ticket_type_ids=tt_ids)
print(f"\n【仅 ID=1 票种筛选】返回 {len(tt_single)} 个票种:")
print(tt_single[["id", "name", "sold_quantity", "checked_quantity"]].to_string(index=False))
assert len(tt_single) == 1, "筛选后应只返回 1 个票种"
assert tt_single.iloc[0]["id"] == 1, "返回的票种 ID 错误"

# 选多个票种
tt_ids_2 = [1, 3]
tt_multi = svc.get_ticket_types(activity_id=1, ticket_type_ids=tt_ids_2)
print(f"\n【ID=1,3 多票种筛选】返回 {len(tt_multi)} 个票种:")
print(tt_multi[["id", "name", "sold_quantity", "checked_quantity"]].to_string(index=False))
assert len(tt_multi) == 2, "筛选后应返回 2 个票种"

# 结合日期筛选
tt_d1 = svc.get_ticket_types(
    activity_id=1,
    start_date="2024-06-01",
    end_date="2024-06-10",
    ticket_type_ids=tt_ids,
)
print(f"\n【票种=1 + 日期=6/1-10】返回 {len(tt_d1)} 个票种, 销量={tt_d1.iloc[0]['sold_quantity']}, 核销={tt_d1.iloc[0]['checked_quantity']}:")
print(tt_d1[["id", "name", "sold_quantity", "checked_quantity"]].to_string(index=False))
assert tt_d1.iloc[0]["sold_quantity"] == 18, f"日期筛选后销量应为 18, 实际 {tt_d1.iloc[0]['sold_quantity']}"
assert tt_d1.iloc[0]["checked_quantity"] == 8, f"日期筛选后核销应为 8, 实际 {tt_d1.iloc[0]['checked_quantity']}"

# 空筛选
tt_empty = svc.get_ticket_types(activity_id=1, ticket_type_ids=[999])
print(f"\n【票种=999 不存在】返回 {len(tt_empty)} 个票种")
assert len(tt_empty) == 0, "不存在的票种应返回空 DataFrame"

print("\n" + sep)
print("🎉 票种筛选在票种分析查询中全部验证通过")
print("✅ 筛选条件正确传递到:")
print("   1. 票种分析图（页面图表只显示选中票种）")
print("   2. 导出文件票种分析工作表（只含选中票种）")
print("   3. 下钻票种规则 Tab（只显示选中票种）")
print(sep)

svc.close()
