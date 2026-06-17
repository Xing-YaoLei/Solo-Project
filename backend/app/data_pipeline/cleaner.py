import pandas as pd
from datetime import datetime
import re


class DataCleaner:
    
    @staticmethod
    def clean_charging_data(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.drop_duplicates(subset=['resident_id', 'charge_date'])
        df['charge_date'] = pd.to_datetime(df['charge_date'], errors='coerce')
        df = df.dropna(subset=['charge_date'])
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df = df.dropna(subset=['amount'])
        df['amount'] = df['amount'].round(2)
        return df
    
    @staticmethod
    def clean_access_control_data(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.drop_duplicates(subset=['resident_id', 'access_time'])
        df['access_time'] = pd.to_datetime(df['access_time'], errors='coerce')
        df = df.dropna(subset=['access_time'])
        df['direction'] = df['direction'].str.lower().str.strip()
        df = df[df['direction'].isin(['in', 'out'])]
        return df
    
    @staticmethod
    def clean_health_device_data(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.drop_duplicates(subset=['resident_id', 'measure_time', 'metric_type'])
        df['measure_time'] = pd.to_datetime(df['measure_time'], errors='coerce')
        df = df.dropna(subset=['measure_time'])
        df['metric_value'] = pd.to_numeric(df['metric_value'], errors='coerce')
        df = df.dropna(subset=['metric_value'])
        return df
    
    @staticmethod
    def normalize_resident_id(resident_id: str) -> str:
        if not resident_id:
            return ""
        resident_id = str(resident_id).strip()
        resident_id = re.sub(r'[^a-zA-Z0-9]', '', resident_id)
        return resident_id.upper()
    
    @staticmethod
    def standardize_care_level(level: str) -> str:
        if not level:
            return ""
        level = str(level).strip()
        level_map = {
            '自理': '自理',
            '半自理': '半自理',
            '介助': '半自理',
            '全护理': '全护理',
            '介护': '全护理',
            '特护': '特护',
            '专护': '特护'
        }
        return level_map.get(level, level)
    
    @staticmethod
    def deduplicate_events(df: pd.DataFrame, time_window_minutes: int = 30) -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values(['resident_id', 'occur_time'])
        df['occur_time'] = pd.to_datetime(df['occur_time'])
        
        keep_indices = []
        last_time = {}
        
        for idx, row in df.iterrows():
            resident = row['resident_id']
            event_type = row['type']
            key = f"{resident}_{event_type}"
            current_time = row['occur_time']
            
            if key not in last_time:
                keep_indices.append(idx)
                last_time[key] = current_time
            else:
                time_diff = (current_time - last_time[key]).total_seconds() / 60
                if time_diff > time_window_minutes:
                    keep_indices.append(idx)
                    last_time[key] = current_time
        
        return df.loc[keep_indices].reset_index(drop=True)
