from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, Date, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from config import Config
from datetime import datetime

Base = declarative_base()

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(Config.DATABASE_URL)
    return _engine


def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def __getattr__(name):
    if name == 'engine':
        return get_engine()
    elif name == 'SessionLocal':
        return get_session_local()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


class Store(Base):
    __tablename__ = 'stores'
    id = Column(Integer, primary_key=True)
    store_code = Column(String(50), unique=True, nullable=False)
    store_name = Column(String(200), nullable=False)
    address = Column(String(500))
    phone = Column(String(20))
    manager = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Member(Base):
    __tablename__ = 'members'
    id = Column(Integer, primary_key=True)
    member_card_no = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    birthday = Column(Date)
    phone = Column(String(20))
    id_card = Column(String(20))
    address = Column(String(500))
    chronic_disease = Column(String(200))
    allergy_history = Column(String(500))
    member_level = Column(String(20))
    register_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Drug(Base):
    __tablename__ = 'drugs'
    id = Column(Integer, primary_key=True)
    drug_code = Column(String(50), unique=True, nullable=False)
    drug_name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    specification = Column(String(200))
    manufacturer = Column(String(200))
    dosage_form = Column(String(50))
    category = Column(String(100))
    is_prescription = Column(Boolean, default=False)
    unit = Column(String(20))
    price = Column(Float)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Inventory(Base):
    __tablename__ = 'inventory'
    id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey('stores.id'))
    drug_id = Column(Integer, ForeignKey('drugs.id'))
    batch_no = Column(String(100), nullable=False)
    production_date = Column(Date)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float)
    replenishment_order_id = Column(Integer, ForeignKey('replenishment_orders.id'))
    received_date = Column(Date)
    supplier = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    store = relationship('Store')
    drug = relationship('Drug')
    replenishment_order = relationship('ReplenishmentOrder')


class ReplenishmentOrder(Base):
    __tablename__ = 'replenishment_orders'
    id = Column(Integer, primary_key=True)
    order_no = Column(String(50), unique=True, nullable=False)
    store_id = Column(Integer, ForeignKey('stores.id'))
    supplier = Column(String(200))
    order_date = Column(Date)
    expected_date = Column(Date)
    actual_date = Column(Date)
    status = Column(String(20))
    total_amount = Column(Float)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    store = relationship('Store')
    items = relationship('ReplenishmentOrderItem', back_populates='order')


class ReplenishmentOrderItem(Base):
    __tablename__ = 'replenishment_order_items'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('replenishment_orders.id'))
    drug_id = Column(Integer, ForeignKey('drugs.id'))
    batch_no = Column(String(100))
    production_date = Column(Date)
    expiry_date = Column(Date)
    order_quantity = Column(Integer)
    received_quantity = Column(Integer)
    unit_price = Column(Float)
    subtotal = Column(Float)
    created_at = Column(DateTime, default=datetime.now)
    order = relationship('ReplenishmentOrder', back_populates='items')
    drug = relationship('Drug')


class CashierRecord(Base):
    __tablename__ = 'cashier_records'
    id = Column(Integer, primary_key=True)
    receipt_no = Column(String(50), unique=True, nullable=False)
    store_id = Column(Integer, ForeignKey('stores.id'))
    member_id = Column(Integer, ForeignKey('members.id'))
    cashier = Column(String(100))
    sale_time = Column(DateTime, nullable=False)
    total_amount = Column(Float)
    payment_method = Column(String(20))
    insurance_amount = Column(Float)
    self_pay_amount = Column(Float)
    is_insurance_settled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    store = relationship('Store')
    member = relationship('Member')
    items = relationship('CashierRecordItem', back_populates='cashier_record')
    insurance_record = relationship('InsuranceRecord', uselist=False, back_populates='cashier_record')


class CashierRecordItem(Base):
    __tablename__ = 'cashier_record_items'
    id = Column(Integer, primary_key=True)
    cashier_record_id = Column(Integer, ForeignKey('cashier_records.id'))
    drug_id = Column(Integer, ForeignKey('drugs.id'))
    inventory_id = Column(Integer, ForeignKey('inventory.id'))
    batch_no = Column(String(100))
    quantity = Column(Integer)
    unit_price = Column(Float)
    subtotal = Column(Float)
    is_prescription = Column(Boolean, default=False)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    created_at = Column(DateTime, default=datetime.now)
    cashier_record = relationship('CashierRecord', back_populates='items')
    drug = relationship('Drug')
    inventory = relationship('Inventory')
    prescription = relationship('Prescription')


