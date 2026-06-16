import polars as pl
import random
import uuid
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
import logging

from data import DuckDBClient
from config import config

logger = logging.getLogger(__name__)


class SampleDataGenerator:
    def __init__(self, db_client: DuckDBClient):
        self.db = db_client
        self.elders: List[Dict[str, Any]] = []
        self.activities: List[Dict[str, Any]] = []
        self.checkins: List[Dict[str, Any]] = []
        self.risk_events: List[Dict[str, Any]] = []
        self.anomalies: List[Dict[str, Any]] = []
        
        self.elder_names = [
            "张建国", "李淑芬", "王德华", "赵秀兰", "刘文明",
            "陈桂英", "杨振华", "黄丽华", "周志强", "吴美玉",
            "郑海涛", "孙秀珍", "马建国", "朱丽娟", "胡大伟"
        ]
        
        self.activity_types = [
            ("肢体康复训练", "物理治疗"),
            ("言语认知训练", "康复治疗"),
            ("老年保健操", "运动康复"),
            ("音乐疗法", "心理康复"),
            ("手工制作", "作业治疗"),
            ("步态训练", "物理治疗"),
            ("记忆力训练", "认知康复"),
            ("社交活动", "社会参与")
        ]
        
        self.therapists = ["李医生", "王治疗师", "张护士", "刘康复师", "陈医师"]

    def generate_all_data(self, days: int = 30) -> None:
        logger.info(f"Generating sample data for {days} days...")
        
        self._generate_elders(15)
        self._generate_activities(days)
        self._generate_checkins()
        self._generate_risk_events()
        
        self._save_to_database()
        
        logger.info("Sample data generation completed")

    def _generate_elders(self, count: int) -> None:
        today = date.today()
        
        for i in range(count):
            elder_id = f"E{str(i+1).zfill(4)}"
            gender = "男" if i % 2 == 0 else "女"
            age = random.randint(65, 92)
            admission_date = today - timedelta(days=random.randint(30, 730))
            
            health_levels = ["健康", "良好", "一般", "较差"]
            care_levels = ["自理", "半自理", "全护理", "特级护理"]
            
            medical_histories = [
                ["高血压", "糖尿病"],
                ["心脏病"],
                ["糖尿病", "关节炎"],
                ["高血压"],
                ["糖尿病", "高血压", "心脏病"]
            ]
            
            self.elders.append({
                "elder_id": elder_id,
                "name": self.elder_names[i],
                "gender": gender,
                "age": age,
                "room_number": f"{random.randint(1, 5)}{random.randint(1, 3)}{random.randint(1, 9):02d}",
                "admission_date": admission_date,
                "health_level": random.choice(health_levels),
                "care_level": random.choice(care_levels),
                "medical_history": ",".join(random.choice(medical_histories)),
                "contact_person": f"{random.choice(['儿子', '女儿', '配偶'])}",
                "contact_phone": f"138{random.randint(10000000, 99999999)}",
                "notes": ""
            })
        
        logger.info(f"Generated {len(self.elders)} elder profiles")

    def _generate_activities(self, days: int) -> None:
        today = date.today()
        start_date = today - timedelta(days=days)
        
        current_date = start_date
        activity_id = 1
        
        while current_date <= today:
            activities_per_day = random.randint(3, 8)
            
            for _ in range(activities_per_day):
                activity_name, activity_type = random.choice(self.activity_types)
                
                plan_start_hour = random.choice(["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"])
                plan_end_hour = f"{int(plan_start_hour[:2]) + 1}:00"
                
                elder = random.choice(self.elders)
                
                status_weights = [0.7, 0.15, 0.1, 0.05]
                statuses = ["已完成", "进行中", "未参与", "已取消"]
                status = random.choices(statuses, weights=status_weights)[0]
                
                actual_start = None
                actual_end = None
                checkin_time = None
                is_compliant = False
                non_compliant_reason = ""
                
                if status == "已完成":
                    delay_minutes = random.randint(0, 30)
                    actual_start = datetime.combine(
                        current_date, 
                        datetime.strptime(plan_start_hour, "%H:%M").time()
                    ) + timedelta(minutes=delay_minutes)
                    actual_end = actual_start + timedelta(minutes=random.randint(45, 90))
                    
                    checkin_time = actual_start
                    
                    is_compliant = random.random() < 0.8
                    if not is_compliant:
                        reasons = ["活动迟到", "老人状态不佳", "设备故障", "操作不规范"]
                        non_compliant_reason = random.choice(reasons)
                
                data_sources = ["护理终端", "健康设备", "人工录入"]
                data_source = random.choices(data_sources, weights=[0.6, 0.3, 0.1])[0]
                
                self.activities.append({
                    "activity_id": f"A{str(activity_id).zfill(6)}",
                    "activity_name": activity_name,
                    "activity_type": activity_type,
                    "plan_date": current_date,
                    "plan_start_time": plan_start_hour,
                    "plan_end_time": plan_end_hour,
                    "actual_start_time": actual_start,
                    "actual_end_time": actual_end,
                    "elder_id": elder["elder_id"],
                    "elder_name": elder["name"],
                    "therapist": random.choice(self.therapists),
                    "status": status,
                    "checkin_time": checkin_time,
                    "is_compliant": is_compliant,
                    "non_compliant_reason": non_compliant_reason,
                    "data_source": data_source,
                    "notes": ""
                })
                
                activity_id += 1
            
            current_date += timedelta(days=1)
        
        logger.info(f"Generated {len(self.activities)} rehabilitation activities")

    def _generate_checkins(self) -> None:
        checkin_id = 1
        
        for activity in self.activities:
            if activity["checkin_time"]:
                delay_minutes = 0
                is_late = False
                
                if random.random() < 0.3:
                    delay_minutes = random.randint(1, 60)
                    is_late = delay_minutes > 15
                
                if random.random() < 0.05:
                    delay_minutes = random.randint(60 * 25, 60 * 72)
                    is_late = True
                
                checkin_methods = ["人脸识别", "刷卡", "指纹", "人工登记"]
                data_sources = ["护理终端", "收费系统", "健康设备"]
                
                self.checkins.append({
                    "checkin_id": f"C{str(checkin_id).zfill(6)}",
                    "activity_id": activity["activity_id"],
                    "elder_id": activity["elder_id"],
                    "elder_name": activity["elder_name"],
                    "checkin_time": activity["checkin_time"] + timedelta(minutes=delay_minutes),
                    "checkin_method": random.choice(checkin_methods),
                    "terminal_id": f"T{random.randint(1, 5):03d}",
                    "is_late": is_late,
                    "delay_minutes": delay_minutes,
                    "data_source": random.choices(data_sources, weights=[0.5, 0.3, 0.2])[0]
                })
                
                checkin_id += 1
        
        for i in range(int(len(self.activities) * 2 // 10)):
            activity = random.choice(self.activities)
            self.checkins.append({
                "checkin_id": f"C{str(checkin_id).zfill(6)}",
                "activity_id": activity["activity_id"],
                "elder_id": activity["elder_id"],
                "elder_name": activity["elder_name"],
                "checkin_time": activity["checkin_time"],
                "checkin_method": "人脸识别",
                "terminal_id": f"T{random.randint(1, 5):03d}",
                "is_late": False,
                "delay_minutes": 0,
                "data_source": "护理终端"
            })
            checkin_id += 1
        
        logger.info(f"Generated {len(self.checkins)} checkin records")

    def _generate_risk_events(self) -> None:
        today = datetime.today()
        event_id = 1
        
        for i in range(8):
            elder = random.choice(self.elders)
            
            event_days_ago = random.randint(1, 25)
            event_time = today - timedelta(days=event_days_ago)
            event_time = event_time.replace(
                hour=random.randint(6, 22),
                minute=random.randint(0, 59)
            )
            
            risk_types = ["跌倒", "压疮", "用药错误", "感染", "营养问题", "其他"]
            risk_weights = [0.4, 0.2, 0.15, 0.1, 0.1, 0.05]
            event_type = random.choices(risk_types, weights=risk_weights)[0]
            
            risk_levels = ["低风险", "中风险", "高风险", "极高风险"]
            level_weights = [0.3, 0.4, 0.2, 0.1]
            risk_level = random.choices(risk_levels, weights=level_weights)[0]
            
            locations = ["房间", "走廊", "餐厅", "活动室", "卫生间"]
            
            descriptions = {
                "跌倒": f"{elder['name']}在{random.choice(locations)}不慎跌倒，导致{random.choice(['轻微擦伤', '软组织挫伤', '骨折'])}",
                "压疮": f"{elder['name']}出现{random.choice(['一期', '二期', '三期'])}压疮",
                "用药错误": f"{elder['name']}用药剂量{random.choice(['过量', '不足', '错服'])}",
                "感染": f"{elder['name']}出现{random.choice(['呼吸道', '泌尿系统', '皮肤'])}感染",
                "营养问题": f"{elder['name']}出现{random.choice(['营养不良', '脱水', '体重下降'])}症状",
                "其他": f"{elder['name']}出现其他健康问题"
            }
            
            is_impact_trend = (event_type == "跌倒") and (risk_level in ["高风险", "极高风险"])
            
            handle_time = event_time + timedelta(hours=random.randint(1, 24))
            handle_results = [
                "已妥善处理，情况稳定",
                "送医检查后返回",
                "继续观察",
                "已联系家属"
            ]
            
            self.risk_events.append({
                "event_id": f"R{str(event_id).zfill(6)}",
                "event_type": event_type,
                "event_time": event_time,
                "elder_id": elder["elder_id"],
                "elder_name": elder["name"],
                "location": random.choice(locations),
                "risk_level": risk_level,
                "description": descriptions[event_type],
                "handler": random.choice(self.therapists),
                "handle_time": handle_time,
                "handle_result": random.choice(handle_results),
                "follow_up_required": random.random() < 0.5,
                "follow_up_notes": "" if random.random() > 0.5 else "需继续观察康复情况",
                "is_impact_trend": is_impact_trend,
                "impact_days": config.thresholds.fall_impact_days if is_impact_trend else 0
            })
            
            event_id += 1
        
        logger.info(f"Generated {len(self.risk_events)} risk events")

    def _save_to_database(self) -> None:
        elders_df = pl.DataFrame(self.elders)
        self.db.upsert_dataframe("elders", elders_df, "elder_id")
        logger.info(f"Saved {len(elders_df)} elders to database")
        
        activities_df = pl.DataFrame(self.activities)
        self.db.upsert_dataframe("rehabilitation_activities", activities_df, "activity_id")
        logger.info(f"Saved {len(activities_df)} activities to database")
        
        checkins_df = pl.DataFrame(self.checkins)
        self.db.upsert_dataframe("activity_checkins", checkins_df, "checkin_id")
        logger.info(f"Saved {len(checkins_df)} checkins to database")
        
        risk_events_df = pl.DataFrame(self.risk_events)
        self.db.upsert_dataframe("risk_events", risk_events_df, "event_id")
        logger.info(f"Saved {len(risk_events_df)} risk events to database")

    def generate_and_save(self, days: int = 30) -> None:
        self.generate_all_data(days)
        logger.info("Sample data saved successfully")
