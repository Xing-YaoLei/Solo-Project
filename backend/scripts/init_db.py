from datetime import date, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.elder import Elder
from app.models.medication import Medication
from app.models.visit import VisitRecord
from app.models.activity import Activity, ActivitySignIn
from app.models.risk import RiskEvent
from app.models.incident import IncidentOrder
from app.core.auth import get_password_hash


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                full_name="系统管理员",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
            )
            db.add(admin)

            nurse = User(
                username="nurse",
                full_name="李护士",
                email="nurse@example.com",
                hashed_password=get_password_hash("nurse123"),
                role="nurse",
                is_active=True,
            )
            db.add(nurse)
            db.commit()
            db.refresh(admin)
            db.refresh(nurse)
            print("✅ 创建测试用户成功")
            print("   管理员: admin / admin123")
            print("   护士: nurse / nurse123")

        if db.query(Elder).count() == 0:
            elders_data = [
                {
                    "name": "张奶奶",
                    "gender": "女",
                    "birth_date": date(1935, 3, 15),
                    "id_card": "110101193503150001",
                    "phone": "13800138001",
                    "emergency_contact": "张小明",
                    "emergency_phone": "13900139001",
                    "address": "北京市朝阳区",
                    "health_status": "stable",
                    "care_level": "intermediate",
                    "room_number": "201",
                    "bed_number": "A",
                    "admission_date": date(2023, 1, 15),
                    "medical_history": "高血压、糖尿病",
                    "allergies": "青霉素过敏",
                    "dietary_restrictions": "低盐低糖饮食",
                    "mobility_level": "assisted",
                    "cognitive_level": "mild_impairment",
                    "status": "active",
                    "created_by": admin.id,
                },
                {
                    "name": "王爷爷",
                    "gender": "男",
                    "birth_date": date(1932, 7, 20),
                    "id_card": "110101193207200002",
                    "phone": "13800138002",
                    "emergency_contact": "王芳",
                    "emergency_phone": "13900139002",
                    "address": "北京市海淀区",
                    "health_status": "monitoring",
                    "care_level": "advanced",
                    "room_number": "202",
                    "bed_number": "B",
                    "admission_date": date(2023, 3, 10),
                    "medical_history": "冠心病、关节炎",
                    "allergies": "无",
                    "dietary_restrictions": "低脂饮食",
                    "mobility_level": "wheelchair",
                    "cognitive_level": "normal",
                    "status": "active",
                    "created_by": admin.id,
                },
                {
                    "name": "李奶奶",
                    "gender": "女",
                    "birth_date": date(1940, 11, 5),
                    "id_card": "110101194011050003",
                    "phone": "13800138003",
                    "emergency_contact": "李伟",
                    "emergency_phone": "13900139003",
                    "address": "北京市西城区",
                    "health_status": "stable",
                    "care_level": "basic",
                    "room_number": "301",
                    "bed_number": "A",
                    "admission_date": date(2023, 6, 1),
                    "medical_history": "无重大疾病",
                    "allergies": "海鲜过敏",
                    "dietary_restrictions": "无特殊要求",
                    "mobility_level": "independent",
                    "cognitive_level": "normal",
                    "status": "active",
                    "created_by": admin.id,
                },
            ]

            for elder_data in elders_data:
                elder = Elder(**elder_data)
                db.add(elder)
            db.commit()
            print("✅ 创建测试老人档案成功 (3位老人)")

            elders = db.query(Elder).all()

            medications_data = [
                {
                    "elder_id": elders[0].id,
                    "drug_name": "硝苯地平缓释片",
                    "generic_name": "Nifedipine",
                    "dosage": "30mg",
                    "frequency": "qd",
                    "route": "口服",
                    "start_date": date(2023, 1, 15),
                    "prescribing_doctor": "张医生",
                    "purpose": "降压",
                    "status": "active",
                },
                {
                    "elder_id": elders[0].id,
                    "drug_name": "二甲双胍",
                    "generic_name": "Metformin",
                    "dosage": "500mg",
                    "frequency": "bid",
                    "route": "口服",
                    "start_date": date(2023, 1, 20),
                    "prescribing_doctor": "张医生",
                    "purpose": "降糖",
                    "status": "active",
                },
                {
                    "elder_id": elders[1].id,
                    "drug_name": "阿司匹林肠溶片",
                    "generic_name": "Aspirin",
                    "dosage": "100mg",
                    "frequency": "qd",
                    "route": "口服",
                    "start_date": date(2023, 3, 15),
                    "prescribing_doctor": "李医生",
                    "purpose": "抗血小板聚集",
                    "status": "active",
                },
            ]

            for med_data in medications_data:
                med = Medication(**med_data)
                db.add(med)
            db.commit()
            print("✅ 创建测试用药记录成功")

            visits_data = [
                {
                    "elder_id": elders[0].id,
                    "visitor_id": nurse.id,
                    "visit_date": date.today() - timedelta(days=1),
                    "visit_time": "10:00:00",
                    "visit_duration": 45,
                    "visit_type": "routine",
                    "visitor_name": "张小明",
                    "visitor_relation": "儿子",
                    "physical_condition": "良好",
                    "mental_condition": "愉快",
                    "conversation_content": "聊了家常，精神不错",
                    "elder_mood": "happy",
                    "status": "completed",
                },
                {
                    "elder_id": elders[1].id,
                    "visitor_id": nurse.id,
                    "visit_date": date.today() - timedelta(days=2),
                    "visit_time": "14:30:00",
                    "visit_duration": 60,
                    "visit_type": "family",
                    "visitor_name": "王芳",
                    "visitor_relation": "女儿",
                    "physical_condition": "一般",
                    "mental_condition": "一般",
                    "conversation_content": "女儿来看望，带了水果",
                    "elder_mood": "calm",
                    "status": "completed",
                },
            ]

            for visit_data in visits_data:
                visit = VisitRecord(**visit_data)
                db.add(visit)
            db.commit()
            print("✅ 创建测试探访记录成功")

            activities_data = [
                {
                    "name": "晨间保健操",
                    "activity_type": "exercise",
                    "description": "每天早晨的康复保健操",
                    "location": "活动室",
                    "activity_date": date.today(),
                    "start_time": "08:00:00",
                    "end_time": "08:40:00",
                    "max_participants": 20,
                    "instructor": "李护士",
                    "risk_level": "low",
                    "status": "scheduled",
                    "created_by": admin.id,
                },
                {
                    "name": "书法兴趣班",
                    "activity_type": "entertainment",
                    "description": "每周三下午的书法活动",
                    "location": "文娱室",
                    "activity_date": date.today() + timedelta(days=1),
                    "start_time": "14:00:00",
                    "end_time": "16:00:00",
                    "max_participants": 15,
                    "instructor": "王老师",
                    "risk_level": "low",
                    "status": "scheduled",
                    "created_by": admin.id,
                },
                {
                    "name": "康复训练（上肢）",
                    "activity_type": "rehabilitation",
                    "description": "上肢力量康复训练",
                    "location": "康复室",
                    "activity_date": date.today(),
                    "start_time": "09:30:00",
                    "end_time": "10:30:00",
                    "max_participants": 8,
                    "instructor": "康复师刘",
                    "risk_level": "medium",
                    "status": "in_progress",
                    "created_by": admin.id,
                },
            ]

            for act_data in activities_data:
                activity = Activity(**act_data)
                db.add(activity)
            db.commit()
            print("✅ 创建测试活动成功")

        print("\n🎉 数据库初始化完成！")

    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
