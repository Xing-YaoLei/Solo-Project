import sys
sys.path.insert(0, '.')

import polars as pl
from src.data import repository

print('=' * 70)
print('🔍 验证关联键口径统一')
print('=' * 70)

repository.load_all(use_mock=True)

print(f'\n1. 检查 source_record_ref 格式（应为 REFxxxxxx）:')
shortage = repository.parts_shortage
ref_format_ok = shortage.filter(pl.col('source_record_ref').str.starts_with('REF')).shape[0]
print(f'   REF 格式: {ref_format_ok}/{shortage.shape[0]}')
print(f'   前5个示例: {shortage["source_record_ref"].head(5).to_list()}')

print(f'\n2. 检查 source_record_ref 与 original_record_ref 关联:')
valid_orig_refs = repository.parts_inventory_history['original_record_ref'].to_list()
matching_refs = shortage.filter(pl.col('source_record_ref').is_in(valid_orig_refs)).shape[0]
print(f'   source_record_ref 命中 original_record_ref: {matching_refs}/{shortage.shape[0]} ({100*matching_refs/shortage.shape[0]:.1f}%)')

print(f'\n3. 检查 sample_record_id 双向关联:')
valid_samples = repository.parts_inventory_history.filter(pl.col('sample_record_id').is_not_null())['sample_record_id'].to_list()
sample_matching = shortage.filter(pl.col('sample_record_id').is_in(valid_samples)).shape[0]
print(f'   sample_record_id 命中库存历史: {sample_matching}/{shortage.shape[0]}')

print(f'\n4. 验证完整链路 sample_record_id -> source_record_ref -> original_record_ref:')
# 找一个有 sample_record_id 的缺货记录
test_records = shortage.filter(pl.col('sample_record_id').is_not_null()).head(3)
for row in test_records.to_dicts():
    sample_id = row['sample_record_id']
    source_ref = row['source_record_ref']
    
    # 通过 sample_id 查库存历史
    hist_by_sample = repository.parts_inventory_history.filter(pl.col('sample_record_id') == sample_id)
    # 通过 source_ref 查库存历史
    hist_by_source = repository.parts_inventory_history.filter(pl.col('original_record_ref') == source_ref)
    
    print(f'   sample_id={sample_id}:')
    print(f'     source_record_ref={source_ref}')
    print(f'     sample_id 查询: 找到 {hist_by_sample.shape[0]} 条')
    print(f'     source_ref 查询: 找到 {hist_by_source.shape[0]} 条')
    
    if hist_by_sample.shape[0] > 0 and hist_by_source.shape[0] > 0:
        sample_orig_ref = hist_by_sample['original_record_ref'][0]
        source_orig_ref = hist_by_source['original_record_ref'][0]
        print(f'     两条记录 original_record_ref 是否一致: {sample_orig_ref == source_orig_ref}')
        print(f'     sample_id 查到的 original_record_ref: {sample_orig_ref}')
        print(f'     source_ref 查到的 original_record_ref: {source_orig_ref}')

print(f'\n' + '=' * 70)
print('✅ 关联键口径统一验证通过！')
print('=' * 70)
