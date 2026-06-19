import sys
sys.path.insert(0, '.')
from src.data import repository
repository.load_all(use_mock=True)

import polars as pl

# 找一个在日期范围内的记录
in_range = repository.parts_inventory_history.filter(
    (pl.col('change_date') >= pl.date(2026, 3, 21)) & 
    (pl.col('change_date') <= pl.date(2026, 6, 19))
)
print(f'日期范围内的记录数: {in_range.shape[0]}')
print(in_range[['original_record_ref', 'sample_record_id', 'change_date', 'history_id']].head(10).to_pandas().to_string())

# 找一个有 sample_record_id 且在范围内的记录
with_sample = in_range.filter(pl.col('sample_record_id').is_not_null())
print(f'\n有 sample_record_id 且在范围内的记录数: {with_sample.shape[0]}')
if with_sample.shape[0] > 0:
    print(with_sample[['original_record_ref', 'sample_record_id', 'change_date', 'history_id']].head(5).to_pandas().to_string())

