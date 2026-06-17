import pandas as pd
import numpy as np
from datetime import datetime
from app.database import get_session
from app.models import Contract, Property, Tenant
from app.batch_utils import update_batch, complete_batch


CONTRACT_STATUS_MAP = {
    '待签署': 'pending',
    '签署中': 'signing',
    '已生效': 'active',
    '履行中': 'active',
    '已到期': 'expired',
    '已终止': 'terminated',
    '已违约': 'defaulted',
}


class ContractProcessor:
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

    def clean_contract_data(self, df):
        rename_map = {
            '合同编号': 'contract_no',
            '合同号': 'contract_no',
            '合同版本': 'contract_version',
            '版本号': 'contract_version',
            '房源编号': 'property_id',
            '房源ID': 'property_id',
            '租客编号': 'tenant_id',
            '租客ID': 'tenant_id',
            '合同类型': 'contract_type',
            '月租金': 'monthly_rent',
            '租金': 'monthly_rent',
            '押金金额': 'deposit_amount',
            '押金': 'deposit_amount',
            '开始日期': 'start_date',
            '起租日': 'start_date',
            '结束日期': 'end_date',
            '到期日': 'end_date',
            '付款方式': 'payment_method',
            '缴租方式': 'payment_method',
            '合同状态': 'contract_status',
            '状态': 'contract_status',
            '签署时间': 'signed_at',
            '签约时间': 'signed_at',
            '电子合同链接': 'e_sign_url',
            '电子签地址': 'e_sign_url',
            '逾期状态': 'overdue_status',
            '逾期天数': 'overdue_days',
            '逾期金额': 'overdue_amount',
        }

        for old, new in rename_map.items():
            if old in df.columns:
                df = df.rename(columns={old: new})

        required = ['contract_no', 'property_id']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f'缺少必要列: {missing}')

        df = df.dropna(subset=['contract_no', 'property_id'])
        df['contract_no'] = df['contract_no'].astype(str).str.strip()
        df['property_id'] = df['property_id'].astype(str).str.strip()

        if 'contract_version' not in df.columns:
            df['contract_version'] = 'V1.0'
        else:
            df['contract_version'] = df['contract_version'].astype(str).str.strip()

        for col in ['monthly_rent', 'deposit_amount', 'overdue_amount']:
            if col in df.columns:
                df[col] = pd.to_numeric(
                    df[col].astype(str).str.replace(',', '').str.replace('¥', ''),
                    errors='coerce'
                ).fillna(0.0)
            else:
                df[col] = 0.0

        for col in ['start_date', 'end_date', 'signed_at']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            else:
                df[col] = None

        if 'overdue_days' in df.columns:
            df['overdue_days'] = pd.to_numeric(df['overdue_days'], errors='coerce').fillna(0).astype(int)
        else:
            df['overdue_days'] = 0

        if 'contract_status' in df.columns:
            df['contract_status'] = df['contract_status'].astype(str).str.strip()
            df['contract_status'] = df['contract_status'].map(
                lambda x: CONTRACT_STATUS_MAP.get(x, x.lower() if isinstance(x, str) else 'pending')
            )
        else:
            df['contract_status'] = 'pending'

        if 'overdue_status' in df.columns:
            df['overdue_status'] = df['overdue_status'].astype(str).str.strip()
            df['overdue_status'] = df['overdue_status'].map(
                lambda x: 'overdue' if '逾期' in str(x) or x == 'overdue' else 'normal'
            )
        else:
            df['overdue_status'] = 'normal'

        for col in ['tenant_id', 'contract_type', 'payment_method', 'e_sign_url']:
            if col not in df.columns:
                df[col] = None
            else:
                df[col] = df[col].astype(str).str.strip().replace({'nan': None, 'None': None})

        return df

    def calculate_overdue(self, df):
        today = pd.Timestamp.today().normalize()
        for idx, row in df.iterrows():
            if pd.notna(row['end_date']) and row['contract_status'] in ('active', '履行中'):
                if pd.isna(row['start_date']) or pd.isna(row['monthly_rent']) or row['monthly_rent'] <= 0:
                    continue

                if df.loc[idx, 'overdue_days'] == 0:
                    periods_elapsed = (today.year - row['start_date'].year) * 12 + (today.month - row['start_date'].month)
                    if periods_elapsed > 0:
                        pm = str(row.get('payment_method', ''))
                        if '月付' in pm or 'month' in pm.lower():
                            interval = 1
                        elif '季付' in pm or 'quarter' in pm.lower():
                            interval = 3
                        elif '半年' in pm:
                            interval = 6
                        elif '年付' in pm or 'year' in pm.lower():
                            interval = 12
                        else:
                            interval = 1

                        if periods_elapsed % interval == 0:
                            next_due = row['start_date'] + pd.DateOffset(months=periods_elapsed)
                            if today > next_due:
                                df.loc[idx, 'overdue_days'] = (today - next_due).days
                                df.loc[idx, 'overdue_status'] = 'overdue'
                                df.loc[idx, 'overdue_amount'] = df.loc[idx, 'overdue_amount'] or row['monthly_rent']
        return df

    def import_contracts(self, file_path):
        try:
            df = self.read_file(file_path)
            df = self.clean_contract_data(df)
            df = self.calculate_overdue(df)
            total = len(df)

            with get_session() as session:
                for _, row in df.iterrows():
                    try:
                        prop_exists = session.query(Property).filter(
                            Property.property_id == row['property_id']
                        ).first()
                        if not prop_exists:
                            self.failed_count += 1
                            self.errors.append(f"合同 {row['contract_no']}: 房源 {row['property_id']} 不存在")
                            continue

                        existing = session.query(Contract).filter(
                            Contract.contract_no == row['contract_no']
                        ).first()

                        data = {
                            'contract_no': row['contract_no'],
                            'contract_version': row['contract_version'],
                            'property_id': row['property_id'],
                            'tenant_id': row['tenant_id'],
                            'contract_type': row['contract_type'],
                            'monthly_rent': row['monthly_rent'],
                            'deposit_amount': row['deposit_amount'],
                            'start_date': row['start_date'].date() if pd.notna(row['start_date']) else None,
                            'end_date': row['end_date'].date() if pd.notna(row['end_date']) else None,
                            'payment_method': row['payment_method'],
                            'contract_status': row['contract_status'],
                            'signed_at': row['signed_at'].to_pydatetime() if pd.notna(row['signed_at']) else None,
                            'e_sign_url': row['e_sign_url'],
                            'overdue_status': row['overdue_status'],
                            'overdue_days': int(row['overdue_days']),
                            'overdue_amount': row['overdue_amount'],
                            'batch_no': self.batch_no,
                            'updated_at': datetime.utcnow(),
                        }

                        if existing:
                            for k, v in data.items():
                                if v is not None:
                                    setattr(existing, k, v)
                        else:
                            contract = Contract(**data)
                            session.add(contract)

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
                        self.errors.append(f"合同 {row.get('contract_no')}: {str(e)}")

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

    def merge_with_crm(self):
        with get_session() as session:
            contracts = session.query(Contract).filter(
                Contract.batch_no == self.batch_no
            ).all()

            for contract in contracts:
                if contract.tenant_id:
                    tenant = session.query(Tenant).filter(
                        Tenant.tenant_id == contract.tenant_id
                    ).first()
                    if tenant and not tenant.contracts:
                        pass

                prop = session.query(Property).filter(
                    Property.property_id == contract.property_id
                ).first()
                if prop and contract.contract_status in ('active',) and prop.listing_status != 'published':
                    prop.listing_status = 'published'
                    prop.batch_no = self.batch_no

            session.commit()
