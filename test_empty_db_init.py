#!/usr/bin/env python3
"""
测试 PostgreSQL 无库表时自动建表和加载种子数据
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, inspect, text
from app.config import Config

test_db_uri = Config.SQLALCHEMY_DATABASE_URI.replace('audit_compliance', 'audit_compliance_test_empty')

print("=" * 60)
print("测试: 创建临时空数据库并验证自动初始化")
print("=" * 60)

pg_admin_uri = f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/postgres"
admin_engine = create_engine(pg_admin_uri, echo=False, isolation_level="AUTOCOMMIT")

try:
    with admin_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS audit_compliance_test_empty"))
        conn.execute(text(f"CREATE DATABASE audit_compliance_test_empty"))
    print("  ✅ 创建临时空数据库 audit_compliance_test_empty")
    
    test_engine = create_engine(test_db_uri, echo=False)
    test_inspector = inspect(test_engine)
    tables_before = test_inspector.get_table_names()
    print(f"  初始化前表数量: {len(tables_before)}")
    assert len(tables_before) == 0, "❌ 数据库不是空的"
    
    from app.database import Base
    from utils.init_data import init_reference_data, generate_mock_data
    from sqlalchemy.orm import sessionmaker
    
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    
    print("  正在建表...")
    Base.metadata.create_all(bind=test_engine)
    
    test_inspector2 = inspect(test_engine)
    tables_after = test_inspector2.get_table_names()
    print(f"  建表后表数量: {len(tables_after)}")
    assert len(tables_after) > 0, "❌ 建表失败"
    print("  ✅ 建表成功")
    
    import app.database as db_module
    original_engine = db_module.engine
    original_session = db_module.SessionLocal
    
    db_module.engine = test_engine
    db_module.SessionLocal = TestSessionLocal
    
    print("  正在加载种子数据...")
    init_reference_data()
    print("  ✅ 基础数据加载完成")
    generate_mock_data()
    print("  ✅ 模拟数据加载完成")
    
    from app.models import Department, Employee, AuditIssue
    db = TestSessionLocal()
    try:
        dept_count = db.query(Department).count()
        emp_count = db.query(Employee).count()
        issue_count = db.query(AuditIssue).count()
        print(f"  部门: {dept_count}, 员工: {emp_count}, 问题: {issue_count}")
        assert dept_count == 6, f"❌ 部门数量不对: {dept_count}"
        assert emp_count == 10, f"❌ 员工数量不对: {emp_count}"
        assert issue_count > 0, "❌ 问题数量为0"
        print("  ✅ 种子数据验证通过")
    finally:
        db.close()
    
    db_module.engine = original_engine
    db_module.SessionLocal = original_session
    
finally:
    with admin_engine.connect() as conn:
        conn.execute(text("""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = 'audit_compliance_test_empty' AND pid <> pg_backend_pid()
        """))
        conn.execute(text("DROP DATABASE IF EXISTS audit_compliance_test_empty"))
    print("  ✅ 清理临时数据库完成")

print()
print("🎉 无库表时自动建表和加载种子数据测试通过！")
