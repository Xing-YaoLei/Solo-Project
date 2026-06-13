"""测试已有数据场景下的导入 - 验证 _sync_sequences 正常工作"""
from datetime import date, timedelta
import polars as pl
from src.config import load_config
from src.duckdb_manager import DuckDBManager
from src.etl.pipeline import ETLPipeline

print("=" * 60)
print("测试已有数据场景下的导入")
print("=" * 60)

config = load_config()

print("\n1. 清理并手动插入旧数据（模拟旧版本导入，id 从 1 开始）...")
db = DuckDBManager(config.duckdb)
db.execute_query("DELETE FROM attendance_rate_metrics")
db.execute_query("DELETE FROM inventory")
db.execute_query("DELETE FROM reviews")
db.execute_query("DELETE FROM etl_batches")

db.execute_query("""
    INSERT INTO etl_batches (batch_id, data_type, source_file, row_count, status)
    VALUES 
        ('old_inv_batch_1', 'inventory', 'old_inv_1.csv', 2, 'processed'),
        ('old_inv_batch_2', 'inventory', 'old_inv_2.csv', 1, 'processed'),
        ('old_rev_batch_1', 'reviews', 'old_rev_1.csv', 1, 'processed'),
        ('old_rev_batch_2', 'reviews', 'old_rev_2.csv', 1, 'processed')
""")

db.execute_query("""
    INSERT INTO inventory (id, batch_id, product_code, product_name, category,
        stock_quantity, unit_price, cost_price, supplier, expiry_date, store, is_consumable)
    VALUES 
        (1, 'old_inv_batch_1', 'OLD001', '旧商品1', '面部护理', 100, 298, 150, '供应商A', '2027-01-01', '总店', TRUE),
        (2, 'old_inv_batch_1', 'OLD002', '旧商品2', '身体护理', 50, 368, 180, '供应商B', '2027-01-01', '朝阳店', TRUE),
        (3, 'old_inv_batch_2', 'OLD003', '旧商品3', '美甲美睫', 30, 168, 80, '供应商C', '2027-01-01', '海淀店', TRUE)
""")

db.execute_query("""
    INSERT INTO reviews (id, batch_id, customer_id, customer_name, order_id, rating,
        review_tags, review_text, technician, service_item, store, review_date)
    VALUES 
        (1, 'old_rev_batch_1', 'C001', '旧顾客1', 'ORD001', 5, ['服务好'], '很好', '张技师', '面部护理', '总店', '2026-01-01'),
        (2, 'old_rev_batch_2', 'C002', '旧顾客2', 'ORD002', 4, ['环境好'], '不错', '李技师', '身体护理', '朝阳店', '2026-01-02')
""")

db.close()
print("   ✓ 旧数据已插入 (inventory: 3 条, reviews: 2 条)")

print("\n2. 重新连接数据库（触发 _sync_sequences）并导入新数据...")
with ETLPipeline(config) as pipeline:
    inv_max = pipeline.db.execute_query("SELECT MAX(id) as max_id FROM inventory")["max_id"][0]
    rev_max = pipeline.db.execute_query("SELECT MAX(id) as max_id FROM reviews")["max_id"][0]
    print(f"   inventory 最大 id: {inv_max}")
    print(f"   reviews 最大 id: {rev_max}")

    print("\n3. 使用新方法导入新数据...")
    inv_new = pl.DataFrame({
        "product_code": ["NEW001", "NEW002"],
        "product_name": ["新商品1", "新商品2"],
        "category": ["面部护理", "身体护理"],
        "stock_quantity": [200, 150],
        "unit_price": [398.0, 468.0],
        "cost_price": [200.0, 250.0],
        "supplier": ["供应商D", "供应商E"],
        "expiry_date": ["2028-01-01", "2028-01-01"],
        "store": ["总店", "朝阳店"],
        "is_consumable": [True, True],
    })
    rev_new = pl.DataFrame({
        "customer_id": ["CN001", "CN002"],
        "customer_name": ["新顾客1", "新顾客2"],
        "order_id": ["ORDN001", "ORDN002"],
        "rating": [5, 5],
        "review_tags": ["超级好", "非常棒"],
        "review_text": ["完美", "超赞"],
        "technician": ["张技师", "王技师"],
        "service_item": ["面部护理", "身体护理"],
        "category": ["面部护理", "身体护理"],
        "store": ["总店", "朝阳店"],
        "review_date": ["2026-06-14", "2026-06-14"],
    })
    
    results = pipeline.run_full_pipeline(
        inventory_df=inv_new,
        reviews_df=rev_new,
    )
    
    print(f"   成功导入 {len(results)} 个数据类型")

    print("\n4. 验证结果...")
    inv_all = pipeline.db.execute_query("SELECT id, product_code FROM inventory ORDER BY id")
    rev_all = pipeline.db.execute_query("SELECT id, customer_id FROM reviews ORDER BY id")
    print(f"   inventory 总数: {len(inv_all)} 条 (预期: 5)")
    print(f"   inventory ids: {inv_all['id'].to_list()}")
    print(f"   reviews 总数: {len(rev_all)} 条 (预期: 4)")
    print(f"   reviews ids: {rev_all['id'].to_list()}")

    inv_ids = inv_all['id'].to_list()
    rev_ids = rev_all['id'].to_list()
    inv_unique = len(inv_ids) == len(set(inv_ids))
    rev_unique = len(rev_ids) == len(set(rev_ids))

    inv_new_ids = [i for i in inv_ids if i > 3]
    rev_new_ids = [i for i in rev_ids if i > 2]
    inv_new_correct = len(inv_new_ids) == 2 and min(inv_new_ids) > 3
    rev_new_correct = len(rev_new_ids) == 2 and min(rev_new_ids) > 2

    print(f"\n   inventory 主键唯一: {'✓' if inv_unique else '✗'}")
    print(f"   inventory 新id>旧id: {'✓' if inv_new_correct else '✗'} (新ids: {inv_new_ids})")
    print(f"   reviews 主键唯一: {'✓' if rev_unique else '✗'}")
    print(f"   reviews 新id>旧id: {'✓' if rev_new_correct else '✗'} (新ids: {rev_new_ids})")

    all_ok = inv_unique and rev_unique and inv_new_correct and rev_new_correct and len(inv_all) == 5 and len(rev_all) == 4

if all_ok:
    print("\n" + "=" * 60)
    print("✓ 已有数据场景测试通过！_sync_sequences 正常工作，新数据id正确递增。")
    print("=" * 60)
else:
    print("\n" + "=" * 60)
    print("✗ 测试失败，请检查上述输出。")
    print("=" * 60)
