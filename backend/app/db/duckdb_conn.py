import duckdb
from contextlib import contextmanager
from app.core.config import settings


class DuckDBConnection:
    _instance = None
    _conn = None

    @classmethod
    def get_connection(cls):
        if cls._conn is None:
            cls._conn = duckdb.connect(settings.DUCKDB_PATH)
            cls._init_views()
        return cls._conn

    @classmethod
    def _init_views(cls):
        conn = cls._conn
        try:
            conn.execute("""
                CREATE VIEW IF NOT EXISTS v_chapter_distribution AS
                SELECT 
                    c.name as course_name,
                    ch.name as chapter_name,
                    COUNT(q.id) as question_count,
                    COUNT(DISTINCT CASE WHEN sp.is_correct THEN sp.student_id END) as completed_count,
                    ROUND(
                        CAST(COUNT(DISTINCT CASE WHEN sp.is_correct THEN sp.student_id END) AS DECIMAL) 
                        / NULLIF(COUNT(DISTINCT sp.student_id), 0) * 100, 
                    2) as completion_rate
                FROM chapters ch
                JOIN courses c ON ch.course_id = c.id
                JOIN questions q ON q.chapter_id = ch.id
                LEFT JOIN student_practice sp ON sp.question_id = q.id
                GROUP BY c.name, ch.name, ch.order_index
                ORDER BY c.name, ch.order_index
            """)
        except Exception:
            pass

    @classmethod
    def close(cls):
        if cls._conn is not None:
            cls._conn.close()
            cls._conn = None


@contextmanager
def get_duckdb():
    conn = DuckDBConnection.get_connection()
    try:
        yield conn
    finally:
        pass
