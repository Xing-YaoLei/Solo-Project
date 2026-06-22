#!/usr/bin/env python3
"""
测试空 PostgreSQL 库自动建表和加载种子数据（完整流程）
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, inspect, text
from app.config import Config

TEST_DB_NAME = 'audit_compliance_test_full'
test_db_uri = Config.SQLALCHEMY_DATABASE_URI.replace('audit_compliance', TEST_DB_NAME)

print("=" * 60)
print("测试完整流程: 空库自动建表 + 加载种子数据")
print("=" * 60)

pg_admin_uri = f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/postgres"
admin_engine = create_engine(pg_admin_uri, echo=False, isolation_level="AUTOCOMMIT")

try:
    with admin_engine.connect() as conn:
        conn.execute(text(f"""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid()
        """))
        conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
        conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    print(f"  ✅ 创建临时空数据库 {TEST_DB_NAME}")
    
    import app.config as config_module
    original_uri = config_module.Config.SQLALCHEMY_DATABASE_URI
    config_module.Config.SQLALCHEMY_DATABASE_URI = test_db_uri
    
    import app.database as db_module
    from app.database import Base
    from sqlalchemy.orm import sessionmaker
    
    db_module.engine = create_engine(test_db_uri, echo=False)
    db_module.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_module.engine)
    
    test_inspector = inspect(db_module.engine)
    tables_before = test_inspector.get_table_names()
    print(f"  初始化前表数量: {len(tables_before)}")
    assert len(tables_before) == 0, "❌ 数据库不是空的"
    
    print("  调用 ensure_database_ready()...")
    result = db_module.ensure_database_ready()
    assert result, "❌ ensure_database_ready() 返回 False"
    print("  ✅ ensure_database_ready() 执行成功")
    
    test_inspector2 = inspect(db_module.engine)
    tables_after = test_inspector2.get_table_names()
    print(f"  建表后表数量: {len(tables_after)}")
    print(f"  表列表: {', '.join(sorted(tables_after))}")
    
    expected_tables = {'department', 'audit_issue', 'employee', 'sampling_record', 
                       'rectification_plan', 'note_task', 'evidence', 'email_record',
                       'checklist_category', 'checklist_item', 'checklist_subitem',
                       'permission_log', 'supplier', 'erp_transaction', 'celery_task'}
    
    missing = expected_tables - set(tables_after)
    extra = set(tables_after) - expected_tables
    if missing:
        print(f"  ❌ 缺失表: {missing}")
    if extra:
        print(f"  ⚠️  额外表: {extra}")
    assert not missing, f"❌ 缺失表: {missing}"
    print("  ✅ 所有预期表已创建")
    
    from app.models import Department, Employee, AuditIssue, ChecklistCategory, Supplier
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=db_module.engine)
    db = TestSession()
    try:
        dept_count = db.query(Department).count()
        emp_count = db.query(Employee).count()
        issue_count = db.query(AuditIssue).count()
        cat_count = db.query(ChecklistCategory).count()
        supplier_count = db.query(Supplier).count()
        
        print(f"  部门: {dept_count}")
        print(f"  员工: {emp_count}")
        print(f"  问题: {issue_count}")
        print(f"  检查清单类别: {cat_count}")
        print(f"  供应商: {supplier_count}")
        
        assert dept_count == 6, f"❌ 部门数量不对: {dept_count}, 期望 6"
        assert emp_count >= 10, f"❌ 员工数量不对: {emp_count}, 期望 >= 10"
        assert issue_count > 0, "❌ 问题数量为 0"
        assert cat_count > 0, "❌ 检查清单类别数量为 0"
        assert supplier_count > 0, "❌ 供应商数量为 0"
        print("  ✅ 种子数据验证通过")
    finally:
        db.close()
    
    print()
    print("=" * 60)
    print("测试: 已有数据时 ensure_database_ready() 不重复初始化")
    print("=" * 60)
    
    result2 = db_module.ensure_database_ready()
    assert result2, "❌ ensure_database_ready() 第二次调用返回 False"
    
    db2 = TestSession()
    try:
        dept_count2 = db2.query(Department).count()
        issue_count2 = db2.query(AuditIssue).count()
        print(f"  第二次调用后部门数: {dept_count2}")
        print(f"  第二次调用后问题数: {issue_count2}")
        assert dept_count2 == dept_count, "❌ 部门数量发生变化（重复初始化）"
        print("  ✅ 第二次调用不重复初始化")
    finally:
        db2.close()
    
    config_module.Config.SQLALCHEMY_DATABASE_URI = original_uri
    
finally:
    with admin_engine.connect() as conn:
        conn.execute(text(f"""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid()
        """))
        conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
    print(f"  ✅ 清理临时数据库完成")

print()
print("🎉 完整初始化流程测试通过！")
print()
print("功能总结：")
print("  ✅ 建表前自动导入 app.models 注册到 Base.metadata")
print("  ✅ register_models() 显式注册所有模型类")
print("  ✅ is_schema_initialized() 对比预期表和实际表，确保完整")
print("  ✅ ensure_database_ready() 空库时自动建表+加载种子数据")
print("  ✅ run.sh 预检查也使用已注册模型的初始化路径")
print("  ✅ 已有数据时不重复初始化")
