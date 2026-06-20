import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data.minio_client import minio_client

status = minio_client.get_status_info()
print("=== MinIO 状态信息 ===")
print(f"端点: {status['endpoint']}")
print(f"Bucket: {status['bucket']}")
print(f"Secure: {status['secure']}")
print(f"可用: {status['available']}")
print(f"fallback 目录: {status.get('fallback_dir')}")

test_bytes = b"order_id,ticket_code\nORD001,TCK001\nORD001,TCK002\n"
ok, path = minio_client.upload_bytes(test_bytes, "imports/EVT_test/tickets/20260621_test.csv", "text/csv")
print("\n=== 上传测试 ===")
print(f"成功: {ok}")
print(f"路径: {path}")
assert ok, "上传应该始终成功（fallback 到本地）"

if path.startswith("local://"):
    local_path = path[8:]
    exists = os.path.exists(local_path)
    print(f"本地文件存在: {exists}")
    if exists:
        with open(local_path, "rb") as f:
            content = f.read()
        print(f"文件内容一致: {content == test_bytes}")
        assert content == test_bytes, "文件内容应该一致"

objs = minio_client.list_objects("imports/EVT_test")
print("\n=== 列出对象 ===")
print(f"imports/EVT_test 下的对象: {objs}")

print("\n✅ 所有 MinIO 客户端测试通过!")
