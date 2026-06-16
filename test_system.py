#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("=" * 60)
    print("🏥 康复中心康复评估风险监测系统 - 系统测试")
    print("=" * 60)
    print()

    try:
        print("1. 测试配置加载...")
        from config.settings import settings
        print(f"   ✅ 配置加载成功")
        print(f"      数据库: {settings.DATABASE_URL}")
        print(f"      端口: {settings.DASH_PORT}")
        print()

        print("2. 测试数据库连接...")
        from database.db import SessionLocal
        db = SessionLocal()
        print(f"   ✅ 数据库连接成功")
        from database.models import Patient
        count = db.query(Patient).count()
        print(f"      患者记录数: {count}")
        db.close()
        print()

        print("3. 测试数据服务...")
        from etl.data_service import DataService
        ds = DataService()
        print(f"   ✅ 数据服务初始化成功")
        print()

        print("4. 测试指标计算...")
        metrics_df, anomalies_df = ds.get_risk_monitor_data(days=30)
        print(f"   ✅ 指标数据获取成功: {len(metrics_df)} 行")
        print(f"   ✅ 异常数据获取成功: {len(anomalies_df)} 行")
        if len(metrics_df) > 0:
            latest = metrics_df.iloc[-1]
            print(f"      最新日期: {latest['date']}")
            print(f"      综合风险评分: {latest['综合风险评分']}")
            print(f"      训练完成率: {latest['训练完成率']}%")
            print(f"      收费表延迟率: {latest['收费表延迟率']}%")
            print(f"      病历完整度: {latest['病历完整度']}%")
            print(f"      打卡一致性: {latest['打卡一致性']}%")
            print(f"      医保拒付率: {latest['医保拒付率']}%")
        print()

        print("5. 测试异常检测...")
        from etl.anomaly_detector import AnomalyDetector
        detector = AnomalyDetector(ds.db, settings.ANOMALY_THRESHOLDS)
        from datetime import date
        payment_anomalies = detector.detect_payment_delays(date.today())
        record_anomalies = detector.detect_medical_record_gaps(date.today())
        punchcard_anomalies = detector.detect_punch_card_caliber_changes(date.today())
        insurance_anomalies = detector.detect_insurance_rejection_trends(date.today())
        print(f"   ✅ 收费延迟异常: {len(payment_anomalies)} 个")
        print(f"   ✅ 病历缺失异常: {len(record_anomalies)} 个")
        print(f"   ✅ 打卡口径异常: {len(punchcard_anomalies)} 个")
        print(f"   ✅ 医保拒付异常: {len(insurance_anomalies)} 个")
        print()

        print("6. 测试CSV导出...")
        csv_content = ds.generate_download_csv(metrics_df, anomalies_df)
        lines = csv_content.split("\n")
        print(f"   ✅ CSV生成成功，共 {len(lines)} 行")
        if len(lines) > 5:
            print("      前5行内容:")
            for line in lines[:5]:
                print(f"         {line[:80]}...")
        print()

        print("7. 测试Dash应用导入...")
        from dashboard.app import app
        print(f"   ✅ Dash应用导入成功")
        print(f"      应用标题: {app.title}")
        print()

        print("8. 测试治疗日历数据...")
        treatment_df = ds.get_treatment_calendar(days=14)
        print(f"   ✅ 治疗日历数据: {len(treatment_df)} 条记录")
        print()

        print("9. 测试器械状态数据...")
        equipment_df = ds.get_equipment_status()
        print(f"   ✅ 器械状态数据: {len(equipment_df)} 条记录")
        print()

        print("10. 测试护理日志数据...")
        nursing_df = ds.get_nursing_logs(days=7)
        print(f"   ✅ 护理日志数据: {len(nursing_df)} 条记录")
        print()

        print("=" * 60)
        print("🎉 所有测试通过！系统运行正常！")
        print("=" * 60)
        print()
        print("💡 启动命令:")
        print("   source venv/bin/activate && python run.py")
        print("   然后访问: http://localhost:8050")
        print()
        return 0

    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
