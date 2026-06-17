import duckdb
import os
from pathlib import Path

DB_PATH = os.path.join(Path(__file__).parent.parent.parent, "data", "elder_care.db")

_db_conn = None

def get_db():
    global _db_conn
    if _db_conn is None:
        _db_conn = duckdb.connect(DB_PATH)
    return _db_conn

def close_db():
    global _db_conn
    if _db_conn is not None:
        _db_conn.close()
        _db_conn = None
