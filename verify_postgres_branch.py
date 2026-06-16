#!/usr/bin/env python3
"""验证 PostgreSQL 默认 URL 进入 PostgreSQL 分支（不连接真实 DB）。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.pop("DATABASE_URL", None)

from config.settings import settings

print(f"[1] settings.DATABASE_URL = {settings.DATABASE_URL}")
expected = "postgresql://postgres:password@localhost:5432/rehab_center"
assert settings.DATABASE_URL == expected, \
    f"默认 URL 错误：期望 {expected}，实际 {settings.DATABASE_URL}"
print("    ✅ 与 README / .env.example 一致")

print(f"[2] settings.USE_SQLITE = {settings.USE_SQLITE}")
assert settings.USE_SQLITE is False, "USE_SQLITE 应当为 False（PostgreSQL 模式）"
print("    ✅ 进入 PostgreSQL 分支")

from database.db import _build_database_url, DATABASE_URL

print(f"[3] _build_database_url -> {_build_database_url(settings.DATABASE_URL)}")
assert DATABASE_URL == "postgresql+psycopg://postgres:password@localhost:5432/rehab_center", \
    f"URL 改写失败：{DATABASE_URL}"
print("    ✅ 自动改用 psycopg v3 驱动")

from database.db import engine
dialect = engine.url.get_dialect()
print(f"[4] engine 方言: name={dialect.name}, driver={dialect.driver}")
assert dialect.driver == "psycopg", f"驱动应为 psycopg，实际 {dialect.driver}"
print("    ✅ 驱动为 psycopg v3")

print("\n✅ 全部通过：默认 PostgreSQL URL 进入 PostgreSQL 分支")
