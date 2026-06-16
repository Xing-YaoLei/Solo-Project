import json
import sys
from datetime import date
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.services.duckdb_service import DuckDBService
from app.services.pipeline import _serialize_snapshot


def test_serialize_snapshot():
    print("=== 测试 _serialize_snapshot ===")
    raw = {
        "member_id": "M001",
        "member_name": "张三",
        "register_date": date(2024, 1, 15),
        "last_visit_date": date(2024, 6, 1),
        "imported_at": None,
        "batch_id": "BATCH_member_TEST01",
    }
    result = _serialize_snapshot(raw)
    print(f"  序列化结果: {result}")

    try:
        json_str = json.dumps(result, ensure_ascii=False)
        print(f"  JSON 序列化成功: {json_str[:80]}...")
    except Exception as e:
        print(f"  ❌ JSON 序列化失败: {e}")
        return False

    assert result["register_date"] == "2024-01-15", f"期望 2024-01-15, 实际 {result['register_date']}"
    assert result["last_visit_date"] == "2024-06-01"
    assert result["imported_at"] is None
    print("  ✅ 日期序列化正确")
    return True


def test_duckdb_integration():
    print("\n=== 测试 DuckDB 完整流程 ===")
    db = DuckDBService()

    test_member_id = "M_TEST_INTEG_001"
    batch_1 = "BATCH_member_INT01"
    batch_2 = "BATCH_member_INT02"

    try:
        db.conn.execute(f"DELETE FROM members WHERE member_id = '{test_member_id}'")
        db.conn.execute(f"DELETE FROM member_profile_changes WHERE member_id = '{test_member_id}'")
        db.conn.execute(f"DELETE FROM import_batches WHERE batch_id LIKE 'BATCH_member_INT%'")

        print("  第1次导入（初始导入）...")
        db.conn.execute(f"""
            INSERT INTO members
            (member_id, member_name, phone, store_id, register_date,
             chronic_disease, allergy_info, last_visit_date, batch_id, imported_at)
            VALUES ('{test_member_id}', '李小明', '13900001111', 'store_02',
                    DATE '2023-03-15', '高血压', '青霉素',
                    DATE '2024-05-10', '{batch_1}', TIMESTAMP '2024-05-10 09:00:00')
        """)

        count = db.conn.execute(
            f"SELECT COUNT(*) FROM members WHERE member_id = '{test_member_id}'"
        ).fetchone()[0]
        print(f"    members 记录数: {count} (期望 1)")

        print("\n  第2次导入（变更导入）...")
        db.conn.execute(f"""
            INSERT INTO members
            (member_id, member_name, phone, store_id, register_date,
             chronic_disease, allergy_info, last_visit_date, batch_id, imported_at)
            VALUES ('{test_member_id}', '李小明', '13900002222', 'store_02',
                    DATE '2023-03-15', '糖尿病', '青霉素',
                    DATE '2024-06-20', '{batch_2}', TIMESTAMP '2024-06-20 14:30:00')
        """)

        count = db.conn.execute(
            f"SELECT COUNT(*) FROM members WHERE member_id = '{test_member_id}'"
        ).fetchone()[0]
        print(f"    members 记录数: {count} (期望 2)")
        assert count == 2, f"期望 2 条记录, 实际 {count} 条"

        latest = db.conn.execute(f"""
            SELECT chronic_disease, last_visit_date, phone FROM members
            WHERE member_id = '{test_member_id}'
            QUALIFY ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY imported_at DESC) = 1
        """).fetchone()
        print(f"    最新记录 - 慢性病: {latest[0]}, 电话: {latest[2]}, 最近到店: {latest[1]}")
        assert latest[0] == "糖尿病"
        assert latest[2] == "13900002222"
        print("    ✅ 最新记录正确")

        print("\n  模拟 pipeline 写入变更记录 + 快照...")
        old_row = db.conn.execute(f"""
            SELECT * FROM members WHERE member_id = '{test_member_id}' AND batch_id = '{batch_1}'
        """).fetchone()
        col_names = [desc[0] for desc in db.conn.execute(
            f"SELECT * FROM members WHERE member_id = '{test_member_id}' LIMIT 1"
        ).description]
        old_dict = dict(zip(col_names, old_row))
        print(f"    旧记录原始类型: { {k: type(v).__name__ for k, v in old_dict.items()} }")

        old_snapshot = _serialize_snapshot(old_dict)
        snapshot_json = json.dumps(old_snapshot, ensure_ascii=False)
        print(f"    序列化后 JSON 长度: {len(snapshot_json)} 字符")

        db.track_member_profile_change(
            change_id=f"CHG_{test_member_id}_phone_{batch_2}",
            member_id=test_member_id,
            field_name="phone",
            old_value=old_snapshot["phone"],
            new_value="13900002222",
            source_batch_id=batch_2,
            source_snapshot=snapshot_json,
        )
        db.track_member_profile_change(
            change_id=f"CHG_{test_member_id}_chronic_disease_{batch_2}",
            member_id=test_member_id,
            field_name="chronic_disease",
            old_value=old_snapshot["chronic_disease"],
            new_value="糖尿病",
            source_batch_id=batch_2,
            source_snapshot=snapshot_json,
        )
        db.track_member_profile_change(
            change_id=f"CHG_{test_member_id}_last_visit_date_{batch_2}",
            member_id=test_member_id,
            field_name="last_visit_date",
            old_value=old_snapshot["last_visit_date"],
            new_value="2024-06-20",
            source_batch_id=batch_2,
            source_snapshot=snapshot_json,
        )
        print("    ✅ 3 条变更记录写入成功")

        changes = db.conn.execute(f"""
            SELECT change_id, field_name, old_value, new_value, source_batch_id, source_snapshot
            FROM member_profile_changes WHERE member_id = '{test_member_id}'
            ORDER BY field_name
        """).fetchall()
        print(f"\n    查询到 {len(changes)} 条变更记录")
        assert len(changes) == 3

        for chg in changes:
            change_id, field, old_val, new_val, src_batch, src_snap = chg
            print(f"    - {field}: {old_val} -> {new_val} (batch={src_batch})")
            assert src_snap is not None, f"{field} 的 source_snapshot 为空！"
            snap_dict = json.loads(src_snap)
            assert "register_date" in snap_dict
            assert "batch_id" in snap_dict
            assert "imported_at" in snap_dict
            print(f"      ✅ 快照包含完整字段 (register_date={snap_dict.get('register_date')}, batch_id={snap_dict.get('batch_id')})")

        print("\n  测试 get_member_snapshot_at_batch...")
        snap1 = db.get_member_snapshot_at_batch(test_member_id, batch_1)
        print(f"    批次 {batch_1}: 慢性病={snap1.get('chronic_disease')}, 电话={snap1.get('phone')}")
        assert snap1.get("chronic_disease") == "高血压"

        snap2 = db.get_member_snapshot_at_batch(test_member_id, batch_2)
        print(f"    批次 {batch_2}: 慢性病={snap2.get('chronic_disease')}, 电话={snap2.get('phone')}")
        assert snap2.get("chronic_disease") == "糖尿病"

        snap_nonexist = db.get_member_snapshot_at_batch(test_member_id, "NONEXIST_BATCH")
        assert snap_nonexist is None
        print("    ✅ 不存在的批次返回 None")

        print("\n  测试 get_member_profile_changes (带 source_snapshot)...")
        df = db.get_member_profile_changes(member_id=test_member_id)
        print(f"    返回 {df.height} 条记录")
        assert "source_snapshot" in df.columns
        print("    ✅ source_snapshot 列存在")

        db.conn.execute(f"DELETE FROM members WHERE member_id = '{test_member_id}'")
        db.conn.execute(f"DELETE FROM member_profile_changes WHERE member_id = '{test_member_id}'")
        print("\n  ✅ 测试数据清理完成")

        db.close()
        return True

    except Exception as e:
        print(f"\n  ❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        db.close()
        return False


if __name__ == "__main__":
    ok1 = test_serialize_snapshot()
    ok2 = test_duckdb_integration()
    print("\n" + "=" * 50)
    if ok1 and ok2:
        print("✅ 所有测试通过！")
    else:
        print("❌ 部分测试失败")
        sys.exit(1)
