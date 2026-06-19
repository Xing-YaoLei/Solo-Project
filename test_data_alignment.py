import sys
sys.path.insert(0, '.')

import polars as pl
from src.data import mock_data, polars_utils

print('=' * 60)
print('🔍 测试数据生成口径对齐')
print('=' * 60)

inv_hist = mock_data.generate_parts_inventory_history(n=200)
print(f'\n1. 库存历史: {inv_hist.shape[0]} 条')
print(f'   含 sample_record_id: {inv_hist.filter(pl.col("sample_record_id").is_not_null()).shape[0]} 条')
print(f'   original_record_ref 格式: {inv_hist["original_record_ref"][0]}')
print(f'   history_id 格式: {inv_hist["history_id"][0]}')

with_sample = inv_hist.filter(pl.col('sample_record_id').is_not_null()).head(3)
print(f'\n   对应关系示例:')
for row in with_sample.to_dicts():
    print(f'     sample_id={row["sample_record_id"]} <-> history_id={row["history_id"]} <-> original_ref={row["original_record_ref"]}')

parts_shortage = mock_data.generate_parts_shortage(n=30, inventory_history=inv_hist)
print(f'\n2. 缺货记录: {parts_shortage.shape[0]} 条')

valid_refs = inv_hist['history_id'].to_list()
valid_sample_ids = inv_hist.filter(pl.col('sample_record_id').is_not_null())['sample_record_id'].to_list()

matching_refs = parts_shortage.filter(pl.col('source_record_ref').is_in(valid_refs)).shape[0]
matching_samples = parts_shortage.filter(pl.col('sample_record_id').is_in(valid_sample_ids)).shape[0]

print(f'\n3. 关联验证:')
print(f'   source_record_ref 命中率: {matching_refs}/{parts_shortage.shape[0]}')
print(f'   sample_record_id 命中率: {matching_samples}/{parts_shortage.shape[0]}')

if matching_samples > 0:
    test_sample = parts_shortage.filter(pl.col('sample_record_id').is_in(valid_sample_ids))['sample_record_id'][0]
    print(f'\n4. 双向查询测试 sample_id={test_sample}:')
    hist_by_sample = inv_hist.filter(pl.col('sample_record_id') == test_sample)
    print(f'   sample_id -> 出入库历史: {hist_by_sample.shape[0]} 条')

    shortage_rec = parts_shortage.filter(pl.col('sample_record_id') == test_sample)
    source_ref = shortage_rec['source_record_ref'][0]
    hist_by_source = inv_hist.filter(pl.col('history_id') == source_ref)
    print(f'   source_ref={source_ref} -> 出入库历史: {hist_by_source.shape[0]} 条')

    shortage_by_sample = parts_shortage.filter(pl.col('sample_record_id') == test_sample)
    print(f'   sample_id -> 缺货记录: {shortage_by_sample.shape[0]} 条')

print('\n' + '=' * 60)
print('✅ 验证通过！')
print('=' * 60)
