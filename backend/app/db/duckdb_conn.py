import duckdb
import os
from ..core.config import settings


def get_duckdb_connection():
    os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
    conn = duckdb.connect(settings.DUCKDB_PATH)
    return conn
