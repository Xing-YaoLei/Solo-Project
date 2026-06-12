from datetime import datetime
from decimal import Decimal

import pandas as pd

from db.models import AlertThreshold


def get_thresholds(session, store_code=None, material_code=None):
    query = session.query(AlertThreshold).filter(AlertThreshold.is_active == True)
    if store_code:
        query = query.filter(AlertThreshold.store_code == store_code)
    if material_code:
        query = query.filter(AlertThreshold.material_code == material_code)
    return query.all()


def update_threshold(session, threshold_id, new_value, updated_by):
    threshold = session.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
    if not threshold:
        return None
    threshold.threshold_value = Decimal(str(new_value))
    threshold.updated_by = updated_by
    threshold.updated_at = datetime.utcnow()
    session.flush()
    return threshold


def create_threshold(session, material_code, store_code, threshold_type, threshold_value):
    threshold = AlertThreshold(
        material_code=material_code,
        store_code=store_code,
        threshold_type=threshold_type,
        threshold_value=Decimal(str(threshold_value)),
        is_active=True,
    )
    session.add(threshold)
    session.flush()
    return threshold


def delete_threshold(session, threshold_id):
    threshold = session.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
    if not threshold:
        return None
    threshold.is_active = False
    threshold.updated_at = datetime.utcnow()
    session.flush()
    return threshold


def get_threshold_df(session):
    rows = session.query(AlertThreshold).filter(AlertThreshold.is_active == True).all()
    data = [
        {
            "id": r.id,
            "material_code": r.material_code,
            "store_code": r.store_code,
            "threshold_type": r.threshold_type,
            "threshold_value": float(r.threshold_value) if r.threshold_value else 0.0,
            "is_active": r.is_active,
            "updated_by": r.updated_by,
            "updated_at": r.updated_at,
        }
        for r in rows
    ]
    return pd.DataFrame(data)
