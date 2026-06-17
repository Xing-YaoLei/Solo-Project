from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy.orm import Session

from app.models.batch import ImportBatch
from app.schemas.batch import ImportBatchCreate
from app.services.crm_service import CRMService
from app.services.payment_service import PaymentService
from app.services.contract_service import ContractService
from app.schemas.crm import CRMCustomerCreate, PropertyCreate
from app.schemas.payment import PaymentTransactionCreate
from app.schemas.contract import EContractCreate
from app.schemas.inspection import InspectionRecordCreate
from app.schemas.repair import RepairOrderCreate
from app.schemas.comment import ComplaintCreate


class ImportService:
    def __init__(self, db: Session):
        self.db = db
        self.crm_service = CRMService(db)
        self.payment_service = PaymentService(db)
        self.contract_service = ContractService(db)

    def create_batch(self, source_type: str, file_name: str, imported_by: int, remark: Optional[str] = None) -> ImportBatch:
        batch_no = f"BATCH-{source_type.upper()}-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        batch_in = ImportBatchCreate(
            batch_no=batch_no,
            source_type=source_type,
            status="processing",
            file_name=file_name,
            imported_by=imported_by,
            remark=remark,
            record_count=0
        )
        db_batch = ImportBatch(**batch_in.model_dump())
        self.db.add(db_batch)
        self.db.commit()
        self.db.refresh(db_batch)
        return db_batch

    def update_batch_status(self, batch_id: int, status: str, record_count: int = 0, remark: Optional[str] = None) -> Optional[ImportBatch]:
        batch = self.db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
        if batch:
            batch.status = status
            batch.record_count = record_count
            if remark:
                batch.remark = remark
            self.db.commit()
            self.db.refresh(batch)
        return batch

    def import_data(
        self,
        source_type: str,
        data: Dict[str, Any],
        file_name: str,
        imported_by: int,
        remark: Optional[str] = None
    ) -> ImportBatch:
        batch = self.create_batch(source_type, file_name, imported_by, remark)
        record_count = 0

        try:
            if source_type == "crm":
                customers_data = data.get("customers", [])
                properties_data = data.get("properties", [])
                
                customers = [CRMCustomerCreate(**{**c, "batch_id": batch.id}) for c in customers_data]
                properties = [PropertyCreate(**{**p, "batch_id": batch.id}) for p in properties_data]
                
                self.crm_service.bulk_create_customers(customers)
                self.crm_service.bulk_create_properties(properties)
                record_count = len(customers) + len(properties)

            elif source_type == "payment":
                transactions_data = data.get("transactions", [])
                transactions = [PaymentTransactionCreate(**{**t, "batch_id": batch.id}) for t in transactions_data]
                self.payment_service.bulk_create_transactions(transactions)
                record_count = len(transactions)

            elif source_type == "contract":
                contracts_data = data.get("contracts", [])
                contracts = [EContractCreate(**{**c, "batch_id": batch.id}) for c in contracts_data]
                self.contract_service.bulk_create_contracts(contracts)
                record_count = len(contracts)

            elif source_type == "inspection":
                inspections_data = data.get("inspections", [])
                for ins in inspections_data:
                    ins["batch_id"] = batch.id
                    self.db.execute(
                        """
                        INSERT INTO inspection_records 
                        (inspection_no, contract_id, property_id, customer_id, inspector_id, 
                         apply_date, inspection_date, status, water_reading, electricity_reading, 
                         gas_reading, has_damage, damage_description, batch_id)
                        VALUES 
                        (:inspection_no, :contract_id, :property_id, :customer_id, :inspector_id,
                         :apply_date, :inspection_date, :status, :water_reading, :electricity_reading,
                         :gas_reading, :has_damage, :damage_description, :batch_id)
                        """,
                        ins
                    )
                record_count = len(inspections_data)
                self.db.commit()

            elif source_type == "repair":
                repairs_data = data.get("repairs", [])
                for r in repairs_data:
                    r["batch_id"] = batch.id
                    self.db.execute(
                        """
                        INSERT INTO repair_orders
                        (repair_no, property_id, reporter_id, worker_id, repair_type, description,
                         report_time, assign_time, start_time, complete_time, status, duration_hours,
                         caliber_version, batch_id)
                        VALUES
                        (:repair_no, :property_id, :reporter_id, :worker_id, :repair_type, :description,
                         :report_time, :assign_time, :start_time, :complete_time, :status, :duration_hours,
                         :caliber_version, :batch_id)
                        """,
                        r
                    )
                record_count = len(repairs_data)
                self.db.commit()

            batch = self.update_batch_status(batch.id, "completed", record_count)

        except Exception as e:
            batch = self.update_batch_status(batch.id, "failed", record_count, remark=str(e))
            raise

        return batch

    def list_batches(
        self,
        source_type: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ImportBatch]:
        query = self.db.query(ImportBatch)
        if source_type:
            query = query.filter(ImportBatch.source_type == source_type)
        if status:
            query = query.filter(ImportBatch.status == status)
        return query.order_by(ImportBatch.created_at.desc()).offset(skip).limit(limit).all()

    def get_batch(self, batch_id: int) -> Optional[ImportBatch]:
        return self.db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
