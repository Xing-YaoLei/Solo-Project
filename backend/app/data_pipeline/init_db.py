import duckdb
import os
import sys
from datetime import datetime, timedelta
import random
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from app.db.database import DB_PATH

RESIDENT_NAMES = [
    "张桂芳", "李建国", "王秀兰", "刘德海", "陈秀英",
    "杨振华", "赵淑琴", "黄志明", "周美华", "吴天福",
    "徐丽娟", "孙长兴", "马春花", "朱伟民", "胡金凤",
    "郭树林", "何玉珍", "高志远", "林雅琴", "罗明辉"
]

CARE_LEVELS = ["自理", "半自理", "全护理", "特护"]
DISEASES = ["高血压", "糖尿病", "冠心病", "阿尔茨海默症", "骨质疏松", "脑梗塞后遗症", "慢性支气管炎"]
AREAS = ["A区一楼", "A区二楼", "B区一楼", "B区二楼", "C区三楼"]
ACTIVITY_TYPES = ["晨练", "手工活动", "书法绘画", "音乐欣赏", "康复训练", "棋牌娱乐", "观影活动"]
RISK_TYPES = [
    ("fall", "跌倒", "high"),
    ("pressure_ulcer", "压疮", "medium"),
    ("wandering", "走失", "high"),
    ("medication_error", "用药失误", "medium"),
    ("other", "其他", "low")
]
CARE_TYPES = ["晨间护理", "午间护理", "晚间护理", "翻身拍背", "康复训练", "用药护理", "生命体征测量"]
CAREGIVERS = ["王护士", "李护理员", "张护理员", "陈护工", "刘护理员", "赵护士"]


