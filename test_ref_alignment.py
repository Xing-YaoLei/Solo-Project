import sys
sys.path.insert(0, '.')

import polars as pl
from src.data import repository

print('=' * 70)
print('🔍 验证关联键口径统一 & sample_id 唯一性')
print('=' * 70)

repository.load_all(use_mock=True)
shortage = repository.parts_shortage
inv_hist = repository.parts_inventory_history

print(f'\n1. 检查 source_record_ref 格式（应为 REFxxxxxx）:')
ref_format_ok = shortage.filter(pl.col('source_record_ref').str.starts_with('REF')).shape[0]
print(f'   REF 格式: {ref_format_ok}/{shortage.shape[0]}')
print(f'   前5个示例: {shortage["source_record_ref"].head(5).to_list()}')

print(f'\n2. 检查 source_record_ref 与 original_record_ref 关联:')
valid_orig_refs = inv_hist['original_record_ref'].to_list()
matching_refs = shortage.filter(pl.col('source_record_ref').is_in(valid_orig_refs)).shape[0]
print(f'   source_record_ref 命中 original_record_ref: {matching_refs}/{shortage.shape[0]} ({100*matching_refs/shortage.shape[0]:.1f}%)')

print(f'\n3. 检查 sample_record_id 双向关联:')
inv_hist_with_sample = inv_hist.filter(pl.col('sample_record_id').is_not_null())
valid_samples = inv_hist_with_sample['sample_record_id'].to_list()
sample_matching = shortage.filter(pl.col('sample_record_id').is_in(valid_samples)).shape[0]
print(f'   sample_record_id 命中库存历史: {sample_matching}/{shortage.shape[0]}')

print(f'\n4. 检查缺货记录中 sample_record_id 唯一性:')
sample_counts = shortage.group_by('sample_record_id').agg(pl.count().alias('cnt'))
duplicates = sample_counts.filter(pl.col('cnt') > 1)
print(f'   重复 sample_id 数量: {duplicates.shape[0]}')
if duplicates.shape[0] > 0:
    print(f'   ❌ 重复的 sample_id: {duplicates.to_dicts()}')
else:
    print(f'   ✅ 所有 sample_record_id 都是唯一的')

print(f'\n5. 检查随机生成的 SMP 是否撞到已有样本:')
shortage_samples_set = set(shortage['sample_record_id'].to_list())
inv_samples_set = set(valid_samples)
collision = shortage_samples_set & inv_samples_set

# 对于碰撞的样本，检查 source_record_ref 是否正确绑定
collision_ok = True
collision_errors = []
for sample_id in collision:
    shortage_row = shortage.filter(pl.col('sample_record_id') == sample_id)
    inv_row = inv_hist_with_sample.filter(pl.col('sample_record_id') == sample_id)
    if shortage_row['source_record_ref'][0] != inv_row['original_record_ref'][0]:
        collision_ok = False
        collision_errors.append((sample_id, shortage_row['source_record_ref'][0], inv_row['original_record_ref'][0]))

print(f'   碰撞样本数: {len(collision)}')
if collision_ok:
    print(f'   ✅ 所有碰撞样本都正确绑定了对应的 original_record_ref')
else:
    print(f'   ❌ 以下样本绑定错误:')
    for sid, src_ref, orig_ref in collision_errors:
        print(f'      - {sid}: source_ref={src_ref}, 应为 orig_ref={orig_ref}')

print(f'\n6. 验证同源组合: 命中的 sample_id 对应的 source_ref 必须与 inventory_history 的 original_record_ref 一致')
matched_shortage = shortage.filter(pl.col('sample_record_id').is_in(valid_samples))
homology_ok = True
homology_errors = []
for row in matched_shortage.to_dicts():
    sample_id = row['sample_record_id']
    source_ref = row['source_record_ref']
    inv_row = inv_hist_with_sample.filter(pl.col('sample_record_id') == sample_id)
    if inv_row.shape[0] > 0 and inv_row['original_record_ref'][0] != source_ref:
        homology_ok = False
        homology_errors.append((sample_id, source_ref, inv_row['original_record_ref'][0]))

if homology_ok:
    print(f'   ✅ {matched_shortage.shape[0]} 个同源样本全部正确绑定')
else:
    print(f'   ❌ 以下同源样本绑定错误:')
    for sid, src_ref, orig_ref in homology_errors:
        print(f'      - {sid}: source_ref={src_ref}, 应为 orig_ref={orig_ref}')

print(f'\n7. 验证每个 sample_record_id 查询只指向一条出入库历史记录:')
unique_query_ok = True
query_errors = []
for row in shortage.to_dicts():
    sample_id = row['sample_record_id']
    source_ref = row['source_record_ref']
    
    # 通过 sample_id 查询
    by_sample = inv_hist.filter(pl.col('sample_record_id') == sample_id)
    # 通过 source_ref 查询
    by_source = inv_hist.filter(pl.col('original_record_ref') == source_ref)
    
    # 如果 sample_id 命中，则两条查询必须指向同一条记录
    if by_sample.shape[0] > 0:
        if by_sample.shape[0] > 1:
            unique_query_ok = False
            query_errors.append((sample_id, f'sample_id 查询返回 {by_sample.shape[0]} 条记录'))
        if by_source.shape[0] > 1:
            unique_query_ok = False
            query_errors.append((sample_id, f'source_ref 查询返回 {by_source.shape[0]} 条记录'))
        if by_sample.shape[0] == 1 and by_source.shape[0] == 1:
            if by_sample['history_id'][0] != by_source['history_id'][0]:
                unique_query_ok = False
                query_errors.append((sample_id, f'sample_id 和 source_ref 查询指向不同的记录'))

if unique_query_ok:
    print(f'   ✅ 所有样本查询都只指向唯一一条出入库历史记录')
else:
    print(f'   ❌ 以下样本查询存在问题:')
    for sid, err in query_errors:
        print(f'      - {sid}: {err}')

print(f'\n8. 具体示例验证 (从数据中抽取几个):')
test_records = shortage.filter(pl.col('sample_record_id').is_in(valid_samples)).head(5)
for row in test_records.to_dicts():
    sample_id = row['sample_record_id']
    source_ref = row['source_record_ref']
    
    hist_by_sample = inv_hist.filter(pl.col('sample_record_id') == sample_id)
    hist_by_source = inv_hist.filter(pl.col('original_record_ref') == source_ref)
    
    print(f'   sample_id={sample_id}:')
    print(f'     source_record_ref={source_ref}')
    print(f'     sample_id 查询: 找到 {hist_by_sample.shape[0]} 条')
    print(f'     source_ref 查询: 找到 {hist_by_source.shape[0]} 条')
    
    if hist_by_sample.shape[0] > 0 and hist_by_source.shape[0] > 0:
        sample_orig_ref = hist_by_sample['original_record_ref'][0]
        source_orig_ref = hist_by_source['original_record_ref'][0]
        same_record = hist_by_sample['history_id'][0] == hist_by_source['history_id'][0]
        print(f'     是否同一条记录: {same_record}')
        print(f'     sample_id 查到 REF: {sample_orig_ref}')
        print(f'     source_ref 查到 REF: {source_orig_ref}')

print(f'\n' + '=' * 70)
all_ok = (duplicates.shape[0] == 0 and collision_ok and homology_ok and unique_query_ok)
if all_ok:
    print('✅ 所有验证通过！sample_id 与 source_ref 绑定正确且唯一')
else:
    print('❌ 部分验证失败，请检查上面的错误信息')
print('=' * 70)
