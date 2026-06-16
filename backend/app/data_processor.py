import pandas as pd
import numpy as np
import re
from datetime import datetime, date
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
import uuid

from . import models, schemas


class DataCleaner:
    @staticmethod
    def clean_phone(phone: str) -> str:
        if not phone:
            return ""
        cleaned = re.sub(r'[^0-9+]', '', str(phone))
        if len(cleaned) >= 11 and cleaned.startswith('86'):
            cleaned = cleaned[2:]
        return cleaned[:20]

    @staticmethod
    def clean_id_card(id_card: str) -> str:
        if not id_card:
            return ""
        cleaned = re.sub(r'[^0-9Xx]', '', str(id_card)).upper()
        return cleaned[:20]

    @staticmethod
    def clean_name(name: str) -> str:
        if not name:
            return ""
        cleaned = re.sub(r'[\s\-_\.]', '', str(name))
        return cleaned[:100]

    @staticmethod
    def clean_date(date_val: Any) -> Optional[date]:
        if not date_val:
            return None
        if isinstance(date_val, date):
            return date_val
        if isinstance(date_val, datetime):
            return date_val.date()
        for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%Y%m%d', '%m/%d/%Y']:
            try:
                return datetime.strptime(str(date_val), fmt).date()
            except (ValueError, TypeError):
                continue
        return None

    @staticmethod
    def clean_datetime(dt_val: Any) -> Optional[datetime]:
        if not dt_val:
            return None
        if isinstance(dt_val, datetime):
            return dt_val
        if isinstance(dt_val, date):
            return datetime.combine(dt_val, datetime.min.time())
        for fmt in [
            '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M:%S',
            '%Y/%m/%d %H:%M:%S', '%Y-%m-%d', '%Y/%m/%d'
        ]:
            try:
                return datetime.strptime(str(dt_val), fmt)
            except (ValueError, TypeError):
                continue
        return None

    @staticmethod
    def clean_numeric(val: Any, default: float = 0.0) -> float:
        if val is None or val == '':
            return default
        try:
            cleaned = re.sub(r'[^0-9.\-]', '', str(val))
            return float(cleaned) if cleaned else default
        except (ValueError, TypeError):
            return default


class Deduplicator:
    def __init__(self, db: Session):
        self.db = db

    def find_duplicate_patient(self, patient_data: Dict) -> Optional[models.Patient]:
        if patient_data.get('id_card'):
            existing = self.db.query(models.Patient).filter(
                models.Patient.id_card == patient_data['id_card']
            ).first()
            if existing:
                return existing

        if patient_data.get('phone'):
            existing = self.db.query(models.Patient).filter(
                models.Patient.phone == patient_data['phone'],
                models.Patient.name == patient_data['name']
            ).first()
            if existing:
                return existing

        existing = self.db.query(models.Patient).filter(
            models.Patient.patient_id == patient_data['patient_id']
        ).first()
        return existing

    def find_duplicate_appointment(self, appt_data: Dict) -> Optional[models.Appointment]:
        return self.db.query(models.Appointment).filter(
            models.Appointment.appointment_id == appt_data['appointment_id']
        ).first()

    def find_duplicate_billing(self, billing_data: Dict) -> Optional[models.BillingRecord]:
        return self.db.query(models.BillingRecord).filter(
            models.BillingRecord.billing_id == billing_data['billing_id']
        ).first()

    def find_duplicate_image(self, image_data: Dict) -> Optional[models.ImageRecord]:
        if image_data.get('study_instance_uid'):
            existing = self.db.query(models.ImageRecord).filter(
                models.ImageRecord.study_instance_uid == image_data['study_instance_uid']
            ).first()
            if existing:
                return existing

        return self.db.query(models.ImageRecord).filter(
            models.ImageRecord.image_id == image_data['image_id']
        ).first()


