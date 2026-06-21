import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
import os
import re
import uuid
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import logging

from app.models import db, Email, EmailAttachment, Case, Client, Evidence
from config import Config

logger = logging.getLogger(__name__)


class EmailConnector:
    KEYWORD_CASE_PATTERNS = [
        r'(?:案号|案件编号|case\s*(?:no|number)?)\s*[:：]?\s*([A-Z0-9\-()（）]+)',
        r'([\(（]\d{4}[\)）][^\s]{0,20}民初\d+号)',
        r'([\(（]\d{4}[\)）][^\s]{0,20}民终\d+号)',
    ]
    KEYWORD_EVIDENCE_PATTERNS = [
        r'(证据|举证|材料|附件|合同|借条|欠条|转账|凭证|发票|收据|鉴定|公证)',
    ]

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config
        self.server = None
        self.connected = False

    def connect(self) -> bool:
        try:
            self.server = imaplib.IMAP4_SSL(
                self.config.EMAIL_IMAP_SERVER,
                self.config.EMAIL_IMAP_PORT
            )
            self.server.login(self.config.EMAIL_USER, self.config.EMAIL_PASSWORD)
            self.connected = True
            logger.info("Connected to email server successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to email server: {e}")
            self.connected = False
            return False

    def disconnect(self) -> None:
        if self.server and self.connected:
            try:
                self.server.logout()
            except Exception:
                pass
        self.connected = False

    def fetch_unread_emails(self, limit: int = 100) -> List[Dict[str, Any]]:
        if not self.connected:
            if not self.connect():
                return []
        try:
            self.server.select('INBOX')
            status, messages = self.server.search(None, '(UNSEEN)')
            if status != 'OK':
                return []

            email_ids = messages[0].split()
            if not email_ids:
                return []

            email_ids = email_ids[-limit:]
            results = []

            for eid in email_ids:
                try:
                    status, msg_data = self.server.fetch(eid, '(RFC822)')
                    if status != 'OK':
                        continue
                    msg = email.message_from_bytes(msg_data[0][1])
                    parsed = self._parse_email(msg)
                    if parsed:
                        results.append(parsed)
                        self.server.store(eid, '+FLAGS', '\\Seen')
                except Exception as e:
                    logger.warning(f"Failed to parse email {eid}: {e}")
                    continue

            return results
        except Exception as e:
            logger.error(f"Failed to fetch emails: {e}")
            return []

    def _parse_email(self, msg) -> Optional[Dict[str, Any]]:
        try:
            message_id = msg.get('Message-ID', str(uuid.uuid4()))

            subject = self._decode_mime_word(msg.get('Subject', ''))
            sender = msg.get('From', '')
            sender_name, sender_email_addr = self._parse_sender(sender)
            recipients = self._parse_addresses(msg.get('To', ''))
            cc_recipients = self._parse_addresses(msg.get('Cc', ''))

            sent_at = None
            date_header = msg.get('Date')
            if date_header:
                try:
                    sent_at = parsedate_to_datetime(date_header)
                except Exception:
                    sent_at = datetime.utcnow()

            body_text, body_html = self._extract_body(msg)

            attachments = []
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_maintype() == 'multipart':
                        continue
                    if part.get('Content-Disposition') is None:
                        continue
                    att = self._parse_attachment(part, message_id)
                    if att:
                        attachments.append(att)

            case_number, evidence_keywords = self._classify_content(subject, body_text)
            matched_case_id, matched_client_id = self._match_case_or_client(
                case_number, sender_email_addr, subject, body_text
            )

            return {
                'message_id': message_id,
                'subject': subject,
                'sender': sender_email_addr,
                'sender_name': sender_name,
                'recipients': recipients,
                'cc_recipients': cc_recipients,
                'sent_at': sent_at,
                'body_text': body_text,
                'body_html': body_html,
                'has_attachments': len(attachments) > 0,
                'attachment_count': len(attachments),
                'case_id': matched_case_id,
                'client_id': matched_client_id,
                'auto_classified': bool(matched_case_id or evidence_keywords),
                'classification_confidence': 0.8 if matched_case_id else (0.4 if evidence_keywords else 0.1),
                'labels': evidence_keywords,
                'attachments': attachments,
            }
        except Exception as e:
            logger.warning(f"Email parsing error: {e}")
            return None

    def _decode_mime_word(self, text: str) -> str:
        if not text:
            return ''
        parts = decode_header(text)
        decoded = []
        for part, charset in parts:
            if isinstance(part, bytes):
                try:
                    decoded.append(part.decode(charset or 'utf-8', errors='replace'))
                except Exception:
                    decoded.append(part.decode('utf-8', errors='replace'))
            else:
                decoded.append(str(part))
        return ''.join(decoded)

    def _parse_sender(self, from_header: str) -> Tuple[str, str]:
        name = ''
        addr = ''
        if not from_header:
            return name, addr
        try:
            from email.utils import parseaddr
            name, addr = parseaddr(from_header)
            name = self._decode_mime_word(name)
        except Exception:
            addr = from_header
        return name, addr

    def _parse_addresses(self, header: str) -> List[str]:
        if not header:
            return []
        from email.utils import getaddresses
        result = []
        for name, addr in getaddresses([header]):
            if addr:
                result.append(addr.lower())
        return result

    def _extract_body(self, msg) -> Tuple[str, str]:
        body_text = ''
        body_html = ''
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                cdisp = str(part.get('Content-Disposition') or '')
                if 'attachment' in cdisp:
                    continue
                payload = part.get_payload(decode=True)
                if payload is None:
                    continue
                charset = part.get_content_charset() or 'utf-8'
                try:
                    content = payload.decode(charset, errors='replace')
                except Exception:
                    content = payload.decode('utf-8', errors='replace')
                if ctype == 'text/plain':
                    body_text += content
                elif ctype == 'text/html':
                    body_html += content
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or 'utf-8'
                try:
                    body_text = payload.decode(charset, errors='replace')
                except Exception:
                    body_text = payload.decode('utf-8', errors='replace')
        return body_text[:50000], body_html[:200000]

    def _parse_attachment(self, part, message_id: str) -> Optional[Dict[str, Any]]:
        try:
            filename = self._decode_mime_word(part.get_filename() or '')
            if not filename:
                return None
            payload = part.get_payload(decode=True)
            if payload is None:
                return None
            file_size = len(payload)
            file_hash = hashlib.sha256(payload).hexdigest()

            safe_msg_id = re.sub(r'[<>]', '', message_id)[:50] if message_id else 'unknown'
            storage_dir = os.path.join(self.config.EMAIL_ATTACHMENT_DIR, safe_msg_id)
            os.makedirs(storage_dir, exist_ok=True)
            safe_filename = re.sub(r'[\\/:*?"<>|]', '_', filename)
            file_path = os.path.join(storage_dir, safe_filename)
            with open(file_path, 'wb') as f:
                f.write(payload)

            mime_type = part.get_content_type()
            return {
                'file_name': filename,
                'file_path': file_path,
                'file_size': file_size,
                'file_hash': file_hash,
                'mime_type': mime_type,
            }
        except Exception as e:
            logger.warning(f"Attachment parse error: {e}")
            return None

    def _classify_content(self, subject: str, body_text: str) -> Tuple[Optional[str], List[str]]:
        text = f"{subject} {body_text[:2000]}"
        case_number = None
        for pattern in self.KEYWORD_CASE_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                case_number = m.group(1)
                break

        evidence_keywords = []
        for pattern in self.KEYWORD_EVIDENCE_PATTERNS:
            matches = re.findall(pattern, text)
            evidence_keywords.extend(matches)
        evidence_keywords = list(set(evidence_keywords))

        return case_number, evidence_keywords

    def _match_case_or_client(
        self, case_number: Optional[str], sender_email: Optional[str],
        subject: str, body_text: str
    ) -> Tuple[Optional[str], Optional[str]]:
        matched_case_id = None
        matched_client_id = None

        if case_number:
            case = Case.query.filter(
                (Case.case_number.ilike(f'%{case_number}%')) |
                (Case.court_case_number.ilike(f'%{case_number}%'))
            ).first()
            if case:
                matched_case_id = case.id
                matched_client_id = case.client_id

        if not matched_client_id and sender_email:
            client = Client.query.filter(
                (Client.contact_email.ilike(sender_email)) |
                (Client.name.ilike(f'%{sender_email.split("@")[0]}%'))
            ).first()
            if client:
                matched_client_id = client.id

        return matched_case_id, matched_client_id

    def save_to_db(self, parsed_emails: List[Dict[str, Any]]) -> Dict[str, int]:
        stats = {'processed': 0, 'added': 0, 'updated': 0, 'failed': 0}
        for data in parsed_emails:
            try:
                stats['processed'] += 1
                attachments_data = data.pop('attachments', [])

                existing = Email.query.filter_by(message_id=data['message_id']).first()
                if existing:
                    for key, val in data.items():
                        if hasattr(existing, key) and val is not None:
                            setattr(existing, key, val)
                    existing.processed = True
                    existing.processed_at = datetime.utcnow()
                    stats['updated'] += 1
                    email_obj = existing
                else:
                    email_obj = Email(**data)
                    email_obj.processed = True
                    email_obj.processed_at = datetime.utcnow()
                    db.session.add(email_obj)
                    stats['added'] += 1

                for att_data in attachments_data:
                    email_obj.attachments.append(EmailAttachment(**att_data))

                db.session.flush()

                if attachments_data and email_obj.case_id:
                    self._link_attachments_to_evidence(email_obj, attachments_data)

            except Exception as e:
                db.session.rollback()
                stats['failed'] += 1
                logger.error(f"Save email error: {e}")
                continue

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Commit emails error: {e}")

        return stats

    def _link_attachments_to_evidence(self, email_obj: Email, attachments: List[Dict[str, Any]]):
        case = Case.query.get(email_obj.case_id)
        if not case:
            return
        for att in attachments:
            ev = Evidence.query.filter_by(
                case_id=case.id,
                file_hash=att.get('file_hash')
            ).first()
            if not ev:
                ev_code = f"EV{case.case_number}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4]}"
                ev = Evidence(
                    case_id=case.id,
                    evidence_code=ev_code,
                    evidence_name=att['file_name'],
                    evidence_type='邮件附件',
                    source_email_id=email_obj.id,
                    file_path=att.get('file_path'),
                    file_name=att['file_name'],
                    file_size=att.get('file_size'),
                    file_hash=att.get('file_hash'),
                    status='已收集'
                )
                db.session.add(ev)
