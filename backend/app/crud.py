from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any
from sqlalchemy import and_, or_, func, extract
from sqlalchemy.orm import Session

from app.models import (
    User, Apartment, CleaningSchedule, TimeSlot,
    RescheduleRecord, AttendanceRecord, ConflictRecord,
    CommunicationRecord, ReviewOpinion, CapacityRule,
    UserRole, CleaningStatus, AttendanceStatus, RescheduleReason, RiskLevel
)
from app.schemas import (
    UserCreate, UserUpdate,
    ApartmentCreate, ApartmentUpdate,
    TimeSlotCreate, TimeSlotUpdate,
    CleaningScheduleCreate, CleaningScheduleUpdate,
    RescheduleRecordCreate, AttendanceRecordCreate,
    ConflictRecordCreate, ConflictRecordUpdate,
    CommunicationRecordCreate, ReviewOpinionCreate,
    CapacityRuleCreate
)
from app.security import get_password_hash
from app.utils.scheduler import check_all_conflicts


def create_schedule_code() -> str:
    now = datetime.now()
    return f"CL{now.strftime('%Y%m%d%H%M%S')}{now.microsecond // 1000:03d}"


class CRUDUser:
    def get(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_multi(
        self, db: Session,
        skip: int = 0, limit: int = 100,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None
    ) -> List[User]:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    def get_cleaners(self, db: Session) -> List[User]:
        return db.query(User).filter(
            User.role == UserRole.CLEANER,
            User.is_active == True
        ).order_by(User.full_name).all()

    def create(self, db: Session, obj_in: UserCreate) -> User:
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            role=obj_in.role,
            is_active=obj_in.is_active,
            avatar_url=obj_in.avatar_url,
            skills=obj_in.skills or [],
            hashed_password=get_password_hash(obj_in.password)
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, username: str, password: str) -> Optional[User]:
        from app.security import verify_password
        user = self.get_by_username(db, username)
        if not user:
            user = self.get_by_email(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user


class CRUDApartment:
    def get(self, db: Session, id: int) -> Optional[Apartment]:
        return db.query(Apartment).filter(Apartment.id == id).first()

    def get_by_code(self, db: Session, code: str) -> Optional[Apartment]:
        return db.query(Apartment).filter(Apartment.apartment_code == code).first()

    def get_multi(
        self, db: Session,
        skip: int = 0, limit: int = 100,
        building: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Apartment]:
        query = db.query(Apartment)
        if building:
            query = query.filter(Apartment.building == building)
        if is_active is not None:
            query = query.filter(Apartment.is_active == is_active)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(or_(
                Apartment.apartment_code.ilike(search_pattern),
                Apartment.building.ilike(search_pattern),
                Apartment.unit.ilike(search_pattern),
                Apartment.resident_name.ilike(search_pattern)
            ))
        return query.order_by(Apartment.apartment_code).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: ApartmentCreate) -> Apartment:
        db_obj = Apartment(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Apartment, obj_in: ApartmentUpdate) -> Apartment:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDTimeSlot:
    def get(self, db: Session, id: int) -> Optional[TimeSlot]:
        return db.query(TimeSlot).filter(TimeSlot.id == id).first()

    def get_multi(self, db: Session, is_active: Optional[bool] = None) -> List[TimeSlot]:
        query = db.query(TimeSlot)
        if is_active is not None:
            query = query.filter(TimeSlot.is_active == is_active)
        return query.order_by(TimeSlot.start_time).all()

    def create(self, db: Session, obj_in: TimeSlotCreate) -> TimeSlot:
        db_obj = TimeSlot(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: TimeSlot, obj_in: TimeSlotUpdate) -> TimeSlot:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDCleaningSchedule:
    def get(self, db: Session, id: int) -> Optional[CleaningSchedule]:
        return db.query(CleaningSchedule).filter(CleaningSchedule.id == id).first()

    def get_by_code(self, db: Session, code: str) -> Optional[CleaningSchedule]:
        return db.query(CleaningSchedule).filter(CleaningSchedule.schedule_code == code).first()

    def get_multi(
        self, db: Session,
        skip: int = 0, limit: int = 100,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[CleaningStatus] = None,
        cleaner_id: Optional[int] = None,
        supervisor_id: Optional[int] = None,
        apartment_id: Optional[int] = None,
        has_conflict: Optional[bool] = None,
        risk_level: Optional[RiskLevel] = None
    ) -> List[CleaningSchedule]:
        query = db.query(CleaningSchedule)
        if date_from:
            query = query.filter(CleaningSchedule.scheduled_date >= date_from)
        if date_to:
            query = query.filter(CleaningSchedule.scheduled_date <= date_to)
        if status:
            query = query.filter(CleaningSchedule.status == status)
        if cleaner_id:
            query = query.filter(CleaningSchedule.cleaner_id == cleaner_id)
        if supervisor_id:
            query = query.filter(CleaningSchedule.supervisor_id == supervisor_id)
        if apartment_id:
            query = query.filter(CleaningSchedule.apartment_id == apartment_id)
        if has_conflict is not None:
            query = query.filter(CleaningSchedule.has_conflict == has_conflict)
        if risk_level:
            query = query.filter(CleaningSchedule.risk_level == risk_level)
        return query.order_by(
            CleaningSchedule.scheduled_date.desc(),
            CleaningSchedule.start_time.desc()
        ).offset(skip).limit(limit).all()

    def get_for_user(
        self, db: Session,
        user_id: int,
        user_role: UserRole,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[CleaningStatus] = None
    ) -> List[CleaningSchedule]:
        query = db.query(CleaningSchedule)

        if user_role == UserRole.CLEANER:
            query = query.filter(CleaningSchedule.cleaner_id == user_id)
        elif user_role == UserRole.SUPERVISOR:
            query = query.filter(
                or_(
                    CleaningSchedule.supervisor_id == user_id,
                    CleaningSchedule.supervisor_id == None
                )
            )

        if date_from:
            query = query.filter(CleaningSchedule.scheduled_date >= date_from)
        if date_to:
            query = query.filter(CleaningSchedule.scheduled_date <= date_to)
        if status:
            query = query.filter(CleaningSchedule.status == status)

        return query.order_by(
            CleaningSchedule.scheduled_date.desc(),
            CleaningSchedule.start_time.desc()
        ).all()

    def create(
        self, db: Session,
        obj_in: CleaningScheduleCreate,
        created_by_id: Optional[int] = None
    ) -> CleaningSchedule:
        schedule_code = create_schedule_code()

        conflict_result = check_all_conflicts(
            db,
            apartment_id=obj_in.apartment_id,
            start_time=obj_in.start_time,
            end_time=obj_in.end_time,
            cleaner_id=obj_in.cleaner_id,
            time_slot_id=obj_in.time_slot_id
        )

        db_obj = CleaningSchedule(
            **obj_in.model_dump(),
            schedule_code=schedule_code,
            status=CleaningStatus.PENDING,
            attendance_status=AttendanceStatus.NOT_STARTED,
            has_conflict=conflict_result["has_conflict"],
            risk_level=conflict_result.get("overall_risk_level"),
            conflict_details={
                "conflicts": conflict_result["conflicts"],
                "warnings": conflict_result["capacity_warnings"]
            } if conflict_result["has_conflict"] else None,
            created_by_id=created_by_id
        )
        db.add(db_obj)
        db.flush()

        if conflict_result["has_conflict"]:
            for conflict in conflict_result["conflicts"]:
                conflict_record = ConflictRecord(
                    cleaning_schedule_id=db_obj.id,
                    conflicting_schedule_id=conflict.get("conflicting_schedule_id"),
                    conflict_type=conflict["conflict_type"],
                    risk_level=conflict["risk_level"],
                    description=conflict["description"]
                )
                db.add(conflict_record)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session,
        db_obj: CleaningSchedule,
        obj_in: CleaningScheduleUpdate
    ) -> CleaningSchedule:
        update_data = obj_in.model_dump(exclude_unset=True)

        needs_recheck = any(
            key in update_data for key in [
                "cleaner_id", "scheduled_date", "start_time", "end_time", "time_slot_id"
            ]
        )

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        if needs_recheck:
            conflict_result = check_all_conflicts(
                db,
                apartment_id=db_obj.apartment_id,
                start_time=db_obj.start_time,
                end_time=db_obj.end_time,
                cleaner_id=db_obj.cleaner_id,
                time_slot_id=db_obj.time_slot_id,
                exclude_schedule_id=db_obj.id
            )
            db_obj.has_conflict = conflict_result["has_conflict"]
            db_obj.risk_level = conflict_result.get("overall_risk_level")
            db_obj.conflict_details = {
                "conflicts": conflict_result["conflicts"],
                "warnings": conflict_result["capacity_warnings"]
            } if conflict_result["has_conflict"] else None

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
        self, db: Session,
        db_obj: CleaningSchedule,
        status: CleaningStatus
    ) -> CleaningSchedule:
        db_obj.status = status
        if status == CleaningStatus.COMPLETED:
            db_obj.completion_time = datetime.now()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def record_attendance(
        self, db: Session,
        schedule_id: int,
        obj_in: AttendanceRecordCreate,
        recorded_by: Optional[int] = None
    ) -> AttendanceRecord:
        schedule = self.get(db, schedule_id)
        if not schedule:
            raise ValueError("Schedule not found")

        attendance = AttendanceRecord(
            **obj_in.model_dump(exclude={"recorded_by"}),
            timestamp=datetime.now(),
            recorded_by=recorded_by or obj_in.recorded_by
        )
        db.add(attendance)

        schedule.attendance_status = obj_in.status
        if obj_in.status == AttendanceStatus.ARRIVED:
            schedule.check_in_time = datetime.now()
        elif obj_in.status == AttendanceStatus.CHECKED_OUT:
            schedule.check_out_time = datetime.now()

        db.add(schedule)
        db.commit()
        db.refresh(attendance)
        return attendance

    def reschedule(
        self, db: Session,
        db_obj: CleaningSchedule,
        new_start: datetime,
        new_end: datetime,
        new_cleaner_id: Optional[int],
        reason: RescheduleReason,
        reason_detail: Optional[str],
        requested_by: Optional[int] = None,
        approved_by: Optional[int] = None
    ) -> CleaningSchedule:
        reschedule_record = RescheduleRecord(
            cleaning_schedule_id=db_obj.id,
            old_start_time=db_obj.start_time,
            old_end_time=db_obj.end_time,
            old_cleaner_id=db_obj.cleaner_id,
            new_start_time=new_start,
            new_end_time=new_end,
            new_cleaner_id=new_cleaner_id,
            reason=reason,
            reason_detail=reason_detail,
            requested_by=requested_by,
            approved_by=approved_by,
            approved_at=datetime.now() if approved_by else None
        )
        db.add(reschedule_record)

        db_obj.start_time = new_start
        db_obj.end_time = new_end
        db_obj.cleaner_id = new_cleaner_id
        db_obj.scheduled_date = new_start.date()
        db_obj.status = CleaningStatus.RESCHEDULED

        conflict_result = check_all_conflicts(
            db,
            apartment_id=db_obj.apartment_id,
            start_time=new_start,
            end_time=new_end,
            cleaner_id=new_cleaner_id,
            time_slot_id=db_obj.time_slot_id,
            exclude_schedule_id=db_obj.id
        )
        db_obj.has_conflict = conflict_result["has_conflict"]
        db_obj.risk_level = conflict_result.get("overall_risk_level")
        db_obj.conflict_details = {
            "conflicts": conflict_result["conflicts"],
            "warnings": conflict_result["capacity_warnings"]
        } if conflict_result["has_conflict"] else None

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def mark_no_show(
        self, db: Session,
        db_obj: CleaningSchedule
    ) -> CleaningSchedule:
        db_obj.status = CleaningStatus.NO_SHOW
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDRescheduleRecord:
    def get(self, db: Session, id: int) -> Optional[RescheduleRecord]:
        return db.query(RescheduleRecord).filter(RescheduleRecord.id == id).first()

    def get_by_schedule(self, db: Session, schedule_id: int) -> List[RescheduleRecord]:
        return db.query(RescheduleRecord).filter(
            RescheduleRecord.cleaning_schedule_id == schedule_id
        ).order_by(RescheduleRecord.created_at.desc()).all()


