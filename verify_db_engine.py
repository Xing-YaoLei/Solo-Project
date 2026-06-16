#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_postgresql_url():
    os.environ["DATABASE_URL"] = "postgresql://postgres:password@localhost:5432/rehab_center"

    from config.settings import settings
    print(f"1. settings.DATABASE_URL = {settings.DATABASE_URL}")

    from database.db import _build_database_url, DATABASE_URL, engine
    rewritten = _build_database_url(settings.DATABASE_URL)
    print(f"2. _build_database_url result = {rewritten}")
    print(f"3. DATABASE_URL (module-level) = {DATABASE_URL}")
    print(f"4. engine.url = {engine.url}")

    dialect = engine.url.get_dialect()
    print(f"5. dialect name = {dialect.name}")
    print(f"6. dialect driver = {dialect.driver}")

    from sqlalchemy.dialects import registry
    impl = registry.load("postgresql.psycopg")
    print(f"7. psycopg dialect class = {impl}")

    assert str(engine.url).startswith("postgresql+psycopg://"), \
        f"URL 改写失败: {engine.url}"
    assert dialect.driver == "psycopg", \
        f"驱动不对: {dialect.driver}"

    print("\nPostgreSQL engine 创建验证 通过")


def test_sqlite_url():
    os.environ["DATABASE_URL"] = "sqlite:///rehab_center.db"

    import importlib
    import config.settings as _s
    importlib.reload(_s)
    settings = _s.settings

    import database.db as _db
    importlib.reload(_db)
    from database.db import DATABASE_URL, engine

    print(f"\n1. DATABASE_URL = {DATABASE_URL}")
    print(f"2. engine.url = {engine.url}")

    dialect = engine.url.get_dialect()
    print(f"3. dialect name = {dialect.name}")
    print(f"4. dialect driver = {dialect.driver}")

    assert str(engine.url).startswith("sqlite://"), \
        f"SQLite URL 异常: {engine.url}"

    print("\nSQLite engine 创建验证 通过")


def test_url_passthrough():
    os.environ["DATABASE_URL"] = "postgresql+psycopg://user:pass@host:5432/db"

    import importlib
    import config.settings as _s
    importlib.reload(_s)
    settings = _s.settings

    import database.db as _db
    importlib.reload(_db)
    from database.db import DATABASE_URL, engine

    print(f"\n1. DATABASE_URL = {DATABASE_URL}")
    assert DATABASE_URL == "postgresql+psycopg://user:pass@host:5432/db", \
        f"已含 +psycopg 的 URL 不应该再被改写: {DATABASE_URL}"

    print("\npostgresql+psycopg:// 直通验证 通过")


if __name__ == "__main__":
    test_postgresql_url()
    test_sqlite_url()
    test_url_passthrough()
    print("\n全部验证通过")
