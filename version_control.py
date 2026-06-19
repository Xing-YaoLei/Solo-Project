import uuid
import json
from datetime import datetime, timedelta
from database import db
from minio_storage import minio_mgr

class VersionController:
    def __init__(self):
        self.conn = db.get_conn()

    def _get_next_version_id(self) -> int:
        next_id = None
        
        try:
            result = self.conn.execute(
                "SELECT COALESCE(MAX(version_id), 0) + 1 FROM data_versions"
            ).fetchone()
            if result and result[0] is not None and int(result[0]) > 0:
                next_id = int(result[0])
        except Exception:
            pass
        
        if next_id is None or next_id <= 0:
            try:
                result = self.conn.execute("SELECT nextval('data_versions_seq')").fetchone()
                if result and result[0] is not None:
                    next_id = int(result[0])
            except Exception:
                pass
        
        if next_id is None or next_id <= 0:
            next_id = int(datetime.now().timestamp() * 1000000) % (2**31)
            if next_id <= 0:
                next_id = 1
        
        return next_id

    def snapshot_and_version(self, table_name: str, record_id: str, 
                             new_data: dict, change_reason: str = None, 
                             changed_by: str = None) -> int:
        current_data = self._get_current_record(table_name, record_id)
        if not current_data:
            return 1
        
        current_version = current_data.get('version', 1)
        new_version = current_version + 1
        
        minio_mgr.save_data_version(
            table_name=table_name,
            record_id=record_id,
            data=current_data,
            version=current_version,
            change_reason=change_reason
        )
        
        try:
            cols = [row[0] for row in self.conn.execute("DESCRIBE data_versions").fetchall()]
        except Exception as e:
            raise RuntimeError(f"获取 data_versions 表结构失败: {e}") from e
        
        version_id = self._get_next_version_id()
        has_record_version = 'record_version' in cols
        has_version_id = 'version_id' in cols
        
        snapshot_json = json.dumps(current_data, ensure_ascii=False, default=str)
        
        if has_version_id and has_record_version:
            insert_sql = """
                INSERT INTO data_versions (version_id, record_version, table_name, record_id, snapshot_data, change_reason, changed_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            params = [version_id, current_version, table_name, record_id,
                      snapshot_json, change_reason, changed_by]
        elif has_record_version:
            insert_sql = """
                INSERT INTO data_versions (record_version, table_name, record_id, snapshot_data, change_reason, changed_by)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            params = [current_version, table_name, record_id,
                      snapshot_json, change_reason, changed_by]
        else:
            insert_sql = """
                INSERT INTO data_versions (table_name, record_id, snapshot_data, change_reason, changed_by)
                VALUES (?, ?, ?, ?, ?)
            """
            params = [table_name, record_id,
                      snapshot_json, change_reason, changed_by]
        
        try:
            self.conn.execute(insert_sql, params)
        except Exception as e:
            try:
                self.conn.execute("ROLLBACK")
            except Exception:
                pass
            raise RuntimeError(
                f"DuckDB 版本快照写入失败，已回滚。当前记录 {record_id} 未更新。"
                f"SQL: {insert_sql}, 错误: {e}"
            ) from e
        
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
            try:
                col_info = self.conn.execute("DESCRIBE data_versions").fetchall()
                col_names = [row[0] for row in col_info]
                col_name_to_idx = {name: idx for idx, name in enumerate(col_names)}
            except Exception as e:
                print(f"获取 data_versions 表结构失败: {e}")
                return sorted(minio_versions, key=lambda x: int(x.get('version', 0)))
            
            has_record_version = 'record_version' in col_name_to_idx
            has_version_id = 'version_id' in col_name_to_idx
            
            select_fields = []
            field_order = []
            
            if has_record_version:
                select_fields.append('record_version')
                field_order.append('record_version')
            if has_version_id:
                select_fields.append('version_id')
                field_order.append('version_id')
            
            other_fields = ['snapshot_data', 'change_reason', 'changed_at', 'changed_by']
            for f in other_fields:
                if f in col_name_to_idx:
                    select_fields.append(f)
                    field_order.append(f)
            
            if has_record_version:
                order_by = 'record_version DESC'
            elif has_version_id:
                order_by = 'version_id DESC'
            else:
                order_by = 'changed_at DESC'
            
            sql = f"""
                SELECT {', '.join(select_fields)}
                FROM data_versions
                WHERE table_name = ? AND record_id = ?
                ORDER BY {order_by}
            """
            
            db_versions = self.conn.execute(sql, [table_name, record_id]).fetchall()
            col_name_to_select_idx = {name: idx for idx, name in enumerate(field_order)}
            
            for row in db_versions:
                version_num = None
                
                if has_record_version and 'record_version' in col_name_to_select_idx:
                    rv_idx = col_name_to_select_idx['record_version']
                    version_num = row[rv_idx]
                
                if version_num is None and has_version_id and 'version_id' in col_name_to_select_idx:
                    vid_idx = col_name_to_select_idx['version_id']
                    version_num = row[vid_idx]
                
                if version_num is None:
                    version_num = 1
                
                snapshot = None
                change_reason = None
                changed_at = None
                changed_by = None
                
                if 'snapshot_data' in col_name_to_select_idx:
                    sd_idx = col_name_to_select_idx['snapshot_data']
                    snapshot = row[sd_idx]
                if 'change_reason' in col_name_to_select_idx:
                    cr_idx = col_name_to_select_idx['change_reason']
                    change_reason = row[cr_idx]
                if 'changed_at' in col_name_to_select_idx:
                    ca_idx = col_name_to_select_idx['changed_at']
                    changed_at = row[ca_idx]
                if 'changed_by' in col_name_to_select_idx:
                    cb_idx = col_name_to_select_idx['changed_by']
                    changed_by = row[cb_idx]
                
                minio_versions.append({
                    'version': int(version_num) if version_num is not None else 1,
                    'snapshot': json.loads(snapshot) if snapshot else {},
                    'change_reason': change_reason,
                    'timestamp': str(changed_at) if changed_at else '',
                    'changed_by': changed_by,
                    'source': 'DuckDB'
                })
        except Exception as e:
            print(f"读取版本历史失败: {e}")
            import traceback
            traceback.print_exc()

        return sorted(minio_versions, key=lambda x: int(x.get('version', 0)))

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
        try:
            self.conn.execute("BEGIN")
        except Exception:
            pass
        
        try:
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
            
            try:
                self.conn.execute("COMMIT")
            except Exception:
                pass
        except Exception as e:
            try:
                self.conn.execute("ROLLBACK")
            except Exception:
                pass
            raise RuntimeError(f"更新收款流水失败，已回滚: {e}") from e

    def update_door_lock_with_versioning(self, lock_id: str, updates: dict,
                                         change_reason: str, changed_by: str = None):
        try:
            self.conn.execute("BEGIN")
        except Exception:
            pass
        
        try:
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
            
            try:
                self.conn.execute("COMMIT")
            except Exception:
                pass
        except Exception as e:
            try:
                self.conn.execute("ROLLBACK")
            except Exception:
                pass
            raise RuntimeError(f"更新门锁记录失败，已回滚: {e}") from e

version_ctrl = VersionController()
