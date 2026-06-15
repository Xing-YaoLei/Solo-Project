from celery_app import celery
from tasks.base import BaseSyncTask, gen_id
from models import get_db, RawSmartCard, Student
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)


class SyncSmartCardTask(BaseSyncTask):
    source_system = "一卡通系统"
    sync_type = "增量同步"


@celery.task(base=SyncSmartCardTask, bind=True, name="tasks.sync_smart_card.sync_smart_card")
def sync_smart_card(self, days=15):
    try:
        with get_db() as db:
            batch_id = gen_id("BATCH")
            cutoff = datetime.now() - timedelta(days=days)

            mock_data = _generate_mock_smart_card()
            self.total_records = len(mock_data)
            raw_records = []

            for item in mock_data:
                raw = RawSmartCard(
                    batch_id=batch_id,
                    source_id=f"sc_{item['card_id']}",
                    card_id=item["card_id"],
                    student_id=item["student_id"],
                    student_name=item["student_name"],
                    card_status=item["card_status"],
                    identity_verified=item["identity_verified"],
                    last_verify_time=item["last_verify_time"],
                    verify_location=item["verify_location"],
                    raw_payload=item,
                    is_processed=False,
                    is_anomaly=False,
                )
                db.add(raw)
                raw_records.append((raw, item))

            db.commit()

            for raw, item in raw_records:
                try:
                    student = db.query(Student).filter(Student.student_id == item["student_id"]).first()

                    if not student:
                        self.record_anomaly(
                            anomaly_type="学生不存在",
                            description=f"一卡通关联学号 {item['student_id']} 不存在于学生表",
                            severity="中",
                            table_name="students",
                            record_id=item["student_id"],
                            raw_data=item,
                        )
                        raw.is_anomaly = True
                        raw.anomaly_note = "关联学生不存在"
                        self.failed_count += 1
                        continue

                    if student.smart_card_id and student.smart_card_id != item["card_id"]:
                        self.record_anomaly(
                            anomaly_type="卡号不一致",
                            description=f"学号 {item['student_id']} 登记卡号 {student.smart_card_id} 与一卡通 {item['card_id']} 不一致",
                            severity="高",
                            table_name="students",
                            record_id=item["student_id"],
                            field_name="smart_card_id",
                            expected_value=student.smart_card_id,
                            actual_value=item["card_id"],
                            raw_data=item,
                        )
                        raw.is_anomaly = True
                        raw.anomaly_note = "卡号与登记不一致"

                    if item["identity_verified"]:
                        if item["last_verify_time"] and item["last_verify_time"] < cutoff:
                            self.record_anomaly(
                                anomaly_type="验证过期",
                                description=f"一卡通 {item['card_id']} 最近核验已超过{days}天",
                                severity="低",
                                table_name="raw_smart_cards",
                                record_id=str(raw.id),
                                field_name="last_verify_time",
                                raw_data=item,
                                remark="需提醒学生重新核验身份"
                            )

                    student.smart_card_id = item["card_id"]
                    student.is_verified = bool(item["identity_verified"])
                    student.synced_at = datetime.now()

                    raw.is_processed = True
                    raw.processed_at = datetime.now()
                    self.success_count += 1

                except Exception as e:
                    raw.is_anomaly = True
                    raw.anomaly_note = f"处理异常: {str(e)}"
                    self.failed_count += 1
                    logger.error(f"处理一卡通数据失败 raw_id={raw.id}: {e}")

            db.commit()

        self.create_sync_log(status="成功")
        return {
            "sync_id": self.sync_id,
            "total": self.total_records,
            "success": self.success_count,
            "failed": self.failed_count,
            "anomaly": self.anomaly_count,
        }

    except Exception as e:
        self.create_sync_log(status="失败", error_message=str(e))
        raise


def _generate_mock_smart_card():
    data = []
    for i in range(1, 81):
        student_id = f"S{20230000 + i:08d}"
        data.append({
            "card_id": f"CARD{10000000 + i:08d}",
            "student_id": student_id,
            "student_name": f"学生{i}",
            "card_status": random.choices(["正常", "挂失", "冻结"], weights=[92, 5, 3], k=1)[0],
            "identity_verified": random.random() < 0.88,
            "last_verify_time": datetime.now() - timedelta(
                days=random.randint(0, 25),
                hours=random.randint(0, 23)
            ),
            "verify_location": random.choice(["图书馆入口", "教学楼A", "学生活动中心", "宿舍区", None]),
        })

    for i in range(5):
        data.append({
            "card_id": f"CARD99999{i:03d}",
            "student_id": f"S99999{i:05d}",
            "student_name": f"异常学生{i}",
            "card_status": "正常",
            "identity_verified": True,
            "last_verify_time": datetime.now(),
            "verify_location": "异常测试",
        })

    return data
