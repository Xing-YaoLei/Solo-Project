import uuid
import json
from datetime import datetime, timedelta
from database import db
from minio_storage import minio_mgr

class VersionController:
    def __init__(self):
        self.conn = db.get_conn()

    def snapshot_and_version(self, table_name: str, record_id: str, 
                             new_data: dict, change_reason: str = None, 
                             changed_by: str = None) -> int:
        current_data = self._get_current_record(table_name, record_id)
        if current_data:
            current_version = current_data.get('version', 1)
            new_version = current_version + 1
            
            minio_mgr.save_data_version(
                table_name=table_name,
                record_id=record_id,
                data=current_data,
                version=current_version,
                change_reason=change_reason
            )
            
            self.conn.execute("""
                INSERT INTO data_versions (record_version, table_name, record_id, snapshot_data, change_reason, changed_by)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [current_version, table_name, record_id, 
                  json.dumps(current_data, ensure_ascii=False, default=str), 
                  change_reason, changed_by])
        else:
            new_version = 1

        return new_version

    def _get_current_record(self, table_name: str, record_id: str) -> dict:
        id_column_map = {
            'payment_records': 'payment_id',
            'door_lock_records': 'lock_id',
            'customer_service_messages': 'message_id',
            'funnel_records': 'record_id'
        }
        id_col = id_column_map.get(table_name, 'id')
        
        try:
            result = self.conn.execute(
                f"SELECT * FROM {table_name} WHERE {id_col} = ?",
                [record_id]
            ).fetchone()
            
            if result:
                columns = [desc[0] for desc in self.conn.description]
                return dict(zip(columns, result))
            return None
        except Exception:
            return None

    def get_record_versions(self, table_name: str, record_id: str) -> list:
        minio_versions = minio_mgr.get_data_versions(table_name, record_id)
        
        try:
            db_versions = self.conn.execute("""
                SELECT 
                    record_version,
                    snapshot_data,
                    change_reason,
                    changed_at,
                    changed_by
                FROM data_versions
                WHERE table_name = ? AND record_id = ?
                ORDER BY record_version DESC
            """, [table_name, record_id]).fetchall()
            
            for row in db_versions:
                minio_versions.append({
                    'version': row[0],
                    'snapshot': json.loads(row[1]) if row[1] else {},
                    'change_reason': row[2],
                    'timestamp': str(row[3]),
                    'changed_by': row[4],
                    'source': 'DuckDB'
                })
        except Exception:
            pass

        return sorted(minio_versions, key=lambda x: x.get('version', 0))

    def compare_versions(self, version_a: dict, version_b: dict) -> dict:
        snapshot_a = version_a.get('snapshot', {})
        snapshot_b = version_b.get('snapshot', {})
        
        differences = {}
        all_keys = set(snapshot_a.keys()) | set(snapshot_b.keys())
        
        for key in all_keys:
            val_a = snapshot_a.get(key)
            val_b = snapshot_b.get(key)
            
            if str(val_a) != str(val_b):
                differences[key] = {
                    'version_a_value': val_a,
                    'version_b_value': val_b,
                    'changed': True
                }
        
        return {
            'version_a': version_a.get('version'),
            'version_b': version_b.get('version'),
            'differences': differences,
            'has_changes': len(differences) > 0
        }

    def update_payment_with_versioning(self, payment_id: str, updates: dict, 
                                       change_reason: str, changed_by: str = None):
        new_version = self.snapshot_and_version(
            'payment_records', payment_id, updates, change_reason, changed_by
        )
        
        safe_updates = {k: v for k, v in updates.items() 
                        if k in ('status', 'amount', 'payment_method', 'channel', 'deposit_amount')}
        safe_updates['version'] = new_version
        
        set_clause = ", ".join([f"{k} = ?" for k in safe_updates.keys()])
        params = list(safe_updates.values()) + [payment_id]
        
        self.conn.execute(f"""
            UPDATE payment_records 
            SET {set_clause}
            WHERE payment_id = ?
        """, params)

    def update_door_lock_with_versioning(self, lock_id: str, updates: dict,
                                         change_reason: str, changed_by: str = None):
        new_version = self.snapshot_and_version(
            'door_lock_records', lock_id, updates, change_reason, changed_by
        )
        
        safe_updates = {k: v for k, v in updates.items() 
                        if k in ('status', 'checkin_time', 'checkout_time', 'door_open_count', 'last_open_time')}
        safe_updates['version'] = new_version
        
        set_clause = ", ".join([f"{k} = ?" for k in safe_updates.keys()])
        params = list(safe_updates.values()) + [lock_id]
        
        self.conn.execute(f"""
            UPDATE door_lock_records 
            SET {set_clause}
            WHERE lock_id = ?
        """, params)

version_ctrl = VersionController()
