import os
import duckdb
import polars as pl
from config import settings

class DatabaseManager:
    def __init__(self):
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        self.conn = duckdb.connect(settings.DUCKDB_PATH)
        self._init_tables()

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS packages (
                package_id VARCHAR PRIMARY KEY,
                package_name VARCHAR NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                original_stock INTEGER NOT NULL,
                current_stock INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS funnel_records (
                record_id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                package_id VARCHAR NOT NULL,
                stage VARCHAR NOT NULL,
                stage_time TIMESTAMP NOT NULL,
                channel VARCHAR,
                is_deleted BOOLEAN DEFAULT FALSE,
                version INTEGER DEFAULT 1,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS payment_records (
                payment_id VARCHAR PRIMARY KEY,
                order_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                package_id VARCHAR NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR,
                payment_time TIMESTAMP NOT NULL,
                status VARCHAR NOT NULL,
                channel VARCHAR,
                deposit_amount DECIMAL(10,2) DEFAULT 0,
                version INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS door_lock_records (
                lock_id VARCHAR PRIMARY KEY,
                order_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                package_id VARCHAR NOT NULL,
                checkin_time TIMESTAMP,
                checkout_time TIMESTAMP,
                door_open_count INTEGER DEFAULT 0,
                last_open_time TIMESTAMP,
                status VARCHAR NOT NULL,
                version INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS verification_records (
                verification_id VARCHAR PRIMARY KEY,
                order_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                package_id VARCHAR NOT NULL,
                verification_time TIMESTAMP NOT NULL,
                verification_type VARCHAR NOT NULL,
                operator VARCHAR,
                remarks TEXT,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS customer_service_messages (
                message_id VARCHAR PRIMARY KEY,
                order_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                package_id VARCHAR,
                message_content TEXT NOT NULL,
                message_time TIMESTAMP NOT NULL,
                sender_type VARCHAR NOT NULL,
                promised_delivery_time TIMESTAMP,
                promised_refund_policy VARCHAR,
                version INTEGER DEFAULT 1,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS deposit_records (
                deposit_id VARCHAR PRIMARY KEY,
                order_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                package_id VARCHAR NOT NULL,
                deposit_amount DECIMAL(10,2) NOT NULL,
                paid_time TIMESTAMP NOT NULL,
                refund_time TIMESTAMP,
                refund_amount DECIMAL(10,2),
                status VARCHAR NOT NULL,
                reason TEXT,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS channel_orders (
                channel_order_id VARCHAR PRIMARY KEY,
                internal_order_id VARCHAR,
                package_id VARCHAR NOT NULL,
                channel_name VARCHAR NOT NULL,
                channel_order_no VARCHAR,
                order_amount DECIMAL(10,2) NOT NULL,
                create_time TIMESTAMP NOT NULL,
                status VARCHAR NOT NULL,
                is_abnormal BOOLEAN DEFAULT FALSE,
                abnormal_reason TEXT,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS remark_tasks (
                task_id VARCHAR PRIMARY KEY,
                package_id VARCHAR NOT NULL,
                task_type VARCHAR NOT NULL,
                trigger_value DECIMAL(10,4) NOT NULL,
                threshold DECIMAL(10,4) NOT NULL,
                trigger_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR DEFAULT '待处理',
                handler VARCHAR,
                conclusion TEXT,
                chart_anchor VARCHAR,
                resolved_time TIMESTAMP,
                FOREIGN KEY (package_id) REFERENCES packages(package_id)
            )
        """)

        try:
            self.conn.execute("CREATE SEQUENCE IF NOT EXISTS data_versions_seq START 1")
        except Exception:
            pass

        try:
            existing_cols = [row[0] for row in self.conn.execute("DESCRIBE data_versions").fetchall()]
        except Exception:
            existing_cols = []

        if not existing_cols:
            self.conn.execute("""
                CREATE TABLE data_versions (
                    version_id INTEGER PRIMARY KEY DEFAULT nextval('data_versions_seq'),
                    record_version INTEGER NOT NULL,
                    table_name VARCHAR NOT NULL,
                    record_id VARCHAR NOT NULL,
                    snapshot_data JSON NOT NULL,
                    change_reason VARCHAR,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    changed_by VARCHAR
                )
            """)
        else:
            self._migrate_data_versions(existing_cols)

    def get_conn(self):
        return self.conn

    def _migrate_data_versions(self, existing_cols: list):
        try:
            if 'record_version' not in existing_cols:
                self.conn.execute("ALTER TABLE data_versions ADD COLUMN record_version INTEGER DEFAULT 1")
                existing_cols.append('record_version')
            
            if 'version_id' in existing_cols and 'record_version' in existing_cols:
                try:
                    self.conn.execute("""
                        UPDATE data_versions 
                        SET record_version = COALESCE(record_version, version_id, 1)
                    """)
                except Exception:
                    pass
            
            try:
                col_info = self.conn.execute(
                    "SELECT column_name, column_default FROM information_schema.columns "
                    "WHERE table_name = 'data_versions' AND column_name = 'version_id'"
                ).fetchone()
                if col_info and (col_info[1] is None or 'nextval' not in str(col_info[1]).lower()):
                    try:
                        self.conn.execute("""
                            ALTER TABLE data_versions 
                            ALTER COLUMN version_id SET DEFAULT nextval('data_versions_seq')
                        """)
                    except Exception:
                        pass
            except Exception:
                pass
            
            try:
                has_null_rid = self.conn.execute(
                    "SELECT COUNT(*) FROM data_versions WHERE record_version IS NULL"
                ).fetchone()[0]
                if has_null_rid and has_null_rid > 0:
                    self.conn.execute("UPDATE data_versions SET record_version = 1 WHERE record_version IS NULL")
            except Exception:
                pass
        except Exception as e:
            print(f"Migration warning: {e}")

    def query_polars(self, sql: str) -> pl.DataFrame:
        return self.conn.sql(sql).pl()

    def close(self):
        self.conn.close()

db = DatabaseManager()
