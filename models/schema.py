from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Numeric,
    Integer,
    DateTime,
    Text,
    ForeignKey,
    create_engine,
    event,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.engine import Engine
from config import DATABASE_URL


Base = declarative_base()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


def _now():
    return datetime.now()


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True)
    name = Column(String(256), nullable=False)
    address = Column(String(512))
    client_name = Column(String(128))
    client_phone = Column(String(32))
    status = Column(String(32), default="active")
    created_at = Column(DateTime, default=_now)

    contracts = relationship("Contract", back_populates="project")
    payment_records = relationship("PaymentRecord", back_populates="project")
    purchase_orders = relationship("PurchaseOrder", back_populates="project")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    contract_no = Column(String(128), unique=True, nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    signed_date = Column(DateTime)
    attachment_path = Column(Text)
    remarks = Column(Text)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=_now)

    project = relationship("Project", back_populates="contracts")
    payment_records = relationship("PaymentRecord", back_populates="contract")


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    contract_id = Column(String(64), ForeignKey("contracts.id"))
    payment_no = Column(String(128), unique=True, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_type = Column(String(32))
    payment_method = Column(String(32))
    payment_date = Column(DateTime)
    payer_name = Column(String(128))
    receiver_name = Column(String(128))
    status = Column(String(32), default="pending")
    remarks = Column(Text)
    created_at = Column(DateTime, default=_now)

    project = relationship("Project", back_populates="payment_records")
    contract = relationship("Contract", back_populates="payment_records")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    po_no = Column(String(128), nullable=False)
    version = Column(Integer, default=1)
    supplier_name = Column(String(256))
    total_amount = Column(Numeric(14, 2), nullable=False)
    order_date = Column(DateTime)
    status = Column(String(32), default="draft")
    created_at = Column(DateTime, default=_now)

    project = relationship("Project", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(String(64), primary_key=True)
    po_id = Column(String(64), ForeignKey("purchase_orders.id"), nullable=False)
    room = Column(String(128))
    material_name = Column(String(256), nullable=False)
    spec = Column(String(256))
    qty = Column(Numeric(14, 4), nullable=False)
    unit = Column(String(32))
    price = Column(Numeric(14, 2), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    category = Column(String(64))

    purchase_order = relationship("PurchaseOrder", back_populates="items")


class DesignExportItem(Base):
    __tablename__ = "design_export_items"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    export_batch = Column(String(64), nullable=False)
    room_name = Column(String(128))
    item_name = Column(String(256), nullable=False)
    quantity = Column(Numeric(14, 4), nullable=False)
    unit = Column(String(32))
    unit_price = Column(Numeric(14, 2), nullable=False)
    total_price = Column(Numeric(14, 2), nullable=False)
    created_at = Column(DateTime, default=_now)


class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    po_id = Column(String(64), ForeignKey("purchase_orders.id"))
    design_item_id = Column(String(64), ForeignKey("design_export_items.id"))
    status = Column(String(32), nullable=False)
    internal_amount = Column(Numeric(14, 2))
    design_amount = Column(Numeric(14, 2))
    diff_amount = Column(Numeric(14, 2))
    gap_flag = Column(Integer, default=0)
    remarks = Column(Text)
    created_at = Column(DateTime, default=_now)


@event.listens_for(Engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, connection_record):
    if "sqlite" in str(type(dbapi_connection)).lower():
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


def init_db():
    Base.metadata.create_all(engine)
