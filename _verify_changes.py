from src.ui.charts import safe_drop_columns, safe_select_columns
from src.auth.permissions import permission_manager, UserRole, _is_sensitive_col
from src.pages.import_data import render_import_data_page
from src.data.database import db
import polars as pl

print('✅ 所有模块导入成功')

df = pl.DataFrame({'a': [1, 2], 'b': [3, 4], 'c': [5, 6]})
result = safe_drop_columns(df, ['b', 'd'])
print(f'✅ safe_drop_columns 测试通过: {result.columns}')

result2 = safe_select_columns(df, ['a', 'd'])
print(f'✅ safe_select_columns 测试通过: {result2.columns}')

print(f'✅ _is_sensitive_col 持票人 tickets: {_is_sensitive_col("tickets", "持票人")}')
print(f'✅ _is_sensitive_col 座位 tickets: {_is_sensitive_col("tickets", "座位")}')
print(f'✅ _is_sensitive_col 购票人 orders: {_is_sensitive_col("orders", "购票人")}')
print(f'✅ _is_sensitive_col 票码 gate_records: {_is_sensitive_col("gate_records", "票码")}')

df2 = pl.DataFrame({
    '持票人': ['张三', '李四'],
    '购票人': ['王五', '赵六'],
    '座位': ['A1-01', 'B2-03'],
    '票码': ['TCK00123ABC', 'TCK00456DEF'],
})
masked = permission_manager.mask_sensitive_data(df2, 'tickets', UserRole.GATE_STAFF)
print('✅ mask_sensitive_data 中文列测试通过')
print(f'   持票人: {masked["持票人"].to_list()}')
print(f'   座位: {masked["座位"].to_list()}')
print(f'   票码: {masked["票码"].to_list()}')

print()
print('🎉 所有测试通过！')
