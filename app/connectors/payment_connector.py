import os
import re
import hashlib
import uuid
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal

import pandas as pd
import numpy as np

from app.models import db, PaymentTransaction, Case, Client
from config import Config

logger = logging.getLogger(__name__)


class PaymentStatementParser:
    TRANSACTION_ID_PATTERNS = [
        r'(?:流水号|交易流水号|业务流水号|交易单号|交易号)\s*[:：]?\s*([A-Z0-9\-]+)',
    ]

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config

    def parse_all_sources(self) -> List[Dict[str, Any]]:
        all_txs = []
        all_txs.extend(self.parse_bank_statements())
        all_txs.extend(self.parse_alipay())
        all_txs.extend(self.parse_wechat())
        return all_txs

    def parse_bank_statements(self) -> List[Dict[str, Any]]:
        records = []
        stmt_dir = self.config.PAYMENT_BANK_STATEMENT_DIR
        if not os.path.exists(stmt_dir):
            return records
        for fname in os.listdir(stmt_dir):
            fpath = os.path.join(stmt_dir, fname)
            try:
                if fname.endswith(('.xlsx', '.xls')):
                    records.extend(self._parse_bank_excel(fpath))
                elif fname.endswith('.csv'):
                    records.extend(self._parse_bank_csv(fpath))
            except Exception as e:
                logger.warning(f"Failed to parse bank statement {fname}: {e}")
        return records

    def _parse_bank_excel(self, fpath: str) -> List[Dict[str, Any]]:
        df = pd.read_excel(fpath, dtype=str)
        df = df.fillna('')
        rows = []
        col_map = self._detect_columns(df.columns.tolist())
        if not col_map:
            return rows
        for _, row in df.iterrows():
            try:
                tx = self._row_to_txn(row, col_map, 'bank', fpath)
                if tx:
                    rows.append(tx)
            except Exception as e:
                logger.debug(f"Row parse skip: {e}")
                continue
        return rows

    def _parse_bank_csv(self, fpath: str) -> List[Dict[str, Any]]:
        try:
            df = pd.read_csv(fpath, dtype=str, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(fpath, dtype=str, encoding='gbk')
        df = df.fillna('')
        rows = []
        col_map = self._detect_columns(df.columns.tolist())
        if not col_map:
            return rows
        for _, row in df.iterrows():
            try:
                tx = self._row_to_txn(row, col_map, 'bank', fpath)
                if tx:
                    rows.append(tx)
            except Exception as e:
                logger.debug(f"Row parse skip: {e}")
                continue
        return rows

    def _detect_columns(self, columns: List[str]) -> Optional[Dict[str, str]]:
        mapping = {}
        for col in columns:
            col_clean = str(col).strip()
            if any(k in col_clean for k in ['日期', '交易日期', '记账日期', '发生日期']):
                mapping['date'] = col_clean
            elif any(k in col_clean for k in ['摘要', '用途', '备注', '附言', '交易说明']):
                mapping['remark'] = col_clean
            elif any(k in col_clean for k in ['对方户名', '对方单位', '付款人', '收款人', '交易方']):
                mapping['counterparty'] = col_clean
            elif any(k in col_clean for k in ['对方账号', '付款账号', '收款账号']):
                mapping['counterparty_account'] = col_clean
            elif any(k in col_clean for k in ['收入金额', '贷方金额', '存入', '收款金额']):
                mapping['income'] = col_clean
            elif any(k in col_clean for k in ['支出金额', '借方金额', '支出', '付款金额']):
                mapping['expense'] = col_clean
            elif any(k in col_clean for k in ['金额', '发生额', '交易金额']) and 'amount' not in mapping:
                mapping['amount'] = col_clean
            elif any(k in col_clean for k in ['余额', '账户余额']):
                mapping['balance'] = col_clean
            elif any(k in col_clean for k in ['流水号', '交易号', '业务编号']):
                mapping['ref'] = col_clean
        if 'date' in mapping and ('income' in mapping or 'amount' in mapping):
            return mapping
        return None

    def _row_to_txn(self, row: pd.Series, col_map: Dict[str, str],
                    source: str, fpath: str) -> Optional[Dict[str, Any]]:
        date_val = self._parse_date(row.get(col_map.get('date', ''), ''))
        if not date_val:
            return None

        income_str = str(row.get(col_map.get('income', ''), '')) if 'income' in col_map else ''
        expense_str = str(row.get(col_map.get('expense', ''), '')) if 'expense' in col_map else ''
        amount_str = str(row.get(col_map.get('amount', ''), '')) if 'amount' in col_map else ''

        amount = Decimal('0')
        is_income = True
        if income_str and self._to_decimal(income_str) > 0:
            amount = self._to_decimal(income_str)
            is_income = True
        elif expense_str and self._to_decimal(expense_str) > 0:
            amount = self._to_decimal(expense_str)
            is_income = False
        elif amount_str:
            amt = self._to_decimal(amount_str)
            if amt == 0:
                return None
            amount = abs(amt)
            is_income = amt > 0

        if not is_income:
            return None
        if amount <= 0:
            return None

        counterparty = str(row.get(col_map.get('counterparty', ''), '')).strip()
        remark = str(row.get(col_map.get('remark', ''), '')).strip()
        ref = str(row.get(col_map.get('ref', ''), '')).strip()
        counterparty_account = str(row.get(col_map.get('counterparty_account', ''), '')).strip()

        unique_key = f"{date_val.isoformat()}|{str(amount)}|{counterparty}|{remark}|{ref}|{source}"
        txn_id = hashlib.sha256(unique_key.encode()).hexdigest()[:24]

        matched_case_id, matched_client_id = self._match_case_or_client(
            counterparty, remark, amount
        )

        return {
            'txn_id': txn_id,
            'case_id': matched_case_id,
            'client_id': matched_client_id,
            'contract_amount': amount,
            'payment_stage': self._detect_stage(remark),
            'scheduled_amount': amount,
            'actual_amount': amount,
            'currency': 'CNY',
            'payment_method': 'bank_transfer',
            'source': source,
            'payer_account': counterparty_account,
            'payee_account': '',
            'bank_ref': ref,
            'scheduled_date': date_val,
            'actual_date': date_val,
            'status': '部分收款' if matched_case_id else '未核对',
            'is_overdue': False,
            'reconciliation_status': '已匹配' if matched_case_id else '未匹配',
            'notes': remark,
            'statement_file_id': hashlib.md5(fpath.encode()).hexdigest()[:12],
        }

    def parse_alipay(self) -> List[Dict[str, Any]]:
        records = []
        alipay_dir = self.config.PAYMENT_ALIPAY_DIR
        if not os.path.exists(alipay_dir):
            return records
        for fname in os.listdir(alipay_dir):
            fpath = os.path.join(alipay_dir, fname)
            try:
                if fname.endswith('.csv'):
                    records.extend(self._parse_alipay_csv(fpath))
            except Exception as e:
                logger.warning(f"Failed to parse alipay {fname}: {e}")
        return records

    def _parse_alipay_csv(self, fpath: str) -> List[Dict[str, Any]]:
        try:
            with open(fpath, 'r', encoding='gbk') as f:
                lines = f.readlines()
            start_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('交易号,') or line.startswith('交易时间,'):
                    start_idx = i
                    break
            df = pd.read_csv(fpath, skiprows=start_idx, dtype=str, encoding='gbk')
        except Exception:
            df = pd.read_csv(fpath, dtype=str, encoding='utf-8')
        df = df.fillna('')
        rows = []
        for _, row in df.iterrows():
            try:
                tx = self._row_to_txn_alipay(row, fpath)
                if tx:
                    rows.append(tx)
            except Exception:
                continue
        return rows

    def _row_to_txn_alipay(self, row: pd.Series, fpath: str) -> Optional[Dict[str, Any]]:
        date_str = ''
        for col in ['交易时间', '交易创建时间', '付款时间']:
            if col in row:
                date_str = str(row[col])
                break
        date_val = self._parse_date(date_str)
        if not date_val:
            return None
        amount_str = str(row.get('金额', '') or row.get('交易金额', '') or '')
        amount = self._to_decimal(amount_str)
        if amount <= 0:
            return None
        direction = str(row.get('收/支', '') or row.get('资金状态', '') or '')
        if direction and '支' in direction:
            return None

        counterparty = str(row.get('交易对方', '') or row.get('对方', '') or '')
        remark = str(row.get('商品名称', '') or row.get('商品说明', '') or row.get('备注', '') or '')
        ref = str(row.get('交易号', '') or row.get('交易单号', '') or '')

        unique_key = f"alipay|{date_val.isoformat()}|{str(amount)}|{counterparty}|{remark}|{ref}"
        txn_id = hashlib.sha256(unique_key.encode()).hexdigest()[:24]
        matched_case_id, matched_client_id = self._match_case_or_client(counterparty, remark, amount)

        return {
            'txn_id': txn_id,
            'case_id': matched_case_id,
            'client_id': matched_client_id,
            'contract_amount': amount,
            'payment_stage': self._detect_stage(remark),
            'scheduled_amount': amount,
            'actual_amount': amount,
            'currency': 'CNY',
            'payment_method': 'alipay',
            'source': 'alipay',
            'payer_account': '',
            'payee_account': '',
            'bank_ref': ref,
            'scheduled_date': date_val,
            'actual_date': date_val,
            'status': '部分收款' if matched_case_id else '未核对',
            'is_overdue': False,
            'reconciliation_status': '已匹配' if matched_case_id else '未匹配',
            'notes': remark,
            'statement_file_id': hashlib.md5(fpath.encode()).hexdigest()[:12],
        }

    def parse_wechat(self) -> List[Dict[str, Any]]:
        records = []
        wx_dir = self.config.PAYMENT_WECHAT_DIR
        if not os.path.exists(wx_dir):
            return records
        for fname in os.listdir(wx_dir):
            fpath = os.path.join(wx_dir, fname)
            try:
                if fname.endswith('.csv'):
                    records.extend(self._parse_wechat_csv(fpath))
            except Exception as e:
                logger.warning(f"Failed to parse wechat {fname}: {e}")
        return records

    def _parse_wechat_csv(self, fpath: str) -> List[Dict[str, Any]]:
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            start_idx = 0
            for i, line in enumerate(lines):
                if '交易时间' in line and '交易类型' in line:
                    start_idx = i
                    break
            df = pd.read_csv(fpath, skiprows=start_idx, dtype=str, encoding='utf-8')
        except Exception:
            try:
                df = pd.read_csv(fpath, dtype=str, encoding='gbk')
            except Exception:
                df = pd.read_csv(fpath, dtype=str, encoding='utf-8')
        df = df.fillna('')
        rows = []
        for _, row in df.iterrows():
            try:
                tx = self._row_to_txn_wechat(row, fpath)
                if tx:
                    rows.append(tx)
            except Exception:
                continue
        return rows

    def _row_to_txn_wechat(self, row: pd.Series, fpath: str) -> Optional[Dict[str, Any]]:
        date_str = str(row.get('交易时间', '') or '')
        date_val = self._parse_date(date_str)
        if not date_val:
            return None
        amount_str = str(row.get('金额(元)', '') or row.get('金额', '') or '').replace('¥', '').replace(',', '')
        amount = self._to_decimal(amount_str)
        if amount <= 0:
            return None
        direction = str(row.get('收/支', '') or '')
        if direction and '支出' in direction:
            return None
        counterparty = str(row.get('交易对方', '') or '')
        remark = str(row.get('商品', '') or row.get('备注', '') or '')
        ref = str(row.get('交易单号', '') or row.get('商户单号', '') or '')

        unique_key = f"wechat|{date_val.isoformat()}|{str(amount)}|{counterparty}|{remark}|{ref}"
        txn_id = hashlib.sha256(unique_key.encode()).hexdigest()[:24]
        matched_case_id, matched_client_id = self._match_case_or_client(counterparty, remark, amount)

        return {
            'txn_id': txn_id,
            'case_id': matched_case_id,
            'client_id': matched_client_id,
            'contract_amount': amount,
            'payment_stage': self._detect_stage(remark),
            'scheduled_amount': amount,
            'actual_amount': amount,
            'currency': 'CNY',
            'payment_method': 'wechat',
            'source': 'wechat',
            'payer_account': '',
            'payee_account': '',
            'bank_ref': ref,
            'scheduled_date': date_val,
            'actual_date': date_val,
            'status': '部分收款' if matched_case_id else '未核对',
            'is_overdue': False,
            'reconciliation_status': '已匹配' if matched_case_id else '未匹配',
            'notes': remark,
            'statement_file_id': hashlib.md5(fpath.encode()).hexdigest()[:12],
        }

    def _parse_date(self, s: str) -> Optional[date]:
        if not s:
            return None
        s = str(s).strip()
        fmts = [
            '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d',
            '%Y/%m/%d %H:%M:%S', '%Y/%m/%d %H:%M', '%Y/%m/%d',
            '%Y年%m月%d日 %H:%M:%S', '%Y年%m月%d日',
            '%m/%d/%Y', '%d/%m/%Y',
            '%Y%m%d'
        ]
        for fmt in fmts:
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
        try:
            return pd.to_datetime(s, errors='coerce').date()
        except Exception:
            return None

    def _to_decimal(self, s: str) -> Decimal:
        if not s:
            return Decimal('0')
        try:
            clean = re.sub(r'[^\d\.\-]', '', str(s))
            return Decimal(clean) if clean else Decimal('0')
        except Exception:
            return Decimal('0')

    def _detect_stage(self, remark: str) -> str:
        if not remark:
            return '其他款项'
        r = remark
        if any(k in r for k in ['首期', '首笔', '首付', '第一期', '定金', '签约']):
            return '首期律师费'
        if any(k in r for k in ['二期', '第二笔', '立案']):
            return '二期律师费'
        if any(k in r for k in ['尾款', '三期', '结案', '胜诉']):
            return '尾款律师费'
        if any(k in r for k in ['风险', '风险代理', '分成', '提成']):
            return '风险代理费'
        if any(k in r for k in ['诉讼费', '受理费', '保全费', '公告费', '鉴定费', '公证费']):
            return '代垫费用'
        return '律师费'

    def _match_case_or_client(self, counterparty: str, remark: str, amount: Decimal) -> Tuple[Optional[str], Optional[str]]:
        matched_case_id = None
        matched_client_id = None

        if remark:
            m = re.search(r'([\(（]\d{4}[\)）][^\s]{0,20}民初\d+号)', remark)
            if not m:
                m = re.search(r'案号\s*[:：]?\s*([A-Z0-9\-()（）]+)', remark, re.IGNORECASE)
            if m:
                case = Case.query.filter(
                    (Case.case_number.ilike(f'%{m.group(1)}%')) |
                    (Case.court_case_number.ilike(f'%{m.group(1)}%'))
                ).first()
                if case:
                    matched_case_id = case.id
                    matched_client_id = case.client_id

        if not matched_client_id and counterparty:
            client = Client.query.filter(
                (Client.name == counterparty) |
                (Client.name.ilike(f'%{counterparty}%')) |
                (Client.contact_person == counterparty)
            ).first()
            if client:
                matched_client_id = client.id

        if not matched_case_id and matched_client_id and amount > 0:
            case = Case.query.filter_by(
                client_id=matched_client_id, status='active'
            ).order_by(Case.created_at.desc()).first()
            if case:
                matched_case_id = case.id

        return matched_case_id, matched_client_id

    def save_to_db(self, records: List[Dict[str, Any]]) -> Dict[str, int]:
        stats = {'processed': 0, 'added': 0, 'updated': 0, 'failed': 0}
        for data in records:
            try:
                stats['processed'] += 1
                existing = PaymentTransaction.query.filter_by(txn_id=data['txn_id']).first()
                if existing:
                    for key, val in data.items():
                        if hasattr(existing, key) and val is not None:
                            setattr(existing, key, val)
                    stats['updated'] += 1
                else:
                    db.session.add(PaymentTransaction(**data))
                    stats['added'] += 1
            except Exception as e:
                stats['failed'] += 1
                logger.error(f"Save payment error: {e}")
                continue

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Commit payments error: {e}")

        self._update_case_payment_status()
        return stats

    def _update_case_payment_status(self):
        try:
            cases = Case.query.filter_by(status='active').all()
            for case in cases:
                txns = PaymentTransaction.query.filter_by(case_id=case.id).all()
                if not txns:
                    continue
                total_due = sum(float(t.scheduled_amount) for t in txns)
                total_paid = sum(float(t.actual_amount) for t in txns)
                if total_paid >= total_due and total_due > 0:
                    for t in txns:
                        t.status = '已结清'
                elif total_paid > 0:
                    for t in txns:
                        if float(t.actual_amount) > 0:
                            t.status = '部分收款'
            db.session.commit()
        except Exception as e:
            logger.error(f"Update payment status error: {e}")
            db.session.rollback()
