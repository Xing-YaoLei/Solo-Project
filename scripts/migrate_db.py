#!/usr/bin/env python3
"""
数据库迁移脚本
用于在已有数据库上添加新字段，支持版本化升级
用法: python scripts/migrate_db.py [--version VERSION]
"""

import os
import re
import sys
import argparse
from typing import List, Optional
from dotenv import load_dotenv

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)
sys.path.insert(0, PROJECT_ROOT)

load_dotenv()

from app import db, server
from sqlalchemy import text, inspect


MIGRATIONS = {
    "v1.0": {
        "description": "初始版本 - 创建所有表",
        "run": lambda: _v1_0_create_all_tables(),
    },
    "v1.1": {
        "description": "添加 sync_tasks 表的 config_source 和 config_url 字段",
        "run": lambda: _v1_1_add_sync_task_config_fields(),
    },
    "v1.2": {
        "description": "添加 sync_tasks 表索引并优化字段长度",
        "run": lambda: _v1_2_optimize_sync_task_fields(),
    },
}


def _parse_version(version_str: str) -> tuple:
    """
    解析语义化版本号，返回可用于排序的元组
    例如: "v1.2.3" -> (1, 2, 3)
    """
    match = re.match(r"v(\d+)(?:\.(\d+))?(?:\.(\d+))?", version_str)
    if not match:
        return (0, 0, 0)
    major = int(match.group(1))
    minor = int(match.group(2)) if match.group(2) else 0
    patch = int(match.group(3)) if match.group(3) else 0
    return (major, minor, patch)


def _get_sorted_versions() -> List[str]:
    """
    返回按语义化版本号排序的版本列表
    """
    return sorted(MIGRATIONS.keys(), key=_parse_version)


def _table_exists(table_name: str) -> bool:
    """检查表是否存在"""
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    """检查列是否存在"""
    inspector = inspect(db.engine)
    if not _table_exists(table_name):
        return False
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def _index_exists(table_name: str, index_name: str) -> bool:
    """检查索引是否存在"""
    inspector = inspect(db.engine)
    if not _table_exists(table_name):
        return False
    indexes = [idx["name"] for idx in inspector.get_indexes(table_name)]
    return index_name in indexes


def _execute_sql(sql: str, params: dict = None) -> None:
    """执行 SQL 语句，支持参数化查询"""
    with db.engine.connect() as conn:
        if params:
            conn.execute(text(sql), params)
        else:
            conn.execute(text(sql))
        conn.commit()


