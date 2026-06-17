import pandas as pd
import numpy as np
from datetime import datetime
from app.database import get_session
from app.models import MeterReading, RepairRecord, Contract, Property
from app.batch_utils import update_batch, complete_batch


class MeterReadingProcessor:
    def __init__(self, batch_no, user_id=None):
        self.batch_no = batch_no
        self.user_id = user_id
        self.success_count = 0
        self.failed_count = 0
        self.errors = []

    def read_file(self, file_path):
        if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
            return pd.read_excel(file_path, dtype=str)
        elif file_path.endswith('.csv'):
            return pd.read_csv(file_path, dtype=str, encoding='utf-8-sig')
        else:
            raise ValueError(f'不支持的文件格式: {file_path}')

    def clean_data(self, df):
        rename_map = {
            '抄表编号': 'reading_id',
            '记录ID': 'reading_id',
            '合同编号': 'contract_no',
            '合同号': 'contract_no',
            '房源编号': 'property_id',
            '房源ID': 'property_id',
            '账期': 'period',
            '周期': 'period',
            '表类型': 'meter_type',
            '种类': 'meter_type',
            '上次读数': 'last_reading',
            '当前读数': 'current_reading',
            '本次读数': 'current_reading',
            '用量': 'usage',
            '使用量': 'usage',
            '单价': 'unit_price',
            '金额': 'amount',
            '抄表日期': 'reading_date',
            '日期': 'reading_date',
        }

        for old, new in rename_map.items():
            if old in df.columns:
                df = df.rename(columns={old: new})

        if 'reading_id' not in df.columns:
            df['reading_id'] = [f'MR_{i+1:08d}' for i in range(len(df))]

        if 'contract_no' not in df.columns and 'property_id' not in df.columns:
            raise ValueError('缺少必要列: 需要合同编号或房源编号')

        df = df.copy()
        df['reading_id'] = df['reading_id'].astype(str).str.strip()
        if 'contract_no' in df.columns:
            df['contract_no'] = df['contract_no'].astype(str).str.strip()
        else:
            df['contract_no'] = None
        if 'property_id' in df.columns:
            df['property_id'] = df['property_id'].astype(str).str.strip()
        else:
            df['property_id'] = None

        for col in ['last_reading', 'current_reading', 'usage', 'unit_price', 'amount']:
            if col in df.columns:
                df[col] = pd.to_numeric(
                    df[col].astype(str).str.replace(',', ''),
                    errors='coerce'
                ).fillna(0.0)
            else:
                df[col] = 0.0

        df['usage_calc'] = df['current_reading'] - df['last_reading']
        df['usage'] = np.where(df['usage'].abs() < 0.001, df['usage_calc'].abs(), df['usage'])
        df['amount_calc'] = df['usage'] * df['unit_price']
        df['amount'] = np.where(df['amount'].abs() < 0.01, df['amount_calc'], df['amount'])

        if 'reading_date' in df.columns:
            df['reading_date'] = pd.to_datetime(df['reading_date'], errors='coerce')
        else:
            df['reading_date'] = pd.Timestamp.today().normalize()

        if 'period' not in df.columns:
            df['period'] = df['reading_date'].dt.strftime('%Y%m')
        else:
            df['period'] = df['period'].astype(str).str.strip()

        if 'meter_type' not in df.columns:
            df['meter_type'] = 'water'
        else:
            TYPE_MAP = {
                '水': 'water', '水表': 'water', 'water': 'water',
                '电': 'electric', '电表': 'electric', 'electric': 'electric',
                '气': 'gas', '燃气': 'gas', 'gas': 'gas',
                '暖': 'heat', '暖气': 'heat', 'heat': 'heat',
            }
            df['meter_type'] = df['meter_type'].astype(str).str.strip()
            df['meter_type'] = df['meter_type'].map(lambda x: TYPE_MAP.get(x, x.lower()))

        return df

    def import_readings(self, file_path):
        try:
            df = self.read_file(file_path)
            df = self.clean_data(df)
            total = len(df)

            with get_session() as session:
                for _, row in df.iterrows():
                    try:
                        contract_no = row['contract_no']
                        property_id = row['property_id']

                        if not contract_no and property_id:
                            contract = session.query(Contract).filter(
                                Contract.property_id == property_id,
                                Contract.contract_status == 'active'
                            ).order_by(Contract.start_date.desc()).first()
                            if contract:
                                contract_no = contract.contract_no
                            else:
                                self.failed_count += 1
                                self.errors.append(f"抄表 {row['reading_id']}: 房源 {property_id} 无有效合同")
                                continue

                        if contract_no:
                            contract_exists = session.query(Contract).filter(
                                Contract.contract_no == contract_no
                            ).first()
                            if not contract_exists:
                                self.failed_count += 1
                                self.errors.append(f"抄表 {row['reading_id']}: 合同 {contract_no} 不存在")
                                continue
                            if not property_id:
                                property_id = contract_exists.property_id

                        existing = session.query(MeterReading).filter(
                            MeterReading.reading_id == row['reading_id']
                        ).first()

                        data = {
                            'reading_id': row['reading_id'],
                            'contract_no': contract_no,
                            'property_id': property_id,
                            'period': row['period'],
                            'meter_type': row['meter_type'],
                            'last_reading': row['last_reading'],
                            'current_reading': row['current_reading'],
                            'usage': row['usage'],
                            'unit_price': row['unit_price'],
                            'amount': row['amount'],
                            'reading_date': row['reading_date'].date() if pd.notna(row['reading_date']) else None,
                            'batch_no': self.batch_no,
                        }

                        if existing:
                            for k, v in data.items():
                                if v is not None:
                                    setattr(existing, k, v)
                        else:
                            reading = MeterReading(**data)
                            session.add(reading)

                        self.success_count += 1
                        if self.success_count % 100 == 0:
                            update_batch(
                                self.batch_no,
                                success_records=self.success_count,
                                failed_records=self.failed_count,
                                total_records=total,
                            )
                            session.commit()
                    except Exception as e:
                        self.failed_count += 1
                        self.errors.append(f"抄表 {row.get('reading_id')}: {str(e)}")

                session.commit()

            complete_batch(
                self.batch_no,
                success=self.success_count,
                failed=self.failed_count,
                total=total,
                error_message='; '.join(self.errors[:10]) if self.errors else None,
            )
            return {'success': self.success_count, 'failed': self.failed_count, 'total': total}
        except Exception as e:
            complete_batch(self.batch_no, error_message=str(e))
            raise


