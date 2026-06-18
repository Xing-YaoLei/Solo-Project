from datetime import datetime
from celery import shared_task
from pathlib import Path
import json

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import DesignExport, Quotation, QuotationItem, Project
from config import Config


@celery_app.task(name="tasks.import_design_export")
def import_design_export_task(file_path: str, project_id: int,
                              software_name: str, imported_by: int = None):
    db = SessionLocal()
    try:
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        parsed = _parse_design_file(file_path_obj)

        export_record = DesignExport(
            project_id=project_id,
            file_name=file_path_obj.name,
            file_path=str(file_path_obj),
            software_name=software_name,
            export_date=datetime.now().date(),
            parsed_data=parsed,
            imported_by=imported_by
        )
        db.add(export_record)
        db.flush()

        if 'items' in parsed and parsed['items']:
            existing_quotations = db.query(Quotation).filter(
                Quotation.project_id == project_id
            ).count()

            quotation = Quotation(
                project_id=project_id,
                quotation_no=f"Q-{project_id}-{existing_quotations + 1:04d}",
                version=f"v{existing_quotations + 1}.0",
                created_by=imported_by
            )
            total = 0
            items = []
            for idx, item in enumerate(parsed['items']):
                qty = float(item.get('quantity', 0))
                price = float(item.get('unit_price', 0))
                subtotal = round(qty * price, 2)
                total += subtotal
                items.append(QuotationItem(
                    category=item.get('category', '未分类'),
                    item_name=item.get('name', f'项目{idx + 1}'),
                    specification=item.get('spec', ''),
                    unit=item.get('unit', '项'),
                    quantity=qty,
                    unit_price=price,
                    subtotal=subtotal
                ))
            quotation.total_amount = round(total, 2)
            quotation.material_cost = round(total * 0.55, 2)
            quotation.labor_cost = round(total * 0.30, 2)
            quotation.management_fee = round(total * 0.10, 2)
            quotation.design_fee = round(total * 0.05, 2)
            quotation.final_amount = round(total, 2)
            quotation.items = items
            db.add(quotation)

        db.commit()
        return {"status": "success", "export_id": export_record.id}

    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


def _parse_design_file(file_path: Path) -> dict:
    suffix = file_path.suffix.lower()

    if suffix == '.json':
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    elif suffix in ['.csv', '.xlsx', '.xls']:
        return _parse_table_design(file_path)
    else:
        return {
            "file_type": suffix,
            "items": [],
            "note": "通用文件格式，需人工确认"
        }


def _parse_table_design(file_path: Path) -> dict:
    try:
        import pandas as pd
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        items = []
        col_map = _find_columns(df.columns)
        for _, row in df.iterrows():
            item = {}
            for k, v in col_map.items():
                if v in df.columns:
                    item[k] = str(row[v]) if pd.notna(row[v]) else ''
            if item.get('name'):
                items.append(item)
        return {"items": items}
    except Exception as e:
        return {"error": str(e), "items": []}


def _find_columns(columns):
    mapping = {}
    for col in columns:
        col_lower = str(col).lower()
        if any(k in col_lower for k in ['name', '项目', '名称']):
            mapping['name'] = col
        elif any(k in col_lower for k in ['category', '分类', '类别']):
            mapping['category'] = col
        elif any(k in col_lower for k in ['spec', '规格', '型号']):
            mapping['spec'] = col
        elif any(k in col_lower for k in ['unit', '单位']):
            mapping['unit'] = col
        elif any(k in col_lower for k in ['qty', '数量']):
            mapping['quantity'] = col
        elif any(k in col_lower for k in ['price', '单价']):
            mapping['unit_price'] = col
    return mapping
