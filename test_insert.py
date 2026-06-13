"""测试DuckDB插入功能"""
from datetime import date, timedelta
import polars as pl
from src.config import load_config
from src.etl.pipeline import ETLPipeline

print("=" * 60)
print("测试 DuckDB 插入功能")
print("=" * 60)

config = load_config()

with ETLPipeline(config) as pipeline:
    print("\n1. 清理旧数据...")
    try:
        pipeline.db.execute_query("DELETE FROM attendance_rate_metrics")
        pipeline.db.execute_query("DELETE FROM inventory_anomaly_notes")
        pipeline.db.execute_query("DELETE FROM technician_schedules")
        pipeline.db.execute_query("DELETE FROM service_cards")
        pipeline.db.execute_query("DELETE FROM recharge_transactions")
        pipeline.db.execute_query("DELETE FROM appointments")
        pipeline.db.execute_query("DELETE FROM reviews")
        pipeline.db.execute_query("DELETE FROM inventory")
        pipeline.db.execute_query("DELETE FROM etl_batches")
        print("   ✓ 旧数据已清理")
    except Exception as e:
        print(f"   ℹ 清理跳过: {e}")

    end_date = date.today()
    start_date = end_date - timedelta(days=7)

    print(f"\n2. 生成测试数据 ({start_date} ~ {end_date})...")

    inv_df = pl.DataFrame({
        "product_code": ["SKU001", "SKU002", "SKU003", "SKU004"],
        "product_name": ["玻尿酸精华液", "保湿面膜", "复方精油", "美甲油胶"],
        "category": ["面部护理", "面部护理", "身体护理", "美甲美睫"],
        "stock_quantity": [100, 3, 50, 2],
        "unit_price": [298.0, 198.0, 368.0, 168.0],
        "cost_price": [150.0, 80.0, 180.0, 80.0],
        "supplier": ["供应商A", "供应商A", "供应商B", "供应商C"],
        "expiry_date": [
            (end_date + timedelta(days=365)).isoformat(),
            (end_date + timedelta(days=30)).isoformat(),
            (end_date + timedelta(days=180)).isoformat(),
            (end_date - timedelta(days=10)).isoformat(),
        ],
        "store": ["总店", "总店", "朝阳店", "海淀店"],
        "is_consumable": [True, True, True, True],
    })
    print(f"   库存: {len(inv_df)} 条")

    rev_df = pl.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004", "C005"],
        "customer_name": ["王芳", "李丽", "张敏", "刘静", "陈娟"],
        "order_id": ["ORD001", "ORD002", "ORD003", "ORD004", "ORD005"],
        "rating": [5, 4, 3, 2, 5],
        "review_tags": ["服务好,技术专业", "环境舒适,干净卫生", "效果一般", "等待时间长,推销多", "没有推销,细心周到"],
        "review_text": ["非常满意！", "环境很好", "效果一般般", "体验不好，推销太多", "很舒服，推荐"],
        "technician": ["张技师", "李技师", "张技师", "王技师", "李技师"],
        "service_item": ["深层清洁补水", "抗衰紧致提升", "背部精油SPA", "日式美甲", "美白淡斑护理"],
        "category": ["面部护理", "面部护理", "身体护理", "美甲美睫", "面部护理"],
        "store": ["总店", "总店", "朝阳店", "朝阳店", "海淀店"],
        "review_date": [
            (start_date + timedelta(days=i)).isoformat()
            for i in range(5)
        ],
    })
    print(f"   点评: {len(rev_df)} 条")

    appt_df = pl.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004", "C005", "C006", "C007", "C008"],
        "customer_name": ["王芳", "李丽", "张敏", "刘静", "陈娟", "杨燕", "黄玲", "周红"],
        "phone": ["13800138001", "13800138002", "13800138003", "13800138004", "13800138005", "13800138006", "13800138007", "13800138008"],
        "appointment_date": [
            (end_date - timedelta(days=i)).isoformat()
            for i in range(8)
        ],
        "appointment_time": ["10:00:00", "14:00:00", "09:00:00", "15:00:00", "11:00:00", "16:00:00", "13:00:00", "10:00:00"],
        "service_item": ["深层清洁补水", "抗衰紧致提升", "背部精油SPA", "日式美甲", "美白淡斑护理", "肩颈放松调理", "全身淋巴排毒", "韩式美睫"],
        "category": ["面部护理", "面部护理", "身体护理", "美甲美睫", "面部护理", "身体护理", "身体护理", "美甲美睫"],
        "technician": ["张技师", "李技师", "张技师", "王技师", "李技师", "刘技师", "张技师", "陈技师"],
        "store": ["总店", "总店", "朝阳店", "朝阳店", "海淀店", "海淀店", "总店", "海淀店"],
        "status": ["已完成", "已完成", "已完成", "已完成", "已完成", "已完成", "未到店", "已完成"],
        "actual_amount": [298, 580, 368, 168, 458, 198, 0, 268],
        "attended": [True, True, True, True, True, True, False, True],
        "is_member": [True, True, False, True, True, False, True, True],
    })
    print(f"   预约: {len(appt_df)} 条")

    recharge_df = pl.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004"],
        "customer_name": ["王芳", "李丽", "张敏", "刘静"],
        "phone": ["13800138001", "13800138002", "13800138003", "13800138004"],
        "recharge_date": [
            (end_date - timedelta(days=i*5)).isoformat()
            for i in range(4)
        ],
        "recharge_amount": [5000, 10000, 2000, 3000],
        "gift_amount": [750, 2000, 200, 300],
        "payment_method": ["微信", "银行卡", "支付宝", "微信"],
        "store": ["总店", "总店", "朝阳店", "海淀店"],
        "sales_staff": ["张技师", "李技师", "王技师", "刘技师"],
        "card_type": ["季卡", "年卡", "月卡", "半年卡"],
    })
    print(f"   充值: {len(recharge_df)} 条")

    cards_df = pl.DataFrame({
        "card_code": ["CARD001", "CARD002", "CARD003", "CARD004"],
        "card_name": ["深层补水年卡", "抗衰护理季卡", "SPA放松年卡", "美甲年卡"],
        "category": ["面部护理", "面部护理", "身体护理", "美甲美睫"],
        "total_sessions": [48, 12, 24, 24],
        "used_sessions": [12, 6, 8, 10],
        "remaining_sessions": [36, 6, 16, 14],
        "original_price": [3980, 1680, 2980, 1980],
        "sale_price": [2980, 1280, 2180, 1580],
        "customer_id": ["C001", "C002", "C003", "C004"],
        "customer_name": ["王芳", "李丽", "张敏", "刘静"],
        "purchase_date": [
            (end_date - timedelta(days=30)).isoformat(),
            (end_date - timedelta(days=60)).isoformat(),
            (end_date - timedelta(days=90)).isoformat(),
            (end_date - timedelta(days=45)).isoformat(),
        ],
        "expiry_date": [
            (end_date + timedelta(days=335)).isoformat(),
            (end_date + timedelta(days=305)).isoformat(),
            (end_date + timedelta(days=275)).isoformat(),
            (end_date + timedelta(days=320)).isoformat(),
        ],
        "store": ["总店", "总店", "朝阳店", "海淀店"],
    })
    print(f"   服务卡: {len(cards_df)} 条")

    schedules_df = pl.DataFrame({
        "technician": ["张技师", "李技师", "王技师", "刘技师", "陈技师", "杨技师"],
        "schedule_date": [end_date.isoformat()] * 6,
        "shift_type": ["早班", "晚班", "全天", "早班", "晚班", "休息"],
        "start_time": ["09:00:00", "12:00:00", "09:00:00", "09:00:00", "12:00:00", None],
        "end_time": ["18:00:00", "21:00:00", "21:00:00", "18:00:00", "21:00:00", None],
        "store": ["总店", "总店", "朝阳店", "海淀店", "海淀店", "西城店"],
        "is_leave": [False, False, False, False, False, True],
        "leave_reason": ["", "", "", "", "", "年假"],
    })
    print(f"   排班: {len(schedules_df)} 条")

    print("\n3. 运行 ETL 流水线...")
    results = pipeline.run_full_pipeline(
        inventory_df=inv_df,
        reviews_df=rev_df,
        appointments_df=appt_df,
        recharge_df=recharge_df,
        service_cards_df=cards_df,
        schedules_df=schedules_df,
    )

    print("\n4. 验证写入结果:")
    stats = pipeline.db.get_summary_stats()
    all_ok = True
    for table, expected in [
        ("inventory", 4),
        ("reviews", 5),
        ("appointments", 8),
        ("recharge_transactions", 4),
        ("service_cards", 4),
        ("technician_schedules", 6),
        ("attendance_rate_metrics", ">0"),
    ]:
        actual = stats.get(table, 0)
        if expected == ">0":
            ok = actual > 0
        else:
            ok = actual == expected
        status = "✓" if ok else "✗"
        print(f"   {status} {table}: {actual} 条 (预期: {expected})")
        if not ok:
            all_ok = False

    print("\n5. 验证批次回查:")
    batches = pipeline.get_batch_history()
    print(f"   批次总数: {len(batches)}")
    if not batches.is_empty():
        batch = batches.row(0, named=True)
        print(f"   最新批次: {batch['batch_id']} ({batch['data_type']})")
        batch_data = pipeline.get_batch_data(batch["batch_id"], batch["data_type"])
        if batch_data is not None and not batch_data.is_empty():
            print(f"   ✓ 批次数据回查成功: {len(batch_data)} 条")
        else:
            print(f"   ✗ 批次数据回查失败")
            all_ok = False

    print("\n6. 验证消课率指标:")
    metrics = pipeline.db.get_attendance_metrics()
    if not metrics.is_empty():
        print(f"   消课率指标记录: {len(metrics)} 条")
        sample = metrics.head(3).to_pandas()
        print(sample[["metric_date", "technician", "attendance_rate", "target_rate"]].to_string(index=False))

        print("\n7. 验证一线员工权限:")
        from src.config import TECHNICIAN_STORE_MAP
        for tech, store in list(TECHNICIAN_STORE_MAP.items())[:3]:
            tech_metrics = pipeline.db.get_attendance_metrics(technician=tech)
            if not tech_metrics.is_empty():
                tech_rate = tech_metrics["attendance_rate"].mean()
                print(f"   {tech} ({store}): 消课率 {tech_rate:.1%}, 仅 {len(tech_metrics)} 条记录")
            else:
                print(f"   {tech} ({store}): 暂无数据")

        anomalies = pipeline.db.get_inventory_anomalies(store="总店", unresolved_only=False)
        print(f"\n8. 验证耗材异常查询 (总店): {len(anomalies)} 条异常")

    if all_ok:
        print("\n" + "=" * 60)
        print("✓ 所有测试通过！DuckDB 写入和批次回查功能正常。")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ 部分测试失败，请检查上述输出。")
        print("=" * 60)
