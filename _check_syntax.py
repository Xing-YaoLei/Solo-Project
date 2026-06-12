import ast
import sys

files = [
    'src/config/__init__.py',
    'src/data/minio_client.py',
    'src/data/duckdb_manager.py',
    'src/data/repository.py',
    'src/data/seed.py',
    'src/data/__init__.py',
    'src/business/metric_versions.py',
    'src/business/loss_calculator.py',
    'src/business/__init__.py',
    'src/auth/permissions.py',
    'src/auth/__init__.py',
    'src/share/share_manager.py',
    'src/share/__init__.py',
    'app.py',
]

errors = []
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            ast.parse(fh.read(), filename=f)
        print(f'✓ {f}')
    except SyntaxError as e:
        errors.append((f, e))
        print(f'✗ {f}: {e}')

if errors:
    print(f'\nFound {len(errors)} syntax error(s)')
    sys.exit(1)
print('\nAll files parsed successfully!')
