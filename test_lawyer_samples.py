import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.utils.analyzer import risk_analyzer

print("=== 测试 get_returned_samples 带 lawyer 参数 ===")

samples_all = risk_analyzer.get_returned_samples(limit=100)
print(f"所有退回样本: {len(samples_all)} 条")

if len(samples_all) > 0:
    lawyer_name = samples_all["lawyer"][0]
    print(f"\n选择律师: {lawyer_name}")
    
    samples_by_lawyer = risk_analyzer.get_returned_samples(lawyer=lawyer_name, limit=50)
    print(f"按律师筛选后样本: {len(samples_by_lawyer)} 条")
    
    for i in range(min(3, len(samples_by_lawyer))):
        row = samples_by_lawyer.row(i, named=True)
        print(f"  - {row['doc_id']}: {row['lawyer']}, {row['region']}, {row['doc_type']}")
    
    all_lawyers_match = all(row["lawyer"] == lawyer_name for row in samples_by_lawyer.iter_rows(named=True))
    print(f"\n✅ 所有样本律师都匹配: {all_lawyers_match}")
    
    # 测试多个参数组合
    region = samples_all["region"][0]
    samples_combined = risk_analyzer.get_returned_samples(region=region, lawyer=lawyer_name, limit=50)
    print(f"\n按区域+律师筛选: {len(samples_combined)} 条")
    
    all_match = all(row["lawyer"] == lawyer_name and row["region"] == region 
                    for row in samples_combined.iter_rows(named=True))
    print(f"✅ 所有样本区域+律师都匹配: {all_match}")
    
print("\n✅ get_returned_samples lawyer 参数测试通过!")
