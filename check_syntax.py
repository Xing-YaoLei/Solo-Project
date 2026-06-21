import ast, sys
files = [
    'config.py', 'celery_app.py', 'run.py',
    'app/__init__.py', 'app/models.py',
    'app/services/__init__.py', 'app/services/data_service.py',
    'app/services/auth_service.py', 'app/services/export_service.py',
    'app/connectors/__init__.py', 'app/connectors/email_connector.py',
    'app/connectors/calendar_connector.py', 'app/connectors/payment_connector.py',
    'app/dashboard/__init__.py', 'app/dashboard/charts.py',
    'app/dashboard/components.py', 'app/dashboard/callbacks.py',
    'app/dashboard/layout.py',
    'app/tasks/__init__.py', 'app/tasks/data_sync.py'
]
errors = []
for f in files:
    try:
        with open(f) as fp:
            ast.parse(fp.read(), filename=f)
        print('OK  ', f)
    except SyntaxError as e:
        errors.append((f, str(e)))
        print('ERR ', f, ':', e)
print('\n=== 结果 ===')
if errors:
    print(f'发现 {len(errors)} 个错误')
    sys.exit(1)
else:
    print(f'全部 {len(files)} 个文件语法检查通过 ✓')
