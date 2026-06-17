import polars as pl
import random
from datetime import datetime, timedelta, date
from typing import List, Dict

from src.config import CARE_LEVELS, ACTIVITY_TYPES


class SampleDataGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        self.elder_ids = []
        self.nurse_ids = []

    def generate_elder_profiles(self, count: int = 50) -> pl.DataFrame:
        surnames = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高"]
        names = ["桂芳", "秀英", "玉兰", "桂兰", "福海", "志强", "建国", "建华", "文明", "志明", "丽华", "美丽", "秀珍", "玉英", "德顺"]
        
        diseases = ["高血压", "糖尿病", "冠心病", "关节炎", "骨质疏松", "帕金森", "阿尔茨海默", "哮喘", "慢性胃炎", "高血脂"]
        allergies = ["青霉素", "磺胺", "花粉", "海鲜", "牛奶", "花生"]
        
        profiles = []
        for i in range(1, count + 1):
            elder_id = f"E{str(i).zfill(4)}"
            self.elder_ids.append(elder_id)
            
            surname = random.choice(surnames)
            name = random.choice(names)
            gender = random.choice(["男", "女"])
            
            birth_year = random.randint(1930, 1955)
            birth_month = random.randint(1, 12)
            birth_day = random.randint(1, 28)
            birth_date = date(birth_year, birth_month, birth_day)
            
            age = datetime.now().year - birth_year
            
            care_level_weights = [0.15, 0.25, 0.25, 0.20, 0.15]
            care_level_codes = list(CARE_LEVELS.keys())
            care_level = random.choices(care_level_codes, weights=care_level_weights)[0]
            
            room_floor = random.randint(1, 5)
            room_num = random.randint(1, 20)
            room_number = f"{room_floor}{str(room_num).zfill(2)}"
            bed_number = f"{room_number}-{random.randint(1, 3)}"
            
            num_diseases = random.randint(0, 4)
            elder_diseases = random.sample(diseases, num_diseases) if num_diseases > 0 else []
            
            num_allergies = random.randint(0, 2)
            elder_allergies = random.sample(allergies, num_allergies) if num_allergies > 0 else []
            
            admission_year = random.randint(2020, 2024)
            admission_month = random.randint(1, 12)
            admission_day = random.randint(1, 28)
            admission_date = date(admission_year, admission_month, admission_day)
            
            profiles.append({
                "elder_id": elder_id,
                "name": surname + name,
                "gender": gender,
                "birth_date": birth_date,
                "age": age,
                "id_card": f"3301{random.randint(100000000000, 999999999999)}",
                "phone": f"13{random.randint(0, 9)}{random.randint(10000000, 99999999)}",
                "emergency_contact": random.choice(["儿子", "女儿", "配偶", "侄子", "侄女", "孙子", "孙女"]),
                "emergency_phone": f"13{random.randint(0, 9)}{random.randint(10000000, 99999999)}",
                "room_number": room_number,
                "bed_number": bed_number,
                "care_level": care_level,
                "care_level_name": CARE_LEVELS[care_level].name,
                "standard_daily_minutes": CARE_LEVELS[care_level].daily_care_minutes,
                "admission_date": admission_date,
                "chronic_diseases": elder_diseases,
                "allergies": elder_allergies,
                "notes": f"{'患有' + '、'.join(elder_diseases) + '，' if elder_diseases else ''}需{'、'.join(elder_allergies) + '过敏注意' if elder_allergies else '注意防跌倒'}"
            })
        
        return pl.DataFrame(profiles)

    def generate_medication_list(self, elder_ids: List[str]) -> pl.DataFrame:
        medications = [
            {"name": "硝苯地平缓释片", "dosage": "10mg", "frequency": "每日两次", "times": ["08:00", "20:00"]},
            {"name": "二甲双胍片", "dosage": "0.5g", "frequency": "每日三次", "times": ["08:00", "12:00", "18:00"]},
            {"name": "阿司匹林肠溶片", "dosage": "100mg", "frequency": "每日一次", "times": ["08:00"]},
            {"name": "阿托伐他汀钙片", "dosage": "20mg", "frequency": "每晚一次", "times": ["21:00"]},
            {"name": "美托洛尔缓释片", "dosage": "47.5mg", "frequency": "每日一次", "times": ["08:00"]},
            {"name": "奥美拉唑肠溶胶囊", "dosage": "20mg", "frequency": "每日一次", "times": ["08:00"]},
            {"name": "盐酸氨基葡萄糖胶囊", "dosage": "0.75g", "frequency": "每日两次", "times": ["08:00", "20:00"]},
            {"name": "甲钴胺片", "dosage": "0.5mg", "frequency": "每日三次", "times": ["08:00", "12:00", "18:00"]},
            {"name": "复方丹参滴丸", "dosage": "10丸", "frequency": "每日三次", "times": ["08:00", "12:00", "18:00"]},
            {"name": "钙尔奇D片", "dosage": "600mg", "frequency": "每日一次", "times": ["20:00"]},
        ]
        
        doctors = ["王医生", "李医生", "张医生", "刘医生", "陈医生"]
        
        medication_list = []
        for elder_id in elder_ids:
            num_meds = random.randint(1, 6)
            elder_meds = random.sample(medications, num_meds)
            
            for med in elder_meds:
                start_days_ago = random.randint(30, 365)
                start_date = date.today() - timedelta(days=start_days_ago)
                
                has_end = random.random() < 0.3
                end_date = None
                if has_end:
                    end_days_ago = random.randint(7, 30)
                    end_date = date.today() - timedelta(days=end_days_ago)
                
                medication_list.append({
                    "elder_id": elder_id,
                    "medication_name": med["name"],
                    "dosage": med["dosage"],
                    "frequency": med["frequency"],
                    "administration_time": med["times"],
                    "start_date": start_date,
                    "end_date": end_date,
                    "prescribing_doctor": random.choice(doctors),
                    "notes": f"用于治疗{random.choice(['高血压', '糖尿病', '冠心病', '关节炎', '骨质疏松'])}",
                    "is_active": end_date is None
                })
        
        return pl.DataFrame(medication_list)

    def generate_nursing_records(self, elder_ids: List[str], days: int = 90) -> pl.DataFrame:
        nurse_count = 15
        self.nurse_ids = [f"N{str(i).zfill(3)}" for i in range(1, nurse_count + 1)]
        nurse_names = ["李护士", "王护士", "张护士", "刘护士", "陈护士", "杨护士", "黄护士", "周护士", 
                      "吴护士", "徐护士", "孙护士", "胡护士", "朱护士", "高护士", "林护士"]
        
        activity_codes = list(ACTIVITY_TYPES.keys())
        category_weights = {
            "日常护理": 0.45,
            "康复活动": 0.25,
            "医疗护理": 0.20,
            "应急处理": 0.10
        }
        
        weighted_activities = []
        for code, act in ACTIVITY_TYPES.items():
            weight = category_weights.get(act.category, 0.1) / len(
                [a for a in ACTIVITY_TYPES.values() if a.category == act.category]
            )
            weighted_activities.extend([code] * int(weight * 1000))
        
        records = []
        end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(days=days)
        
        current_date = start_date
        record_id = 1
        
        while current_date <= end_date:
            for elder_id in elder_ids:
                elder_profile = None
                
                num_activities = random.randint(3, 8)
                
                for _ in range(num_activities):
                    activity_code = random.choice(weighted_activities)
                    activity = ACTIVITY_TYPES[activity_code]
                    
                    base_hour = random.randint(6, 21)
                    base_minute = random.randint(0, 59)
                    activity_start = current_date + timedelta(hours=base_hour, minutes=base_minute)
                    
                    duration_variance = random.uniform(0.7, 1.5)
                    duration = max(5, int(activity.standard_duration * duration_variance))
                    
                    activity_end = activity_start + timedelta(minutes=duration)
                    
                    nurse_idx = random.randint(0, nurse_count - 1)
                    nurse_id = self.nurse_ids[nurse_idx]
                    nurse_name = nurse_names[nurse_idx]
                    
                    quality_mean = 85
                    if activity.category == "应急处理":
                        quality_mean = 78
                    
                    quality_score = min(100, max(50, int(random.gauss(quality_mean, 10))))
                    
                    records.append({
                        "elder_id": elder_id,
                        "activity_code": activity_code,
                        "activity_name": activity.name,
                        "activity_category": activity.category,
                        "activity_start_time": activity_start,
                        "activity_end_time": activity_end,
                        "activity_duration": duration,
                        "activity_date": current_date.date(),
                        "nurse_id": nurse_id,
                        "nurse_name": nurse_name,
                        "quality_score": quality_score,
                        "notes": f"{activity.name}服务完成",
                        "source_file": f"nursing/{current_date.strftime('%Y%m%d')}.parquet",
                        "source_type": "nursing_terminal"
                    })
                    record_id += 1
                
                if random.random() < 0.02:
                    fall_hour = random.randint(6, 22)
                    fall_time = current_date + timedelta(hours=fall_hour, minutes=random.randint(0, 59))
                    
                    response_delay = random.randint(3, 25)
                    response_time = fall_time + timedelta(minutes=response_delay)
                    fall_duration = random.randint(20, 60)
                    
                    nurse_idx = random.randint(0, nurse_count - 1)
                    
                    records.append({
                        "elder_id": elder_id,
                        "activity_code": "fall_response",
                        "activity_name": "跌倒应急处理",
                        "activity_category": "应急处理",
                        "activity_start_time": response_time,
                        "activity_end_time": response_time + timedelta(minutes=fall_duration),
                        "activity_duration": fall_duration,
                        "activity_date": current_date.date(),
                        "nurse_id": self.nurse_ids[nurse_idx],
                        "nurse_name": nurse_names[nurse_idx],
                        "quality_score": min(100, max(40, int(random.gauss(70, 15)))),
                        "notes": f"老人在{random.choice(['房间', '走廊', '卫生间', '餐厅', '活动室'])}跌倒，已处理",
                        "source_file": f"nursing/{current_date.strftime('%Y%m%d')}.parquet",
                        "source_type": "nursing_terminal"
                    })
            
            current_date += timedelta(days=1)
        
        return pl.DataFrame(records)

    def generate_health_data(self, elder_ids: List[str], days: int = 90) -> pl.DataFrame:
        metrics = [
            ("heart_rate", "次/分", 72, 10),
            ("bp_systolic", "mmHg", 135, 15),
            ("bp_diastolic", "mmHg", 85, 8),
            ("blood_oxygen", "%", 96, 2),
            ("blood_glucose", "mmol/L", 7.5, 2),
            ("temperature", "℃", 36.5, 0.3),
            ("sleep_score", "分", 75, 10),
            ("activity_steps", "步", 1500, 800),
        ]
        
        device_types = ["智能手环", "智能床垫", "血压计", "血糖仪", "体温计"]
        
        health_data = []
        record_id = 1
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        current_date = start_date
        
        while current_date <= end_date:
            for elder_id in elder_ids:
                fall_today = False
                if random.random() < 0.02:
                    fall_today = True
                    fall_hour = random.randint(6, 22)
                
                for metric_code, metric_unit, mean, std in metrics:
                    readings_per_day = 2 if metric_code in ["heart_rate", "blood_oxygen", "sleep_score", "activity_steps"] else 1
                    
                    for reading_idx in range(readings_per_day):
                        hour = random.randint(6, 22)
                        minute = random.randint(0, 59)
                        record_time = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        
                        if metric_code == "bp_systolic":
                            value = max(90, min(200, random.gauss(mean, std)))
                        elif metric_code == "bp_diastolic":
                            value = max(50, min(120, random.gauss(mean, std)))
                        elif metric_code == "blood_oxygen":
                            value = max(85, min(100, random.gauss(mean, std)))
                        elif metric_code == "temperature":
                            value = max(35, min(39, random.gauss(mean, std)))
                        elif metric_code == "activity_steps":
                            value = max(0, random.gauss(mean, std))
                        elif metric_code == "sleep_score":
                            value = max(30, min(100, random.gauss(mean, std)))
                        elif metric_code == "blood_glucose":
                            value = max(3.9, min(15, random.gauss(mean, std)))
                        else:
                            value = max(40, min(180, random.gauss(mean, std)))
                        
                        is_alert = False
                        if metric_code == "heart_rate" and (value < 50 or value > 100):
                            is_alert = True
                        elif metric_code == "bp_systolic" and value > 160:
                            is_alert = True
                        elif metric_code == "blood_oxygen" and value < 92:
                            is_alert = True
                        elif metric_code == "temperature" and value > 37.5:
                            is_alert = True
                        
                        health_data.append({
                            "elder_id": elder_id,
                            "record_time": record_time,
                            "record_date": current_date.date(),
                            "device_type": random.choice(device_types),
                            "device_id": f"DEV{random.randint(100, 999)}",
                            "metric_type": metric_code,
                            "metric_value": round(value, 1),
                            "metric_unit": metric_unit,
                            "is_alert": is_alert,
                            "is_fall_alert": False,
                            "alert_threshold": None,
                            "source_file": f"health/{current_date.strftime('%Y%m%d')}.parquet"
                        })
                        record_id += 1
                
                if fall_today:
                    fall_time = current_date.replace(hour=fall_hour, minute=random.randint(0, 59))
                    health_data.append({
                        "elder_id": elder_id,
                        "record_time": fall_time,
                        "record_date": current_date.date(),
                        "device_type": "智能手环",
                        "device_id": f"DEV{random.randint(100, 999)}",
                        "metric_type": "fall_detected",
                        "metric_value": 1,
                        "metric_unit": "次",
                        "is_alert": True,
                        "is_fall_alert": True,
                        "alert_threshold": 1,
                        "source_file": f"health/{current_date.strftime('%Y%m%d')}.parquet"
                    })
                    record_id += 1
            
            current_date += timedelta(days=1)
        
        return pl.DataFrame(health_data)

    def generate_access_records(self, elder_ids: List[str], days: int = 90) -> pl.DataFrame:
        person_types = ["elder", "staff", "visitor"]
        directions = ["in", "out"]
        locations = [
            ("大厅入口", "LOC001"),
            ("东翼楼道", "LOC002"),
            ("西翼楼道", "LOC003"),
            ("餐厅入口", "LOC004"),
            ("活动室入口", "LOC005"),
            ("康复中心", "LOC006"),
            ("医护站", "LOC007"),
        ]
        
        staff_ids = [f"N{str(i).zfill(3)}" for i in range(1, 16)]
        staff_names = ["李护士", "王护士", "张护士", "刘护士", "陈护士", "杨护士", "黄护士", "周护士", 
                      "吴护士", "徐护士", "孙护士", "胡护士", "朱护士", "高护士", "林护士"]
        
        elder_names = []
        
        access_records = []
        record_id = 1
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        current_date = start_date
        
        while current_date <= end_date:
            for hour in range(6, 23):
                num_entries = random.randint(5, 20)
                
                for _ in range(num_entries):
                    person_type = random.choices(person_types, weights=[0.5, 0.35, 0.15])[0]
                    
                    if person_type == "elder":
                        person_id = random.choice(elder_ids)
                        person_name = f"老人-{person_id}"
                    elif person_type == "staff":
                        idx = random.randint(0, len(staff_ids) - 1)
                        person_id = staff_ids[idx]
                        person_name = staff_names[idx]
                    else:
                        person_id = f"V{random.randint(1000, 9999)}"
                        person_name = f"访客-{person_id}"
                    
                    location_name, device_id = random.choice(locations)
                    
                    record_time = current_date.replace(
                        hour=hour, 
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59),
                        microsecond=0
                    )
                    
                    access_records.append({
                        "person_id": person_id,
                        "person_type": person_type,
                        "person_name": person_name,
                        "timestamp": record_time,
                        "access_date": current_date.date(),
                        "device_id": device_id,
                        "device_location": location_name,
                        "direction": random.choice(directions),
                        "access_granted": True,
                        "source_file": f"access/{current_date.strftime('%Y%m%d')}.parquet"
                    })
                    record_id += 1
            
            current_date += timedelta(days=1)
        
        return pl.DataFrame(access_records)

    def generate_all_data(self, elder_count: int = 50, days: int = 90) -> Dict[str, pl.DataFrame]:
        elders = self.generate_elder_profiles(elder_count)
        medications = self.generate_medication_list(self.elder_ids)
        nursing = self.generate_nursing_records(self.elder_ids, days)
        health = self.generate_health_data(self.elder_ids, days)
        access = self.generate_access_records(self.elder_ids, days)
        
        return {
            "elder_profiles": elders,
            "medication_list": medications,
            "nursing_records": nursing,
            "health_data": health,
            "access_records": access
        }
