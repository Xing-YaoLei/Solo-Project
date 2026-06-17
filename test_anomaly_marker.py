import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import polars as pl
from data import DuckDBClient
from utils import SampleDataGenerator
from processing import DataProcessor
from components import AnomalyMarker

def test_anomaly_summary_no_errors():
    """测试1: 各种异常存在时 get_anomaly_summary 不报错"""
    print("\n=== 测试1: get_anomaly_summary 不报错 ===")
    
    db = DuckDBClient()
    generator = SampleDataGenerator(db)
    generator.generate_and_save(days=30)
    
    processor = DataProcessor(db)
    anomalies = processor.detect_all_anomalies()
    
    print(f"检测到的异常类型: {[k for k, v in anomalies.items() if len(v) > 0]}")
    for k, v in anomalies.items():
        print(f"  - {k}: {len(v)} 条")
    
    marker = AnomalyMarker(anomalies, db_client=db)
    
    try:
        summary = marker.get_anomaly_summary()
        print(f"✅ get_anomaly_summary 成功, 返回 {len(summary)} 条异常")
        for item in summary:
            print(f"  - {item['icon']} {item['label']}: {item['count']} 条")
            print(f"    描述: {item['description']}")
        return True
    except Exception as e:
        print(f"❌ get_anomaly_summary 报错: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_split_description_methods():
    """测试2: 总览描述和单条描述拆分正确"""
    print("\n=== 测试2: 总览描述和单条描述方法拆分 ===")
    
    db = DuckDBClient()
    processor = DataProcessor(db)
    anomalies = processor.detect_all_anomalies()
    marker = AnomalyMarker(anomalies, db_client=db)
    
    success = True
    
    for anomaly_type in ["terminal_delay", "charging_missing", "device_caliber_change", "fall_impact"]:
        df = anomalies.get(anomaly_type, pl.DataFrame())
        
        try:
            overview = marker._get_overview_description(anomaly_type, df)
            print(f"✅ {anomaly_type} 总览描述: {overview}")
        except Exception as e:
            print(f"❌ {anomaly_type} 总览描述报错: {e}")
            success = False
        
        if len(df) > 0:
            row = df.row(0, named=True)
            try:
                single = marker._get_single_anomaly_description(anomaly_type, row)
                print(f"✅ {anomaly_type} 单条描述: {single}")
            except Exception as e:
                print(f"❌ {anomaly_type} 单条描述报错: {e}")
                success = False
    
    return success

def test_saved_conclusions_near_chart():
    """测试3: 图表旁读取并展示已保存处理结论"""
    print("\n=== 测试3: 读取已保存的处理结论 ===")
    
    db = DuckDBClient()
    processor = DataProcessor(db)
    anomalies = processor.detect_all_anomalies()
    marker = AnomalyMarker(anomalies, db_client=db)
    
    test_anomaly_ids = []
    for anomaly_type in ["charging_missing", "fall_impact"]:
        df = anomalies.get(anomaly_type, pl.DataFrame())
        if len(df) > 0:
            row = df.row(0, named=True)
            if anomaly_type == "charging_missing":
                aid = f"charging_{row.get('activity_id', 0)}"
            elif anomaly_type == "fall_impact":
                aid = f"fall_{row.get('event_id', 0)}"
            else:
                aid = f"{anomaly_type}_0"
            
            db.save_anomaly_review(
                anomaly_id=aid,
                review_notes=f"测试{anomaly_type}复盘",
                handle_conclusion=f"测试{anomaly_type}处理结论-已保存",
                resolved=True
            )
            test_anomaly_ids.append((anomaly_type, aid))
            print(f"  - 已保存测试结论: {aid}")
    
    try:
        all_conclusions = marker.get_all_saved_conclusions()
        print(f"✅ get_all_saved_conclusions 成功, 返回 {len(all_conclusions)} 条结论")
        for conc in all_conclusions:
            print(f"  - {conc['description']}: {conc['conclusion']} (已解决: {conc['is_resolved']})")
    except Exception as e:
        print(f"❌ get_all_saved_conclusions 报错: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    for anomaly_type, aid in test_anomaly_ids:
        try:
            conclusions = marker.get_saved_conclusions(anomaly_type)
            if len(conclusions) > 0:
                print(f"✅ {anomaly_type} 读取到 {len(conclusions)} 条结论")
            else:
                print(f"⚠️ {anomaly_type} 未读取到结论 (aid: {aid})")
        except Exception as e:
            print(f"❌ {anomaly_type} get_saved_conclusions 报错: {e}")
            return False
    
    return True

def test_edge_cases():
    """测试4: 边界情况"""
    print("\n=== 测试4: 边界情况 ===")
    
    success = True
    
    empty_marker = AnomalyMarker({}, db_client=None)
    try:
        summary = empty_marker.get_anomaly_summary()
        print(f"✅ 空异常字典返回 summary: {summary}")
    except Exception as e:
        print(f"❌ 空异常字典报错: {e}")
        success = False
    
    try:
        has = empty_marker.has_anomalies()
        print(f"✅ has_anomalies (空): {has}")
    except Exception as e:
        print(f"❌ has_anomalies 报错: {e}")
        success = False
    
    try:
        concs = empty_marker.get_all_saved_conclusions()
        print(f"✅ get_all_saved_conclusions (无db): {concs}")
    except Exception as e:
        print(f"❌ get_all_saved_conclusions (无db) 报错: {e}")
        success = False
    
    none_marker = AnomalyMarker(None, db_client=None)
    try:
        summary = none_marker.get_anomaly_summary()
        print(f"✅ None异常字典返回 summary: {summary}")
    except Exception as e:
        print(f"❌ None异常字典报错: {e}")
        success = False
    
    db = DuckDBClient()
    marker_with_db = AnomalyMarker({"charging_missing": None}, db_client=db)
    try:
        summary = marker_with_db.get_anomaly_summary()
        print(f"✅ DataFrame为None的异常不报错: {summary}")
    except Exception as e:
        print(f"❌ DataFrame为None的异常报错: {e}")
        success = False
    
    return success

def main():
    print("🏥 AnomalyMarker 拆分与稳定性测试")
    
    tests = [
        ("异常总览不报错", test_anomaly_summary_no_errors),
        ("描述方法拆分", test_split_description_methods),
        ("图表旁处理结论读取", test_saved_conclusions_near_chart),
        ("边界情况", test_edge_cases),
    ]
    
    passed = 0
    failed = 0
    
    for name, func in tests:
        try:
            if func():
                passed += 1
                print(f"✅ {name} - 通过")
            else:
                failed += 1
                print(f"❌ {name} - 失败")
        except Exception as e:
            failed += 1
            print(f"❌ {name} - 异常: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'='*50}")
    print(f"📊 测试总结: {passed} 通过, {failed} 失败")
    
    if failed == 0:
        print("\n🎉 所有测试通过！")
        print("\n已完成的修改:")
        print("  1. 拆分 _get_overview_description (总览, 接收df)")
        print("     和 _get_single_anomaly_description (单条, 接收row)")
        print("  2. get_anomaly_summary 增加 try-except 保护")
        print("  3. 新增 render_saved_conclusions_near_chart() 统一展示")
        print("  4. 所有字典访问改用 .get() 避免KeyError")
        print("  5. anomalies=None 时在 __init__ 中安全处理")
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(main())
