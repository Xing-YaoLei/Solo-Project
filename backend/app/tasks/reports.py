import asyncio
import os
import json
from datetime import datetime
from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.models import ReportDownload, User, ReviewApplication, AdvisorQuota
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.reports import _generate_excel_report, get_classroom_utilization, get_monthly_summary

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated_reports")


@celery_app.task(name="generate_report_async", bind=True)
def generate_report_async(self, report_type: str, filter_criteria: dict, generated_by_id: int):
    task_id = self.request.id

    async def _do():
        async with AsyncSessionLocal() as db:
            report = ReportDownload(
                report_name=f"{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                report_type=report_type,
                filter_criteria=filter_criteria,
                generated_by_id=generated_by_id,
                task_id=task_id,
                status="processing",
            )
            db.add(report)
            await db.flush()
            report_id = report.id

            try:
                user = (await db.execute(select(User).where(User.id == generated_by_id))).scalar_one_or_none()
                generated_by_name = user.full_name if user else "未知"

                data = []
                if report_type == "classroom_utilization":
                    data_dicts = await get_classroom_utilization(
                        filter_criteria.get("year", datetime.now().year),
                        filter_criteria.get("month", datetime.now().month),
                        filter_criteria.get("building"),
                        user, db,
                    )
                    data = [d.model_dump() for d in data_dicts]
                elif report_type == "monthly_summary":
                    data_dicts = await get_monthly_summary(filter_criteria.get("year"), user, db)
                    data = [d.model_dump() for d in data_dicts]
                elif report_type == "review_details":
                    reviews = (await db.execute(
                        select(ReviewApplication).options(selectinload(ReviewApplication.student), selectinload(ReviewApplication.course))
                    )).scalars().all()
                    for r in reviews:
                        data.append({
                            "申请编号": r.application_no,
                            "学生": r.student.name if r.student else "",
                            "课程": r.course.course_name if r.course else "",
                            "当前成绩": r.current_score,
                            "状态": r.status.value,
                            "申请时间": r.applied_at.strftime("%Y-%m-%d %H:%M") if r.applied_at else "",
                        })
                elif report_type == "advisor_quota":
                    quotas = (await db.execute(
                        select(AdvisorQuota).options(selectinload(AdvisorQuota.advisor))
                    )).scalars().all()
                    for q in quotas:
                        data.append({
                            "导师": q.advisor.full_name if q.advisor else "",
                            "学期": q.semester,
                            "最大名额": q.max_quota,
                            "已分配": q.current_assigned,
                            "剩余名额": q.max_quota - q.current_assigned,
                        })

                file_bytes = _generate_excel_report(report_type, data, filter_criteria, generated_by=generated_by_name)
                file_name = f"{report.report_name}.xlsx"
                file_path = os.path.join(REPORTS_DIR, file_name)
                os.makedirs(REPORTS_DIR, exist_ok=True)
                with open(file_path, "wb") as f:
                    f.write(file_bytes)

                report.file_path = file_name
                report.status = "completed"
                await db.commit()
                return {"status": "completed", "report_id": report_id, "file_name": file_name}
            except Exception as e:
                report.status = "failed"
                await db.commit()
                return {"status": "failed", "report_id": report_id, "error": str(e)}

    return asyncio.run(_do())
