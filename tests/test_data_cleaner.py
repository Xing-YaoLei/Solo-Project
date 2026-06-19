import sys
from pathlib import Path
from datetime import date, datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utils.data_cleaner import DataCleaner


def test_clean_ota_orders_normal():
    records = [{
        "order_no": "OTA001",
        "property_id": "prop-001",
        "channel": "携程",
        "check_in_date": "2026-06-20",
        "check_out_date": "2026-06-22",
        "guest_name": "张三",
        "room_count": 1,
        "room_type": "大床房",
        "total_amount": 880.00,
        "paid_amount": 880.00,
        "order_status": "已确认"
    }]

    result = DataCleaner.clean_ota_orders(records)
    assert result.total_records == 1
    assert result.anomaly_count == 0
    assert len(result.cleaned_data) == 1
    assert result.cleaned_data[0]["is_anomaly"] == False


def test_clean_ota_orders_with_anomalies():
    records = [{
        "order_no": "OTA002",
        "property_id": "prop-001",
        "channel": "未知渠道",
        "check_in_date": "2026-06-22",
        "check_out_date": "2026-06-20",
        "total_amount": -100,
        "order_status": "未知状态",
        "room_count": 0
    }]

    result = DataCleaner.clean_ota_orders(records)
    assert result.total_records == 1
    assert result.anomaly_count > 0
    assert result.cleaned_data[0]["is_anomaly"] == True
    assert len(result.anomalies) > 0


def test_clean_payment_transactions():
    past_time = (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    records = [{
        "transaction_no": "PAY001",
        "property_id": "prop-001",
        "amount": 500.00,
        "transaction_time": past_time,
        "transaction_status": "已支付",
        "payment_method": "微信"
    }]

    result = DataCleaner.clean_payment_transactions(records)
    assert result.total_records == 1
    assert result.anomaly_count == 0
    assert result.cleaned_data[0]["is_anomaly"] == False


def test_clean_door_lock_records():
    past_time = (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    records = [{
        "record_no": "LOCK001",
        "property_id": "prop-001",
        "action_type": "开门",
        "action_time": past_time,
        "lock_device_id": "DEV-001"
    }]

    result = DataCleaner.clean_door_lock_records(records)
    assert result.total_records == 1
    assert result.anomaly_count == 0
    assert result.cleaned_data[0]["is_anomaly"] == False


def test_detect_room_status_conflicts():
    records = [
        {
            "property_id": "prop-001",
            "status_date": date(2026, 6, 20),
            "room_type": "大床房",
            "status": "已确认"
        },
        {
            "property_id": "prop-001",
            "status_date": date(2026, 6, 20),
            "room_type": "大床房",
            "status": "已入住"
        }
    ]

    cleaned, anomalies = DataCleaner.detect_room_status_conflicts(records)
    assert len(anomalies) > 0
    assert cleaned[0]["has_conflict"] == True
    assert cleaned[1]["has_conflict"] == True


def test_date_parsing():
    assert DataCleaner._parse_date("2026-06-20") == date(2026, 6, 20)
    assert DataCleaner._parse_date("2026/06/20") == date(2026, 6, 20)
    assert DataCleaner._parse_date(None) is None

    assert DataCleaner._parse_datetime("2026-06-20 14:30:00") == datetime(2026, 6, 20, 14, 30, 0)
    assert DataCleaner._parse_datetime(None) is None


if __name__ == "__main__":
    test_clean_ota_orders_normal()
    test_clean_ota_orders_with_anomalies()
    test_clean_payment_transactions()
    test_clean_door_lock_records()
    test_detect_room_status_conflicts()
    test_date_parsing()
    print("✅ 所有数据清洗测试通过！")
