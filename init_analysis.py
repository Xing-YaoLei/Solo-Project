from src.data.database import db
from src.data.diff_detector import DiffDetector
from src.data.gap_analyzer import GapAnalyzer
from src.analysis.anomaly_detector import AnomalyDetector
from config import setup_logger
import polars as pl
import uuid
from datetime import datetime, timedelta
import random

logger = setup_logger()

def create_diff_data():
    logger.info("创建差异数据用于演示...")
    
    orders = db.query("SELECT * FROM textbook_order WHERE data_source = 'teaching_platform' LIMIT 50").to_dicts()
    
    diff_orders = []
    for order in orders:
        if random.random() < 0.4:
            new_order = order.copy()
            suffix = random.choice(["_card", "_app"])
            new_order["order_id"] = order["order_id"] + suffix
            new_order["data_source"] = "campus_card" if suffix == "_card" else "student_application"
            
            if random.random() < 0.5:
                new_order["quantity"] = max(0, order["quantity"] + random.randint(-10, 10))
            if random.random() < 0.3:
                new_order["price"] = round(float(order["price"]) * (1 + random.uniform(-0.1, 0.1)), 2) if order["price"] else None
            if random.random() < 0.2:
                new_order["textbook_name"] = order["textbook_name"] + "(修订版)"
            if random.random() < 0.2:
                new_order["publisher"] = None if order["publisher"] else order["publisher"]
            
            diff_orders.append(new_order)
    
    if diff_orders:
        df = pl.DataFrame(diff_orders)
        for o in diff_orders:
            db.execute(f"DELETE FROM textbook_order WHERE order_id = '{o['order_id']}'")
        db.insert_dataframe("textbook_order", df)
        logger.info(f"创建了 {len(diff_orders)} 条差异数据")

def run_analysis():
    logger.info("开始运行数据分析...")
    
    current_term = "2024-2025-2"
    
    diff_detector = DiffDetector()
    diffs = diff_detector.detect_diff("teaching_platform", "campus_card", term_id=current_term)
    if not diffs.is_empty():
        diff_detector.save_diff_records(diffs)
        logger.info(f"检测到 {len(diffs)} 条差异记录")
    
    diffs2 = diff_detector.detect_diff("teaching_platform", "student_application", term_id=current_term)
    if not diffs2.is_empty():
        diff_detector.save_diff_records(diffs2)
        logger.info(f"检测到 {len(diffs2)} 条差异记录(学生申请表)")
    
    gap_analyzer = GapAnalyzer()
    gaps = gap_analyzer.identify_gaps(current_term)
    logger.info(f"识别到 {len(gaps)} 个数据缺口")
    
    anomaly_detector = AnomalyDetector()
    anomalies = anomaly_detector.detect_anomalies(current_term)
    logger.info(f"检测到 {len(anomalies)} 个异常")
    
    logger.info("数据分析完成！")

if __name__ == "__main__":
    create_diff_data()
    run_analysis()
