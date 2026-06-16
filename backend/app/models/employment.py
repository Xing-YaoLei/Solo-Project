from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class EmploymentRecord(Base):
    __tablename__ = "employment_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    graduation_date = Column(DateTime)
    company_name = Column(String(200))
    company_type = Column(String(100))
    position = Column(String(200))
    position_level = Column(String(50))
    salary = Column(Float)
    salary_range = Column(String(50))
    city = Column(String(100))
    province = Column(String(100))
    industry = Column(String(200))
    is_major_match = Column(Boolean, default=True)
    employment_status = Column(String(20), default="employed")
    offer_date = Column(DateTime)
    contract_type = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class EmploymentStatistics(Base):
    __tablename__ = "employment_statistics"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, index=True)
    major = Column(String(200), index=True)
    total_students = Column(Integer, default=0)
    employed_count = Column(Integer, default=0)
    employment_rate = Column(Float, default=0)
    avg_salary = Column(Float, default=0)
    median_salary = Column(Float, default=0)
    major_match_rate = Column(Float, default=0)
    top_industries = Column(JSON)
    top_cities = Column(JSON)
    top_companies = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class JobFair(Base):
    __tablename__ = "job_fairs"

    id = Column(Integer, primary_key=True, index=True)
    fair_name = Column(String(200))
    fair_date = Column(DateTime)
    location = Column(String(200))
    total_companies = Column(Integer, default=0)
    total_positions = Column(Integer, default=0)
    participating_students = Column(Integer, default=0)
    interview_count = Column(Integer, default=0)
    offer_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CompanyInfo(Base):
    __tablename__ = "company_info"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), unique=True, index=True)
    company_type = Column(String(100))
    industry = Column(String(200))
    scale = Column(String(50))
    headquarters = Column(String(100))
    website = Column(String(500))
    contact_person = Column(String(100))
    contact_phone = Column(String(20))
    cooperation_level = Column(String(50), default="normal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
