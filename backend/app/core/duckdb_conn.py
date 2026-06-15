import duckdb
from contextlib import contextmanager
from .config import get_settings
import os

settings = get_settings()


def init_duckdb():
    os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
    con = duckdb.connect(settings.DUCKDB_PATH)
    return con


@contextmanager
def get_duckdb_connection():
    con = init_duckdb()
    try:
        yield con
    finally:
        con.close()
