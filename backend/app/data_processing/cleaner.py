import re
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime


class DataCleaner:
    """数据清洗器 - 处理来自不同数据源的原始数据"""

    @staticmethod
    def clean_phone(phone: str) -> str:
        """清洗手机号：移除空格、横线、+86等前缀"""
        if not phone:
            return ""
        phone = str(phone).strip()
        phone = re.sub(r'[\s\-_]', '', phone)
        phone = re.sub(r'^\+?86', '', phone)
        if re.match(r'^1[3-9]\d{9}$', phone):
            return phone
        return phone

    @staticmethod
    def clean_name(name: str) -> str:
        """清洗姓名：去空格、统一全角半角"""
        if not name:
            return ""
        name = str(name).strip()
        name = re.sub(r'\s+', '', name)
        return name

    @staticmethod
    def clean_id_card(id_card: str) -> str:
        """清洗身份证号"""
        if not id_card:
            return ""
        id_card = str(id_card).strip().upper()
        id_card = re.sub(r'[\s\-_]', '', id_card)
        return id_card

    @staticmethod
    def clean_email(email: str) -> str:
        """清洗邮箱"""
        if not email:
            return ""
        email = str(email).strip().lower()
        return email

    @staticmethod
    def normalize_date(date_str: str, formats: List[str] = None) -> str:
        """日期标准化为 YYYY-MM-DD 格式"""
        if not date_str:
            return None
        if formats is None:
            formats = [
                '%Y-%m-%d', '%Y/%m/%d', '%Y年%m月%d日',
                '%Y%m%d', '%m/%d/%Y', '%d-%m-%Y'
            ]
        for fmt in formats:
            try:
                dt = datetime.strptime(str(date_str).strip(), fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None

    @staticmethod
    def normalize_gender(gender: str) -> str:
        """性别标准化"""
        if not gender:
            return ""
        gender = str(gender).strip()
        gender_map = {
            '男': 'male', 'm': 'male', 'M': 'male', 'male': 'male', '男生': 'male',
            '女': 'female', 'f': 'female', 'F': 'female', 'female': 'female', '女生': 'female'
        }
        return gender_map.get(gender, gender)

    @staticmethod
    def normalize_grade(grade: str) -> str:
        """年级标准化"""
        if not grade:
            return ""
        grade = str(grade).strip()
        grade = re.sub(r'年级|班|Grade|grade', '', grade)
        grade_map = {
            '1': 'G1', '一': 'G1', '2': 'G2', '二': 'G2',
            '3': 'G3', '三': 'G3', '4': 'G4', '四': 'G4',
            '5': 'G5', '五': 'G5', '6': 'G6', '六': 'G6',
            '7': 'G7', '七': 'G7', '初一': 'G7',
            '8': 'G8', '八': 'G8', '初二': 'G8',
            '9': 'G9', '九': 'G9', '初三': 'G9',
            '高一': 'G10', '高二': 'G11', '高三': 'G12'
        }
        return grade_map.get(grade, grade)

    def clean_student_data(self, data: List[Dict[str, Any]], source: str) -> pd.DataFrame:
        """清洗学生数据"""
        df = pd.DataFrame(data)
        if 'name' in df.columns:
            df['name'] = df['name'].apply(self.clean_name)
        if 'phone' in df.columns:
            df['phone'] = df['phone'].apply(self.clean_phone)
        if 'gender' in df.columns:
            df['gender'] = df['gender'].apply(self.normalize_gender)
        if 'grade' in df.columns:
            df['grade'] = df['grade'].apply(self.normalize_grade)
        df['data_source'] = source
        df['is_cleaned'] = True
        return df

    def clean_enrollment_data(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """清洗报名数据"""
        df = self.clean_student_data(data, 'enrollment')
        if 'enrollment_date' in df.columns:
            df['enrollment_date'] = df['enrollment_date'].apply(self.normalize_date)
        return df

    def clean_academic_data(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """清洗教务数据"""
        df = self.clean_student_data(data, 'academic')
        if 'record_date' in df.columns:
            df['record_date'] = df['record_date'].apply(self.normalize_date)
        if 'score' in df.columns:
            df['score'] = pd.to_numeric(df['score'], errors='coerce')
        if 'attendance_rate' in df.columns:
            df['attendance_rate'] = pd.to_numeric(df['attendance_rate'], errors='coerce')
        return df

    def clean_homework_data(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """清洗作业数据"""
        df = self.clean_student_data(data, 'homework')
        if 'submit_time' in df.columns:
            df['submit_time'] = pd.to_datetime(df['submit_time'], errors='coerce')
        if 'score' in df.columns:
            df['score'] = pd.to_numeric(df['score'], errors='coerce')
        return df


data_cleaner = DataCleaner()
