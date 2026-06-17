import pandas as pd
import numpy as np
from datetime import datetime
from app.database import get_session
from app.models import Property, PropertyPhoto, Tenant
from app.batch_utils import update_batch, complete_batch


STATUS_MAPPING = {
    '草稿': 'draft',
    '待审核': 'pending_review',
    '已发布': 'published',
    '已下架': 'offline',
    '草稿箱': 'draft',
    '待发布': 'pending_review',
}


class CRMProcessor:
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

    def clean_property_data(self, df):
        rename_map = {
            '房源编号': 'property_id',
            '房源ID': 'property_id',
            '项目名称': 'project_name',
            '楼盘': 'project_name',
            '楼栋': 'building',
            '单元': 'building',
            '房号': 'unit_no',
            '室号': 'unit_no',
            '楼层': 'floor',
            '户型': 'room_type',
            '面积': 'area',
            '区域': 'district',
            '行政区': 'district',
            '地址': 'address',
            '详细地址': 'address',
            '照片数量': 'photo_count',
            '图片数量': 'photo_count',
            '上架状态': 'listing_status',
            '状态': 'listing_status',
            '发布时间': 'publish_time',
            '管家ID': 'manager_id',
            '负责人': 'manager_id',
        }

        for old, new in rename_map.items():
            if old in df.columns:
                df = df.rename(columns={old: new})

        required = ['property_id']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f'缺少必要列: {missing}')

        df = df.dropna(subset=['property_id'])
        df['property_id'] = df['property_id'].astype(str).str.strip()

        if 'floor' in df.columns:
            df['floor'] = pd.to_numeric(df['floor'], errors='coerce').fillna(0).astype(int)
        else:
            df['floor'] = 0

        if 'area' in df.columns:
            df['area'] = pd.to_numeric(df['area'], errors='coerce').fillna(0.0)
        else:
            df['area'] = 0.0

        if 'photo_count' in df.columns:
            df['photo_count'] = pd.to_numeric(df['photo_count'], errors='coerce').fillna(0).astype(int)
        else:
            df['photo_count'] = 0

        if 'listing_status' in df.columns:
            df['listing_status'] = df['listing_status'].astype(str).str.strip()
            df['listing_status'] = df['listing_status'].map(
                lambda x: STATUS_MAPPING.get(x, x.lower() if isinstance(x, str) else 'draft')
            )
        else:
            df['listing_status'] = 'draft'

        if 'publish_time' in df.columns:
            df['publish_time'] = pd.to_datetime(df['publish_time'], errors='coerce')
        else:
            df['publish_time'] = None

        for col in ['project_name', 'building', 'unit_no', 'room_type', 'district', 'address']:
            if col not in df.columns:
                df[col] = None
            else:
                df[col] = df[col].astype(str).str.strip().replace({'nan': None, 'None': None})

        if 'manager_id' in df.columns:
            df['manager_id'] = pd.to_numeric(df['manager_id'], errors='coerce').astype('Int64')
        else:
            df['manager_id'] = None

        return df

    def clean_tenant_data(self, df):
        rename_map = {
            '租客编号': 'tenant_id',
            '租客ID': 'tenant_id',
            '姓名': 'name',
            '身份证': 'id_card',
            '手机号': 'phone',
            '电话': 'phone',
            '性别': 'gender',
            '年龄': 'age',
            '职业': 'occupation',
            '公司': 'company',
            '紧急联系人': 'emergency_contact',
            '档案阶段': 'profile_stage',
            '信用分': 'credit_score',
        }

        for old, new in rename_map.items():
            if old in df.columns:
                df = df.rename(columns={old: new})

        required = ['tenant_id']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f'缺少必要列: {missing}')

        df = df.dropna(subset=['tenant_id'])
        df['tenant_id'] = df['tenant_id'].astype(str).str.strip()

        if 'age' in df.columns:
            df['age'] = pd.to_numeric(df['age'], errors='coerce').astype('Int64')
        if 'credit_score' in df.columns:
            df['credit_score'] = pd.to_numeric(df['credit_score'], errors='coerce').astype('Int64')

        STAGE_MAPPING = {
            '意向': 'inquiry',
            '看房': 'viewing',
            '意向金': 'deposit',
            '签约中': 'signing',
            '已入住': 'checked_in',
            '已退租': 'moved_out',
        }
        if 'profile_stage' in df.columns:
            df['profile_stage'] = df['profile_stage'].astype(str).str.strip()
            df['profile_stage'] = df['profile_stage'].map(
                lambda x: STAGE_MAPPING.get(x, x.lower() if isinstance(x, str) else 'inquiry')
            )
        else:
            df['profile_stage'] = 'inquiry'

        for col in ['name', 'id_card', 'phone', 'gender', 'occupation', 'company', 'emergency_contact']:
            if col not in df.columns:
                df[col] = None
            else:
                df[col] = df[col].astype(str).str.strip().replace({'nan': None, 'None': None})

        return df

    def import_properties(self, file_path):
        try:
            df = self.read_file(file_path)
            df = self.clean_property_data(df)
            total = len(df)

            with get_session() as session:
                for _, row in df.iterrows():
                    try:
                        existing = session.query(Property).filter(
                            Property.property_id == row['property_id']
                        ).first()

                        data = {
                            'property_id': row['property_id'],
                            'project_name': row['project_name'],
                            'building': row['building'],
                            'unit_no': row['unit_no'],
                            'floor': row['floor'],
                            'room_type': row['room_type'],
                            'area': row['area'],
                            'district': row['district'],
                            'address': row['address'],
                            'photo_count': row['photo_count'],
                            'listing_status': row['listing_status'],
                            'publish_time': row['publish_time'],
                            'manager_id': row['manager_id'],
                            'batch_no': self.batch_no,
                            'updated_at': datetime.utcnow(),
                        }

                        if existing:
                            for k, v in data.items():
                                if v is not None:
                                    setattr(existing, k, v)
                        else:
                            prop = Property(**data)
                            session.add(prop)

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
                        self.errors.append(f"房源 {row.get('property_id')}: {str(e)}")

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

    def import_tenants(self, file_path):
        try:
            df = self.read_file(file_path)
            df = self.clean_tenant_data(df)
            total = len(df)

            with get_session() as session:
                for _, row in df.iterrows():
                    try:
                        existing = session.query(Tenant).filter(
                            Tenant.tenant_id == row['tenant_id']
                        ).first()

                        data = {
                            'tenant_id': row['tenant_id'],
                            'name': row['name'],
                            'id_card': row['id_card'],
                            'phone': row['phone'],
                            'gender': row['gender'],
                            'age': row['age'],
                            'occupation': row['occupation'],
                            'company': row['company'],
                            'emergency_contact': row['emergency_contact'],
                            'profile_stage': row['profile_stage'],
                            'credit_score': row['credit_score'],
                            'batch_no': self.batch_no,
                            'updated_at': datetime.utcnow(),
                        }

                        if existing:
                            for k, v in data.items():
                                if v is not None and pd.notna(v):
                                    setattr(existing, k, v)
                        else:
                            tenant = Tenant(**{k: (v if pd.notna(v) else None) for k, v in data.items()})
                            session.add(tenant)

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
                        self.errors.append(f"租客 {row.get('tenant_id')}: {str(e)}")

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
