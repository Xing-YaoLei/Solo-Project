from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID
import enum
from .database import Base


class ImportSource(enum.Enum):
    POS = "pos"
    MEMBER = "member"
    INSURANCE = "insurance"


class BatchStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(enum.Enum):
    MANAGEMENT = "management"
    EXECUTOR = "executor"
    PHARMACIST = "pharmacist"


class PrescriptionStatus(enum.Enum):
    RECEIVED = "received"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_CLARIFICATION = "needs_clarification"
    FOLLOW_UP = "follow_up"


class PharmacistOpinion(enum.Enum):
    PASSED = "passed"
    DOSE_ISSUE = "dose_issue"
    INTERACTION_WARNING = "interaction_warning"
    DUPLICATE_THERAPY = "duplicate_therapy"
    CONTRAINDICATION = "contraindication"
    INCOMPLETE_INFO = "incomplete_info"
    PHOTO_UNCLEAR = "photo_unclear"


class FollowUpStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_no = Column(String(50), unique=True, nullable=False, index=True)
    source = Column(Enum(ImportSource), nullable=False, index=True)
    status = Column(Enum(BatchStatus), default=BatchStatus.PENDING, nullable=False)
    total_records = Column(Integer, default=0)
    success_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    file_name = Column(String(255))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    error_message = Column(Text)

    user = relationship("User", back_populates="batches")
    prescriptions = relationship("Prescription", back_populates="batch")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime)

    pharmacy = relationship("Pharmacy", back_populates="users")
    batches = relationship("ImportBatch", back_populates="user")
    reviews = relationship("PharmacistReview", back_populates="pharmacist")
    notes = relationship("PrescriptionNote", back_populates="author")
    assigned_follow_ups = relationship("FollowUp", foreign_keys="FollowUp.assigned_to", back_populates="assignee")


class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="pharmacy")
    members = relationship("Member", back_populates="pharmacy")
    prescriptions = relationship("Prescription", back_populates="pharmacy")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_no = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    birth_date = Column(Date)
    phone = Column(String(20))
    id_card = Column(String(20))
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"))
    insurance_no = Column(String(50))
    insurance_type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra = Column(JSONB, default={})

    pharmacy = relationship("Pharmacy", back_populates="members")
    prescriptions = relationship("Prescription", back_populates="member")
    insurance_settlements = relationship("InsuranceSettlement", back_populates="member")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_no = Column(String(50), unique=True, nullable=False, index=True)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"))
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    pos_order_no = Column(String(50), index=True)
    patient_name = Column(String(100))
    doctor_name = Column(String(100))
    hospital = Column(String(200))
    prescription_date = Column(Date, index=True)
    review_date = Column(DateTime)
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.RECEIVED, nullable=False, index=True)
    total_amount = Column(Float, default=0.0)
    insurance_amount = Column(Float, default=0.0)
    self_pay_amount = Column(Float, default=0.0)
    photo_count = Column(Integer, default=0)
    has_unclear_photo = Column(Boolean, default=False)
    extra = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pharmacy = relationship("Pharmacy", back_populates="prescriptions")
    member = relationship("Member", back_populates="prescriptions")
    batch = relationship("ImportBatch", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")
    photos = relationship("PrescriptionPhoto", back_populates="prescription", cascade="all, delete-orphan")
    reviews = relationship("PharmacistReview", back_populates="prescription", cascade="all, delete-orphan")
    notes = relationship("PrescriptionNote", back_populates="prescription", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="prescription", cascade="all, delete-orphan")
    insurance_settlement = relationship("InsuranceSettlement", back_populates="prescription", uselist=False)


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    drug_code = Column(String(50), index=True)
    drug_name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    specification = Column(String(100))
    batch_no = Column(String(50), index=True)
    expiry_date = Column(Date, index=True)
    quantity = Column(Float, default=0.0)
    unit = Column(String(20))
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    dosage = Column(String(200))
    frequency = Column(String(100))
    days_supply = Column(Integer)

    prescription = relationship("Prescription", back_populates="items")


class PrescriptionPhoto(Base):
    __tablename__ = "prescription_photos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    photo_url = Column(String(500))
    photo_type = Column(String(50))
    quality_score = Column(Float)
    is_clear = Column(Boolean, default=True)
    page_no = Column(Integer, default=1)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prescription = relationship("Prescription", back_populates="photos")


class PharmacistReview(Base):
    __tablename__ = "pharmacist_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    pharmacist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opinion = Column(Enum(PharmacistOpinion), nullable=False)
    comment = Column(Text)
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prescription = relationship("Prescription", back_populates="reviews")
    pharmacist = relationship("User", back_populates="reviews")


class PrescriptionNote(Base):
    __tablename__ = "prescription_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_type = Column(String(50), default="clarification")
    content = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime)

    prescription = relationship("Prescription", back_populates="notes")
    author = relationship("User", back_populates="notes")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(FollowUpStatus), default=FollowUpStatus.PENDING, nullable=False, index=True)
    priority = Column(Integer, default=0)
    follow_up_type = Column(String(100))
    content = Column(Text)
    result = Column(Text)
    due_date = Column(Date, index=True)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prescription = relationship("Prescription", back_populates="follow_ups")
    assignee = relationship("User", back_populates="assigned_follow_ups")


class InsuranceSettlement(Base):
    __tablename__ = "insurance_settlements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, unique=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    settlement_no = Column(String(50), unique=True, index=True)
    insurance_type = Column(String(50))
    total_cost = Column(Float, default=0.0)
    insurance_pay = Column(Float, default=0.0)
    individual_pay = Column(Float, default=0.0)
    settlement_date = Column(Date, index=True)
    is_settled = Column(Boolean, default=False)
    extra = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prescription = relationship("Prescription", back_populates="insurance_settlement")
    member = relationship("Member", back_populates="insurance_settlements")
