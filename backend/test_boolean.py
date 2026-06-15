import pandas as pd


def _parse_boolean(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        if pd.isna(value):
            return default
        return value != 0
    if isinstance(value, str):
        s = value.strip().lower()
        if s == '':
            return default
        if s in ('true', '1', '是', 'y', 'yes'):
            return True
        if s in ('false', '0', '否', 'n', 'no'):
            return False
        return default
    return default


truthy = [True, 'True', 'true', 'TRUE', 1, '1', '是', 'Y', 'y', 'yes', 'Yes']
print('TRUTHY tests:')
for v in truthy:
    result = _parse_boolean(v)
    status = 'OK' if result is True else 'FAIL'
    print(f'  _parse_boolean({repr(v):15}) = {result}  {status}')

falsy = [False, 'False', 'false', 'FALSE', 0, '0', '否', 'N', 'n', 'no', 'No', '']
print('\nFALSY tests:')
for v in falsy:
    result = _parse_boolean(v)
    status = 'OK' if result is False else 'FAIL'
    print(f'  _parse_boolean({repr(v):15}) = {result}  {status}')

print('\nDEFAULT tests:')
for v in [None, float('nan')]:
    result = _parse_boolean(v, default=False)
    status = 'OK' if result is False else 'FAIL'
    print(f'  _parse_boolean({repr(v):15}, default=False) = {result}  {status}')
    result = _parse_boolean(v, default=True)
    status = 'OK' if result is True else 'FAIL'
    print(f'  _parse_boolean({repr(v):15}, default=True)  = {result}  {status}')

# 验证 CSV 中 is_submitted 为 False 等写入未提交
print('\nCSV is_submitted behavior:')
for v in ['False', 'false', 0, '0', '否']:
    parsed = _parse_boolean(v, default=False)
    expected = False
    status = 'OK' if parsed is expected else 'FAIL'
    print(f'  CSV value={repr(v):8} -> is_submitted={parsed} (expected=False)  {status}')
