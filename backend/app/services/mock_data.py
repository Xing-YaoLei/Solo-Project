import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.services.duckdb_service import get_analytics

STORES = [
    {"id": 1, "store_code": "SH001", "store_name": "上海南京路店", "region": "华东", "city": "上海"},
    {"id": 2, "store_code": "SH002", "store_name": "上海陆家嘴店", "region": "华东", "city": "上海"},
    {"id": 3, "store_code": "BJ001", "store_name": "北京国贸店", "region": "华北", "city": "北京"},
    {"id": 4, "store_code": "BJ002", "store_name": "北京中关村店", "region": "华北", "city": "北京"},
    {"id": 5, "store_code": "GZ001", "store_name": "广州天河城店", "region": "华南", "city": "广州"},
]

EQUIPMENT_TYPES = [
    {"type": "意式咖啡机", "model": "La Marzocco Linea PB"},
    {"type": "意式咖啡机", "model": "Synesso MVP Hydra"},
    {"type": "磨豆机", "model": "Mahlkonig E65S"},
    {"type": "奶泡机", "model": "Melitta Cino Milk"},
    {"type": "制冰机", "model": "Manitowoc RFF-0300A"},
    {"type": "冷藏柜", "model": "Hoshizaki RTC-77MA"},
]

CLEANING_SKUS = [
    {"code": "CLN001", "name": "咖啡机清洁片", "cat": "清洁耗材"},
    {"code": "CLN002", "name": "蒸汽棒清洁刷", "cat": "清洁耗材"},
    {"code": "CLN003", "name": "冲煮头反冲粉", "cat": "清洁耗材"},
    {"code": "CLN004", "name": "奶缸消毒片", "cat": "清洁耗材"},
    {"code": "CLN005", "name": "设备除垢剂", "cat": "清洁耗材"},
    {"code": "CLN006", "name": "台面消毒液", "cat": "清洁耗材"},
    {"code": "BEAN001", "name": "意式拼配豆1kg", "cat": "咖啡豆"},
    {"code": "BEAN002", "name": "单品豆SOE 250g", "cat": "咖啡豆"},
    {"code": "MILK001", "name": "全脂牛奶1L", "cat": "乳制品"},
    {"code": "MILK002", "name": "燕麦奶1L", "cat": "乳制品"},
]

COFFEE_SKUS = [
    {"code": "ESP001", "name": "美式咖啡", "cat": "意式咖啡"},
    {"code": "ESP002", "name": "拿铁咖啡", "cat": "意式咖啡"},
    {"code": "ESP003", "name": "卡布奇诺", "cat": "意式咖啡"},
    {"code": "ESP004", "name": "摩卡咖啡", "cat": "意式咖啡"},
    {"code": "ESP005", "name": "澳白咖啡", "cat": "意式咖啡"},
    {"code": "CLD001", "name": "冰美式", "cat": "冰咖啡"},
    {"code": "CLD002", "name": "冰拿铁", "cat": "冰咖啡"},
    {"code": "TEA001", "name": "柠檬红茶", "cat": "茶饮"},
]

FAULT_TYPES = [
    {"type": "冲煮头堵塞", "cat": "清洁相关", "clean": True},
    {"type": "蒸汽棒结垢", "cat": "清洁相关", "clean": True},
    {"type": "磨豆机残粉", "cat": "清洁相关", "clean": True},
    {"type": "奶缸异味", "cat": "清洁相关", "clean": True},
    {"type": "密封圈老化", "cat": "机械故障", "clean": False},
    {"type": "压力异常", "cat": "机械故障", "clean": False},
    {"type": "温度异常", "cat": "机械故障", "clean": False},
    {"type": "制冰机缺水", "cat": "清洁相关", "clean": True},
]

TASK_TYPES = [
    "深度清洁整改",
    "设备维护保养",
    "员工操作规范培训",
    "清洁流程优化",
    "设备校准",
]

INSPECTORS = ["张三", "李四", "王五", "赵六", "陈七"]

def rand_date(base: datetime, offset_days: int = 0, add_minutes: int = None) -> datetime:
    d = base + timedelta(days=offset_days)
    if add_minutes is not None:
        d = d + timedelta(minutes=add_minutes)
    else:
        d = d.replace(hour=random.randint(7, 22), minute=random.randint(0, 59))
    return d

