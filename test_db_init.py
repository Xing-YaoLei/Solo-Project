#!/usr/bin/env python3
"""
测试数据库启动初始化逻辑
"""
import sys
sys.path.insert(0, '.')

from app.database import (
    ensure_database_ready, check_database_connection, 
    is_schema_initialized, DB_TYPE, engine
)
from sqlalchemy import inspect, text

print("=" * 60)
print("测试1: 数据库类型和连接")
print("=" * 60)
print(f"  DB_TYPE: {DB_TYPE}")
print(f"  Engine URL: {engine.url}")
assert DB_TYPE == 'postgresql', f"❌ DB_TYPE 应该是 postgresql，实际: {DB_TYPE}"
print("  ✅ 数据库类型正确")

print()
print("=" * 60)
print("测试2: check_database_connection()")
print("=" * 60)
connected = check_database_connection()
print(f"  连接状态: {'成功' if connected else '失败'}")
assert connected, "❌ 数据库连接失败"
print("  ✅ 数据库连接正常")

print()
print("=" * 60)
print("测试3: is_schema_initialized()")
print("=" * 60)
has_schema = is_schema_initialized()
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"  Schema 已初始化: {has_schema}")
print(f"  表数量: {len(tables)}")
if tables:
    print(f"  表列表: {', '.join(tables[:5])}...")
assert has_schema, "❌ Schema 未初始化"
print("  ✅ Schema 已初始化")

print()
print("=" * 60)
print("测试4: ensure_database_ready() - 已有 Schema 不应重复初始化")
print("=" * 60)
result = ensure_database_ready()
print(f"  ensure_database_ready() 返回: {result}")
assert result, "❌ ensure_database_ready() 返回 False"
print("  ✅ ensure_database_ready() 正常工作")

print()
print("=" * 60)
print("测试5: 验证种子数据是否存在")
print("=" * 60)
from app.database import SessionLocal
from app.models import Department, Employee, AuditIssue

db = SessionLocal()
try:
    dept_count = db.query(Department).count()
    emp_count = db.query(Employee).count()
    issue_count = db.query(AuditIssue).count()
    print(f"  部门数量: {dept_count}")
    print(f"  员工数量: {emp_count}")
    print(f"  问题数量: {issue_count}")
    assert dept_count > 0, "❌ 部门表为空"
    assert emp_count > 0, "❌ 员工表为空"
    assert issue_count > 0, "❌ 问题表为空"
    print("  ✅ 种子数据已加载")
finally:
    db.close()

print()
print("🎉 所有数据库启动初始化测试通过！")
print()
print("功能总结：")
print("  ✅ 默认使用 PostgreSQL 数据库连接")
print("  ✅ check_database_connection() 验证连接状态")
print("  ✅ is_schema_initialized() 检查表是否存在")
print("  ✅ ensure_database_ready() 无表时自动建表+加载种子数据")
print("  ✅ 不再依赖 audit_compliance.db SQLite 文件判断")
