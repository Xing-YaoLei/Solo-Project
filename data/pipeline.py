import re
import pandas as pd
from datetime import datetime, date
from typing import List, Dict, Tuple, Optional


class DataCleaner:
    @staticmethod
    def clean_vin(vin: str) -> str:
        if not vin:
            return ""
        vin = str(vin).strip().upper()
        vin = re.sub(r'[^A-Z0-9]', '', vin)
        return vin[:17] if len(vin) > 17 else vin

    @staticmethod
    def clean_license_plate(plate: str) -> str:
        if not plate:
            return ""
        plate = str(plate).strip().upper()
        plate = re.sub(r'\s+', '', plate)
        return plate

    @staticmethod
    def clean_phone(phone: str) -> str:
        if not phone:
            return ""
        phone = str(phone).strip()
        phone = re.sub(r'[^\d+]', '', phone)
        return phone

    @staticmethod
    def clean_money(value) -> float:
        if value is None or value == "":
            return 0.0
        if isinstance(value, (int, float)):
            return float(value)
        value = str(value).strip()
        value = re.sub(r'[^\d.-]', '', value)
        try:
            return float(value)
        except ValueError:
            return 0.0

    @staticmethod
    def clean_date(value) -> Optional[date]:
        if not value:
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, datetime):
            return value.date()
        value = str(value).strip()
        for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%Y%m%d', '%d-%m-%Y', '%d/%m/%Y']:
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        text = str(text).strip()
        text = re.sub(r'\s+', ' ', text)
        return text