class CaliberMatcher:
    def __init__(self, db: Session):
        self.db = db

    CALIBER_MAPPINGS = {
        'treatment_type': {
            '检查': ['检查', '体检', '口腔检查', '常规检查'],
            '洁牙': ['洁牙', '洗牙', '牙齿清洁', '牙周洁治'],
            '补牙': ['补牙', '充填', '树脂充填', '虫牙治疗'],
            '根管治疗': ['根管治疗', '根管', '牙髓治疗', '杀神经'],
            '拔牙': ['拔牙', '拔除', '智齿拔除'],
            '种植牙': ['种植牙', '种植', '人工种植牙'],
            '正畸': ['正畸', '矫正', '牙齿矫正', '隐形矫正'],
            '烤瓷牙': ['烤瓷牙', '烤瓷冠', '全瓷冠', '牙冠修复'],
            '影像检查': ['影像检查', '拍片', 'X光', 'CT', '全景片', 'CBCT'],
        },
        'department': {
            '口腔内科': ['口腔内科', '内科', '牙体牙髓科'],
            '口腔外科': ['口腔外科', '外科', '颌面外科'],
            '口腔修复科': ['口腔修复科', '修复科', '镶牙科'],
            '口腔正畸科': ['口腔正畸科', '正畸科', '矫正科'],
            '口腔种植科': ['口腔种植科', '种植科'],
            '儿童口腔科': ['儿童口腔科', '儿童牙科', '儿科'],
            '牙周科': ['牙周科', '牙周病科'],
            '影像科': ['影像科', '放射科', 'X光室'],
        },
        'image_type': {
            'X光片': ['X光片', 'X线片', '根尖片', '小牙片'],
            '全景片': ['全景片', '曲面断层片', '全景'],
            'CBCT': ['CBCT', '锥形束CT', '口腔CT'],
            '头颅侧位片': ['头颅侧位片', '头影测量片', '侧位片'],
            '口内照片': ['口内照片', '口内像', '口腔照片'],
            '面部照片': ['面部照片', '面像', '微笑照'],
        }
    }

    def match_caliber(self, field: str, value: str) -> str:
        if not value:
            return value

        mappings = self.CALIBER_MAPPINGS.get(field, {})
        for standard_value, aliases in mappings.items():
            if value in aliases:
                return standard_value
            for alias in aliases:
                if alias in value or value in alias:
                    return standard_value

        return value

    def check_caliber_conflict(
        self,
        patient_id: str,
        source_a: str,
        source_b: str,
        field: str,
        value_a: Any,
        value_b: Any
    ) -> Optional[models.CaliberConflict]:
        if str(value_a) == str(value_b):
            return None

        matched_a = self.match_caliber(field, str(value_a))
        matched_b = self.match_caliber(field, str(value_b))

        if matched_a == matched_b:
            return None

        conflict = models.CaliberConflict(
            conflict_id=f"CONF_{uuid.uuid4().hex[:12]}",
            patient_id=patient_id,
            source_system_a=source_a,
            source_system_b=source_b,
            conflict_field=field,
            value_a=str(value_a),
            value_b=str(value_b),
            resolution_status="pending"
        )
        return conflict

    def detect_conflicts_from_data(
        self,
        appointment_data: List[Dict],
        image_data: List[Dict]
    ) -> List[models.CaliberConflict]:
        conflicts = []

        appt_by_patient = {}
        for appt in appointment_data:
            pid = appt.get('patient_id')
            if pid:
                appt_by_patient.setdefault(pid, []).append(appt)

        image_by_patient = {}
        for img in image_data:
            pid = img.get('patient_id')
            if pid:
                image_by_patient.setdefault(pid, []).append(img)

        for pid in set(appt_by_patient.keys()) & set(image_by_patient.keys()):
            appts = appt_by_patient[pid]
            images = image_by_patient[pid]

            for appt in appts:
                for img in images:
                    appt_date = DataCleaner.clean_datetime(appt.get('appointment_date'))
                    img_date = DataCleaner.clean_datetime(img.get('study_date'))

                    if appt_date and img_date:
                        days_diff = abs((appt_date.date() - img_date.date()).days)
                        if days_diff <= 3:
                            treatment_type = str(appt.get('treatment_type', ''))
                            image_type = str(img.get('image_type', ''))

                            if '影像' in treatment_type or '检查' in treatment_type:
                                matched_treatment = self.match_caliber('treatment_type', treatment_type)
                                matched_image = self.match_caliber('image_type', image_type)

                                if matched_treatment == '影像检查' and matched_image not in image_type:
                                    conflict = self.check_caliber_conflict(
                                        pid,
                                        appt.get('source_system', 'appointment_system'),
                                        img.get('source_system', 'imaging_system'),
                                        'treatment_image_match',
                                        treatment_type,
                                        image_type
                                    )
                                    if conflict:
                                        conflicts.append(conflict)

        return conflicts


