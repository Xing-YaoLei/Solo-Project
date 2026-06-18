import sys
sys.path.insert(0, ".")

print("=== 测试支付页回调 ===")
import callbacks.payment_callbacks as pc
print("payment_callbacks OK")

from data.loader import load_reconciliation_results, load_payment_records

recon = load_reconciliation_results("proj-003")
print(f"proj-003原始对账条数: {len(recon)}")
if not recon.empty:
    print(f"proj-003对账状态: {recon['status'].unique().tolist()}")
mismatched = recon[recon["status"] == "mismatched"]
print(f"proj-003 mismatched过滤后: {len(mismatched)} 条")

payments = load_payment_records("proj-003")
print(f"proj-003原始付款: {len(payments)} 条")
filtered_projects = (
    set(mismatched["project_id"].unique()) if not mismatched.empty else set()
)
print(f"筛选后project_id集合: {filtered_projects}")
if filtered_projects:
    dp = payments[payments["project_id"].isin(filtered_projects)]
else:
    dp = payments.iloc[0:0].copy()
print(f"筛选后付款: {len(dp)} 条 (正确应该=0，因为proj-003无mismatched)")
print()

print("=== 测试回款周期 ===")
from data.reconciler import compute_payment_cycle

cycles = compute_payment_cycle()
from datetime import datetime

sorted_cycles = sorted(cycles, key=lambda c: c.get("sort_date") or datetime.max)
for c in sorted_cycles:
    sd = c.get("signed_date")
    fp = c.get("first_payment_date")
    print(
        f"{c['contract_no']} | 签署:{sd} | 首笔:{fp} | 首笔天数:{c['days_to_first']} | 末笔天数:{c['days_to_last']}"
    )
if len(sorted_cycles) >= 2:
    first_days = [c["days_to_first"] or 0 for c in sorted_cycles]
    for i in range(1, len(sorted_cycles)):
        diff = first_days[i] - first_days[i - 1]
        tag = f"改善{abs(diff)}天" if diff < 0 else f"恶化{diff}天" if diff > 0 else "持平"
        print(
            f"  {sorted_cycles[i-1]['contract_no']} → {sorted_cycles[i]['contract_no']}: 首笔天数变化 {diff:+d}天 → {tag}"
        )
    total_diff = first_days[-1] - first_days[0]
    tag = (
        f"整体改善{abs(total_diff)}天"
        if total_diff < 0
        else f"整体恶化{total_diff}天"
        if total_diff > 0
        else "整体持平"
    )
    print(f"  总体变化: {total_diff:+d}天 → {tag}")
print()

print("=== 测试合同回调 ===")
import callbacks.contract_callbacks as cc
print("contract_callbacks OK")

print("=== 全部导入测试 ===")
import app
print("app OK")
print("所有模块验证通过！")
