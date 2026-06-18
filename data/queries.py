from datetime import date, timedelta
from typing import Optional, List, Dict
import pandas as pd
from sqlalchemy import func, and_, or_, cast, Date
from data.database import SessionLocal
from data.models import (
    RepairOrder, Vehicle, DiagnosisResult, OrderItem,
    PartsInventory, PartsUsage, ReworkRecord,
    ReworkRateCaliberVersion, ThresholdConfig, ReviewMaterial
)


class DataQueryService:
    def __init__(self):
        self.db = SessionLocal()

    def close(self):
        self.db.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def get_appointment_trend(self, start_date: date, end_date: date) -> pd.DataFrame:
        orders = self.db.query(
            RepairOrder.appointment_date,
            func.count(RepairOrder.id).label('appointment_count'),
            func.count(RepairOrder.actual_arrival_date).label('arrival_count'),
            func.sum(RepairOrder.total_cost).label('total_cost')
        ).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date
            )
        ).group_by(
            RepairOrder.appointment_date
        ).order_by(
            RepairOrder.appointment_date
        ).all()

        df = pd.DataFrame([{
            'date': row.appointment_date,
            '预约量': row.appointment_count,
            '到店量': row.arrival_count,
            '到店率': round(row.arrival_count / row.appointment_count * 100, 1) if row.appointment_count > 0 else 0,
            '总金额': float(row.total_cost or 0)
        } for row in orders])
        return df

    def get_vehicle_stats(self, start_date: date, end_date: date) -> Dict:
        total_vehicles = self.db.query(func.count(Vehicle.id)).scalar()
        active_vehicles = self.db.query(func.count(RepairOrder.vehicle_id.distinct())).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date
            )
        ).scalar()

        brand_stats = self.db.query(
            Vehicle.brand,
            func.count(Vehicle.id).label('count')
        ).filter(
            Vehicle.brand.isnot(None)
        ).group_by(Vehicle.brand).order_by(
            func.count(Vehicle.id).desc()
        ).limit(10).all()

        return {
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
            'brand_distribution': [{'brand': r.brand or '其他', 'count': r.count} for r in brand_stats]
        }

    def get_diagnosis_stats(self, start_date: date, end_date: date) -> pd.DataFrame:
        diagnoses = self.db.query(
            DiagnosisResult.fault_category,
            DiagnosisResult.fault_severity,
            func.count(DiagnosisResult.id).label('count')
        ).filter(
            and_(
                DiagnosisResult.diagnosis_date >= start_date,
                DiagnosisResult.diagnosis_date <= end_date
            )
        ).group_by(
            DiagnosisResult.fault_category,
            DiagnosisResult.fault_severity
        ).all()

        df = pd.DataFrame([{
            '故障类别': row.fault_category or '其他',
            '严重程度': row.fault_severity or '未知',
            '数量': row.count
        } for row in diagnoses])
        return df

    def get_order_item_stats(self, start_date: date, end_date: date) -> pd.DataFrame:
        items = self.db.query(
            OrderItem.item_type,
            func.count(OrderItem.id).label('count'),
            func.sum(OrderItem.subtotal).label('total_amount')
        ).join(
            RepairOrder, OrderItem.order_id == RepairOrder.id
        ).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date
            )
        ).group_by(
            OrderItem.item_type
        ).order_by(
            func.sum(OrderItem.subtotal).desc()
        ).all()

        df = pd.DataFrame([{
            '项目类型': row.item_type,
            '数量': row.count,
            '总金额': float(row.total_amount or 0)
        } for row in items])
        return df

    def get_rework_rate(self, start_date: date, end_date: date,
                        caliber_version: str = None) -> Dict:
        if not caliber_version:
            active = self.db.query(ReworkRateCaliberVersion).filter(
                ReworkRateCaliberVersion.is_active == True
            ).first()
            caliber_version = active.version_code if active else "v1.0"

        total_orders = self.db.query(func.count(RepairOrder.id)).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date
            )
        ).scalar()

        rework_count = self.db.query(func.count(ReworkRecord.id)).join(
            RepairOrder, ReworkRecord.rework_order_id == RepairOrder.id
        ).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date,
                ReworkRecord.caliber_version == caliber_version
            )
        ).scalar()

        rate = (rework_count / total_orders * 100) if total_orders > 0 else 0

        return {
            'total_orders': total_orders,
            'rework_count': rework_count,
            'rework_rate': round(rate, 2),
            'caliber_version': caliber_version
        }

    def get_parts_shortage_stats(self, start_date: date, end_date: date) -> Dict:
        total_parts_usage = self.db.query(
            func.count(PartsUsage.id),
            func.sum(PartsUsage.quantity)
        ).join(
            RepairOrder, PartsUsage.order_id == RepairOrder.id
        ).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date
            )
        ).first()

        shortage_stats = self.db.query(
            PartsUsage.part_code,
            PartsUsage.part_name,
            func.count(PartsUsage.id).label('shortage_count'),
            func.sum(PartsUsage.shortage_quantity).label('shortage_qty')
        ).join(
            RepairOrder, PartsUsage.order_id == RepairOrder.id
        ).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date,
                PartsUsage.is_shortage == True
            )
        ).group_by(
            PartsUsage.part_code,
            PartsUsage.part_name
        ).order_by(
            func.count(PartsUsage.id).desc()
        ).limit(20).all()

        total_usage = total_parts_usage[0] if total_parts_usage else 0
        shortage_count = sum(s.shortage_count for s in shortage_stats)
        shortage_rate = (shortage_count / total_usage * 100) if total_usage > 0 else 0

        return {
            'total_parts_usage': total_usage,
            'shortage_count': shortage_count,
            'shortage_rate': round(shortage_rate, 2),
            'top_shortage_parts': [
                {'part_code': s.part_code, 'part_name': s.part_name,
                 'shortage_count': s.shortage_count, 'shortage_qty': float(s.shortage_qty or 0)}
                for s in shortage_stats
            ]
        }

    def get_repair_orders_detail(self, start_date: date, end_date: date,
                                  order_type: str = None,
                                  status: str = None) -> pd.DataFrame:
        query = self.db.query(
            RepairOrder.order_no,
            RepairOrder.appointment_date,
            RepairOrder.actual_arrival_date,
            RepairOrder.order_type,
            RepairOrder.order_status,
            Vehicle.license_plate,
            Vehicle.brand,
            Vehicle.model,
            RepairOrder.service_advisor,
            RepairOrder.technician,
            RepairOrder.total_cost,
            RepairOrder.is_rework
        ).outerjoin(
            Vehicle, RepairOrder.vehicle_id == Vehicle.id
        ).filter(
            and_(
                RepairOrder.appointment_date >= start_date,
                RepairOrder.appointment_date <= end_date
            )
        )

        if order_type:
            query = query.filter(RepairOrder.order_type == order_type)
        if status:
            query = query.filter(RepairOrder.order_status == status)

        query = query.order_by(RepairOrder.appointment_date.desc())

        df = pd.DataFrame([{
            '工单号': r.order_no,
            '预约日期': r.appointment_date,
            '到店日期': r.actual_arrival_date,
            '工单类型': r.order_type,
            '状态': r.order_status,
            '车牌号': r.license_plate or '',
            '品牌': r.brand or '',
            '车型': r.model or '',
            '服务顾问': r.service_advisor or '',
            '技师': r.technician or '',
            '总金额': float(r.total_cost or 0),
            '是否返修': '是' if r.is_rework else '否'
        } for r in query.all()])
        return df

    def get_threshold_config(self, category: str = None) -> List[Dict]:
        query = self.db.query(ThresholdConfig)
        if category:
            query = query.filter(ThresholdConfig.category == category)
        configs = query.order_by(ThresholdConfig.category, ThresholdConfig.config_name).all()
        return [{
            'id': c.id,
            'config_key': c.config_key,
            'config_name': c.config_name,
            'config_value': c.config_value,
            'config_type': c.config_type,
            'category': c.category,
            'description': c.description,
            'updated_by': c.updated_by,
            'updated_at': c.updated_at
        } for c in configs]

    def update_threshold_config(self, config_key: str, config_value: str, updated_by: str = "admin") -> bool:
        config = self.db.query(ThresholdConfig).filter(
            ThresholdConfig.config_key == config_key
        ).first()
        if config:
            config.config_value = config_value
            config.updated_by = updated_by
            self.db.commit()
            return True
        return False

    def get_caliber_versions(self) -> List[Dict]:
        versions = self.db.query(ReworkRateCaliberVersion).order_by(
            ReworkRateCaliberVersion.effective_date.desc()
        ).all()
        return [{
            'id': v.id,
            'version_code': v.version_code,
            'version_name': v.version_name,
            'description': v.description,
            'definition_formula': v.definition_formula,
            'is_active': v.is_active,
            'effective_date': v.effective_date,
            'created_by': v.created_by,
            'change_reason': v.change_reason,
            'created_at': v.created_at
        } for v in versions]

    def get_active_caliber(self) -> Optional[Dict]:
        active = self.db.query(ReworkRateCaliberVersion).filter(
            ReworkRateCaliberVersion.is_active == True
        ).first()
        if active:
            return {
                'version_code': active.version_code,
                'version_name': active.version_name,
                'description': active.description,
                'definition_formula': active.definition_formula
            }
        return None

    def get_review_materials(self, review_type: str = None) -> List[Dict]:
        query = self.db.query(ReviewMaterial)
        if review_type:
            query = query.filter(ReviewMaterial.review_type == review_type)
        materials = query.order_by(ReviewMaterial.review_date.desc()).limit(20).all()
        return [{
            'id': m.id,
            'review_date': m.review_date,
            'review_type': m.review_type,
            'title': m.title,
            'summary': m.summary,
            'key_metrics': m.key_metrics,
            'related_part_codes': m.related_part_codes,
            'related_order_ids': m.related_order_ids,
            'caliber_version': m.caliber_version,
            'status': m.status,
            'created_by': m.created_by,
            'created_at': m.created_at
        } for m in materials]
