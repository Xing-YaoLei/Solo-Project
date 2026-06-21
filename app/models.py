from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from sqlalchemy import TypeDecorator, String
from sqlalchemy.dialects import postgresql
import json
import uuid

db = SQLAlchemy()


class ArrayType(TypeDecorator):
    impl = String
    cache_ok = True

    def __init__(self, item_type, **kwargs):
        self.item_type = item_type
        super().__init__(**kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(postgresql.ARRAY(self.item_type))
        return dialect.type_descriptor(String())

    def process_bind_param(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return []


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='lawyer')
    department = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    last_login = db.Column(db.DateTime)

    managed_cases = db.relationship('Case', backref='responsible_lawyer',
                                    foreign_keys='Case.responsible_lawyer_id', lazy='dynamic')
    created_share_links = db.relationship('ShareLink', backref='creator',
                                          foreign_keys='ShareLink.created_by', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'department': self.department,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    client_type = db.Column(db.String(20), nullable=False, default='individual')
    name = db.Column(db.String(200), nullable=False, index=True)
    id_card_or_credit_code = db.Column(db.String(50), unique=True)
    contact_person = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(120))
    address = db.Column(db.String(500))
    industry = db.Column(db.String(100))
    risk_level = db.Column(db.String(20), default='normal')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cases = db.relationship('Case', backref='client', lazy='dynamic')
    payments = db.relationship('PaymentTransaction', backref='client', lazy='dynamic')

    __table_args__ = (
        db.Index('idx_client_name_type', 'name', 'client_type'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'client_code': self.client_code,
            'client_type': self.client_type,
            'name': self.name,
            'id_card_or_credit_code': self.id_card_or_credit_code,
            'contact_person': self.contact_person,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'address': self.address,
            'industry': self.industry,
            'risk_level': self.risk_level,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Case(db.Model):
    __tablename__ = 'cases'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    court_case_number = db.Column(db.String(100), index=True)
    case_name = db.Column(db.String(300), nullable=False, index=True)
    case_type = db.Column(db.String(50), nullable=False)
    case_category = db.Column(db.String(50))
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False, index=True)
    opposing_party = db.Column(db.String(200))
    responsible_lawyer_id = db.Column(db.String(36), db.ForeignKey('users.id'), index=True)
    assistant_lawyer_ids = db.Column(ArrayType(db.String(36)))
    entrusted_at = db.Column(db.DateTime, index=True)
    accepted_at = db.Column(db.DateTime, index=True)
    filed_at = db.Column(db.DateTime, index=True)
    closed_at = db.Column(db.DateTime, index=True)
    current_stage = db.Column(db.String(20), nullable=False, default='咨询')
    stage_updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    court = db.Column(db.String(200))
    presiding_judge = db.Column(db.String(100))
    claim_amount = db.Column(db.Numeric(15, 2), default=0)
    judged_amount = db.Column(db.Numeric(15, 2))
    risk_assessment = db.Column(db.String(20), default='medium')
    case_summary = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='active')
    jurisdiction = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evidences = db.relationship('Evidence', backref='case', lazy='dynamic',
                                cascade='all, delete-orphan')
    hearings = db.relationship('Hearing', backref='case', lazy='dynamic',
                               cascade='all, delete-orphan')
    payments = db.relationship('PaymentTransaction', backref='case', lazy='dynamic')
    stage_history = db.relationship('CaseStageHistory', backref='case', lazy='dynamic',
                                    cascade='all, delete-orphan')
    share_links = db.relationship('ShareLink', backref='case', lazy='dynamic')

    __table_args__ = (
        db.Index('idx_case_status_stage', 'status', 'current_stage'),
        db.Index('idx_case_lawyer_stage', 'responsible_lawyer_id', 'current_stage'),
    )

    def to_dict(self, include_finance=True):
        data = {
            'id': self.id,
            'case_number': self.case_number,
            'court_case_number': self.court_case_number,
            'case_name': self.case_name,
            'case_type': self.case_type,
            'case_category': self.case_category,
            'client_id': self.client_id,
            'client_name': self.client.name if self.client else None,
            'opposing_party': self.opposing_party,
            'responsible_lawyer_id': self.responsible_lawyer_id,
            'responsible_lawyer_name': self.responsible_lawyer.full_name if self.responsible_lawyer else None,
            'entrusted_at': self.entrusted_at.isoformat() if self.entrusted_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'filed_at': self.filed_at.isoformat() if self.filed_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'current_stage': self.current_stage,
            'stage_updated_at': self.stage_updated_at.isoformat() if self.stage_updated_at else None,
            'court': self.court,
            'presiding_judge': self.presiding_judge,
            'risk_assessment': self.risk_assessment,
            'case_summary': self.case_summary,
            'status': self.status,
            'jurisdiction': self.jurisdiction,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_finance:
            data['claim_amount'] = float(self.claim_amount) if self.claim_amount else 0
            data['judged_amount'] = float(self.judged_amount) if self.judged_amount else None
        return data


class CaseStageHistory(db.Model):
    __tablename__ = 'case_stage_history'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False, index=True)
    from_stage = db.Column(db.String(20))
    to_stage = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    changed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'from_stage': self.from_stage,
            'to_stage': self.to_stage,
            'changed_by': self.changed_by,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
            'notes': self.notes,
        }


