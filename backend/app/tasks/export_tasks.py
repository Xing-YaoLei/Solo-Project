from typing import Any, Dict, Optional

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services import ExportService


@celery_app.task(bind=True, name="export_sampling_records")
def export_sampling_records_task(
    self,
    export_format: str = "excel",
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        filepath, filename = ExportService.export_sampling_records(
            db=db,
            export_format=export_format,
            filters=filters
        )
        return {
            "status": "success",
            "filepath": filepath,
            "filename": filename,
            "entity_type": "sampling",
            "format": export_format
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "entity_type": "sampling",
            "format": export_format
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="export_rectification_plans")
def export_rectification_plans_task(
    self,
    export_format: str = "excel",
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        filepath, filename = ExportService.export_rectification_plans(
            db=db,
            export_format=export_format,
            filters=filters
        )
        return {
            "status": "success",
            "filepath": filepath,
            "filename": filename,
            "entity_type": "rectification",
            "format": export_format
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "entity_type": "rectification",
            "format": export_format
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="export_exception_orders")
def export_exception_orders_task(
    self,
    export_format: str = "excel",
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        filepath, filename = ExportService.export_exception_orders(
            db=db,
            export_format=export_format,
            filters=filters
        )
        return {
            "status": "success",
            "filepath": filepath,
            "filename": filename,
            "entity_type": "exception",
            "format": export_format
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "entity_type": "exception",
            "format": export_format
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="export_generic")
def export_generic_task(
    self,
    entity_type: str,
    export_format: str = "excel",
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if entity_type == "sampling":
        return export_sampling_records_task(export_format=export_format, filters=filters)
    elif entity_type == "rectification":
        return export_rectification_plans_task(export_format=export_format, filters=filters)
    elif entity_type == "exception":
        return export_exception_orders_task(export_format=export_format, filters=filters)
    else:
        return {
            "status": "failed",
            "error": f"Unknown entity_type: {entity_type}",
            "entity_type": entity_type,
            "format": export_format
        }
