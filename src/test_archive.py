import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(".")))
from storage import get_minio
from data_service import get_service
from data_models import initialize_all_data
from database import get_db

db = get_db()
try:
    cnt = db.query("SELECT COUNT(*) as c FROM patients")
    if cnt.is_empty() or cnt.row(0)["c"] == 0:
        print("初始化模拟数据...")
        initialize_all_data()
except:
    initialize_all_data()

minio = get_minio()
mode = minio.get_storage_mode()
print(f"存储模式: {mode}")
print(f"is_connected: {minio.is_connected()}")
stats = minio.get_bucket_stats()
print(f"bucket_stats: {stats}")

svc = get_service()

files = {"test.csv": "id,name\n1,test\n".encode(), "TRAINING_COMPLETION_RULE.md": "rules".encode()}
result = svc.export_and_archive(
    export_type="风险趋势",
    files=files,
    file_name="risk_trend_test.zip",
    date_from="2026-04-17",
    date_to="2026-06-16",
    record_count=60,
    created_by="测试脚本"
)
print(f"export_and_archive result: {result}")

if result.get("success"):
    aid = result["archive_id"]
    print(f"archive_id: {aid}")

    retrieve = svc.retrieve_archive(aid)
    if retrieve and retrieve.get("data"):
        print(f"retrieve OK: {len(retrieve['data'])} bytes, file_name={retrieve['file_name']}")
        import zipfile, io
        with zipfile.ZipFile(io.BytesIO(retrieve["data"])) as zf:
            print(f"ZIP contents: {zf.namelist()}")
    else:
        print(f"retrieve FAILED: {retrieve}")

    records = svc.list_archive_records()
    print(f"total archives in DB: {len(records)}")
    if not records.is_empty():
        r = records.row(0, named=True)
        print(f"first record: archive_id={r['archive_id']}, type={r['export_type']}, object={r['object_name']}, status={r['status']}")

    svc.delete_archive_record(aid, also_delete_minio=True)
    print("deleted archive + object")

    stats2 = minio.get_bucket_stats()
    print(f"after delete: {stats2}")
else:
    print(f"FAILED: {result}")

print("\n=== 测试所有6类导出 ===")
types = ["风险趋势", "异常汇总", "治疗日历", "器械状态", "护理日志", "复盘备注"]
archive_ids = []
for t in types:
    files = {f"{t}.csv": f"type,{t}\n1,data\n".encode()}
    r = svc.export_and_archive(
        export_type=t, files=files, file_name=f"{t}_test.zip",
        date_from="2026-04-17", date_to="2026-06-16",
        record_count=10, created_by="批量测试"
    )
    if r.get("success"):
        archive_ids.append(r["archive_id"])
        print(f"  {t}: OK, archive_id={r['archive_id']}, size={r['file_size_bytes']} bytes")
    else:
        print(f"  {t}: FAILED, error={r.get('error')}")

print(f"\n验证取回所有 {len(archive_ids)} 个归档...")
for aid in archive_ids:
    ret = svc.retrieve_archive(aid)
    ok = ret is not None and ret.get("data") is not None
    print(f"  {aid}: {'OK' if ok else 'FAILED'} ({len(ret['data']) if ok else 0} bytes)")

print(f"\n清理所有测试归档...")
for aid in archive_ids:
    svc.delete_archive_record(aid, also_delete_minio=True)
print("清理完毕")
