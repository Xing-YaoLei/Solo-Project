import uuid
from datetime import datetime, date
from sqlalchemy.orm import Session
from typing import List
import random

from app.models.batch import BatchImport
from app.models.practice import StudentPractice, HomeworkRecord, LearningProgress
from app.models.student import Student
from app.models.course import Chapter
from app.models.metrics import MetricsSummary, CaliberVersion, ProgressNote
from app.models.user import User
from app.schemas.import_batch import (
    ImportBatch as ImportBatchSchema,
    ImportRequest, ImportResponse,
    ProgressNoteCreate, ProgressNoteResponse
)


class DataImportService:
    def __init__(self, db: Session):
        self.db = db

    def _generate_batch_id(self) -> str:
        return f"BATCH-{uuid.uuid4().hex[:8].upper()}"

    def _process_live_data(self, batch_id: str) -> int:
        students = self.db.query(Student).all()
        if not students:
            return 0

        count = 0
        for student in students:
            for _ in range(random.randint(1, 5)):
                practice = StudentPractice(
                    student_id=student.id,
                    question_id=random.randint(1, 50),
                    batch_id=batch_id,
                    is_correct=random.random() > 0.3,
                    duration_seconds=random.randint(30, 300),
                    practice_time=datetime.now()
                )
                self.db.add(practice)
                count += 1
        return count

    def _process_employment_data(self, batch_id: str) -> int:
        students = self.db.query(Student).all()
        if not students:
            return 0

        count = 0
        for student in students:
            hw = HomeworkRecord(
                student_id=student.id,
                homework_id=random.randint(1, 20),
                batch_id=batch_id,
                status=random.choice(['assigned', 'started', 'submitted', 'graded', 'passed']),
                assigned_at=datetime.now(),
                started_at=datetime.now() if random.random() > 0.2 else None,
                submitted_at=datetime.now() if random.random() > 0.4 else None,
                graded_at=datetime.now() if random.random() > 0.6 else None,
                score=round(random.uniform(60, 100), 2) if random.random() > 0.4 else None
            )
            self.db.add(hw)
            count += 1
        return count

    def _process_lms_data(self, batch_id: str) -> int:
        students = self.db.query(Student).all()
        chapters = self.db.query(Chapter).all()
        if not students or not chapters:
            return 0

        count = 0
        for student in students:
            for chapter in chapters:
                progress = LearningProgress(
                    student_id=student.id,
                    chapter_id=chapter.id,
                    batch_id=batch_id,
                    progress=round(random.uniform(20, 100), 2),
                    record_date=date.today()
                )
                self.db.add(progress)
                count += 1
        return count

    def _calculate_metrics(self, batch_id: str):
        active_caliber = self.db.query(CaliberVersion).filter(
            CaliberVersion.is_active == True
        ).first()

        caliber_version = active_caliber.version if active_caliber else "v1.0"

        total_practices = self.db.query(StudentPractice).count()
        correct_practices = self.db.query(StudentPractice).filter(
            StudentPractice.is_correct == True
        ).count()
        completion_rate = round((correct_practices / total_practices * 100) if total_practices > 0 else 0, 2)

        total_students = self.db.query(Student).count()
        active_users = self.db.query(StudentPractice).filter(
            StudentPractice.practice_time >= date.today()
        ).group_by(StudentPractice.student_id).count()

        avg_duration = self.db.query(
            StudentPractice.duration_seconds
        ).filter(StudentPractice.duration_seconds.isnot(None)).all()
        avg_dur = int(sum(d[0] for d in avg_duration) / len(avg_duration)) if avg_duration else 0

        metrics = MetricsSummary(
            summary_date=date.today(),
            caliber_version=caliber_version,
            total_completion_rate=completion_rate,
            total_students=total_students,
            active_users=active_users,
            avg_duration=avg_dur,
            batch_id=batch_id
        )
        self.db.add(metrics)

    def trigger_import(self, request: ImportRequest, operator_id: int) -> ImportResponse:
        batch_id = self._generate_batch_id()

        batch = BatchImport(
            batch_id=batch_id,
            source=request.source,
            status="processing",
            operator_id=operator_id,
            remark=request.remark
        )
        self.db.add(batch)
        self.db.flush()

        try:
            record_count = 0
            if request.source == "live":
                record_count = self._process_live_data(batch_id)
            elif request.source == "employment":
                record_count = self._process_employment_data(batch_id)
            elif request.source == "lms":
                record_count = self._process_lms_data(batch_id)

            self._calculate_metrics(batch_id)

            batch.status = "success"
            batch.record_count = record_count
            self.db.commit()

            return ImportResponse(
                batchId=batch_id,
                status="success",
                message=f"成功导入 {record_count} 条记录"
            )
        except Exception as e:
            self.db.rollback()
            batch.status = "failed"
            batch.error_log = str(e)
            self.db.commit()
            return ImportResponse(
                batchId=batch_id,
                status="failed",
                message=f"导入失败: {str(e)}"
            )

    def get_batches(self, skip: int = 0, limit: int = 50) -> List[ImportBatchSchema]:
        batches = self.db.query(BatchImport).join(
            User, BatchImport.operator_id == User.id
        ).order_by(
            BatchImport.import_time.desc()
        ).offset(skip).limit(limit).all()

        return [
            ImportBatchSchema(
                batchId=b.batch_id,
                importTime=b.import_time,
                source=b.source,
                recordCount=b.record_count,
                status=b.status,
                operator=b.operator.name if b.operator else "未知",
                remark=b.remark
            )
            for b in batches
        ]

    def rollback_batch(self, batch_id: str) -> bool:
        batch = self.db.query(BatchImport).filter(BatchImport.batch_id == batch_id).first()
        if not batch:
            return False

        self.db.query(StudentPractice).filter(StudentPractice.batch_id == batch_id).delete()
        self.db.query(HomeworkRecord).filter(HomeworkRecord.batch_id == batch_id).delete()
        self.db.query(LearningProgress).filter(LearningProgress.batch_id == batch_id).delete()
        self.db.query(MetricsSummary).filter(MetricsSummary.batch_id == batch_id).delete()

        batch.status = "rolled_back"
        self.db.commit()
        return True

    def add_note(self, note_data: ProgressNoteCreate, user_id: int) -> ProgressNoteResponse:
        note = ProgressNote(
            note_date=datetime.strptime(note_data.date, "%Y-%m-%d").date(),
            student_id=note_data.studentId,
            class_id=note_data.classId,
            note=note_data.note,
            created_by=user_id
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)

        user = self.db.query(User).filter(User.id == user_id).first()
        return ProgressNoteResponse(
            id=note.id,
            date=note.note_date.strftime("%Y-%m-%d"),
            studentId=note.student_id,
            classId=note.class_id,
            note=note.note,
            createdBy=user.name if user else "未知",
            createdAt=note.created_at
        )

    def get_notes(self, note_date: str | None = None) -> List[ProgressNoteResponse]:
        query = self.db.query(ProgressNote).join(User, ProgressNote.created_by == User.id)
        if note_date:
            query = query.filter(
                ProgressNote.note_date == datetime.strptime(note_date, "%Y-%m-%d").date()
            )
        notes = query.order_by(ProgressNote.created_at.desc()).all()

        return [
            ProgressNoteResponse(
                id=n.id,
                date=n.note_date.strftime("%Y-%m-%d"),
                studentId=n.student_id,
                classId=n.class_id,
                note=n.note,
                createdBy=n.creator.name if n.creator else "未知",
                createdAt=n.created_at
            )
            for n in notes
        ]