class Deduplicator:
    @staticmethod
    def dedup_by_source_id(df: pd.DataFrame, source_system_value: str, id_col: str) -> Tuple[pd.DataFrame, int]:
        before = len(df)
        if id_col not in df.columns:
            return df, 0

        if 'source_system' in df.columns:
            deduped = df.drop_duplicates(subset=['source_system', id_col], keep='last')
        else:
            df = df.copy()
            df.loc[:, 'source_system'] = source_system_value
            deduped = df.drop_duplicates(subset=['source_system', id_col], keep='last')
        removed = before - len(deduped)
        return deduped, removed

    @staticmethod
    def dedup_vehicles(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        before = len(df)
        if 'vin' in df.columns:
            df = df.copy()
            df = df.dropna(subset=['vin'])
            df.loc[:, 'vin_clean'] = df['vin'].apply(DataCleaner.clean_vin)
            df = df.drop_duplicates(subset=['vin_clean'], keep='last')
            df = df.drop(columns=['vin_clean'])
        removed = before - len(df)
        return df, removed

    @staticmethod
    def dedup_repair_orders(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        before = len(df)
        if 'order_no' in df.columns:
            df = df.dropna(subset=['order_no'])
            df = df.drop_duplicates(subset=['order_no'], keep='last')
        elif 'source_system' in df.columns and 'source_id' in df.columns:
            df = df.drop_duplicates(subset=['source_system', 'source_id'], keep='last')
        removed = before - len(df)
        return df, removed


class CaliberMatcher:
    FAULT_CATEGORY_MAP = {
        'P': '动力系统', '发动机': '动力系统', 'engine': '动力系统',
        'B': '车身系统', 'body': '车身系统', '钣金': '车身系统',
        'C': '底盘系统', 'chassis': '底盘系统', '悬挂': '底盘系统',
        'U': '网络通讯', 'network': '网络通讯', 'can': '网络通讯',
        'BMS': '电池管理', '电池': '电池管理', 'battery': '电池管理',
        'MCU': '电机控制', '电机': '电机控制', 'motor': '电机控制',
    }

    ORDER_TYPE_MAP = {
        '保养': '常规保养', 'maintenance': '常规保养', '小保养': '常规保养',
        '维修': '故障维修', 'repair': '故障维修', '故障': '故障维修',
        '事故': '事故维修', 'accident': '事故维修', '保险': '事故维修',
        '改装': '改装升级', '改装升级': '改装升级',
        '检测': '检测诊断', 'diagnosis': '检测诊断',
    }

    REWORK_TYPE_MAP = {
        '配件质量': '配件相关', 'parts': '配件相关', '配件': '配件相关',
        '工艺问题': '工艺相关', '工艺': '工艺相关', 'installation': '工艺相关',
        '诊断失误': '诊断相关', '误诊': '诊断相关', 'diagnosis': '诊断相关',
        '客户原因': '客户相关', 'customer': '客户相关',
    }

    DAMAGE_TYPE_MAP = {
        '追尾': '追尾事故', 'rear end': '追尾事故', ' rear': '追尾事故',
        '正面': '正面碰撞', 'front': '正面碰撞', '车头': '正面碰撞',
        '侧面': '侧面碰撞', 'side': '侧面碰撞', '侧方': '侧面碰撞',
        '剐蹭': '剐蹭事故', 'scratch': '剐蹭事故', '刮擦': '剐蹭事故',
        '冰雹': '冰雹损伤', 'hail': '冰雹损伤',
        '水淹': '水淹车', 'water': '水淹车', '泡水': '水淹车',
        '火灾': '火烧车', 'fire': '火烧车',
        '高空坠物': '高空坠物损伤',
    }

    CLAIM_STATUS_MAP = {
        '受理': '已受理', 'received': '已受理', '已接收': '已受理',
        '审核': '审核中', 'review': '审核中', 'pending': '审核中',
        '已通过': '已通过', 'approved': '已通过', '赔付中': '已通过',
        '已赔付': '已赔付', 'paid': '已赔付', '结算': '已赔付',
        '拒赔': '已拒赔', 'rejected': '已拒赔', '拒绝': '已拒赔',
        '作废': '已作废', 'cancel': '已作废', '取消': '已作废',
    }

    INSURANCE_COMPANY_MAP = {
        '人民保险': '人保财险', 'picc': '人保财险', '人保': '人保财险', 'PICC': '人保财险',
        '平安': '平安车险', 'pingan': '平安车险', '中国平安': '平安车险',
        '太保': '太平洋保险', 'cpic': '太平洋保险', '太平洋': '太平洋保险',
        '国寿财险': '中国人寿财险', 'chinalife': '中国人寿财险', '人寿': '中国人寿财险',
        '阳光': '阳光财险', 'ygsic': '阳光财险', '阳光保险': '阳光财险',
        '中华': '中华联合', 'cic': '中华联合', '中华财险': '中华联合',
        '大地': '大地财险', 'ccic': '大地财险',
        '天安': '天安财险',
        '华安': '华安财险',
    }

    @classmethod
    def match_fault_category(cls, fault_code: str, description: str = "") -> str:
        if not fault_code and not description:
            return '其他'
        fault_code = str(fault_code).upper() if fault_code else ""
        description = str(description).lower() if description else ""

        for key, category in cls.FAULT_CATEGORY_MAP.items():
            if key.upper() in fault_code or key.lower() in description:
                return category
        return '其他'

    @classmethod
    def match_order_type(cls, raw_type: str) -> str:
        if not raw_type:
            return '其他'
        raw_type = str(raw_type).strip().lower()
        for key, matched in cls.ORDER_TYPE_MAP.items():
            if key.lower() in raw_type:
                return matched
        return '其他'

    @classmethod
    def match_rework_type(cls, reason: str) -> str:
        if not reason:
            return '其他'
        reason = str(reason).strip().lower()
        for key, matched in cls.REWORK_TYPE_MAP.items():
            if key.lower() in reason:
                return matched
        return '其他'

    @staticmethod
    def normalize_part_code(code: str) -> str:
        if not code:
            return ""
        code = str(code).strip().upper()
        code = re.sub(r'[^A-Z0-9-]', '', code)
        return code

    @classmethod
    def match_damage_type(cls, raw_type: str) -> str:
        if not raw_type:
            return '其他损伤'
        raw_type = str(raw_type).strip().lower()
        for key, matched in cls.DAMAGE_TYPE_MAP.items():
            if key.lower() in raw_type:
                return matched
        return raw_type if raw_type else '其他损伤'

    @classmethod
    def match_claim_status(cls, raw_status: str) -> str:
        if not raw_status:
            return '未知'
        raw_status = str(raw_status).strip().lower()
        for key, matched in cls.CLAIM_STATUS_MAP.items():
            if key.lower() in raw_status:
                return matched
        return raw_status if raw_status else '未知'

    @classmethod
    def match_insurance_company(cls, raw_name: str) -> str:
        if not raw_name:
            return '其他'
        raw_name = str(raw_name).strip().lower()
        for key, matched in cls.INSURANCE_COMPANY_MAP.items():
            if key.lower() in raw_name:
                return matched
        return raw_name if raw_name else '其他'

    @staticmethod
    def clean_policy_no(policy_no: str) -> str:
        if not policy_no:
            return ""
        policy_no = str(policy_no).strip().upper()
        policy_no = re.sub(r'[^A-Z0-9]', '', policy_no)
        return policy_no


class DataPipeline:
    def __init__(self):
        self.cleaner = DataCleaner()
        self.deduplicator = Deduplicator()
        self.matcher = CaliberMatcher()

    def process_vehicles(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, Dict]:
        stats = {'input': len(df), 'invalid': 0, 'deduplicated': 0, 'output': 0}

        if df.empty:
            stats['output'] = 0
            return df, stats

        df = df.copy()

        if 'vin' in df.columns:
            df.loc[:, 'vin'] = df['vin'].apply(self.cleaner.clean_vin)
            invalid_vin = df['vin'].str.len() < 5
            stats['invalid'] += int(invalid_vin.sum())
            df = df[~invalid_vin]

        if 'license_plate' in df.columns:
            df.loc[:, 'license_plate'] = df['license_plate'].apply(self.cleaner.clean_license_plate)

        if 'owner_phone' in df.columns:
            df.loc[:, 'owner_phone'] = df['owner_phone'].apply(self.cleaner.clean_phone)

        if 'first_registration_date' in df.columns:
            df.loc[:, 'first_registration_date'] = df['first_registration_date'].apply(self.cleaner.clean_date)

        if 'mileage' in df.columns:
            df.loc[:, 'mileage'] = pd.to_numeric(df['mileage'], errors='coerce').fillna(0).astype(int)

        if 'brand' in df.columns:
            df.loc[:, 'brand'] = df['brand'].apply(self.cleaner.clean_text)

        if 'model' in df.columns:
            df.loc[:, 'model'] = df['model'].apply(self.cleaner.clean_text)

        df, dedup_count = self.deduplicator.dedup_vehicles(df)
        stats['deduplicated'] = dedup_count
        stats['output'] = len(df)

        if 'source_system' not in df.columns:
            df.loc[:, 'source_system'] = source_system

        return df, stats

    def process_repair_orders(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, Dict]:
        stats = {'input': len(df), 'invalid': 0, 'deduplicated': 0, 'output': 0}

        if df.empty:
            stats['output'] = 0
            return df, stats

        df = df.copy()

        if 'appointment_date' in df.columns:
            df.loc[:, 'appointment_date'] = df['appointment_date'].apply(self.cleaner.clean_date)
            invalid_date = df['appointment_date'].isna()
            stats['invalid'] += int(invalid_date.sum())
            df = df[~invalid_date]

        if 'actual_arrival_date' in df.columns:
            df.loc[:, 'actual_arrival_date'] = df['actual_arrival_date'].apply(self.cleaner.clean_date)

        if 'order_type' in df.columns:
            df.loc[:, 'order_type'] = df['order_type'].apply(self.matcher.match_order_type)

        for cost_col in ['total_cost', 'parts_cost', 'labor_cost']:
            if cost_col in df.columns:
                df.loc[:, cost_col] = df[cost_col].apply(self.cleaner.clean_money)

        if 'order_no' in df.columns:
            df.loc[:, 'order_no'] = df['order_no'].astype(str).str.strip()

        if 'service_advisor' in df.columns:
            df.loc[:, 'service_advisor'] = df['service_advisor'].apply(self.cleaner.clean_text)

        if 'technician' in df.columns:
            df.loc[:, 'technician'] = df['technician'].apply(self.cleaner.clean_text)

        df, dedup_count = self.deduplicator.dedup_repair_orders(df)
        stats['deduplicated'] = dedup_count
        stats['output'] = len(df)

        if 'source_system' not in df.columns:
            df.loc[:, 'source_system'] = source_system

        if 'source_id' not in df.columns and 'order_no' in df.columns:
            df.loc[:, 'source_id'] = df['order_no']

        return df, stats

    def process_diagnosis(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, Dict]:
        stats = {'input': len(df), 'invalid': 0, 'deduplicated': 0, 'output': 0}

        if df.empty:
            stats['output'] = 0
            return df, stats

        df = df.copy()

        if 'diagnosis_date' in df.columns:
            df.loc[:, 'diagnosis_date'] = df['diagnosis_date'].apply(self.cleaner.clean_date)
            invalid_date = df['diagnosis_date'].isna()
            stats['invalid'] += int(invalid_date.sum())
            df = df[~invalid_date]

        if 'fault_code' in df.columns:
            df.loc[:, 'fault_code'] = df['fault_code'].astype(str).str.strip().str.upper()

        if 'fault_description' in df.columns:
            df.loc[:, 'fault_description'] = df['fault_description'].apply(self.cleaner.clean_text)

        if 'fault_category' not in df.columns or df['fault_category'].isna().all():
            df.loc[:, 'fault_category'] = df.apply(
                lambda row: self.matcher.match_fault_category(
                    row.get('fault_code', ''),
                    row.get('fault_description', '')
                ), axis=1
            )

        if 'fault_severity' in df.columns:
            df.loc[:, 'fault_severity'] = df['fault_severity'].astype(str).str.strip()

        if 'technician' in df.columns:
            df.loc[:, 'technician'] = df['technician'].apply(self.cleaner.clean_text)

        if 'diagnosis_result' in df.columns:
            df.loc[:, 'diagnosis_result'] = df['diagnosis_result'].apply(self.cleaner.clean_text)

        if 'source_system' not in df.columns:
            df.loc[:, 'source_system'] = source_system

        if 'source_id' not in df.columns:
            if 'fault_code' in df.columns:
                df.loc[:, 'source_id'] = df['fault_code'].astype(str) + '_' + df['diagnosis_date'].astype(str)
            else:
                df.loc[:, 'source_id'] = [f'diag_{i}' for i in range(len(df))]

        df, dedup_count = self.deduplicator.dedup_by_source_id(df, source_system, 'source_id')
        stats['deduplicated'] = dedup_count
        stats['output'] = len(df)

        return df, stats

    def process_parts(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, Dict]:
        stats = {'input': len(df), 'invalid': 0, 'deduplicated': 0, 'output': 0}

        if df.empty:
            stats['output'] = 0
            return df, stats

        df = df.copy()

        if 'part_code' in df.columns:
            df.loc[:, 'part_code'] = df['part_code'].apply(self.matcher.normalize_part_code)
            invalid_code = df['part_code'].str.len() < 2
            stats['invalid'] += int(invalid_code.sum())
            df = df[~invalid_code]

        if 'part_name' in df.columns:
            df.loc[:, 'part_name'] = df['part_name'].apply(self.cleaner.clean_text)

        if 'unit_price' in df.columns:
            df.loc[:, 'unit_price'] = df['unit_price'].apply(self.cleaner.clean_money)

        if 'stock_quantity' in df.columns:
            df.loc[:, 'stock_quantity'] = pd.to_numeric(df['stock_quantity'], errors='coerce').fillna(0).astype(int)

        if 'part_category' in df.columns:
            df.loc[:, 'part_category'] = df['part_category'].apply(self.cleaner.clean_text)

        df, dedup_count = self.deduplicator.dedup_by_source_id(df, source_system, 'part_code')
        stats['deduplicated'] = dedup_count
        stats['output'] = len(df)

        if 'source_system' not in df.columns:
            df.loc[:, 'source_system'] = source_system

        return df, stats

    def process_insurance(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, Dict]:
        stats = {'input': len(df), 'invalid': 0, 'deduplicated': 0, 'output': 0}

        if df.empty:
            stats['output'] = 0
            return df, stats

        df = df.copy()

        if 'policy_no' in df.columns:
            df.loc[:, 'policy_no'] = df['policy_no'].apply(self.matcher.clean_policy_no)
            invalid_policy = df['policy_no'].str.len() < 3
            stats['invalid'] += int(invalid_policy.sum())
            df = df[~invalid_policy]

        if 'claim_no' in df.columns:
            df.loc[:, 'claim_no'] = df['claim_no'].apply(self.matcher.clean_policy_no)

        if 'insurance_company' in df.columns:
            df.loc[:, 'insurance_company'] = df['insurance_company'].apply(self.matcher.match_insurance_company)

        if 'damage_type' in df.columns:
            df.loc[:, 'damage_type'] = df['damage_type'].apply(self.matcher.match_damage_type)

        if 'claim_status' in df.columns:
            df.loc[:, 'claim_status'] = df['claim_status'].apply(self.matcher.match_claim_status)

        if 'accident_date' in df.columns:
            df.loc[:, 'accident_date'] = df['accident_date'].apply(self.cleaner.clean_date)

        for amount_col in ['estimated_amount', 'approved_amount']:
            if amount_col in df.columns:
                df.loc[:, amount_col] = df[amount_col].apply(self.cleaner.clean_money)

        if 'damage_description' in df.columns:
            df.loc[:, 'damage_description'] = df['damage_description'].apply(self.cleaner.clean_text)

        if 'source_system' not in df.columns:
            df.loc[:, 'source_system'] = source_system

        if 'source_id' not in df.columns:
            if 'claim_no' in df.columns:
                df.loc[:, 'source_id'] = df['claim_no'].astype(str)
            elif 'policy_no' in df.columns:
                df.loc[:, 'source_id'] = df['policy_no'].astype(str)
            else:
                df.loc[:, 'source_id'] = [f'ins_{i}' for i in range(len(df))]

        df, dedup_count = self.deduplicator.dedup_by_source_id(df, source_system, 'source_id')
        stats['deduplicated'] = dedup_count
        stats['output'] = len(df)

        return df, stats
