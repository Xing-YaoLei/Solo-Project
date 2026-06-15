import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import polars as pl
import numpy as np
from config import app_config
from src.storage.duckdb_client import DuckDBClient

class MockDataGenerator:
    def __init__(self, db_client: DuckDBClient):
        self.db = db_client
        self.regions = app_config.regions
        self.courses = [
            ("C001", "Python数据分析实战"),
            ("C002", "Java后端开发"),
            ("C003", "前端开发工程师"),
            ("C004", "UI/UX设计"),
            ("C005", "人工智能入门"),
            ("C006", "大数据开发"),
            ("C007", "云计算运维"),
            ("C008", "软件测试工程师")
        ]
        self.student_names = [
            "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
            "郑十一", "王十二", "冯十三", "陈十四", "褚十五", "卫十六",
            "蒋十七", "沈十八", "韩十九", "杨二十", "朱二十一", "秦二十二",
            "尤二十三", "许二十四", "何二十五", "吕二十六", "施二十七",
            "张二十八", "孔二十九", "曹三十", "严三十一", "华三十二"
        ]
        self.companies = [
            "阿里巴巴", "腾讯科技", "字节跳动", "百度", "华为",
            "美团", "京东", "网易", "小米", "滴滴出行",
            "快手", "哔哩哔哩", "拼多多", "携程", "360"
        ]
        self.positions = [
            "数据分析师", "后端开发工程师", "前端开发工程师",
            "UI设计师", "算法工程师", "大数据工程师",
            "运维工程师", "测试工程师", "产品经理"
        ]

    def _generate_students(self, count: int = 100) -> List[Dict[str, Any]]:
        students = []
        for i in range(count):
            students.append({
                "student_id": f"STU{i+1:05d}",
                "student_name": random.choice(self.student_names),
                "region": random.choice(self.regions)
            })
        return students

    def _get_next_id(self, table_name: str, id_column: str, prefix: str) -> int:
        try:
            result = self.db.query_to_polars(f"SELECT MAX({id_column}) as max_id FROM {table_name}")
            max_id = result['max_id'][0]
            if max_id:
                id_str = str(max_id)
                if prefix == "SAMP_":
                    parts = id_str.split("_")
                    if len(parts) >= 3:
                        return int(parts[-1]) + 1
                else:
                    num_part = int(id_str.replace(prefix, ""))
                    return num_part + 1
        except Exception:
            pass
        return 1

    def generate_employment_records(self, start_date: datetime, end_date: datetime, count: int = 200) -> pl.DataFrame:
        students = self._generate_students(100)
        records = []
        next_id = self._get_next_id("employment_records", "record_id", "EMP")
        
        for i in range(count):
            student = random.choice(students)
            course = random.choice(self.courses)
            days_between = (end_date - start_date).days
            emp_date = start_date + timedelta(days=random.randint(0, days_between))
            
            records.append({
                "record_id": f"EMP{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "course_id": course[0],
                "course_name": course[1],
                "employment_date": emp_date,
                "company_name": random.choice(self.companies),
                "position": random.choice(self.positions),
                "salary": round(random.uniform(6000, 25000), 2),
                "region": student["region"],
                "is_placed": random.random() > 0.15,
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("employment_records", df)
        return df

    def generate_live_platform_logs(self, start_date: datetime, end_date: datetime, count: int = 500) -> pl.DataFrame:
        students = self._generate_students(100)
        rooms = [
            ("R001", "Python数据分析直播课"),
            ("R002", "Java面试技巧分享"),
            ("R003", "前端性能优化实战"),
            ("R004", "AI算法精讲"),
            ("R005", "大数据架构设计"),
            ("R006", "云原生技术分享")
        ]
        records = []
        next_id = self._get_next_id("live_platform_logs", "log_id", "LIVE")
        
        for i in range(count):
            student = random.choice(students)
            room = random.choice(rooms)
            days_between = (end_date - start_date).days
            base_time = start_date + timedelta(days=random.randint(0, days_between),
                                               hours=random.randint(9, 21))
            watch_duration = random.randint(300, 3600)
            
            records.append({
                "log_id": f"LIVE{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "room_id": room[0],
                "room_title": room[1],
                "join_time": base_time,
                "leave_time": base_time + timedelta(seconds=watch_duration),
                "watch_duration": watch_duration,
                "interaction_count": random.randint(0, 50),
                "region": student["region"],
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("live_platform_logs", df)
        return df

    def generate_question_bank_records(self, start_date: datetime, end_date: datetime, count: int = 1000) -> pl.DataFrame:
        students = self._generate_students(100)
        exams = [
            ("E001", "Python基础测试", 100),
            ("E002", "Java核心技术", 100),
            ("E003", "前端开发笔试", 100),
            ("E004", "算法与数据结构", 100),
            ("E005", "数据库原理", 100),
            ("E006", "系统设计面试", 100)
        ]
        records = []
        next_id = self._get_next_id("question_bank_records", "attempt_id", "ATT")
        
        for i in range(count):
            student = random.choice(students)
            exam = random.choice(exams)
            days_between = (end_date - start_date).days
            attempt_time = start_date + timedelta(days=random.randint(0, days_between),
                                                   hours=random.randint(8, 22))
            
            is_correct = random.random() > 0.35
            score = random.uniform(60, 100) if is_correct else random.uniform(0, 59)
            plagiarism_score = random.uniform(0, 0.95)
            is_plagiarized = plagiarism_score > 0.8
            
            records.append({
                "attempt_id": f"ATT{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "question_id": f"Q{random.randint(1, 500):04d}",
                "exam_id": exam[0],
                "exam_name": exam[1],
                "is_correct": is_correct,
                "score": round(score, 2),
                "total_score": exam[2],
                "attempt_time": attempt_time,
                "plagiarism_score": round(plagiarism_score, 4),
                "is_plagiarized": is_plagiarized,
                "region": student["region"],
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("question_bank_records", df)
        return df

    def generate_account_transactions(self, start_date: datetime, end_date: datetime, count: int = 300) -> pl.DataFrame:
        students = self._generate_students(100)
        transaction_types = ["purchase", "refund", "top_up", "redeem", "bonus"]
        records = []
        next_id = self._get_next_id("account_transactions", "transaction_id", "TX")
        balances = {s["student_id"]: random.uniform(0, 5000) for s in students}
        
        for i in range(count):
            student = random.choice(students)
            tx_type = random.choice(transaction_types)
            days_between = (end_date - start_date).days
            tx_time = start_date + timedelta(days=random.randint(0, days_between),
                                             hours=random.randint(0, 23))
            
            if tx_type == "purchase":
                amount = -random.uniform(100, 5000)
            elif tx_type == "refund":
                amount = random.uniform(100, 5000)
            elif tx_type == "top_up":
                amount = random.uniform(100, 10000)
            elif tx_type == "redeem":
                amount = -random.uniform(50, 500)
            else:
                amount = random.uniform(10, 500)
            
            balances[student["student_id"]] += amount
            
            records.append({
                "transaction_id": f"TX{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "transaction_type": tx_type,
                "amount": round(amount, 2),
                "balance_after": round(balances[student["student_id"]], 2),
                "transaction_time": tx_time,
                "region": student["region"],
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("account_transactions", df)
        return df

    def generate_level_changes(self, start_date: datetime, end_date: datetime, count: int = 150) -> pl.DataFrame:
        students = self._generate_students(80)
        change_reasons = [
            "学习进度达标", "考核通过", "连续打卡30天",
            "考试成绩优秀", "完成项目实战", "活跃度下降",
            "长期未登录", "多次考核未通过", "违规操作"
        ]
        records = []
        next_id = self._get_next_id("level_changes", "change_id", "LVL")
        
        for i in range(count):
            student = random.choice(students)
            days_between = (end_date - start_date).days
            change_time = start_date + timedelta(days=random.randint(0, days_between),
                                                 hours=random.randint(0, 23))
            
            old_level = random.randint(1, 10)
            direction = 1 if random.random() > 0.25 else -1
            new_level = max(1, min(10, old_level + direction))
            
            has_gap = random.random() < 0.15
            gap_days = random.randint(31, 90) if has_gap else None
            
            records.append({
                "change_id": f"LVL{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "old_level": old_level,
                "new_level": new_level,
                "change_reason": random.choice(change_reasons),
                "change_time": change_time,
                "region": student["region"],
                "has_data_gap": has_gap,
                "gap_days": gap_days,
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("level_changes", df)
        return df

    def generate_redemption_records(self, start_date: datetime, end_date: datetime, count: int = 100) -> pl.DataFrame:
        students = self._generate_students(60)
        courses = self.courses
        records = []
        next_id = self._get_next_id("redemption_records", "redemption_id", "RED")
        
        for i in range(count):
            student = random.choice(students)
            course = random.choice(courses)
            days_between = (end_date - start_date).days
            redeem_time = start_date + timedelta(days=random.randint(0, days_between),
                                                 hours=random.randint(0, 23))
            
            records.append({
                "redemption_id": f"RED{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "course_id": course[0],
                "course_name": course[1],
                "redemption_time": redeem_time,
                "points_used": random.randint(100, 5000),
                "status": random.choice(["completed", "pending", "failed"]),
                "region": student["region"],
                "detail_link": f"/details/redemption/RED{i+1:08d}" if random.random() > 0.2 else None,
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("redemption_records", df)
        return df

    def generate_refund_records(self, start_date: datetime, end_date: datetime, count: int = 80) -> pl.DataFrame:
        students = self._generate_students(50)
        courses = self.courses
        refund_reasons = [
            "课程内容与描述不符", "讲师水平不达标", "时间安排冲突",
            "学习进度跟不上", "个人经济原因", "客服响应不及时",
            "服务态度不好", "误操作购买", "找到更合适的课程"
        ]
        explanations = [
            "学员反馈课程难度与宣传不符，申请退款已批准",
            "讲师临时更换，学员不满意，已协调退款",
            "学员工作变动无法继续学习，按协议退款",
            "学习困难，建议降级课程，学员选择退款",
            "财务原因，已按流程办理退款",
            "客服响应超时，补偿+退款处理",
            "服务态度问题，已道歉并退款",
            "学员误操作购买，24小时内退款",
            "课程内容重复，支持退款"
        ]
        records = []
        next_id = self._get_next_id("refund_records", "refund_id", "REF")
        
        for i in range(count):
            student = random.choice(students)
            course = random.choice(courses)
            days_between = (end_date - start_date).days
            refund_time = start_date + timedelta(days=random.randint(0, days_between),
                                                 hours=random.randint(0, 23))
            
            reason_idx = random.randint(0, len(refund_reasons) - 1)
            
            records.append({
                "refund_id": f"REF{next_id + i:08d}",
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "course_id": course[0],
                "course_name": course[1],
                "refund_amount": round(random.uniform(100, 5000), 2),
                "refund_reason": refund_reasons[reason_idx],
                "refund_time": refund_time,
                "status": random.choice(["completed", "processing", "rejected"]),
                "region": student["region"],
                "explanation": explanations[reason_idx],
                "sync_id": None,
                "created_at": datetime.now()
            })
        
        df = pl.DataFrame(records)
        self.db.insert_dataframe("refund_records", df)
        return df

    def generate_plagiarism_samples(self, count: int = 50) -> pl.DataFrame:
        attempts = self.db.query_to_polars("SELECT * FROM question_bank_records WHERE is_plagiarized = TRUE LIMIT 200")
        if len(attempts) < 2:
            return pl.DataFrame()
        
        samples = []
        seen_pairs = set()
        next_id = self._get_next_id("plagiarism_samples", "sample_id", "SAMP_")
        
        for i in range(min(len(attempts), 100)):
            for j in range(i + 1, min(len(attempts), 100)):
                if len(samples) >= count:
                    break
                    
                row1 = attempts[i]
                row2 = attempts[j]
                
                pair_key = tuple(sorted([row1["student_id"][0], row2["student_id"][0]]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)
                
                if row1["exam_id"][0] == row2["exam_id"][0] and row1["question_id"][0] == row2["question_id"][0]:
                    similarity = max(float(row1["plagiarism_score"][0]), float(row2["plagiarism_score"][0]))
                    samples.append({
                        "sample_id": f"SAMP_{datetime.now().strftime('%Y%m%d')}_{next_id + len(samples):06d}",
                        "attempt_id_1": row1["attempt_id"][0],
                        "attempt_id_2": row2["attempt_id"][0],
                        "student_id_1": row1["student_id"][0],
                        "student_id_2": row2["student_id"][0],
                        "similarity_score": similarity,
                        "matched_questions": row1["question_id"][0],
                        "detection_time": datetime.now(),
                        "review_status": random.choice(["pending", "confirmed", "rejected"]),
                        "reviewer_notes": None,
                        "sync_id": None,
                        "created_at": datetime.now()
                    })
        
        if samples:
            samples_df = pl.DataFrame(samples)
            self.db.insert_dataframe("plagiarism_samples", samples_df)
            return samples_df
        
        return pl.DataFrame()

    def generate_exam_pass_rates(self) -> pl.DataFrame:
        attempts = self.db.query_to_polars("SELECT * FROM question_bank_records")
        if len(attempts) == 0:
            return pl.DataFrame()
        
        exam_stats = attempts.group_by(["exam_id", "exam_name", "region", pl.col("attempt_time").dt.date().alias("exam_date")]).agg([
            pl.n_unique("student_id").alias("total_students"),
            pl.sum(pl.when(pl.col("score") / pl.col("total_score") >= 0.6).then(1).otherwise(0)).alias("passed_students"),
            (pl.sum(pl.when(pl.col("score") / pl.col("total_score") >= 0.6).then(1).otherwise(0)) / pl.n_unique("student_id")).alias("pass_rate"),
            pl.mean(pl.col("score") / pl.col("total_score") * 100).alias("average_score")
        ]).with_columns([
            pl.concat_str([
                pl.col("exam_id"), 
                pl.col("region"), 
                pl.col("exam_date").cast(pl.Utf8)
            ], separator="_").alias("rate_id"),
            pl.lit(None).alias("sync_id"),
            pl.lit(datetime.now()).alias("created_at")
        ])
        
        if len(exam_stats) > 0:
            self.db.upsert_dataframe("exam_pass_rates", exam_stats, "rate_id")
        
        return exam_stats

    def generate_all_data(self, days: int = 90) -> Dict[str, pl.DataFrame]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        results = {}
        
        results["employment"] = self.generate_employment_records(start_date, end_date, 200)
        results["live_platform"] = self.generate_live_platform_logs(start_date, end_date, 500)
        results["question_bank"] = self.generate_question_bank_records(start_date, end_date, 1000)
        results["transactions"] = self.generate_account_transactions(start_date, end_date, 300)
        results["level_changes"] = self.generate_level_changes(start_date, end_date, 150)
        results["redemption"] = self.generate_redemption_records(start_date, end_date, 100)
        results["refund"] = self.generate_refund_records(start_date, end_date, 80)
        results["plagiarism_samples"] = self.generate_plagiarism_samples(50)
        results["exam_pass_rates"] = self.generate_exam_pass_rates()
        
        return results