class Evidence(db.Model):
    __tablename__ = 'evidences'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False, index=True)
    evidence_code = db.Column(db.String(50), unique=True, nullable=False)
    evidence_name = db.Column(db.String(300), nullable=False)
    evidence_type = db.Column(db.String(50))
    evidence_category = db.Column(db.String(50))
    source_email_id = db.Column(db.String(36), db.ForeignKey('emails.id'))
    file_path = db.Column(db.String(500))
    file_name = db.Column(db.String(300))
    file_size = db.Column(db.Integer)
    file_hash = db.Column(db.String(64))
    page_count = db.Column(db.Integer)
    status = db.Column(db.String(20), nullable=False, default='已收集')
    submitted_to_court = db.Column(db.Boolean, default=False)
    submitted_at = db.Column(db.DateTime)
    authenticity_score = db.Column(db.Float)
    relevance_score = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    source_email = db.relationship('Email', backref='evidences')

    __table_args__ = (
        db.Index('idx_evidence_case_status', 'case_id', 'status'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'case_name': self.case.case_name if self.case else None,
            'evidence_code': self.evidence_code,
            'evidence_name': self.evidence_name,
            'evidence_type': self.evidence_type,
            'evidence_category': self.evidence_category,
            'source_email_id': self.source_email_id,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'file_hash': self.file_hash,
            'page_count': self.page_count,
            'status': self.status,
            'submitted_to_court': self.submitted_to_court,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'authenticity_score': self.authenticity_score,
            'relevance_score': self.relevance_score,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Hearing(db.Model):
    __tablename__ = 'hearings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False, index=True)
    hearing_round = db.Column(db.Integer, default=1)
    hearing_type = db.Column(db.String(50))
    scheduled_at = db.Column(db.DateTime, nullable=False, index=True)
    scheduled_end_at = db.Column(db.DateTime)
    actual_started_at = db.Column(db.DateTime)
    actual_ended_at = db.Column(db.DateTime)
    court_room = db.Column(db.String(100))
    presiding_judge = db.Column(db.String(100))
    judge_panel = db.Column(ArrayType(db.String(100)))
    courtroom = db.Column(db.String(100))
    attending_lawyers = db.Column(ArrayType(db.String(36)))
    location = db.Column(db.String(300))
    online_link = db.Column(db.String(500))
    status = db.Column(db.String(20), nullable=False, default='已排期')
    anomalies = db.Column(ArrayType(db.String(100)))
    preparation_status = db.Column(db.String(20), default='未开始')
    checklist = db.Column(db.JSON)
    notes = db.Column(db.Text)
    calendar_event_id = db.Column(db.String(36))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_hearing_status_time', 'status', 'scheduled_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'case_name': self.case.case_name if self.case else None,
            'case_number': self.case.case_number if self.case else None,
            'hearing_round': self.hearing_round,
            'hearing_type': self.hearing_type,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'scheduled_end_at': self.scheduled_end_at.isoformat() if self.scheduled_end_at else None,
            'actual_started_at': self.actual_started_at.isoformat() if self.actual_started_at else None,
            'actual_ended_at': self.actual_ended_at.isoformat() if self.actual_ended_at else None,
            'court_room': self.court_room,
            'presiding_judge': self.presiding_judge,
            'judge_panel': self.judge_panel,
            'attending_lawyers': self.attending_lawyers,
            'location': self.location,
            'online_link': self.online_link,
            'status': self.status,
            'anomalies': self.anomalies or [],
            'preparation_status': self.preparation_status,
            'checklist': self.checklist,
            'notes': self.notes,
            'calendar_event_id': self.calendar_event_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class PaymentTransaction(db.Model):
    __tablename__ = 'payment_transactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    txn_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False, index=True)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False, index=True)
    contract_amount = db.Column(db.Numeric(15, 2), default=0)
    payment_stage = db.Column(db.String(50))
    scheduled_amount = db.Column(db.Numeric(15, 2), default=0)
    actual_amount = db.Column(db.Numeric(15, 2), default=0)
    currency = db.Column(db.String(10), default='CNY')
    payment_method = db.Column(db.String(50))
    source = db.Column(db.String(50))
    payer_account = db.Column(db.String(100))
    payee_account = db.Column(db.String(100))
    bank_ref = db.Column(db.String(100))
    scheduled_date = db.Column(db.Date, index=True)
    actual_date = db.Column(db.Date, index=True)
    status = db.Column(db.String(20), nullable=False, default='未收款')
    is_overdue = db.Column(db.Boolean, default=False)
    reconciliation_status = db.Column(db.String(20), default='未核对')
    reconciled_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    reconciled_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    statement_file_id = db.Column(db.String(36))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_payment_status_date', 'status', 'actual_date'),
        db.Index('idx_payment_case_status', 'case_id', 'status'),
    )

    def to_dict(self, include_finance=True):
        if include_finance:
            return {
                'id': self.id,
                'txn_id': self.txn_id,
                'case_id': self.case_id,
                'case_number': self.case.case_number if self.case else None,
                'client_id': self.client_id,
                'client_name': self.client.name if self.client else None,
                'contract_amount': float(self.contract_amount) if self.contract_amount else 0,
                'payment_stage': self.payment_stage,
                'scheduled_amount': float(self.scheduled_amount) if self.scheduled_amount else 0,
                'actual_amount': float(self.actual_amount) if self.actual_amount else 0,
                'currency': self.currency,
                'payment_method': self.payment_method,
                'source': self.source,
                'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
                'actual_date': self.actual_date.isoformat() if self.actual_date else None,
                'status': self.status,
                'is_overdue': self.is_overdue,
                'reconciliation_status': self.reconciliation_status,
                'notes': self.notes,
                'created_at': self.created_at.isoformat() if self.created_at else None,
            }
        else:
            return {
                'id': self.id,
                'case_id': self.case_id,
                'payment_stage': self.payment_stage,
                'status': self.status,
                'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            }


class Email(db.Model):
    __tablename__ = 'emails'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = db.Column(db.String(300), unique=True, index=True)
    subject = db.Column(db.String(500))
    sender = db.Column(db.String(200))
    sender_name = db.Column(db.String(200))
    recipients = db.Column(ArrayType(db.String(200)))
    cc_recipients = db.Column(ArrayType(db.String(200)))
    sent_at = db.Column(db.DateTime, index=True)
    received_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    body_text = db.Column(db.Text)
    body_html = db.Column(db.Text)
    has_attachments = db.Column(db.Boolean, default=False)
    attachment_count = db.Column(db.Integer, default=0)
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), index=True)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), index=True)
    auto_classified = db.Column(db.Boolean, default=False)
    classification_confidence = db.Column(db.Float)
    labels = db.Column(ArrayType(db.String(50)))
    processed = db.Column(db.Boolean, default=False)
    processed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    attachments = db.relationship('EmailAttachment', backref='email',
                                  cascade='all, delete-orphan', lazy='dynamic')

    __table_args__ = (
        db.Index('idx_email_case_received', 'case_id', 'received_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'message_id': self.message_id,
            'subject': self.subject,
            'sender': self.sender,
            'sender_name': self.sender_name,
            'recipients': self.recipients,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'has_attachments': self.has_attachments,
            'attachment_count': self.attachment_count,
            'case_id': self.case_id,
            'client_id': self.client_id,
            'labels': self.labels or [],
            'processed': self.processed,
        }


class EmailAttachment(db.Model):
    __tablename__ = 'email_attachments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = db.Column(db.String(36), db.ForeignKey('emails.id'), nullable=False, index=True)
    file_name = db.Column(db.String(300), nullable=False)
    file_path = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    file_hash = db.Column(db.String(64))
    mime_type = db.Column(db.String(100))
    content_preview = db.Column(db.Text)
    linked_evidence_id = db.Column(db.String(36), db.ForeignKey('evidences.id'))
    linked_case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), index=True)
    extracted_text = db.Column(db.Text)
    ocr_applied = db.Column(db.Boolean, default=False)
    auto_classified = db.Column(db.Boolean, default=False)
    classification = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email_id': self.email_id,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'linked_evidence_id': self.linked_evidence_id,
            'linked_case_id': self.linked_case_id,
            'ocr_applied': self.ocr_applied,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_uid = db.Column(db.String(300), unique=True, index=True)
    title = db.Column(db.String(500))
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False, index=True)
    end_time = db.Column(db.DateTime)
    location = db.Column(db.String(500))
    attendees = db.Column(db.JSON)
    organizer = db.Column(db.String(200))
    event_type = db.Column(db.String(50), default='other')
    linked_hearing_id = db.Column(db.String(36), db.ForeignKey('hearings.id'), index=True)
    linked_case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), index=True)
    is_all_day = db.Column(db.Boolean, default=False)
    recurrence_rule = db.Column(db.String(300))
    status = db.Column(db.String(20), default='confirmed')
    source = db.Column(db.String(50))
    last_synced_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    linked_hearing = db.relationship('Hearing', foreign_keys=[linked_hearing_id])

    def to_dict(self):
        return {
            'id': self.id,
            'event_uid': self.event_uid,
            'title': self.title,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'location': self.location,
            'event_type': self.event_type,
            'linked_hearing_id': self.linked_hearing_id,
            'linked_case_id': self.linked_case_id,
            'is_all_day': self.is_all_day,
            'status': self.status,
            'source': self.source,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
        }


