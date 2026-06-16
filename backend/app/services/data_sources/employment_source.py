from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from .base import DataSourceConnector
from ...models.employment import EmploymentRecord, EmploymentStatistics, JobFair, CompanyInfo
from ...core.database import SessionLocal


class EmploymentDataSource(DataSourceConnector):
    def __init__(self):
        self.name = "employment"
        self.description = "就业表数据（就业信息、薪资数据）"
        self.last_sync = None

    def get_name(self) -> str:
        return self.name

    def _get_db(self) -> Session:
        return SessionLocal()

    def fetch_data(self, **kwargs) -> Dict[str, Any]:
        data_type = kwargs.get("data_type", "all")
        params = kwargs.get("params", {})

        db = self._get_db()
        try:
            result = {}

            if data_type in ["all", "employment_records"]:
                result["employment_records"] = self._get_employment_records(db, params)

            if data_type in ["all", "statistics"]:
                result["statistics"] = self._get_statistics(db, params)

            if data_type in ["all", "job_fairs"]:
                result["job_fairs"] = self._get_job_fairs(db, params)

            if data_type in ["all", "companies"]:
                result["companies"] = self._get_companies(db, params)

            if data_type in ["all", "salary_analysis"]:
                result["salary_analysis"] = self._get_salary_analysis(db, params)

            result["source"] = self.name
            result["fetched_at"] = datetime.utcnow().isoformat()

            return result
        finally:
            db.close()

    def _get_employment_records(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(EmploymentRecord)

        if params.get("student_id"):
            query = query.filter(EmploymentRecord.student_id == params["student_id"])

        if params.get("year"):
            query = query.filter(func.extract('year', EmploymentRecord.graduation_date) == params["year"])

        if params.get("major"):
            query = query.filter(EmploymentRecord.major == params["major"])

        if params.get("industry"):
            query = query.filter(EmploymentRecord.industry == params["industry"])

        if params.get("city"):
            query = query.filter(EmploymentRecord.city == params["city"])

        if params.get("employment_status"):
            query = query.filter(EmploymentRecord.employment_status == params["employment_status"])

        total = query.count()
        records = query.order_by(EmploymentRecord.graduation_date.desc()).limit(params.get("limit", 500)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": r.id,
                    "student_id": r.student_id,
                    "student_name": r.student_name,
                    "graduation_date": r.graduation_date.isoformat() if r.graduation_date else None,
                    "company_name": r.company_name,
                    "company_type": r.company_type,
                    "position": r.position,
                    "position_level": r.position_level,
                    "salary": r.salary,
                    "salary_range": r.salary_range,
                    "city": r.city,
                    "province": r.province,
                    "industry": r.industry,
                    "is_major_match": r.is_major_match,
                    "employment_status": r.employment_status,
                    "contract_type": r.contract_type
                }
                for r in records
            ]
        }

    def _get_statistics(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(EmploymentStatistics)

        if params.get("year"):
            query = query.filter(EmploymentStatistics.year == params["year"])

        if params.get("major"):
            query = query.filter(EmploymentStatistics.major == params["major"])

        total = query.count()
        stats = query.order_by(EmploymentStatistics.year.desc()).all()

        return {
            "total": total,
            "data": [
                {
                    "id": s.id,
                    "year": s.year,
                    "major": s.major,
                    "total_students": s.total_students,
                    "employed_count": s.employed_count,
                    "employment_rate": s.employment_rate,
                    "avg_salary": s.avg_salary,
                    "median_salary": s.median_salary,
                    "major_match_rate": s.major_match_rate,
                    "top_industries": s.top_industries,
                    "top_cities": s.top_cities,
                    "top_companies": s.top_companies
                }
                for s in stats
            ]
        }

    def _get_job_fairs(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(JobFair)

        if params.get("year"):
            query = query.filter(func.extract('year', JobFair.fair_date) == params["year"])

        total = query.count()
        fairs = query.order_by(JobFair.fair_date.desc()).all()

        return {
            "total": total,
            "data": [
                {
                    "id": f.id,
                    "fair_name": f.fair_name,
                    "fair_date": f.fair_date.isoformat() if f.fair_date else None,
                    "location": f.location,
                    "total_companies": f.total_companies,
                    "total_positions": f.total_positions,
                    "participating_students": f.participating_students,
                    "interview_count": f.interview_count,
                    "offer_count": f.offer_count
                }
                for f in fairs
            ]
        }

    def _get_companies(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(CompanyInfo)

        if params.get("industry"):
            query = query.filter(CompanyInfo.industry == params["industry"])

        if params.get("cooperation_level"):
            query = query.filter(CompanyInfo.cooperation_level == params["cooperation_level"])

        total = query.count()
        companies = query.all()

        return {
            "total": total,
            "data": [
                {
                    "id": c.id,
                    "company_name": c.company_name,
                    "company_type": c.company_type,
                    "industry": c.industry,
                    "scale": c.scale,
                    "headquarters": c.headquarters,
                    "website": c.website,
                    "cooperation_level": c.cooperation_level
                }
                for c in companies
            ]
        }

    def _get_salary_analysis(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(
            EmploymentRecord.industry,
            func.count(EmploymentRecord.id).label("count"),
            func.avg(EmploymentRecord.salary).label("avg_salary"),
            func.max(EmploymentRecord.salary).label("max_salary"),
            func.min(EmploymentRecord.salary).label("min_salary")
        )

        if params.get("year"):
            query = query.filter(func.extract('year', EmploymentRecord.graduation_date) == params["year"])

        if params.get("major"):
            query = query.filter(EmploymentRecord.major == params["major"])

        query = query.group_by(EmploymentRecord.industry)

        results = query.all()

        return {
            "total": len(results),
            "data": [
                {
                    "industry": r.industry,
                    "count": r.count,
                    "avg_salary": round(float(r.avg_salary or 0), 2),
                    "max_salary": r.max_salary or 0,
                    "min_salary": r.min_salary or 0
                }
                for r in results
            ]
        }

    def get_sync_status(self) -> Dict[str, Any]:
        try:
            db = self._get_db()
            try:
                return {
                    "name": self.name,
                    "description": self.description,
                    "status": "connected",
                    "last_sync": self.last_sync.isoformat() if self.last_sync else None,
                    "record_count": {
                        "employment_records": db.query(EmploymentRecord).count(),
                        "employment_statistics": db.query(EmploymentStatistics).count(),
                        "job_fairs": db.query(JobFair).count(),
                        "companies": db.query(CompanyInfo).count()
                    }
                }
            finally:
                db.close()
        except Exception as e:
            return {
                "name": self.name,
                "description": self.description,
                "status": "disconnected",
                "last_sync": self.last_sync.isoformat() if self.last_sync else None,
                "error": str(e),
                "record_count": {
                    "employment_records": 0,
                    "employment_statistics": 0,
                    "job_fairs": 0,
                    "companies": 0
                }
            }

    def sync_data(self, **kwargs) -> Dict[str, Any]:
        self.last_sync = datetime.utcnow()
        return {
            "source": self.name,
            "synced_at": self.last_sync.isoformat(),
            "status": "success",
            "message": "就业表数据同步完成"
        }