class CRUDAttendanceRecord:
    def get(self, db: Session, id: int) -> Optional[AttendanceRecord]:
        return db.query(AttendanceRecord).filter(AttendanceRecord.id == id).first()

    def get_by_schedule(self, db: Session, schedule_id: int) -> List[AttendanceRecord]:
        return db.query(AttendanceRecord).filter(
            AttendanceRecord.cleaning_schedule_id == schedule_id
        ).order_by(AttendanceRecord.created_at).all()


class CRUDConflictRecord:
    def get(self, db: Session, id: int) -> Optional[ConflictRecord]:
        return db.query(ConflictRecord).filter(ConflictRecord.id == id).first()

    def get_by_schedule(self, db: Session, schedule_id: int) -> List[ConflictRecord]:
        return db.query(ConflictRecord).filter(
            ConflictRecord.cleaning_schedule_id == schedule_id
        ).order_by(ConflictRecord.created_at.desc()).all()

    def get_unresolved(self, db: Session, skip: int = 0, limit: int = 100) -> List[ConflictRecord]:
        return db.query(ConflictRecord).filter(
            ConflictRecord.is_resolved == False
        ).order_by(
            ConflictRecord.risk_level.desc(),
            ConflictRecord.created_at.desc()
        ).offset(skip).limit(limit).all()

    def update(
        self, db: Session,
        db_obj: ConflictRecord,
        obj_in: ConflictRecordUpdate
    ) -> ConflictRecord:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        if db_obj.is_resolved and not db_obj.resolved_at:
            db_obj.resolved_at = datetime.now()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDCommunicationRecord:
    def get(self, db: Session, id: int) -> Optional[CommunicationRecord]:
        return db.query(CommunicationRecord).filter(CommunicationRecord.id == id).first()

    def get_by_schedule(self, db: Session, schedule_id: int) -> List[CommunicationRecord]:
        return db.query(CommunicationRecord).filter(
            CommunicationRecord.cleaning_schedule_id == schedule_id
        ).order_by(CommunicationRecord.created_at.desc()).all()

    def create(
        self, db: Session,
        obj_in: CommunicationRecordCreate,
        sender_id: int
    ) -> CommunicationRecord:
        db_obj = CommunicationRecord(
            **obj_in.model_dump(),
            sender_id=sender_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDReviewOpinion:
    def get(self, db: Session, id: int) -> Optional[ReviewOpinion]:
        return db.query(ReviewOpinion).filter(ReviewOpinion.id == id).first()

    def get_by_schedule(self, db: Session, schedule_id: int) -> List[ReviewOpinion]:
        return db.query(ReviewOpinion).filter(
            ReviewOpinion.cleaning_schedule_id == schedule_id
        ).order_by(ReviewOpinion.created_at.desc()).all()

    def create(
        self, db: Session,
        obj_in: ReviewOpinionCreate,
        reviewer_id: int
    ) -> ReviewOpinion:
        db_obj = ReviewOpinion(
            **obj_in.model_dump(),
            reviewer_id=reviewer_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDCapacityRule:
    def get(self, db: Session, id: int) -> Optional[CapacityRule]:
        return db.query(CapacityRule).filter(CapacityRule.id == id).first()

    def get_multi(self, db: Session, is_active: Optional[bool] = None) -> List[CapacityRule]:
        query = db.query(CapacityRule)
        if is_active is not None:
            query = query.filter(CapacityRule.is_active == is_active)
        return query.order_by(CapacityRule.priority.desc()).all()

    def create(self, db: Session, obj_in: CapacityRuleCreate) -> CapacityRule:
        db_obj = CapacityRule(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


user = CRUDUser()
apartment = CRUDApartment()
time_slot = CRUDTimeSlot()
cleaning_schedule = CRUDCleaningSchedule()
reschedule_record = CRUDRescheduleRecord()
attendance_record = CRUDAttendanceRecord()
conflict_record = CRUDConflictRecord()
communication_record = CRUDCommunicationRecord()
review_opinion = CRUDReviewOpinion()
capacity_rule = CRUDCapacityRule()
