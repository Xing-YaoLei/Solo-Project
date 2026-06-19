import sys
sys.path.insert(0, '.')

import polars as pl
from src.data import repository

print('加载数据中...')
repository.load_all(use_mock=True)

print(f'车辆档案: {repository.vehicles.shape[0]} 条')
print(f'收银流水: {repository.cash_transactions.shape[0]} 条')
print(f'维修工单: {repository.work_orders.shape[0]} 条')
print(f'工单项目: {repository.work_order_items.shape[0]} 条')
print(f'配件库存: {repository.parts_inventory.shape[0]} 条')
print(f'库存历史: {repository.parts_inventory_history.shape[0]} 条')
print(f'缺货记录: {repository.parts_shortage.shape[0]} 条')

print(f'\n验证数据关联:')
valid_refs = repository.parts_inventory_history['history_id'].to_list()
matching = repository.parts_shortage.filter(pl.col('source_record_ref').is_in(valid_refs)).shape[0]
print(f'source_record_ref 命中率: {matching}/{repository.parts_shortage.shape[0]}')

valid_samples = repository.parts_inventory_history.filter(pl.col('sample_record_id').is_not_null())['sample_record_id'].to_list()
sample_matching = repository.parts_shortage.filter(pl.col('sample_record_id').is_in(valid_samples)).shape[0]
print(f'sample_record_id 命中率: {sample_matching}/{repository.parts_shortage.shape[0]}')

print('\n✅ 数据加载测试通过！')
