import sys, os
sys.path.insert(0, ".")

if os.path.exists("./data/promo_analytics.duckdb"):
    os.remove("./data/promo_analytics.duckdb")

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.services.duckdb_service import duckdb_service
from app import models
import pandas as pd
from io import BytesIO

db = SessionLocal()
results = []

# 先刷新DuckDB数据
print("Refreshing DuckDB data...")
duckdb_service.refresh_data(db)
print("DuckDB refreshed\n")

client = TestClient(app)

# 测试1: 漏斗报表下载
print("="*60)
print("Test 1: 漏斗报表下载")
print("="*60)
try:
    response = client.get("/api/v1/download/funnel-report")
    if response.status_code == 200:
        # 检查响应头
        cd = response.headers.get("content-disposition", "")
        has_filename_star = "filename*=UTF-8''" in cd
        has_filename = "filename=" in cd
        
        # 检查Excel内容
        xls = pd.ExcelFile(BytesIO(response.content))
        sheets = xls.sheet_names
        has_calc_sheet = "促销达成计算规则" in sheets
        
        if has_filename_star and has_calc_sheet:
            result = f"PASS (size={len(response.content)}B, sheets={sheets})"
        else:
            result = f"FAIL: filename*={has_filename_star}, calc_sheet={has_calc_sheet}, sheets={sheets}"
    else:
        result = f"FAIL (status={response.status_code})"
except Exception as e:
    result = f"FAIL: {type(e).__name__}: {e}"
results.append(("漏斗报表下载", result))
print(f"Result: {result}\n")

# 测试2: 销售走势报表下载
print("="*60)
print("Test 2: 销售走势报表下载")
print("="*60)
try:
    promotions = db.query(models.Promotion).limit(1).all()
    pid = promotions[0].id if promotions else 1
    
    response = client.get(f"/api/v1/download/sales-trend-report?promotion_id={pid}")
    if response.status_code == 200:
        # 检查响应头
        cd = response.headers.get("content-disposition", "")
        has_filename_star = "filename*=UTF-8''" in cd
        has_filename = "filename=" in cd
        
        # 检查Excel内容
        xls = pd.ExcelFile(BytesIO(response.content))
        sheets = xls.sheet_names
        has_impact_sheet = "陈列不合格影响范围" in sheets
        has_calc_sheet = "促销达成计算规则" in sheets
        has_trend_sheet = "每日销售走势(含异常复盘)" in sheets
        has_summary_sheet = "促销汇总" in sheets
        
        # 读取影响范围数据
        impact_df = pd.read_excel(xls, sheet_name="陈列不合格影响范围")
        impact_count = len(impact_df)
        
        all_ok = has_filename_star and has_impact_sheet and has_calc_sheet and has_trend_sheet and has_summary_sheet
        if all_ok:
            result = f"PASS (size={len(response.content)}B, sheets={len(sheets)}, impact_records={impact_count})"
            print(f"  Sheets: {sheets}")
            print(f"  Impact range preview:")
            print(impact_df.head(3).to_string(index=False))
        else:
            result = f"FAIL: filename*={has_filename_star}, impact={has_impact_sheet}, calc={has_calc_sheet}, sheets={sheets}"
    else:
        result = f"FAIL (status={response.status_code})"
except Exception as e:
    result = f"FAIL: {type(e).__name__}: {e}"
results.append(("销售走势报表下载", result))
print(f"\nResult: {result}\n")

# 测试3: 阈值审计报表下载
print("="*60)
print("Test 3: 阈值审计报表下载")
print("="*60)
try:
    response = client.get("/api/v1/download/threshold-audit-report")
    if response.status_code == 200:
        cd = response.headers.get("content-disposition", "")
        has_filename_star = "filename*=UTF-8''" in cd
        xls = pd.ExcelFile(BytesIO(response.content))
        sheets = xls.sheet_names
        has_calc_sheet = "促销达成计算规则" in sheets
        if has_filename_star and has_calc_sheet:
            result = f"PASS (sheets={sheets})"
        else:
            result = f"FAIL: filename*={has_filename_star}, calc={has_calc_sheet}, sheets={sheets}"
    else:
        result = f"FAIL (status={response.status_code})"
except Exception as e:
    result = f"FAIL: {type(e).__name__}: {e}"
results.append(("阈值审计报表下载", result))
print(f"Result: {result}\n")

# 测试4: 整改记录报表下载
print("="*60)
print("Test 4: 整改记录报表下载")
print("="*60)
try:
    response = client.get("/api/v1/download/rectification-report")
    if response.status_code == 200:
        cd = response.headers.get("content-disposition", "")
        has_filename_star = "filename*=UTF-8''" in cd
        xls = pd.ExcelFile(BytesIO(response.content))
        sheets = xls.sheet_names
        has_calc_sheet = "促销达成计算规则" in sheets
        if has_filename_star and has_calc_sheet:
            result = f"PASS (sheets={sheets})"
        else:
            result = f"FAIL: filename*={has_filename_star}, calc={has_calc_sheet}, sheets={sheets}"
    else:
        result = f"FAIL (status={response.status_code})"
except Exception as e:
    result = f"FAIL: {type(e).__name__}: {e}"
results.append(("整改记录报表下载", result))
print(f"Result: {result}\n")

# 测试5: 陈列照片报表下载
print("="*60)
print("Test 5: 陈列照片报表下载")
print("="*60)
try:
    response = client.get("/api/v1/download/display-photo-report")
    if response.status_code == 200:
        cd = response.headers.get("content-disposition", "")
        has_filename_star = "filename*=UTF-8''" in cd
        xls = pd.ExcelFile(BytesIO(response.content))
        sheets = xls.sheet_names
        has_calc_sheet = "促销达成计算规则" in sheets
        if has_filename_star and has_calc_sheet:
            result = f"PASS (sheets={sheets})"
        else:
            result = f"FAIL: filename*={has_filename_star}, calc={has_calc_sheet}, sheets={sheets}"
    else:
        result = f"FAIL (status={response.status_code})"
except Exception as e:
    result = f"FAIL: {type(e).__name__}: {e}"
results.append(("陈列照片报表下载", result))
print(f"Result: {result}\n")

# 测试6: 异常摘要报表下载
print("="*60)
print("Test 6: 异常摘要报表下载")
print("="*60)
try:
    response = client.get("/api/v1/download/exception-digest-report")
    if response.status_code == 200:
        cd = response.headers.get("content-disposition", "")
        has_filename_star = "filename*=UTF-8''" in cd
        xls = pd.ExcelFile(BytesIO(response.content))
        sheets = xls.sheet_names
        has_calc_sheet = "促销达成计算规则" in sheets
        if has_filename_star and has_calc_sheet:
            result = f"PASS (sheets={sheets})"
        else:
            result = f"FAIL: filename*={has_filename_star}, calc={has_calc_sheet}, sheets={sheets}"
    else:
        result = f"FAIL (status={response.status_code})"
except Exception as e:
    result = f"FAIL: {type(e).__name__}: {e}"
results.append(("异常摘要报表下载", result))
print(f"Result: {result}\n")

# 汇总结果
print("\n" + "="*60)
print("ALL TEST RESULTS")
print("="*60)
all_pass = True
for name, result in results:
    status = "✅" if result.startswith("PASS") else "❌"
    if "FAIL" in result:
        all_pass = False
    print(f"{status} {name}: {result}")

print("="*60)
if all_pass:
    print("🎉 ALL TESTS PASSED!")
else:
    print("⚠️  SOME TESTS FAILED")
    sys.exit(1)

db.close()