class DataPipeline:
    def __init__(self, db: Session):
        self.db = db
        self.cleaner = DataCleaner()
        self.deduplicator = Deduplicator(db)
        self.matcher = CaliberMatcher(db)

    def process_patients(self, df: pd.DataFrame) -> Tuple[int, int, List[models.Patient]]:
        processed = 0
        duplicated = 0
        patients = []

        for _, row in df.iterrows():
            data = {
                'patient_id': str(row.get('patient_id', '')).strip(),
                'name': self.cleaner.clean_name(row.get('name', '')),
                'gender': str(row.get('gender', '')).strip() if row.get('gender') else None,
                'birth_date': self.cleaner.clean_date(row.get('birth_date')),
                'phone': self.cleaner.clean_phone(row.get('phone', '')),
                'id_card': self.cleaner.clean_id_card(row.get('id_card', '')),
                'first_visit_date': self.cleaner.clean_date(row.get('first_visit_date')),
            }

            if not data['patient_id'] or not data['name']:
                continue

            existing = self.deduplicator.find_duplicate_patient(data)
            if existing:
                duplicated += 1
                continue

            patient = models.Patient(**data)
            patients.append(patient)
            processed += 1

        return processed, duplicated, patients

    def process_appointments(self, df: pd.DataFrame) -> Tuple[int, int, List[models.Appointment]]:
        processed = 0
        duplicated = 0
        appointments = []

        for _, row in df.iterrows():
            data = {
                'appointment_id': str(row.get('appointment_id', '')).strip(),
                'patient_id': str(row.get('patient_id', '')).strip(),
                'appointment_date': self.cleaner.clean_datetime(row.get('appointment_date')),
                'department': self.matcher.match_caliber('department', str(row.get('department', '')).strip()),
                'doctor': str(row.get('doctor', '')).strip() if row.get('doctor') else None,
                'treatment_type': self.matcher.match_caliber('treatment_type', str(row.get('treatment_type', '')).strip()),
                'status': str(row.get('status', 'scheduled')).strip(),
                'is_no_show': bool(row.get('is_no_show', False)),
                'source_system': str(row.get('source_system', 'appointment_system')).strip(),
            }

            if not data['appointment_id'] or not data['patient_id'] or not data['appointment_date']:
                continue

            existing = self.deduplicator.find_duplicate_appointment(data)
            if existing:
                duplicated += 1
                continue

            appointment = models.Appointment(**data)
            appointments.append(appointment)
            processed += 1

        return processed, duplicated, appointments

    def process_billing_records(self, df: pd.DataFrame) -> Tuple[int, int, List[models.BillingRecord]]:
        processed = 0
        duplicated = 0
        records = []

        for _, row in df.iterrows():
            treatment_items = row.get('treatment_items')
            if isinstance(treatment_items, str):
                try:
                    import json
                    treatment_items = json.loads(treatment_items)
                except (json.JSONDecodeError, TypeError):
                    treatment_items = None

            data = {
                'billing_id': str(row.get('billing_id', '')).strip(),
                'patient_id': str(row.get('patient_id', '')).strip(),
                'billing_date': self.cleaner.clean_datetime(row.get('billing_date')),
                'total_amount': self.cleaner.clean_numeric(row.get('total_amount')),
                'paid_amount': self.cleaner.clean_numeric(row.get('paid_amount')),
                'payment_method': str(row.get('payment_method', '')).strip() if row.get('payment_method') else None,
                'treatment_items': treatment_items,
                'source_system': str(row.get('source_system', 'billing_system')).strip(),
            }

            if not data['billing_id'] or not data['patient_id'] or not data['billing_date']:
                continue

            existing = self.deduplicator.find_duplicate_billing(data)
            if existing:
                duplicated += 1
                continue

            record = models.BillingRecord(**data)
            records.append(record)
            processed += 1

        return processed, duplicated, records

    def process_image_records(self, df: pd.DataFrame) -> Tuple[int, int, List[models.ImageRecord]]:
        processed = 0
        duplicated = 0
        records = []

        for _, row in df.iterrows():
            data = {
                'image_id': str(row.get('image_id', '')).strip(),
                'patient_id': str(row.get('patient_id', '')).strip(),
                'study_date': self.cleaner.clean_datetime(row.get('study_date')),
                'image_type': self.matcher.match_caliber('image_type', str(row.get('image_type', '')).strip()),
                'body_part': str(row.get('body_part', '')).strip() if row.get('body_part') else None,
                'study_description': str(row.get('study_description', '')).strip() if row.get('study_description') else None,
                'study_instance_uid': str(row.get('study_instance_uid', '')).strip() if row.get('study_instance_uid') else None,
                'series_count': int(self.cleaner.clean_numeric(row.get('series_count'), 0)),
                'image_count': int(self.cleaner.clean_numeric(row.get('image_count'), 0)),
                'file_size_mb': self.cleaner.clean_numeric(row.get('file_size_mb')),
                'storage_path': str(row.get('storage_path', '')).strip() if row.get('storage_path') else None,
                'source_system': str(row.get('source_system', 'imaging_system')).strip(),
                'archive_status': str(row.get('archive_status', 'archived')).strip(),
            }

            if not data['image_id'] or not data['patient_id'] or not data['study_date']:
                continue

            existing = self.deduplicator.find_duplicate_image(data)
            if existing:
                duplicated += 1
                continue

            record = models.ImageRecord(**data)
            records.append(record)
            processed += 1

        return processed, duplicated, records

    def process_medical_records(self, df: pd.DataFrame) -> Tuple[int, int, List[models.MedicalRecord]]:
        processed = 0
        duplicated = 0
        records = []

        for _, row in df.iterrows():
            data = {
                'record_id': str(row.get('record_id', '')).strip(),
                'patient_id': str(row.get('patient_id', '')).strip(),
                'visit_date': self.cleaner.clean_datetime(row.get('visit_date')),
                'doctor': str(row.get('doctor', '')).strip() if row.get('doctor') else None,
                'department': self.matcher.match_caliber('department', str(row.get('department', '')).strip()),
                'chief_complaint': str(row.get('chief_complaint', '')).strip() if row.get('chief_complaint') else None,
                'diagnosis': str(row.get('diagnosis', '')).strip() if row.get('diagnosis') else None,
                'treatment_summary': str(row.get('treatment_summary', '')).strip() if row.get('treatment_summary') else None,
                'prescription': str(row.get('prescription', '')).strip() if row.get('prescription') else None,
                'source_system': str(row.get('source_system', 'clinical_system')).strip(),
            }

            if not data['record_id'] or not data['patient_id'] or not data['visit_date']:
                continue

            existing = self.db.query(models.MedicalRecord).filter(
                models.MedicalRecord.record_id == data['record_id']
            ).first()
            if existing:
                duplicated += 1
                continue

            record = models.MedicalRecord(**data)
            records.append(record)
            processed += 1

        return processed, duplicated, records

    def process_treatment_plans(self, df: pd.DataFrame) -> Tuple[int, int, List[models.TreatmentPlan]]:
        processed = 0
        duplicated = 0
        plans = []

        for _, row in df.iterrows():
            data = {
                'plan_id': str(row.get('plan_id', '')).strip(),
                'record_id': str(row.get('record_id', '')).strip(),
                'plan_name': str(row.get('plan_name', '')).strip(),
                'plan_description': str(row.get('plan_description', '')).strip() if row.get('plan_description') else None,
                'estimated_cost': self.cleaner.clean_numeric(row.get('estimated_cost')),
                'priority': str(row.get('priority', 'normal')).strip(),
                'status': str(row.get('status', 'pending')).strip(),
                'start_date': self.cleaner.clean_date(row.get('start_date')),
                'end_date': self.cleaner.clean_date(row.get('end_date')),
            }

            if not data['plan_id'] or not data['record_id'] or not data['plan_name']:
                continue

            existing = self.db.query(models.TreatmentPlan).filter(
                models.TreatmentPlan.plan_id == data['plan_id']
            ).first()
            if existing:
                duplicated += 1
                continue

            plan = models.TreatmentPlan(**data)
            plans.append(plan)
            processed += 1

        return processed, duplicated, plans

    def bulk_save(self, objects: List[Any]) -> None:
        if objects:
            self.db.bulk_save_objects(objects)
            self.db.commit()

    def save_conflicts(self, conflicts: List[models.CaliberConflict]) -> int:
        count = 0
        for conflict in conflicts:
            existing = self.db.query(models.CaliberConflict).filter(
                models.CaliberConflict.patient_id == conflict.patient_id,
                models.CaliberConflict.conflict_field == conflict.conflict_field,
                models.CaliberConflict.value_a == conflict.value_a,
                models.CaliberConflict.value_b == conflict.value_b,
                models.CaliberConflict.resolution_status == 'pending'
            ).first()
            if not existing:
                self.db.add(conflict)
                count += 1
        self.db.commit()
        return count