class ShareLink(db.Model):
    __tablename__ = 'share_links'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    link_type = db.Column(db.String(20), nullable=False, default='case')
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), index=True)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), index=True)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    role_scope = db.Column(db.String(20), nullable=False, default='client')
    can_view_finance = db.Column(db.Boolean, default=False)
    can_download = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    max_views = db.Column(db.Integer)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked_at = db.Column(db.DateTime)
    revoked_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    notes = db.Column(db.String(500))

    views = db.relationship('ShareLinkView', backref='share_link',
                            cascade='all, delete-orphan', lazy='dynamic')

    def is_valid(self):
        if self.revoked_at is not None:
            return False
        if self.expires_at < datetime.utcnow():
            return False
        if self.max_views and self.view_count >= self.max_views:
            return False
        return True

    def to_dict(self):
        return {
            'id': self.id,
            'token': self.token,
            'link_type': self.link_type,
            'case_id': self.case_id,
            'client_id': self.client_id,
            'created_by': self.created_by,
            'role_scope': self.role_scope,
            'can_view_finance': self.can_view_finance,
            'can_download': self.can_download,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'max_views': self.max_views,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_valid': self.is_valid(),
        }


class ShareLinkView(db.Model):
    __tablename__ = 'share_link_views'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    share_link_id = db.Column(db.String(36), db.ForeignKey('share_links.id'), nullable=False, index=True)
    viewer_ip = db.Column(db.String(50))
    viewer_ua = db.Column(db.String(500))
    viewer_identifier = db.Column(db.String(100))
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'share_link_id': self.share_link_id,
            'viewer_ip': self.viewer_ip,
            'viewer_identifier': self.viewer_identifier,
            'viewed_at': self.viewed_at.isoformat() if self.viewed_at else None,
        }