def init_database():
    conn = duckdb.connect(DB_PATH)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS beds (
            id VARCHAR PRIMARY KEY,
            bed_no VARCHAR UNIQUE NOT NULL,
            area VARCHAR NOT NULL,
            floor VARCHAR NOT NULL,
            status VARCHAR DEFAULT 'available'
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS residents (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            age INTEGER NOT NULL,
            gender VARCHAR NOT NULL,
            care_level VARCHAR NOT NULL,
            admission_date DATE NOT NULL,
            primary_disease VARCHAR,
            bed_id VARCHAR REFERENCES beds(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS care_records (
            id VARCHAR PRIMARY KEY,
            resident_id VARCHAR NOT NULL,
            care_time TIMESTAMP NOT NULL,
            care_type VARCHAR NOT NULL,
            is_completed BOOLEAN DEFAULT true,
            caregiver VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            type VARCHAR NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            location VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activity_signins (
            id VARCHAR PRIMARY KEY,
            activity_id VARCHAR NOT NULL,
            resident_id VARCHAR NOT NULL,
            signin_time TIMESTAMP NOT NULL,
            signin_type VARCHAR DEFAULT 'manual',
            UNIQUE(activity_id, resident_id)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS risk_events (
            id VARCHAR PRIMARY KEY,
            type VARCHAR NOT NULL,
            level VARCHAR NOT NULL,
            resident_id VARCHAR NOT NULL,
            occur_time TIMESTAMP NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS risk_remarks (
            id VARCHAR PRIMARY KEY,
            risk_event_id VARCHAR NOT NULL,
            content TEXT NOT NULL,
            user_name VARCHAR NOT NULL,
            remark_type VARCHAR DEFAULT 'initial',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS review_materials (
            id VARCHAR PRIMARY KEY,
            risk_event_id VARCHAR NOT NULL,
            care_comparison TEXT,
            improvement_measures TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS threshold_configs (
            id VARCHAR PRIMARY KEY,
            metric_key VARCHAR UNIQUE NOT NULL,
            metric_name VARCHAR NOT NULL,
            warning_threshold FLOAT NOT NULL,
            critical_threshold FLOAT NOT NULL,
            unit VARCHAR DEFAULT '%',
            updated_by VARCHAR,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS threshold_change_logs (
            id VARCHAR PRIMARY KEY,
            threshold_id VARCHAR NOT NULL,
            old_warning FLOAT NOT NULL,
            new_warning FLOAT NOT NULL,
            old_critical FLOAT NOT NULL,
            new_critical FLOAT NOT NULL,
            changed_by VARCHAR NOT NULL,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    print("数据库表创建完成")
    return conn


def seed_beds(conn):
    bed_count = conn.execute("SELECT COUNT(*) FROM beds").fetchone()[0]
    if bed_count > 0:
        print("床位数据已存在，跳过")
        return
    
    beds = []
    bed_id = 1
    for area in AREAS:
        floor = area[-2:]
        for i in range(1, 9):
            bed_no = f"{area[0]}{floor.replace('楼','')}{i:02d}"
            beds.append({
                "id": str(uuid.uuid4()),
                "bed_no": bed_no,
                "area": area,
                "floor": floor,
                "status": "occupied" if i <= 6 else "available"
            })
    
    for bed in beds:
        conn.execute("""
            INSERT INTO beds (id, bed_no, area, floor, status)
            VALUES (?, ?, ?, ?, ?)
        """, [bed["id"], bed["bed_no"], bed["area"], bed["floor"], bed["status"]])
    
    print(f"已插入 {len(beds)} 条床位数据")


def seed_residents(conn):
    resident_count = conn.execute("SELECT COUNT(*) FROM residents").fetchone()[0]
    if resident_count > 0:
        print("老人数据已存在，跳过")
        return
    
    beds = conn.execute("SELECT id, bed_no FROM beds WHERE status = 'occupied'").fetchall()
    
    residents = []
    base_date = datetime.now() - timedelta(days=365)
    
    for i, name in enumerate(RESIDENT_NAMES):
        age = random.randint(65, 92)
        gender = random.choice(["男", "女"])
        care_level = random.choices(CARE_LEVELS, weights=[0.3, 0.35, 0.25, 0.1])[0]
        disease = random.choice(DISEASES)
        days_ago = random.randint(10, 300)
        admission_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        bed = beds[i % len(beds)]
        
        residents.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "age": age,
            "gender": gender,
            "care_level": care_level,
            "admission_date": admission_date,
            "primary_disease": disease,
            "bed_id": bed[0]
        })
    
    for r in residents:
        conn.execute("""
            INSERT INTO residents (id, name, age, gender, care_level, admission_date, primary_disease, bed_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [r["id"], r["name"], r["age"], r["gender"], r["care_level"], 
              r["admission_date"], r["primary_disease"], r["bed_id"]])
    
    print(f"已插入 {len(residents)} 条老人数据")


def seed_care_records(conn):
    care_count = conn.execute("SELECT COUNT(*) FROM care_records").fetchone()[0]
    if care_count > 0:
        print("护理记录已存在，跳过")
        return
    
    residents = conn.execute("SELECT id FROM residents").fetchall()
    today = datetime.now()
    
    care_records = []
    
    for day in range(60):
        record_date = today - timedelta(days=day)
        
        for resident in residents:
            resident_id = resident[0]
            
            num_cares = random.randint(3, 5)
            care_types_today = random.sample(CARE_TYPES, num_cares)
            
            for j, care_type in enumerate(care_types_today):
                hour = 6 + j * 4
                if hour > 22:
                    hour = 20
                care_time = record_date.replace(hour=hour, minute=random.randint(0, 30))
                
                is_completed = random.random() > 0.1
                
                caregiver = random.choice(CAREGIVERS)
                
                care_records.append({
                    "id": str(uuid.uuid4()),
                    "resident_id": resident_id,
                    "care_time": care_time,
                    "care_type": care_type,
                    "is_completed": is_completed,
                    "caregiver": caregiver
                })
    
    for record in care_records:
        conn.execute("""
            INSERT INTO care_records (id, resident_id, care_time, care_type, is_completed, caregiver)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [record["id"], record["resident_id"], record["care_time"], 
              record["care_type"], record["is_completed"], record["caregiver"]])
    
    print(f"已插入 {len(care_records)} 条护理记录")


def seed_activities(conn):
    activity_count = conn.execute("SELECT COUNT(*) FROM activities").fetchone()[0]
    if activity_count > 0:
        print("活动数据已存在，跳过")
        return
    
    today = datetime.now()
    activities = []
    
    for day in range(60):
        record_date = today - timedelta(days=day)
        
        num_activities = random.randint(2, 4)
        types_today = random.sample(ACTIVITY_TYPES, num_activities)
        
        for i, activity_type in enumerate(types_today):
            start_hour = 8 + i * 3
            if start_hour > 20:
                start_hour = 15
            start_time = record_date.replace(hour=start_hour, minute=0)
            end_time = start_time + timedelta(hours=1)
            
            locations = ["活动室", "康复室", "多功能厅", "户外花园"]
            location = random.choice(locations)
            
            activities.append({
                "id": str(uuid.uuid4()),
                "name": f"{activity_type}活动",
                "type": activity_type,
                "start_time": start_time,
                "end_time": end_time,
                "location": location
            })
    
    for act in activities:
        conn.execute("""
            INSERT INTO activities (id, name, type, start_time, end_time, location)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [act["id"], act["name"], act["type"], act["start_time"], 
              act["end_time"], act["location"]])
    
    print(f"已插入 {len(activities)} 条活动数据")
    return activities


def seed_activity_signins(conn):
    signin_count = conn.execute("SELECT COUNT(*) FROM activity_signins").fetchone()[0]
    if signin_count > 0:
        print("签到数据已存在，跳过")
        return
    
    activities = conn.execute("SELECT id FROM activities").fetchall()
    residents = conn.execute("SELECT id FROM residents").fetchall()
    
    signins = []
    
    for activity in activities:
        activity_id = activity[0]
        
        participant_rate = random.uniform(0.5, 0.9)
        num_participants = int(len(residents) * participant_rate)
        participants = random.sample(residents, num_participants)
        
        for resident in participants:
            resident_id = resident[0]
            
            act = conn.execute("SELECT start_time FROM activities WHERE id = ?", [activity_id]).fetchone()
            if not act:
                continue
            start_time = act[0]
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time)
            signin_time = start_time + timedelta(minutes=random.randint(-10, 30))
            
            signin_types = ["manual", "face", "card"]
            signin_type = random.choice(signin_types)
            
            signins.append({
                "id": str(uuid.uuid4()),
                "activity_id": activity_id,
                "resident_id": resident_id,
                "signin_time": signin_time,
                "signin_type": signin_type
            })
    
    for s in signins:
        try:
            conn.execute("""
                INSERT INTO activity_signins (id, activity_id, resident_id, signin_time, signin_type)
                VALUES (?, ?, ?, ?, ?)
            """, [s["id"], s["activity_id"], s["resident_id"], 
                  s["signin_time"], s["signin_type"]])
        except Exception:
            pass
    
    print(f"已插入 {len(signins)} 条活动签到数据")


def seed_risk_events(conn):
    risk_count = conn.execute("SELECT COUNT(*) FROM risk_events").fetchone()[0]
    if risk_count > 0:
        print("风险事件数据已存在，跳过")
        return
    
    residents = conn.execute("SELECT id FROM residents").fetchall()
    today = datetime.now()
    
    risk_events = []
    remarks = []
    
    for day in range(60):
        record_date = today - timedelta(days=day)
        
        if random.random() > 0.3:
            continue
        
        num_events = random.randint(1, 3)
        
        for _ in range(num_events):
            risk_type_info = random.choice(RISK_TYPES)
            risk_type, type_name, level = risk_type_info
            
            resident = random.choice(residents)[0]
            
            hour = random.randint(6, 22)
            occur_time = record_date.replace(hour=hour, minute=random.randint(0, 59))
            
            descriptions = {
                "fall": "老人在卫生间滑倒，左侧手臂擦伤，已及时处理",
                "pressure_ulcer": "骶尾部出现一期压疮，已加强翻身护理",
                "wandering": "老人试图走出院区大门，被门卫及时拦回",
                "medication_error": "降压药漏服一次，已补服并监测血压",
                "other": "情绪波动较大，与其他老人发生口角"
            }
            description = descriptions.get(risk_type, "一般风险事件")
            
            event_id = str(uuid.uuid4())
            risk_events.append({
                "id": event_id,
                "type": risk_type,
                "level": level,
                "resident_id": resident,
                "occur_time": occur_time,
                "description": description
            })
            
            if random.random() > 0.4:
                remark_contents = [
                    "当时判断为环境因素导致，已调整卫生间防滑垫",
                    "护理排班较紧，建议增加夜班人员",
                    "家属已通知，表示理解",
                    "已加强该老人的巡视频率",
                    "后续将重点关注此类风险"
                ]
                remark_content = random.choice(remark_contents)
                remark_time = occur_time + timedelta(hours=random.randint(1, 24))
                
                remarks.append({
                    "id": str(uuid.uuid4()),
                    "risk_event_id": event_id,
                    "content": remark_content,
                    "user_name": random.choice(["张主管", "李护士长", "王主任"]),
                    "remark_type": random.choice(["initial", "review", "improvement"]),
                    "created_at": remark_time
                })
    
    for event in risk_events:
        conn.execute("""
            INSERT INTO risk_events (id, type, level, resident_id, occur_time, description)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [event["id"], event["type"], event["level"], event["resident_id"],
              event["occur_time"], event["description"]])
    
    for remark in remarks:
        conn.execute("""
            INSERT INTO risk_remarks (id, risk_event_id, content, user_name, remark_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [remark["id"], remark["risk_event_id"], remark["content"],
              remark["user_name"], remark["remark_type"], remark["created_at"]])
    
    print(f"已插入 {len(risk_events)} 条风险事件，{len(remarks)} 条备注")


def seed_thresholds(conn):
    threshold_count = conn.execute("SELECT COUNT(*) FROM threshold_configs").fetchone()[0]
    if threshold_count > 0:
        print("阈值配置已存在，跳过")
        return
    
    thresholds = [
        {
            "id": str(uuid.uuid4()),
            "metric_key": "care_compliance_rate",
            "metric_name": "护理达标率",
            "warning_threshold": 90,
            "critical_threshold": 80,
            "unit": "%",
            "updated_by": "系统初始化"
        },
        {
            "id": str(uuid.uuid4()),
            "metric_key": "activity_participation_rate",
            "metric_name": "活动参与率",
            "warning_threshold": 60,
            "critical_threshold": 40,
            "unit": "%",
            "updated_by": "系统初始化"
        },
        {
            "id": str(uuid.uuid4()),
            "metric_key": "bed_occupancy_rate",
            "metric_name": "床位利用率",
            "warning_threshold": 70,
            "critical_threshold": 50,
            "unit": "%",
            "updated_by": "系统初始化"
        },
        {
            "id": str(uuid.uuid4()),
            "metric_key": "risk_event_count",
            "metric_name": "周风险事件数",
            "warning_threshold": 10,
            "critical_threshold": 20,
            "unit": "起",
            "updated_by": "系统初始化"
        },
        {
            "id": str(uuid.uuid4()),
            "metric_key": "fall_event_count",
            "metric_name": "月跌倒事件数",
            "warning_threshold": 3,
            "critical_threshold": 6,
            "unit": "起",
            "updated_by": "系统初始化"
        }
    ]
    
    for t in thresholds:
        conn.execute("""
            INSERT INTO threshold_configs (id, metric_key, metric_name, warning_threshold, critical_threshold, unit, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [t["id"], t["metric_key"], t["metric_name"], t["warning_threshold"],
              t["critical_threshold"], t["unit"], t["updated_by"]])
    
    print(f"已插入 {len(thresholds)} 条阈值配置")


def seed_all():
    conn = init_database()
    
    seed_beds(conn)
    seed_residents(conn)
    seed_care_records(conn)
    seed_activities(conn)
    seed_activity_signins(conn)
    seed_risk_events(conn)
    seed_thresholds(conn)
    
    conn.commit()
    conn.close()
    print("所有数据初始化完成！")


if __name__ == "__main__":
    seed_all()