class InsuranceRecord(Base):
    __tablename__ = 'insurance_records'
    id = Column(Integer, primary_key=True)
    insurance_no = Column(String(50), unique=True, nullable=False)
    cashier_record_id = Column(Integer, ForeignKey('cashier_records.id'))
    store_id = Column(Integer, ForeignKey('stores.id'))
    member_id = Column(Integer, ForeignKey('members.id'))
    settlement_time = Column(DateTime)
    insurance_type = Column(String(50))
    policy_holder_name = Column(String(100))
    policy_holder_id = Column(String(50))
    total_amount = Column(Float)
    insurance_pay = Column(Float)
    self_pay = Column(Float)
    reimbursement_ratio = Column(Float)
    status = Column(String(20))
    error_message = Column(String(500))
    response_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)
    cashier_record = relationship('CashierRecord', back_populates='insurance_record')
    store = relationship('Store')
    member = relationship('Member')


class Prescription(Base):
    __tablename__ = 'prescriptions'
    id = Column(Integer, primary_key=True)
    prescription_no = Column(String(50), unique=True, nullable=False)
    store_id = Column(Integer, ForeignKey('stores.id'))
    member_id = Column(Integer, ForeignKey('members.id'))
    cashier_record_id = Column(Integer, ForeignKey('cashier_records.id'))
    doctor_name = Column(String(100))
    hospital = Column(String(200))
    department = Column(String(100))
    diagnosis = Column(String(500))
    prescription_date = Column(Date)
    issue_date = Column(DateTime)
    auditor = Column(String(100))
    audit_time = Column(DateTime)
    audit_status = Column(String(20))
    audit_opinion = Column(Text)
    is_clear = Column(Boolean, default=True)
    unclear_reason = Column(String(500))
    review_status = Column(String(20))
    review_time = Column(DateTime)
    reviewer = Column(String(100))
    review_conclusion = Column(Text)
    is_photo_provided = Column(Boolean, default=False)
    photo_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    store = relationship('Store')
    member = relationship('Member')
    cashier_record = relationship('CashierRecord')
    photos = relationship('PrescriptionPhoto', back_populates='prescription')
    items = relationship('PrescriptionItem', back_populates='prescription')


class PrescriptionItem(Base):
    __tablename__ = 'prescription_items'
    id = Column(Integer, primary_key=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    drug_id = Column(Integer, ForeignKey('drugs.id'))
    drug_name = Column(String(200))
    specification = Column(String(200))
    dosage = Column(String(200))
    frequency = Column(String(100))
    duration = Column(String(100))
    quantity = Column(Integer)
    unit = Column(String(20))
    created_at = Column(DateTime, default=datetime.now)
    prescription = relationship('Prescription', back_populates='items')
    drug = relationship('Drug')


class PrescriptionPhoto(Base):
    __tablename__ = 'prescription_photos'
    id = Column(Integer, primary_key=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    photo_path = Column(String(500))
    file_name = Column(String(200))
    file_size = Column(Integer)
    upload_time = Column(DateTime, default=datetime.now)
    uploaded_by = Column(String(100))
    is_clear = Column(Boolean)
    clarity_score = Column(Float)
    ocr_result = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    prescription = relationship('Prescription', back_populates='photos')


class AuditTask(Base):
    __tablename__ = 'audit_tasks'
    id = Column(Integer, primary_key=True)
    task_no = Column(String(50), unique=True, nullable=False)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    store_id = Column(Integer, ForeignKey('stores.id'))
    task_type = Column(String(50))
    task_reason = Column(String(500))
    task_status = Column(String(20))
    priority = Column(String(20))
    assigned_to = Column(String(100))
    assigned_time = Column(DateTime)
    completed_time = Column(DateTime)
    completed_by = Column(String(100))
    handling_conclusion = Column(Text)
    followup_needed = Column(Boolean, default=False)
    followup_status = Column(String(20))
    followup_time = Column(DateTime)
    followup_result = Column(Text)
    followup_operator = Column(String(100))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    prescription = relationship('Prescription')
    store = relationship('Store')


class FollowupRecord(Base):
    __tablename__ = 'followup_records'
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('audit_tasks.id'))
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    member_id = Column(Integer, ForeignKey('members.id'))
    store_id = Column(Integer, ForeignKey('stores.id'))
    followup_type = Column(String(50))
    followup_channel = Column(String(50))
    followup_time = Column(DateTime)
    followup_operator = Column(String(100))
    contact_result = Column(String(50))
    followup_content = Column(Text)
    member_feedback = Column(Text)
    followup_status = Column(String(20))
    next_followup_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    task = relationship('AuditTask')
    prescription = relationship('Prescription')
    member = relationship('Member')
    store = relationship('Store')


def init_db():
    Base.metadata.create_all(bind=get_engine())


def get_db():
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()
