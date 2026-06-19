from pydantic import BaseModel
from typing import List, Optional


class ReportSeries(BaseModel):
    name: str
    data: List[float]


class ReportData(BaseModel):
    dimension: str
    categories: List[str]
    series: List[ReportSeries]
