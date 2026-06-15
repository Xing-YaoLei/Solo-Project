import pandas as pd
import hashlib
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Student


class DataDeduplicator:
    """数据去重器 - 多源数据去重和学生合并"""

    @staticmethod
    def generate_student_fingerprint(row: pd.Series) -> str:
        """生成学生指纹：基于姓名+电话/身份证的哈希"""
        key_parts = []
        if pd.notna(row.get('name')):
            key_parts.append(str(row['name']).strip().lower())
        if pd.notna(row.get('phone')) and row['phone']:
            key_parts.append(str(row['phone']).strip())
        if pd.notna(row.get('id_card')) and row['id_card']:
            key_parts.append(str(row['id_card']).strip())

        if not key_parts:
            return ""
        key = "|".join(key_parts)
        return hashlib.md5(key.encode('utf-8')).hexdigest()

    def deduplicate_dataframe(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """对单个数据源内部去重"""
        if df.empty:
            return df, 0

        df['fingerprint'] = df.apply(self.generate_student_fingerprint, axis=1)
        df_empty_fingerprint = df[df['fingerprint'] == ""]
        df_valid = df[df['fingerprint'] != ""]

        df_deduped = df_valid.drop_duplicates(subset=['fingerprint'], keep='first')
        dedup_count = len(df_valid) - len(df_deduped)

        result = pd.concat([df_deduped, df_empty_fingerprint], ignore_index=True)
        return result, dedup_count

    def cross_source_deduplicate(
        self,
        enrollment_df: pd.DataFrame,
        academic_df: pd.DataFrame,
        homework_df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, int]]:
        """跨数据源去重与合并"""
        stats = {
            'enrollment_count': len(enrollment_df),
            'academic_count': len(academic_df),
            'homework_count': len(homework_df),
            'unique_students': 0,
            'merged_students': 0
        }

        all_dfs = []
        for df, source in [
            (enrollment_df, 'enrollment'),
            (academic_df, 'academic'),
            (homework_df, 'homework')
        ]:
            if not df.empty:
                df = df.copy()
                df['data_source'] = source
                df['fingerprint'] = df.apply(self.generate_student_fingerprint, axis=1)
                all_dfs.append(df)

        if not all_dfs:
            return pd.DataFrame(), stats

        combined = pd.concat(all_dfs, ignore_index=True)

        valid_fingerprints = combined[combined['fingerprint'] != ""]
        empty_fingerprints = combined[combined['fingerprint'] == ""]

        grouped = valid_fingerprints.groupby('fingerprint')

        merged_records = []
        for fingerprint, group in grouped:
            merged = self._merge_student_records(group)
            merged_records.append(merged)

        merged_df = pd.DataFrame(merged_records)
        result = pd.concat([merged_df, empty_fingerprints], ignore_index=True)

        stats['unique_students'] = len(result)
        stats['merged_students'] = len(valid_fingerprints) - len(merged_df)

        return result, stats

    def _merge_student_records(self, group: pd.DataFrame) -> Dict[str, Any]:
        """合并同一学生的多条记录"""
        merged = {}
        for col in group.columns:
            values = group[col].dropna().unique()
            if len(values) > 0:
                if col == 'data_source':
                    merged[col] = ','.join(sorted(values))
                else:
                    merged[col] = values[0]
            else:
                merged[col] = None

        sources = merged.get('data_source', '').split(',')
        merged['is_merged'] = len(sources) > 1
        return merged

    def find_duplicates_in_db(self, db: Session, df: pd.DataFrame) -> Tuple[List[int], pd.DataFrame]:
        """查找数据库中已存在的重复记录"""
        fingerprints = df[df['fingerprint'] != ""]['fingerprint'].tolist()
        existing = db.query(Student.id, Student.fingerprint).filter(
            Student.fingerprint.in_(fingerprints)
        ).all()

        existing_fingerprints = {s.fingerprint: s.id for s in existing}
        matched_ids = list(existing_fingerprints.values())

        df['existing_student_id'] = df['fingerprint'].map(existing_fingerprints)
        return matched_ids, df


data_deduplicator = DataDeduplicator()