def _ensure_db_version_table() -> None:
    """确保 db_version 表存在"""
    if not _table_exists("db_version"):
        _execute_sql("""
            CREATE TABLE db_version (
                version VARCHAR(20) PRIMARY KEY,
                description VARCHAR(500),
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def _is_version_applied(version: str) -> bool:
    """检查指定版本是否已经应用"""
    _ensure_db_version_table()
    with db.engine.connect() as conn:
        result = conn.execute(
            text("SELECT 1 FROM db_version WHERE version = :version"),
            {"version": version}
        )
        return result.fetchone() is not None


def _get_applied_versions() -> List[str]:
    """获取所有已应用的版本列表（按语义化版本排序"""
    _ensure_db_version_table()
    with db.engine.connect() as conn:
        result = conn.execute(text("SELECT version FROM db_version"))
        versions = [row[0] for row in result.fetchall()]
    return sorted(versions, key=_parse_version)


def _get_current_version() -> str:
    """
    获取当前数据库版本（已应用的最高版本）
    如果没有 db_version 表或没有记录，返回最低的 MIGRATIONS 版本
    """
    applied = _get_applied_versions()
    if applied:
        return applied[-1]
    sorted_versions = _get_sorted_versions()
    return sorted_versions[0] if sorted_versions else "v1.0"


def _set_version(version: str, description: str) -> None:
    """
    设置数据库版本（Upsert 操作，已存在则更新）
    """
    _ensure_db_version_table()
    with db.engine.connect() as conn:
        existing = conn.execute(
            text("SELECT 1 FROM db_version WHERE version = :version"),
            {"version": version}
        ).fetchone()

        if existing:
            conn.execute(
                text("""
                    UPDATE db_version 
                    SET description = :description, 
                        applied_at = CURRENT_TIMESTAMP
                    WHERE version = :version
                """),
                {"version": version, "description": description}
            )
        else:
            conn.execute(
                text("""
                    INSERT INTO db_version (version, description) 
                    VALUES (:version, :description)
                """),
                {"version": version, "description": description}
            )
        conn.commit()


def _v1_0_create_all_tables() -> None:
    """v1.0 - 创建所有表"""
    print("  创建所有数据表...")
    db.create_all()
    print("  ✓ 所有数据表已创建")


def _v1_1_add_sync_task_config_fields() -> None:
    """v1.1 - 添加 sync_tasks 表的 config_source 和 config_url 字段"""
    if not _table_exists("sync_tasks"):
        print("  sync_tasks 表不存在，跳过")
        return

    if not _column_exists("sync_tasks", "config_source"):
        print("  添加 config_source 字段...")
        _execute_sql("""
            ALTER TABLE sync_tasks 
            ADD COLUMN config_source VARCHAR(100)
        """)
        print("  ✓ config_source 字段已添加")
    else:
        print("  ✓ config_source 字段已存在")

    if not _column_exists("sync_tasks", "config_url"):
        print("  添加 config_url 字段...")
        _execute_sql("""
            ALTER TABLE sync_tasks 
            ADD COLUMN config_url VARCHAR(500)
        """)
        print("  ✓ config_url 字段已添加")
    else:
        print("  ✓ config_url 字段已存在")


def _v1_2_optimize_sync_task_fields() -> None:
    """v1.2 - 添加索引并优化字段"""
    if not _table_exists("sync_tasks"):
        print("  sync_tasks 表不存在，跳过")
        return

    if not _index_exists("sync_tasks", "ix_sync_tasks_config_source"):
        print("  添加 config_source 索引...")
        _execute_sql("""
            CREATE INDEX ix_sync_tasks_config_source 
            ON sync_tasks(config_source)
        """)
        print("  ✓ config_source 索引已添加")
    else:
        print("  ✓ config_source 索引已存在")


def migrate(target_version: str = None) -> None:
    """执行数据库迁移"""
    print("=" * 60)
    print("职业教育在线课程漏斗报表 - 数据库迁移")
    print("=" * 60)

    with server.app_context():
        sorted_versions = _get_sorted_versions()
        applied_versions = _get_applied_versions()
        current_version = _get_current_version()

        print(f"\n已应用版本: {applied_versions if applied_versions else '(无)'}")
        print(f"当前最新版本: {current_version}")

        if target_version:
            if target_version in sorted_versions:
                target_idx = sorted_versions.index(target_version)
            else:
                print(f"  ⚠ 目标版本 {target_version} 不存在，使用最新版本")
                target_idx = len(sorted_versions) - 1
        else:
            target_idx = len(sorted_versions) - 1

        target_ver = sorted_versions[target_idx]
        print(f"目标版本: {target_ver}")
        print()

        migrated_count = 0
        skipped_count = 0

        for i in range(0, target_idx + 1):
            version = sorted_versions[i]
            migration = MIGRATIONS[version]

            if _is_version_applied(version):
                print(f"跳过 {version}: 已应用")
                skipped_count += 1
                continue

            print(f"执行迁移 {version}: {migration['description']}")
            try:
                migration["run"]()
                _set_version(version, migration["description"])
                print(f"✓ 迁移 {version} 完成")
                migrated_count += 1
            except Exception as e:
                print(f"✗ 迁移 {version} 失败: {e}")
                import traceback
                traceback.print_exc()
                raise
            print()

        print("=" * 60)
        print(f"数据库迁移完成！")
        print(f"  - 执行迁移: {migrated_count} 个")
        print(f"  - 跳过迁移: {skipped_count} 个")
        print(f"  - 当前最新版本: {_get_current_version()}")
        print("=" * 60)


def show_status() -> None:
    """显示数据库状态"""
    print("=" * 60)
    print("职业教育在线课程漏斗报表 - 数据库状态")
    print("=" * 60)

    with server.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\n数据库表 ({len(tables)} 个):")
        for table in sorted(tables):
            columns = inspector.get_columns(table)
            print(f"  - {table} ({len(columns)} 列)")
            for col in columns:
                col_type = str(col["type"])
                nullable = "NOT NULL" if not col["nullable"] else "NULL"
                print(f"      * {col['name']}: {col_type} {nullable}")

        applied = _get_applied_versions()
        print(f"\n已应用版本:")
        if applied:
            for v in applied:
                desc = MIGRATIONS.get(v, {}).get("description", "(未知)")
                print(f"  - {v}: {desc}")
        else:
            print("  (无)")

        print(f"\n当前最新版本: {_get_current_version()}")
        print()
        print("可用迁移版本:")
        for version in _get_sorted_versions():
            applied_mark = "✓" if _is_version_applied(version) else " "
            desc = MIGRATIONS[version]["description"]
            print(f"  [{applied_mark}] {version}: {desc}")
        print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="数据库迁移工具")
    parser.add_argument("--version", help="目标版本号 (如 v1.1)")
    parser.add_argument("--status", action="store_true", help="显示数据库状态")
    args = parser.parse_args()

    if args.status:
        show_status()
    else:
        migrate(args.version)
