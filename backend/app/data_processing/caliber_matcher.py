import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import Course, CourseChapter, Textbook, Region


class CaliberMatcher:
    """口径匹配器 - 统一不同数据源的业务口径"""

    def __init__(self, db: Session):
        self.db = db
        self._course_mapping = None
        self._chapter_mapping = None
        self._textbook_mapping = None
        self._region_mapping = None

    def _load_course_mapping(self):
        """加载课程映射缓存"""
        if self._course_mapping is None:
            courses = self.db.query(Course).all()
            self._course_mapping = {}
            for c in courses:
                self._course_mapping[c.course_code] = c.id
                self._course_mapping[c.name] = c.id
        return self._course_mapping

    def _load_chapter_mapping(self):
        """加载章节映射缓存"""
        if self._chapter_mapping is None:
            chapters = self.db.query(CourseChapter).all()
            self._chapter_mapping = {}
            for ch in chapters:
                key = f"{ch.course_id}_{ch.chapter_no}"
                self._chapter_mapping[key] = ch.id
                self._chapter_mapping[f"{ch.course_id}_{ch.title}"] = ch.id
        return self._chapter_mapping

    def _load_region_mapping(self):
        """加载区域映射缓存"""
        if self._region_mapping is None:
            regions = self.db.query(Region).all()
            self._region_mapping = {}
            for r in regions:
                self._region_mapping[r.code] = r.id
                self._region_mapping[r.name] = r.id
        return self._region_mapping

    def match_course(self, course_identifier: str) -> Optional[int]:
        """匹配课程ID"""
        if not course_identifier:
            return None
        mapping = self._load_course_mapping()
        return mapping.get(str(course_identifier).strip())

    def match_chapter(self, course_id: int, chapter_identifier: str) -> Optional[int]:
        """匹配章节ID"""
        if not course_id or not chapter_identifier:
            return None
        mapping = self._load_chapter_mapping()
        key1 = f"{course_id}_{chapter_identifier}"
        try:
            chapter_no = int(str(chapter_identifier).strip())
            key2 = f"{course_id}_{chapter_no}"
            return mapping.get(key1) or mapping.get(key2)
        except ValueError:
            return mapping.get(key1)

    def match_region(self, region_identifier: str) -> Optional[int]:
        """匹配区域ID"""
        if not region_identifier:
            return None
        mapping = self._load_region_mapping()
        return mapping.get(str(region_identifier).strip())

    def normalize_score_caliber(self, score: float, source: str) -> Optional[float]:
        """标准化成绩口径：统一为百分制"""
        if score is None or pd.isna(score):
            return None
        score = float(score)

        caliber_rules = {
            'enrollment': lambda s: s if s <= 100 else s / 10,
            'academic': lambda s: s,
            'homework': lambda s: s if s <= 100 else s / 10,
        }
        rule = caliber_rules.get(source, lambda s: s)
        return rule(score)

    def normalize_attendance_caliber(self, attend_count: int, total_classes: int) -> Optional[float]:
        """标准化出勤率口径：统一为百分比"""
        if total_classes and total_classes > 0:
            return round(attend_count / total_classes * 100, 2)
        return None

    def match_dataframe_courses(self, df: pd.DataFrame, course_col: str = 'course_name') -> pd.DataFrame:
        """为DataFrame批量匹配课程ID"""
        if course_col not in df.columns:
            df['course_id'] = None
            return df

        mapping = self._load_course_mapping()
        df['course_id'] = df[course_col].map(mapping)
        return df

    def match_dataframe_regions(self, df: pd.DataFrame, region_col: str = 'region') -> pd.DataFrame:
        """为DataFrame批量匹配区域ID"""
        if region_col not in df.columns:
            df['region_id'] = None
            return df

        mapping = self._load_region_mapping()
        df['region_id'] = df[region_col].map(mapping)
        return df

    def refresh_mappings(self):
        """刷新所有映射缓存"""
        self._course_mapping = None
        self._chapter_mapping = None
        self._textbook_mapping = None
        self._region_mapping = None
        self._load_course_mapping()
        self._load_chapter_mapping()
        self._load_region_mapping()


def get_caliber_matcher(db: Session) -> CaliberMatcher:
    return CaliberMatcher(db)
