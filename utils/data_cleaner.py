from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
import uuid
import json


@dataclass
class AnomalyRecord:
    source_table: str
    source_id: Optional[str]
    anomaly_type: str
    anomaly_field: Optional[str]
    original_value: Optional[str]
    expected_value: Optional[str]
    description: str
    severity: str = "warning"


@dataclass
class CleanResult:
    cleaned_data: List[Dict[str, Any]] = field(default_factory=list)
    anomalies: List[AnomalyRecord] = field(default_factory=list)
    total_records: int = 0
    anomaly_count: int = 0


class DataCleaner:
    REQUIRED_FIELDS = {
        "ota_orders": ["order_no", "property_id", "channel", "check_in_date", "check_out_date", "order_status"],
        "payment_transactions": ["transaction_no", "property_id", "amount", "transaction_time", "transaction_status"],
        "door_lock_records": ["record_no", "property_id", "action_type", "action_time"],
    }

    VALID_CHANNELS = ["携程", "美团", "飞猪", "去哪儿", "Airbnb", "Booking", "Agoda", "直接预订", "线下"]
    VALID_ORDER_STATUSES = ["待确认", "已确认", "已入住", "已退房", "已取消", "已完成", "no_show"]
    VALID_PAYMENT_STATUSES = ["待支付", "已支付", "支付失败", "已退款", "部分退款"]
    VALID_LOCK_ACTIONS = ["开门", "关门", "反锁", "解锁失败", "密码错误", "临时密码创建", "临时密码删除"]

    @classmethod
    def clean_ota_orders(cls, records: List[Dict[str, Any]]) -> CleanResult:
        result = CleanResult(total_records=len(records))

        for record in records:
            record_anomalies = []
            cleaned = dict(record)

            for field in cls.REQUIRED_FIELDS["ota_orders"]:
                if field not in cleaned or cleaned[field] is None or cleaned[field] == "":
                    record_anomalies.append(AnomalyRecord(
                        source_table="ota_orders",
                        source_id=record.get("order_no"),
                        anomaly_type="missing_field",
                        anomaly_field=field,
                        original_value=str(cleaned.get(field)),
                        expected_value="non_null",
                        description=f"必填字段 {field} 缺失或为空",
                        severity="error"
                    ))

            if "check_in_date" in cleaned and cleaned["check_in_date"] and "check_out_date" in cleaned and cleaned["check_out_date"]:
                try:
                    ci = cls._parse_date(cleaned["check_in_date"])
                    co = cls._parse_date(cleaned["check_out_date"])
                    if ci and co and ci >= co:
                        record_anomalies.append(AnomalyRecord(
                            source_table="ota_orders",
                            source_id=record.get("order_no"),
                            anomaly_type="invalid_date_range",
                            anomaly_field="check_in_date,check_out_date",
                            original_value=f"{cleaned['check_in_date']} ~ {cleaned['check_out_date']}",
                            expected_value="check_out_date > check_in_date",
                            description="退房日期必须晚于入住日期",
                            severity="error"
                        ))
                    cleaned["check_in_date"] = ci
                    cleaned["check_out_date"] = co
                except Exception as e:
                    record_anomalies.append(AnomalyRecord(
                        source_table="ota_orders",
                        source_id=record.get("order_no"),
                        anomaly_type="date_parse_error",
                        anomaly_field="check_in_date,check_out_date",
                        original_value=f"{cleaned.get('check_in_date')} ~ {cleaned.get('check_out_date')}",
                        expected_value="valid date format",
                        description=f"日期解析失败: {str(e)}",
                        severity="error"
                    ))

            if "channel" in cleaned and cleaned["channel"] and cleaned["channel"] not in cls.VALID_CHANNELS:
                record_anomalies.append(AnomalyRecord(
                    source_table="ota_orders",
                    source_id=record.get("order_no"),
                    anomaly_type="invalid_channel",
                    anomaly_field="channel",
                    original_value=str(cleaned["channel"]),
                    expected_value=",".join(cls.VALID_CHANNELS),
                    description=f"未知渠道: {cleaned['channel']}",
                    severity="warning"
                ))

            if "order_status" in cleaned and cleaned["order_status"] and cleaned["order_status"] not in cls.VALID_ORDER_STATUSES:
                record_anomalies.append(AnomalyRecord(
                    source_table="ota_orders",
                    source_id=record.get("order_no"),
                    anomaly_type="invalid_status",
                    anomaly_field="order_status",
                    original_value=str(cleaned["order_status"]),
                    expected_value=",".join(cls.VALID_ORDER_STATUSES),
                    description=f"未知订单状态: {cleaned['order_status']}",
                    severity="warning"
                ))

            if "total_amount" in cleaned and cleaned["total_amount"] is not None:
                try:
                    amount = float(cleaned["total_amount"])
                    if amount < 0:
                        record_anomalies.append(AnomalyRecord(
                            source_table="ota_orders",
                            source_id=record.get("order_no"),
                            anomaly_type="negative_amount",
                            anomaly_field="total_amount",
                            original_value=str(cleaned["total_amount"]),
                            expected_value=">= 0",
                            description=f"订单金额为负数: {amount}",
                            severity="error"
                        ))
                    elif amount > 100000:
                        record_anomalies.append(AnomalyRecord(
                            source_table="ota_orders",
                            source_id=record.get("order_no"),
                            anomaly_type="amount_outlier",
                            anomaly_field="total_amount",
                            original_value=str(cleaned["total_amount"]),
                            expected_value="0 ~ 100000",
                            description=f"订单金额异常偏高: {amount}",
                            severity="warning"
                        ))
                    cleaned["total_amount"] = amount
                except (ValueError, TypeError):
                    record_anomalies.append(AnomalyRecord(
                        source_table="ota_orders",
                        source_id=record.get("order_no"),
                        anomaly_type="invalid_amount",
                        anomaly_field="total_amount",
                        original_value=str(cleaned.get("total_amount")),
                        expected_value="numeric",
                        description="订单金额不是有效数字",
                        severity="error"
                    ))

            if "room_count" in cleaned and cleaned["room_count"] is not None:
                try:
                    rc = int(cleaned["room_count"])
                    if rc <= 0 or rc > 50:
                        record_anomalies.append(AnomalyRecord(
                            source_table="ota_orders",
                            source_id=record.get("order_no"),
                            anomaly_type="invalid_room_count",
                            anomaly_field="room_count",
                            original_value=str(cleaned["room_count"]),
                            expected_value="1 ~ 50",
                            description=f"房间数异常: {rc}",
                            severity="warning"
                        ))
                    cleaned["room_count"] = rc
                except (ValueError, TypeError):
                    record_anomalies.append(AnomalyRecord(
                        source_table="ota_orders",
                        source_id=record.get("order_no"),
                        anomaly_type="invalid_room_count",
                        anomaly_field="room_count",
                        original_value=str(cleaned.get("room_count")),
                        expected_value="integer",
                        description="房间数不是有效整数",
                        severity="error"
                    ))

            if record_anomalies:
                cleaned["is_anomaly"] = True
                cleaned["anomaly_detail"] = json.dumps([{
                    "type": a.anomaly_type,
                    "field": a.anomaly_field,
                    "description": a.description,
                    "severity": a.severity
                } for a in record_anomalies], ensure_ascii=False)
                result.anomalies.extend(record_anomalies)
                result.anomaly_count += len(record_anomalies)
            else:
                cleaned["is_anomaly"] = False
                cleaned["anomaly_detail"] = None

            cleaned["raw_data"] = json.dumps(record, ensure_ascii=False) if "raw_data" not in cleaned else cleaned["raw_data"]
            result.cleaned_data.append(cleaned)

        return result

    @classmethod
    def clean_payment_transactions(cls, records: List[Dict[str, Any]]) -> CleanResult:
        result = CleanResult(total_records=len(records))

        for record in records:
            record_anomalies = []
            cleaned = dict(record)

            for field in cls.REQUIRED_FIELDS["payment_transactions"]:
                if field not in cleaned or cleaned[field] is None or cleaned[field] == "":
                    record_anomalies.append(AnomalyRecord(
                        source_table="payment_transactions",
                        source_id=record.get("transaction_no"),
                        anomaly_type="missing_field",
                        anomaly_field=field,
                        original_value=str(cleaned.get(field)),
                        expected_value="non_null",
                        description=f"必填字段 {field} 缺失或为空",
                        severity="error"
                    ))

            if "transaction_time" in cleaned and cleaned["transaction_time"]:
                try:
                    cleaned["transaction_time"] = cls._parse_datetime(cleaned["transaction_time"])
                    if cleaned["transaction_time"] and cleaned["transaction_time"] > datetime.now():
                        record_anomalies.append(AnomalyRecord(
                            source_table="payment_transactions",
                            source_id=record.get("transaction_no"),
                            anomaly_type="future_transaction",
                            anomaly_field="transaction_time",
                            original_value=str(record.get("transaction_time")),
                            expected_value="past or current time",
                            description="交易时间在未来",
                            severity="warning"
                        ))
                except Exception as e:
                    record_anomalies.append(AnomalyRecord(
                        source_table="payment_transactions",
                        source_id=record.get("transaction_no"),
                        anomaly_type="datetime_parse_error",
                        anomaly_field="transaction_time",
                        original_value=str(cleaned.get("transaction_time")),
                        expected_value="valid datetime format",
                        description=f"时间解析失败: {str(e)}",
                        severity="error"
                    ))

            if "amount" in cleaned and cleaned["amount"] is not None:
                try:
                    amount = float(cleaned["amount"])
                    if amount == 0:
                        record_anomalies.append(AnomalyRecord(
                            source_table="payment_transactions",
                            source_id=record.get("transaction_no"),
                            anomaly_type="zero_amount",
                            anomaly_field="amount",
                            original_value="0",
                            expected_value="!= 0",
                            description="交易金额为0",
                            severity="warning"
                        ))
                    elif amount < 0:
                        record_anomalies.append(AnomalyRecord(
                            source_table="payment_transactions",
                            source_id=record.get("transaction_no"),
                            anomaly_type="negative_amount",
                            anomaly_field="amount",
                            original_value=str(cleaned["amount"]),
                            expected_value=">= 0 (退款单独处理)",
                            description=f"交易金额为负数: {amount}",
                            severity="warning"
                        ))
                    elif amount > 500000:
                        record_anomalies.append(AnomalyRecord(
                            source_table="payment_transactions",
                            source_id=record.get("transaction_no"),
                            anomaly_type="amount_outlier",
                            anomaly_field="amount",
                            original_value=str(cleaned["amount"]),
                            expected_value="0 ~ 500000",
                            description=f"交易金额异常偏高: {amount}",
                            severity="warning"
                        ))
                    cleaned["amount"] = amount
                except (ValueError, TypeError):
                    record_anomalies.append(AnomalyRecord(
                        source_table="payment_transactions",
                        source_id=record.get("transaction_no"),
                        anomaly_type="invalid_amount",
                        anomaly_field="amount",
                        original_value=str(cleaned.get("amount")),
                        expected_value="numeric",
                        description="交易金额不是有效数字",
                        severity="error"
                    ))

            if "transaction_status" in cleaned and cleaned["transaction_status"] and cleaned["transaction_status"] not in cls.VALID_PAYMENT_STATUSES:
                record_anomalies.append(AnomalyRecord(
                    source_table="payment_transactions",
                    source_id=record.get("transaction_no"),
                    anomaly_type="invalid_status",
                    anomaly_field="transaction_status",
                    original_value=str(cleaned["transaction_status"]),
                    expected_value=",".join(cls.VALID_PAYMENT_STATUSES),
                    description=f"未知交易状态: {cleaned['transaction_status']}",
                    severity="warning"
                ))

            if record_anomalies:
                cleaned["is_anomaly"] = True
                cleaned["anomaly_detail"] = json.dumps([{
                    "type": a.anomaly_type,
                    "field": a.anomaly_field,
                    "description": a.description,
                    "severity": a.severity
                } for a in record_anomalies], ensure_ascii=False)
                result.anomalies.extend(record_anomalies)
                result.anomaly_count += len(record_anomalies)
            else:
                cleaned["is_anomaly"] = False
                cleaned["anomaly_detail"] = None

            cleaned["raw_data"] = json.dumps(record, ensure_ascii=False) if "raw_data" not in cleaned else cleaned["raw_data"]
            result.cleaned_data.append(cleaned)

        return result

    @classmethod
    def clean_door_lock_records(cls, records: List[Dict[str, Any]]) -> CleanResult:
        result = CleanResult(total_records=len(records))

        for record in records:
            record_anomalies = []
            cleaned = dict(record)

            for field in cls.REQUIRED_FIELDS["door_lock_records"]:
                if field not in cleaned or cleaned[field] is None or cleaned[field] == "":
                    record_anomalies.append(AnomalyRecord(
                        source_table="door_lock_records",
                        source_id=record.get("record_no"),
                        anomaly_type="missing_field",
                        anomaly_field=field,
                        original_value=str(cleaned.get(field)),
                        expected_value="non_null",
                        description=f"必填字段 {field} 缺失或为空",
                        severity="error"
                    ))

            if "action_time" in cleaned and cleaned["action_time"]:
                try:
                    cleaned["action_time"] = cls._parse_datetime(cleaned["action_time"])
                    if cleaned["action_time"] and cleaned["action_time"] > datetime.now():
                        record_anomalies.append(AnomalyRecord(
                            source_table="door_lock_records",
                            source_id=record.get("record_no"),
                            anomaly_type="future_action",
                            anomaly_field="action_time",
                            original_value=str(record.get("action_time")),
                            expected_value="past or current time",
                            description="门锁操作时间在未来",
                            severity="warning"
                        ))
                except Exception as e:
                    record_anomalies.append(AnomalyRecord(
                        source_table="door_lock_records",
                        source_id=record.get("record_no"),
                        anomaly_type="datetime_parse_error",
                        anomaly_field="action_time",
                        original_value=str(cleaned.get("action_time")),
                        expected_value="valid datetime format",
                        description=f"时间解析失败: {str(e)}",
                        severity="error"
                    ))

            if "action_type" in cleaned and cleaned["action_type"] and cleaned["action_type"] not in cls.VALID_LOCK_ACTIONS:
                record_anomalies.append(AnomalyRecord(
                    source_table="door_lock_records",
                    source_id=record.get("record_no"),
                    anomaly_type="invalid_action",
                    anomaly_field="action_type",
                    original_value=str(cleaned["action_type"]),
                    expected_value=",".join(cls.VALID_LOCK_ACTIONS),
                    description=f"未知门锁操作类型: {cleaned['action_type']}",
                    severity="warning"
                ))

            if record_anomalies:
                cleaned["is_anomaly"] = True
                cleaned["anomaly_detail"] = json.dumps([{
                    "type": a.anomaly_type,
                    "field": a.anomaly_field,
                    "description": a.description,
                    "severity": a.severity
                } for a in record_anomalies], ensure_ascii=False)
                result.anomalies.extend(record_anomalies)
                result.anomaly_count += len(record_anomalies)
            else:
                cleaned["is_anomaly"] = False
                cleaned["anomaly_detail"] = None

            cleaned["raw_data"] = json.dumps(record, ensure_ascii=False) if "raw_data" not in cleaned else cleaned["raw_data"]
            result.cleaned_data.append(cleaned)

        return result

    @classmethod
    def detect_room_status_conflicts(cls, records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[AnomalyRecord]]:
        from collections import defaultdict

        grouped = defaultdict(list)
        for r in records:
            key = (str(r.get("property_id")), str(r.get("status_date")), str(r.get("room_type")))
            grouped[key].append(r)

        result_records = []
        anomalies = []

        for key, group in grouped.items():
            statuses = set()
            for r in group:
                if r.get("status"):
                    statuses.add(r["status"])

            has_conflict = len(statuses) > 1
            for r in group:
                cleaned = dict(r)
                if has_conflict:
                    cleaned["has_conflict"] = True
                    cleaned["conflict_detail"] = json.dumps({
                        "conflicting_statuses": list(statuses),
                        "conflict_records_count": len(group)
                    }, ensure_ascii=False)
                    anomalies.append(AnomalyRecord(
                        source_table="room_status",
                        source_id=str(r.get("id")) if r.get("id") else None,
                        anomaly_type="status_conflict",
                        anomaly_field="status",
                        original_value=",".join(statuses),
                        expected_value="single unique status per date/room",
                        description=f"房态冲突: 同一房源同一日期房型存在多个状态 {list(statuses)}",
                        severity="error"
                    ))
                else:
                    cleaned["has_conflict"] = False
                    cleaned["conflict_detail"] = None
                result_records.append(cleaned)

        return result_records, anomalies

    @staticmethod
    def _parse_date(value: Any) -> Optional[date]:
        if value is None or value == "":
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, datetime):
            return value.date()
        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%Y%m%d", "%d-%m-%Y", "%d/%m/%Y"]:
            try:
                return datetime.strptime(str(value), fmt).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def _parse_datetime(value: Any) -> Optional[datetime]:
        if value is None or value == "":
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, date):
            return datetime(value.year, value.month, value.day)
        for fmt in [
            "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y/%m/%d %H:%M:%S",
            "%Y/%m/%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ",
            "%Y%m%d%H%M%S", "%Y-%m-%d %H:%M:%S%z"
        ]:
            try:
                dt = datetime.strptime(str(value), fmt)
                if dt.tzinfo is None:
                    return dt
                return dt.replace(tzinfo=None)
            except ValueError:
                continue
        return None


def save_anomalies_to_db(anomalies: List[AnomalyRecord]):
    from utils.database import get_db_session
    from data.models import DataAnomaly

    with get_db_session() as db:
        for a in anomalies:
            anomaly = DataAnomaly(
                source_table=a.source_table,
                source_id=uuid.UUID(a.source_id) if a.source_id and len(a.source_id) == 36 else None,
                anomaly_type=a.anomaly_type,
                anomaly_field=a.anomaly_field,
                original_value=a.original_value,
                expected_value=a.expected_value,
                description=a.description,
                severity=a.severity,
                is_resolved=False
            )
            db.add(anomaly)