class RepairProcessor:
    def __init__(self, batch_no, user_id=None):
        self.batch_no = batch_no
        self.user_id = user_id
        self.success_count = 0
        self.failed_count = 0
        self.errors = []

    def read_file(self, file_path):
        if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
            return pd.read_excel(file_path, dtype=str)
        elif file_path.endswith('.csv'):
            return pd.read_csv(file_path, dtype=str, encoding='utf-8-sig')
        else:
            raise ValueError(f'不支持的文件格式: {file_path}')

    def clean_data(self, df):
        rename_map = {
            '工单编号': 'repair_id',
            '维修ID': 'repair_id',
            '房源编号': 'property_id',
            '房源ID': 'property_id',
            '合同编号': 'contract_no',
            '合同号': 'contract_no',
            '维修类型': 'repair_type',
            '报修类型': 'repair_type',
            '问题描述': 'description',
            '描述': 'description',
            '报修时间': 'report_time',
            '派单时间': 'assign_time',
            '完成时间': 'complete_time',
            '维修状态': 'repair_status',
            '状态': 'repair_status',
            '维修费用': 'cost',
            '费用': 'cost',
            '维修人员': 'repairer',
            '师傅': 'repairer',
            '满意度': 'satisfaction',
            '评分': 'satisfaction',
        }

        for old, new in rename_map.items():
            if old in df.columns:
                df = df.rename(columns={old: new})

        required = ['repair_id', 'property_id']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f'缺少必要列: {missing}')

        df = df.dropna(subset=['repair_id', 'property_id'])
        df['repair_id'] = df['repair_id'].astype(str).str.strip()
        df['property_id'] = df['property_id'].astype(str).str.strip()

        if 'contract_no' not in df.columns:
            df['contract_no'] = None
        else:
            df['contract_no'] = df['contract_no'].astype(str).str.strip().replace({'nan': None})

        if 'cost' in df.columns:
            df['cost'] = pd.to_numeric(
                df['cost'].astype(str).str.replace(',', '').str.replace('¥', ''),
                errors='coerce'
            ).fillna(0.0)
        else:
            df['cost'] = 0.0

        if 'satisfaction' in df.columns:
            df['satisfaction'] = pd.to_numeric(df['satisfaction'], errors='coerce').astype('Int64')
        else:
            df['satisfaction'] = None

        for col in ['report_time', 'assign_time', 'complete_time']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            else:
                df[col] = None

        if 'repair_type' not in df.columns:
            df['repair_type'] = 'other'
        else:
            df['repair_type'] = df['repair_type'].astype(str).str.strip()

        if 'description' not in df.columns:
            df['description'] = None
        else:
            df['description'] = df['description'].astype(str).str.strip().replace({'nan': None})

        if 'repairer' not in df.columns:
            df['repairer'] = None
        else:
            df['repairer'] = df['repairer'].astype(str).str.strip().replace({'nan': None})

        STATUS_MAP = {
            '待处理': 'pending', '待派单': 'pending',
            '处理中': 'processing', '维修中': 'processing', '已派单': 'processing',
            '已完成': 'completed', '已解决': 'completed',
            '已关闭': 'closed', '已取消': 'cancelled',
        }
        if 'repair_status' in df.columns:
            df['repair_status'] = df['repair_status'].astype(str).str.strip()
            df['repair_status'] = df['repair_status'].map(
                lambda x: STATUS_MAP.get(x, x.lower() if isinstance(x, str) else 'pending')
            )
        else:
            df['repair_status'] = 'pending'

        return df

    def import_repairs(self, file_path):
        try:
            df = self.read_file(file_path)
            df = self.clean_data(df)
            total = len(df)

            with get_session() as session:
                for _, row in df.iterrows():
                    try:
                        prop_exists = session.query(Property).filter(
                            Property.property_id == row['property_id']
                        ).first()
                        if not prop_exists:
                            self.failed_count += 1
                            self.errors.append(f"维修 {row['repair_id']}: 房源 {row['property_id']} 不存在")
                            continue

                        existing = session.query(RepairRecord).filter(
                            RepairRecord.repair_id == row['repair_id']
                        ).first()

                        data = {
                            'repair_id': row['repair_id'],
                            'property_id': row['property_id'],
                            'contract_no': row['contract_no'],
                            'repair_type': row['repair_type'],
                            'description': row['description'],
                            'report_time': row['report_time'].to_pydatetime() if pd.notna(row['report_time']) else None,
                            'assign_time': row['assign_time'].to_pydatetime() if pd.notna(row['assign_time']) else None,
                            'complete_time': row['complete_time'].to_pydatetime() if pd.notna(row['complete_time']) else None,
                            'repair_status': row['repair_status'],
                            'cost': row['cost'],
                            'repairer': row['repairer'],
                            'satisfaction': row['satisfaction'] if pd.notna(row['satisfaction']) else None,
                            'batch_no': self.batch_no,
                        }

                        if existing:
                            for k, v in data.items():
                                if v is not None:
                                    setattr(existing, k, v)
                        else:
                            repair = RepairRecord(**data)
                            session.add(repair)

                        self.success_count += 1
                        if self.success_count % 100 == 0:
                            update_batch(
                                self.batch_no,
                                success_records=self.success_count,
                                failed_records=self.failed_count,
                                total_records=total,
                            )
                            session.commit()
                    except Exception as e:
                        self.failed_count += 1
                        self.errors.append(f"维修 {row.get('repair_id')}: {str(e)}")

                session.commit()

            complete_batch(
                self.batch_no,
                success=self.success_count,
                failed=self.failed_count,
                total=total,
                error_message='; '.join(self.errors[:10]) if self.errors else None,
            )
            return {'success': self.success_count, 'failed': self.failed_count, 'total': total}
        except Exception as e:
            complete_batch(self.batch_no, error_message=str(e))
            raise