def generate_mock_data() -> Dict[str, Any]:
    base_date = datetime(2026, 5, 1)
    analytics = get_analytics()

    equipments = []
    eq_id = 1
    for store in STORES:
        for eq_type in EQUIPMENT_TYPES[:4]:
            equipments.append({
                "id": eq_id,
                "equipment_code": f"{store['store_code']}-EQ{eq_id:03d}",
                "equipment_name": eq_type["model"],
                "equipment_type": eq_type["type"],
                "store_id": store["id"],
                "model": eq_type["model"],
                "manufacturer": random.choice(["La Marzocco", "Mahlkonig", "Synesso", "Nuova Simonelli"]),
                "status": random.choices(["online", "online", "online", "warning", "offline"], weights=[60, 20, 10, 7, 3])[0],
            })
            eq_id += 1

    clean_rows = []
    status_logs = []
    for day in range(45):
        stat_date = base_date + timedelta(days=day)
        date_str = stat_date.strftime("%Y-%m-%d")
        for eq in equipments:
            base_risk = random.uniform(10, 30)
            if eq["equipment_type"] == "意式咖啡机":
                base_risk += random.uniform(5, 15)
            if day % 7 in [5, 6]:
                base_risk += random.uniform(10, 25)

            anomaly_type = None
            anomaly_reason = None
            offline_minutes = 0
            fault_count = random.randint(0, 1)
            inspection_score = round(random.uniform(75, 98), 1)

            if base_risk > 65:
                anomaly_type = random.choice(["high_risk", "offline_gap", "inspection_fail", "fault_trigger"])
                reasons = {
                    "high_risk": "连续3日清洁评分下降且未执行深度清洁",
                    "offline_gap": "设备离线超过4小时，清洁数据采集缺失",
                    "inspection_fail": "巡检清洁项得分低于阈值",
                    "fault_trigger": "触发清洁相关故障告警",
                }
                anomaly_reason = reasons[anomaly_type]
                if anomaly_type == "offline_gap":
                    offline_minutes = random.randint(240, 720)

            sync_delay = 0
            if random.random() < 0.05:
                sync_delay = random.randint(35, 480)

            clean_rows.append({
                "record_date": stat_date,
                "store_id": eq["store_id"],
                "equipment_id": eq["id"],
                "equipment_code": eq["equipment_code"],
                "clean_risk_score": round(min(base_risk, 98), 2),
                "fault_count": fault_count,
                "inspection_score": inspection_score,
                "offline_minutes": offline_minutes,
                "status": eq["status"],
                "anomaly_type": anomaly_type,
                "anomaly_reason": anomaly_reason,
                "sample_ref": f"samples/{eq['equipment_code']}/{date_str}" if anomaly_type else None,
                "created_at": datetime.utcnow(),
            })

    clean_df = pd.DataFrame(clean_rows)
    analytics.load_clean_metrics(clean_df)

    inv_v1_rows = []
    inv_v2_rows = []
    for store in STORES:
        snapshot_date = base_date + timedelta(days=14)
        for idx, sku in enumerate(CLEANING_SKUS):
            qty_v1 = random.randint(5, 50)
            qty_v2 = qty_v1
            if random.random() < 0.3:
                qty_v2 = max(0, qty_v1 + random.randint(-10, 15))
            price = round(random.uniform(20, 200), 2)
            inv_v1_rows.append({
                "version_id": 1,
                "batch_id": f"INV-V1-{store['store_code']}",
                "snapshot_date": snapshot_date,
                "store_id": store["id"],
                "sku_code": sku["code"],
                "sku_name": sku["name"],
                "category": sku["cat"],
                "quantity": float(qty_v1),
                "unit": "个",
                "unit_price": price,
                "total_price": round(qty_v1 * price, 2),
                "cleaning_item_flag": sku["code"].startswith("CLN"),
                "sync_delay_minutes": random.choice([0, 0, 0, 45, 120]) if random.random() < 0.3 else 0,
                "created_at": datetime.utcnow(),
            })
            if qty_v1 != qty_v2 or random.random() < 0.1:
                inv_v2_rows.append({
                    "version_id": 2,
                    "batch_id": f"INV-V2-{store['store_code']}",
                    "snapshot_date": snapshot_date,
                    "store_id": store["id"],
                    "sku_code": sku["code"],
                    "sku_name": sku["name"],
                    "category": sku["cat"],
                    "quantity": float(qty_v2),
                    "unit": "个",
                    "unit_price": price,
                    "total_price": round(qty_v2 * price, 2),
                    "cleaning_item_flag": sku["code"].startswith("CLN"),
                    "sync_delay_minutes": 0,
                    "created_at": datetime.utcnow(),
                })

    inv_df = pd.DataFrame(inv_v1_rows + inv_v2_rows)
    analytics.load_inventory_data(inv_df)

    pos_v1_rows = []
    pos_v2_rows = []
    txn_id_seq = 10000
    for day in range(45):
        biz_date = base_date + timedelta(days=day)
        for store in STORES:
            txn_count = random.randint(80, 200)
            for _ in range(txn_count):
                txn_id = f"TXN{txn_id_seq:08d}"
                txn_id_seq += 1
                txn_time = rand_date(biz_date, 0, random.randint(420, 1320))
                member_id = f"M{random.randint(10000, 99999)}" if random.random() < 0.45 else None
                total = round(random.uniform(30, 300), 2)
                pay = round(total * random.uniform(0.8, 1.0), 2)

                item_idx = random.randint(0, len(COFFEE_SKUS) - 1)
                sku = COFFEE_SKUS[item_idx]
                qty = random.randint(1, 3)
                unit_p = round(total / qty * random.uniform(0.9, 1.1), 2)

                sync_d1 = random.choice([0, 0, 0, 55, 200]) if random.random() < 0.25 else 0
                pos_v1_rows.append({
                    "version_id": 1,
                    "batch_id": f"POS-V1-{store['store_code']}",
                    "business_date": biz_date,
                    "store_id": store["id"],
                    "txn_id": txn_id,
                    "txn_time": txn_time,
                    "member_id": member_id,
                    "total_amount": total,
                    "pay_amount": pay,
                    "pay_method": random.choice(["微信", "支付宝", "现金", "储值卡"]),
                    "sku_code": sku["code"],
                    "sku_name": sku["name"],
                    "quantity": float(qty),
                    "unit_price": unit_p,
                    "subtotal": round(unit_p * qty, 2),
                    "sync_delay_minutes": sync_d1,
                    "created_at": datetime.utcnow(),
                })

                total_v2 = total
                if random.random() < 0.03:
                    total_v2 = round(total * random.uniform(0.9, 1.1), 2)
                pos_v2_rows.append({
                    "version_id": 2,
                    "batch_id": f"POS-V2-{store['store_code']}",
                    "business_date": biz_date,
                    "store_id": store["id"],
                    "txn_id": txn_id,
                    "txn_time": txn_time,
                    "member_id": member_id,
                    "total_amount": total_v2,
                    "pay_amount": round(total_v2 * (pay / total), 2),
                    "pay_method": random.choice(["微信", "支付宝", "现金", "储值卡"]),
                    "sku_code": sku["code"],
                    "sku_name": sku["name"],
                    "quantity": float(qty),
                    "unit_price": unit_p,
                    "subtotal": round(unit_p * qty, 2),
                    "sync_delay_minutes": 0,
                    "created_at": datetime.utcnow(),
                })

    pos_df = pd.DataFrame(pos_v1_rows + pos_v2_rows)
    analytics.load_pos_data(pos_df)

    member_rows = []
    receipt_seq = 20000
    for day in range(45):
        biz_date = base_date + timedelta(days=day)
        for store in STORES:
            count = random.randint(25, 70)
            for _ in range(count):
                txn_idx = random.randint(0, min(50, len(pos_v2_rows) - 1))
                pos_ref = pos_v2_rows[(day * 5 + store["id"] * 3 + _) % len(pos_v2_rows)] if pos_v2_rows else None

                receipt_no = f"R{receipt_seq:09d}"
                receipt_seq += 1
                receipt_time = rand_date(biz_date, 0, random.randint(420, 1320))
                member_id = f"M{random.randint(10000, 99999)}"

                total = round(random.uniform(30, 300), 2)
                pay = round(total * random.uniform(0.85, 1.0), 2)

                sku = random.choice(COFFEE_SKUS)
                qty = random.randint(1, 3)
                unit_p = round(total / qty, 2)

                pos_txn_id = pos_ref["txn_id"] if pos_ref and random.random() < 0.92 else None
                if random.random() < 0.05:
                    total = round(total * random.uniform(0.88, 1.12), 2)

                member_rows.append({
                    "receipt_no": receipt_no,
                    "pos_txn_id": pos_txn_id,
                    "member_id": member_id,
                    "business_date": biz_date,
                    "receipt_time": receipt_time,
                    "store_id": store["id"],
                    "total_amount": total,
                    "pay_amount": pay,
                    "points_earned": round(total * 0.1),
                    "sku_code": sku["code"],
                    "sku_name": sku["name"],
                    "quantity": float(qty),
                    "unit_price": unit_p,
                    "subtotal": round(unit_p * qty, 2),
                    "created_at": datetime.utcnow(),
                })

    mr_df = pd.DataFrame(member_rows)
    analytics.load_member_receipt_data(mr_df)

    fault_records = []
    fault_id = 1
    for _ in range(80):
        eq = random.choice(equipments)
        ft = random.choice(FAULT_TYPES)
        fday = random.randint(5, 40)
        ftime = rand_date(base_date, fday)
        status = random.choices(
            ["pending", "processing", "resolved", "closed"],
            weights=[15, 25, 45, 15]
        )[0]
        fault_records.append({
            "id": fault_id,
            "fault_code": f"F{fault_id:06d}",
            "equipment_id": eq["id"],
            "store_id": eq["store_id"],
            "fault_type": ft["type"],
            "fault_category": ft["cat"],
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "fault_time": ftime,
            "detected_by": random.choice(INSPECTORS + ["系统自动", "店长上报"]),
            "description": f"{eq['equipment_name']}出现{ft['type']}问题，影响正常出品。",
            "root_cause": random.choice([
                "未按SOP执行日常清洁",
                "清洁周期超过建议时长",
                "员工操作不规范",
                "耗材质量问题",
                "设备老化",
            ]),
            "is_cleaning_related": ft["clean"],
            "status": status,
            "resolved_time": ftime + timedelta(hours=random.randint(2, 72)) if status in ["resolved", "closed"] else None,
            "resolved_by": random.choice(INSPECTORS) if status in ["resolved", "closed"] else None,
            "resolution": "已完成深度清洁和部件检查" if status in ["resolved", "closed"] else None,
            "downtime_minutes": random.randint(30, 480) if status in ["resolved", "closed"] else 0,
            "maintenance_cost": round(random.uniform(50, 2000), 2),
        })
        fault_id += 1

    tasks = []
    rechecks = []
    task_id = 1
    recheck_id = 1
    for idx, fault in enumerate(fault_records):
        if random.random() < 0.85:
            tt = random.choice(TASK_TYPES)
            deadline = fault["fault_time"] + timedelta(days=random.randint(1, 7))
            status = random.choices(
                ["pending", "in_progress", "completed", "failed", "closed"],
                weights=[10, 20, 40, 15, 15]
            )[0]
            start = fault["fault_time"] + timedelta(hours=random.randint(1, 24))
            complete = None
            result = None
            if status in ["completed", "failed", "closed"]:
                complete = start + timedelta(hours=random.randint(2, 24))
                result = "按要求完成整改，设备运行正常" if status != "failed" else "整改不彻底，仍存在问题"

            tasks.append({
                "id": task_id,
                "task_code": f"T{task_id:07d}",
                "fault_id": fault["id"],
                "equipment_id": fault["equipment_id"],
                "store_id": fault["store_id"],
                "task_type": tt,
                "priority": random.choice(["low", "medium", "high"]),
                "title": f"{tt}-{fault['fault_type']}",
                "description": f"针对{fault['fault_type']}问题进行整改",
                "requirement": "严格按照清洁SOP执行，确认故障解决",
                "deadline": deadline,
                "assignee": random.choice(INSPECTORS),
                "assignor": random.choice(INSPECTORS),
                "status": status,
                "progress": 100 if status in ["completed", "failed", "closed"] else random.randint(0, 80),
                "start_time": start,
                "complete_time": complete,
                "actual_result": result,
            })

            if status in ["completed", "failed"] and random.random() < 0.7:
                rr = "pass" if status == "completed" and random.random() < 0.75 else "fail"
                recheck_time = complete + timedelta(hours=random.randint(1, 48)) if complete else deadline + timedelta(days=1)
                score = round(random.uniform(60, 100), 1) if rr == "pass" else round(random.uniform(40, 75), 1)
                rechecks.append({
                    "id": recheck_id,
                    "recheck_code": f"RC{recheck_id:07d}",
                    "task_id": task_id,
                    "recheck_time": recheck_time,
                    "rechecker": random.choice(INSPECTORS),
                    "result": rr,
                    "score": score,
                    "items": [
                        {"name": "外观清洁", "score": round(random.uniform(score - 10, score + 5), 1), "result": "pass"},
                        {"name": "内部清洁", "score": round(random.uniform(score - 15, score), 1), "result": rr},
                        {"name": "功能测试", "score": round(random.uniform(score - 5, score + 10), 1), "result": "pass"},
                    ],
                    "issues_found": [] if rr == "pass" else [{"item": "内部清洁", "desc": "冲煮头仍有残留咖啡渍"}],
                    "description": f"复查结果：{'合格' if rr == 'pass' else '不合格，需继续整改'}",
                    "conclusion": "整改到位" if rr == "pass" else "需再次整改",
                    "next_action": None if rr == "pass" else "3日内重新安排整改",
                    "next_recheck_time": None if rr == "pass" else recheck_time + timedelta(days=3),
                })
                recheck_id += 1
            task_id += 1

    inspections = []
    insp_trends = []
    insp_id = 1
    for store in STORES:
        for eq in [e for e in equipments if e["store_id"] == store["id"]][:2]:
            for period in range(8):
                p_start = base_date + timedelta(days=period * 7)
                p_end = p_start + timedelta(days=6)
                week_inspections = []
                for _ in range(random.randint(2, 5)):
                    iday = random.randint(0, 6)
                    itime = rand_date(p_start, iday)
                    score = round(random.uniform(65, 98), 1)
                    pass_th = 80.0
                    is_pass = score >= pass_th
                    clean_score = round(random.uniform(max(40, score - 20), min(100, score + 10)), 1)

                    item_results = []
                    issue_items = []
                    insp_items = ["机身外观", "冲煮头", "蒸汽棒", "奶缸", "接水盘", "台面周边"]
                    for i_item in insp_items:
                        i_score = round(random.uniform(max(0, score - 25), min(100, score + 5)), 1)
                        i_result = "pass" if i_score >= pass_th * 0.8 else "fail"
                        item_results.append({"name": i_item, "score": i_score, "result": i_result})
                        if i_result == "fail":
                            issue_items.append({"name": i_item, "score": i_score, "remark": f"{i_item}清洁不达标"})

                    inspections.append({
                        "id": insp_id,
                        "inspection_code": f"I{insp_id:07d}",
                        "equipment_id": eq["id"],
                        "store_id": store["id"],
                        "inspection_type": random.choice(["日常巡检", "专项巡检", "复查巡检"]),
                        "inspection_time": itime,
                        "inspector": random.choice(INSPECTORS),
                        "score": score,
                        "max_score": 100.0,
                        "is_pass": is_pass,
                        "pass_threshold": pass_th,
                        "item_results": item_results,
                        "issue_items": issue_items,
                        "clean_score": clean_score,
                        "overall_rating": "优秀" if score >= 90 else ("良好" if score >= 80 else ("合格" if score >= 70 else "不合格")),
                    })
                    week_inspections.append(score)
                    insp_id += 1

                if week_inspections:
                    total = len(week_inspections)
                    passed = sum(1 for s in week_inspections if s >= 80)
                    cur_rate = passed / total * 100
                    prev_rate = max(0, cur_rate + random.uniform(-15, 15))
                    insp_trends.append({
                        "period_type": "weekly",
                        "period_start": p_start,
                        "period_end": p_end,
                        "store_id": store["id"],
                        "pass_rate": round(cur_rate, 2),
                        "prev_pass_rate": round(prev_rate, 2),
                        "improvement_rate": round(cur_rate - prev_rate, 2),
                        "avg_score": round(sum(week_inspections) / total, 2),
                        "prev_avg_score": round(sum(week_inspections) / total + random.uniform(-8, 8), 2),
                        "total_inspections": total,
                        "created_at": datetime.utcnow(),
                    })

    insp_trend_df = pd.DataFrame(insp_trends)
    if not insp_trend_df.empty:
        analytics.con.register("it_df", insp_trend_df)
        analytics.con.execute("DELETE FROM inspection_comparison")
        analytics.con.execute("INSERT INTO inspection_comparison SELECT * FROM it_df")
        analytics.con.unregister("it_df")

    return {
        "stores": STORES,
        "equipments": equipments,
        "clean_metrics_count": len(clean_rows),
        "inventory_versions": len(inv_v1_rows) + len(inv_v2_rows),
        "pos_versions": len(pos_v1_rows) + len(pos_v2_rows),
        "member_receipts": len(member_rows),
        "fault_records": fault_records,
        "rectification_tasks": tasks,
        "recheck_results": rechecks,
        "inspection_records": inspections,
        "inspection_trends": insp_trends,
    }
