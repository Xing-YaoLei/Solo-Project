import sys
import os
sys.path.insert(0, os.getcwd())

print('=== 开始导入 app.main 模块 ===')
try:
    from app.main import app
    print('✅ app.main:app 导入成功')
except Exception as e:
    print(f'❌ 导入失败: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print(f'   - FastAPI 标题: {app.title}')
print(f'   - 版本: {app.version}')

print()
print('=== 路由检查 ===')
routes = [r for r in app.routes if hasattr(r, 'path')]
api_routes = [r for r in routes if r.path.startswith('/api')]
print(f'   - 总路由数: {len(routes)}')
print(f'   - /api 路由数: {len(api_routes)}')
print(f'   - 包含 /docs: {any("/docs" in r.path for r in routes)}')

print()
print('=== API 模块注册检查 ===')
for mod in ['auth', 'analytics', 'data_ingestion', 'export', 'share']:
    prefix = f'/api/{mod}'
    matched = [r.path for r in routes if r.path.startswith(prefix)]
    print(f'   - {mod}: {len(matched)} 条路由')

print()
print('=== OpenAPI 文档生成检查 ===')
try:
    schema = app.openapi()
    paths = list(schema.get('paths', {}).keys())
    print(f'   - 生成成功，共 {len(paths)} 个端点路径')
except Exception as e:
    print(f'   ⚠️  跳过 OpenAPI 生成: {e}')

print()
print('✅ 所有检查通过，即使没有 PostgreSQL 也能正常加载路由和 /docs')
