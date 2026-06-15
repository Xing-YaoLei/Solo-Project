from sqlalchemy.orm import Session
from sqlalchemy import func, and_, Date, cast
from datetime import date, timedelta
from typing import List, Optional
import duckdb

from app.models.practice import StudentPractice, LearningProgress, HomeworkRecord
from app.models.student import Student, TeacherStudent
from app.models.course import Course, Chapter, Question, QuestionTag, QuestionTagRelation
from app.models.metrics import CaliberVersion
from app.schemas.dashboard import (
    OverviewMetrics, TrendDataPoint, TrendResponse,
    ChapterDistribution, FunnelStage, TagRank, ProgressTrend
)


class DashboardService:
    def __init__(self, db: Session, duckdb_conn: Optional[duckdb.DuckDBPyConnection] = None):
        self.db = db
        self.duckdb_conn = duckdb_conn

    def _get_student_ids_for_user(self, user_id: int, user_role: str) -> List[int]:
        if user_role in ['admin', 'manager']:
            return [s.id for s in self.db.query(Student.id).all()]
        else:
            relations = self.db.query(TeacherStudent).filter(
                TeacherStudent.teacher_id == user_id
            ).all()
            return [r.student_id for r in relations]

    def get_overview_metrics(self, user_id: int, user_role: str) -> OverviewMetrics:
        student_ids = self._get_student_ids_for_user(user_id, user_role)
        if not student_ids:
            return OverviewMetrics(
                totalStudents=0,
                totalCompletionRate=0,
                avgPracticeDuration=0,
                todayActiveUsers=0,
                completionRateChange=0,
                practiceCountChange=0
            )

        today = date.today()
        yesterday = today - timedelta(days=1)

        total_students = len(student_ids)

        active_caliber = self.db.query(CaliberVersion).filter(
            CaliberVersion.is_active == True
        ).first()

        total_practices = self.db.query(StudentPractice).filter(
            StudentPractice.student_id.in_(student_ids)
        ).count()

        correct_practices = self.db.query(StudentPractice).filter(
            and_(
                StudentPractice.student_id.in_(student_ids),
                StudentPractice.is_correct == True
            )
        ).count()

        completion_rate = round((correct_practices / total_practices * 100) if total_practices > 0 else 0, 2)

        avg_duration = self.db.query(func.avg(StudentPractice.duration_seconds)).filter(
            StudentPractice.student_id.in_(student_ids),
            StudentPractice.duration_seconds.isnot(None)
        ).scalar() or 0

        today_active = self.db.query(func.count(func.distinct(StudentPractice.student_id))).filter(
            and_(
                StudentPractice.student_id.in_(student_ids),
                cast(StudentPractice.practice_time, Date) == today
            )
        ).scalar() or 0

        yesterday_practices = self.db.query(StudentPractice).filter(
            and_(
                StudentPractice.student_id.in_(student_ids),
                cast(StudentPractice.practice_time, Date) == yesterday
            )
        ).count()

        yesterday_correct = self.db.query(StudentPractice).filter(
            and_(
                StudentPractice.student_id.in_(student_ids),
                StudentPractice.is_correct == True,
                cast(StudentPractice.practice_time, Date) == yesterday
            )
        ).count()

        yesterday_rate = round((yesterday_correct / yesterday_practices * 100) if yesterday_practices > 0 else 0, 2)

        completion_change = round(completion_rate - yesterday_rate, 2)
        practice_change = round(((total_practices - yesterday_practices) / yesterday_practices * 100) if yesterday_practices > 0 else 0, 2)

        return OverviewMetrics(
            totalStudents=total_students,
            totalCompletionRate=completion_rate,
            avgPracticeDuration=int(avg_duration),
            todayActiveUsers=today_active,
            completionRateChange=completion_change,
            practiceCountChange=practice_change
        )

    def get_trend_data(self, days: int, user_id: int, user_role: str) -> TrendResponse:
        student_ids = self._get_student_ids_for_user(user_id, user_role)
        if not student_ids:
            return TrendResponse(data=[], timeRange=f"近{days}天")

        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        data: List[TrendDataPoint] = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            practices = self.db.query(StudentPractice).filter(
                and_(
                    StudentPractice.student_id.in_(student_ids),
                    cast(StudentPractice.practice_time, Date) == current_date
                )
            ).all()

            practice_count = len(practices)
            correct_count = sum(1 for p in practices if p.is_correct)
            rate = round((correct_count / practice_count * 100) if practice_count > 0 else 0, 2)

            data.append(TrendDataPoint(
                date=current_date.strftime("%Y-%m-%d"),
                completionRate=rate,
                practiceCount=practice_count
            ))

        return TrendResponse(data=data, timeRange=f"近{days}天")

    def get_chapter_distribution(self, user_id: int, user_role: str) -> List[ChapterDistribution]:
        student_ids = self._get_student_ids_for_user(user_id, user_role)

        results = self.db.query(
            Course.name.label('course_name'),
            Chapter.name.label('chapter_name'),
            func.count(Question.id).label('question_count'),
            func.count(func.distinct(
                func.IF(StudentPractice.is_correct == True, StudentPractice.student_id, None)
            )).label('completed_count')
        ).select_from(Chapter).join(
            Course, Chapter.course_id == Course.id
        ).join(
            Question, Question.chapter_id == Chapter.id
        ).outerjoin(
            StudentPractice, and_(
                StudentPractice.question_id == Question.id,
                StudentPractice.student_id.in_(student_ids) if student_ids else True
            )
        ).group_by(
            Course.name, Chapter.name, Chapter.order_index
        ).order_by(
            Course.name, Chapter.order_index
        ).all()

        return [
            ChapterDistribution(
                courseName=r.course_name,
                chapterName=r.chapter_name,
                questionCount=r.question_count,
                completedCount=r.completed_count or 0,
                completionRate=round(
                    ((r.completed_count or 0) / len(student_ids) * 100) if student_ids else 0, 2
                )
            )
            for r in results
        ]

    def get_homework_funnel(self, user_id: int, user_role: str) -> List[FunnelStage]:
        student_ids = self._get_student_ids_for_user(user_id, user_role)
        base_query = self.db.query(HomeworkRecord).filter(
            HomeworkRecord.student_id.in_(student_ids) if student_ids else True
        )

        stages = [
            ('assigned', base_query.count()),
            ('started', base_query.filter(HomeworkRecord.started_at.isnot(None)).count()),
            ('submitted', base_query.filter(HomeworkRecord.submitted_at.isnot(None)).count()),
            ('graded', base_query.filter(HomeworkRecord.graded_at.isnot(None)).count()),
            ('passed', base_query.filter(HomeworkRecord.status == 'passed').count()),
        ]

        result: List[FunnelStage] = []
        prev_value = stages[0][1] if stages else 1
        for stage, value in stages:
            conversion_rate = round((value / prev_value * 100) if prev_value > 0 else 0, 2)
            result.append(FunnelStage(
                stage=stage,
                value=value,
                conversionRate=conversion_rate
            ))
            prev_value = value

        return result

    def get_tag_ranking(self, user_id: int, user_role: str) -> List[TagRank]:
        student_ids = self._get_student_ids_for_user(user_id, user_role)

        results = self.db.query(
            QuestionTag.tag_name.label('tag_name'),
            func.count(StudentPractice.id).label('practice_count'),
            func.avg(func.IF(StudentPractice.is_correct == True, 100, 0)).label('correct_rate')
        ).select_from(QuestionTag).join(
            QuestionTagRelation, QuestionTagRelation.tag_id == QuestionTag.id
        ).join(
            Question, Question.id == QuestionTagRelation.question_id
        ).outerjoin(
            StudentPractice, and_(
                StudentPractice.question_id == Question.id,
                StudentPractice.student_id.in_(student_ids) if student_ids else True
            )
        ).group_by(
            QuestionTag.tag_name
        ).order_by(
            func.count(StudentPractice.id).desc()
        ).limit(15).all()

        return [
            TagRank(
                tagName=r.tag_name,
                practiceCount=r.practice_count or 0,
                correctRate=round(float(r.correct_rate or 0), 2)
            )
            for r in results
        ]

    def get_progress_trend(self, user_id: int, user_role: str) -> List[ProgressTrend]:
        student_ids = self._get_student_ids_for_user(user_id, user_role)
        if not student_ids:
            return []

        end_date = date.today()
        start_date = end_date - timedelta(days=29)

        results = self.db.query(
            LearningProgress.record_date.label('record_date'),
            Student.class_id.label('class_id'),
            func.avg(LearningProgress.progress).label('avg_progress')
        ).join(
            Student, Student.id == LearningProgress.student_id
        ).filter(
            and_(
                LearningProgress.student_id.in_(student_ids),
                LearningProgress.record_date >= start_date,
                LearningProgress.record_date <= end_date
            )
        ).group_by(
            LearningProgress.record_date,
            Student.class_id
        ).order_by(
            LearningProgress.record_date
        ).all()

        return [
            ProgressTrend(
                date=r.record_date.strftime("%Y-%m-%d"),
                className=r.class_id or '默认班级',
                progress=round(float(r.avg_progress or 0), 2)
            )
            for r in results
        ]