class DataRefreshLog(db.Model):
    __tablename__ = 'data_refresh_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    refresh_type = db.Column(db.String(50), nullable=False)
    source = db.Column(db.String(50))
    records_processed = db.Column(db.Integer, default=0)
    records_added = db.Column(db.Integer, default=0)
    records_updated = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    finished_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), nullable=False, default='running')
    error_message = db.Column(db.Text)
    triggered_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    celery_task_id = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'refresh_type': self.refresh_type,
            'source': self.source,
            'records_processed': self.records_processed,
            'records_added': self.records_added,
            'records_updated': self.records_updated,
            'records_failed': self.records_failed,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'finished_at': self.finished_at.isoformat() if self.finished_at else None,
            'status': self.status,
            'error_message': self.error_message,
        }


class DashboardMaterializedView(db.Model):
    __tablename__ = 'dashboard_mv'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    view_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    last_refreshed = db.Column(db.DateTime, default=datetime.utcnow)
    refresh_duration_ms = db.Column(db.Integer)
    row_count = db.Column(db.Integer, default=0)
    data_json = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'view_name': self.view_name,
            'last_refreshed': self.last_refreshed.isoformat() if self.last_refreshed else None,
            'refresh_duration_ms': self.refresh_duration_ms,
            'row_count': self.row_count,
        }
