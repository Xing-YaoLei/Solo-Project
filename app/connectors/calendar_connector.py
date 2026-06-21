import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
import re
import uuid
import icalendar
from dateutil.rrule import rrule, rruleset
import pytz

from app.models import db, CalendarEvent, Hearing, Case
from config import Config

logger = logging.getLogger(__name__)


class CalendarConnector:
    HEARING_KEYWORDS = ['开庭', '庭审', '听证', '仲裁', '调解', '谈话', '询问', '质证']
    CASE_NUMBER_PATTERN = r'[\(（]\d{4}[\)）][^\s]{0,20}(?:民初|民终|民申|民再|刑初|刑终|行初|行终|执|仲)\d+号'

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config
        self.tz = pytz.timezone('Asia/Shanghai')

    def sync_ics_url(self, ics_url: Optional[str] = None) -> List[Dict[str, Any]]:
        url = ics_url or self.config.CALENDAR_ICS_URL
        if not url:
            logger.warning("No ICS URL configured")
            return []
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            return self._parse_ics_data(resp.text, source='ics_url')
        except Exception as e:
            logger.error(f"Failed to sync ICS calendar: {e}")
            return []

    def sync_webdav(self, webdav_url: Optional[str] = None,
                    username: Optional[str] = None,
                    password: Optional[str] = None) -> List[Dict[str, Any]]:
        url = webdav_url or self.config.CALENDAR_WEBDAV_URL
        if not url:
            logger.warning("No WebDAV URL configured")
            return []
        try:
            auth = (username or self.config.EMAIL_USER,
                    password or self.config.EMAIL_PASSWORD)
            headers = {
                'Depth': '1',
                'Content-Type': 'text/xml; charset=utf-8'
            }
            body = '''<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="{start}" end="{end}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>'''
            now = datetime.now(self.tz)
            start = (now - timedelta(days=30)).strftime('%Y%m%dT%H%M%SZ')
            end = (now + timedelta(days=180)).strftime('%Y%m%dT%H%M%SZ')
            body = body.format(start=start, end=end)

            resp = requests.request('REPORT', url, auth=auth, headers=headers,
                                    data=body, timeout=30)
            resp.raise_for_status()

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, 'lxml-xml')
            results = []
            for cal_data in soup.find_all('calendar-data'):
                events = self._parse_ics_data(cal_data.get_text() or '', source='webdav')
                results.extend(events)
            return results
        except Exception as e:
            logger.error(f"Failed to sync WebDAV calendar: {e}")
            return []

    def _parse_ics_data(self, ics_text: str, source: str) -> List[Dict[str, Any]]:
        results = []
        if not ics_text:
            return results
        try:
            cal = icalendar.Calendar.from_ical(ics_text)
        except Exception as e:
            logger.error(f"Failed to parse ICS: {e}")
            return results

        for component in cal.walk():
            if component.name != 'VEVENT':
                continue
            try:
                parsed = self._parse_event(component, source)
                if parsed:
                    results.append(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse event: {e}")
                continue
        return results

    def _parse_event(self, event, source: str) -> Optional[Dict[str, Any]]:
        try:
            uid = str(event.get('UID', uuid.uuid4()))
            title = str(event.get('SUMMARY', ''))
            description = str(event.get('DESCRIPTION', ''))
            location = str(event.get('LOCATION', ''))

            dtstart = event.get('DTSTART')
            dtend = event.get('DTEND')
            start_time = self._dt_to_utc(dtstart.dt) if dtstart else None
            end_time = self._dt_to_utc(dtend.dt) if dtend else None
            if not start_time:
                return None

            is_all_day = hasattr(dtstart.dt, 'date') and not hasattr(dtstart.dt, 'hour')

            organizer = ''
            org = event.get('ORGANIZER')
            if org:
                organizer = str(org)

            attendees = []
            for attendee in event.get('ATTENDEE', []) if isinstance(event.get('ATTENDEE'), list) else [event.get('ATTENDEE')]:
                if attendee:
                    attendees.append(str(attendee))

            event_type = self._detect_event_type(title, description, location)

            case_number = self._extract_case_number(f"{title} {description} {location}")
            linked_case_id = None
            linked_hearing_id = None
            if case_number:
                case = Case.query.filter(
                    (Case.case_number.ilike(f'%{case_number}%')) |
                    (Case.court_case_number.ilike(f'%{case_number}%'))
                ).first()
                if case:
                    linked_case_id = case.id
                    if event_type == 'hearing':
                        linked_hearing_id = self._find_or_create_hearing(case, start_time, title, location)

            recurrence = str(event.get('RRULE', '')) or None

            status_map = {'CONFIRMED': 'confirmed', 'TENTATIVE': 'tentative',
                          'CANCELLED': 'cancelled'}
            status = status_map.get(str(event.get('STATUS', 'CONFIRMED')), 'confirmed')

            return {
                'event_uid': uid,
                'title': title,
                'description': description,
                'start_time': start_time,
                'end_time': end_time,
                'location': location,
                'attendees': attendees,
                'organizer': organizer,
                'event_type': event_type,
                'linked_case_id': linked_case_id,
                'linked_hearing_id': linked_hearing_id,
                'is_all_day': is_all_day,
                'recurrence_rule': recurrence,
                'status': status,
                'source': source,
                'last_synced_at': datetime.utcnow()
            }
        except Exception as e:
            logger.warning(f"Parse event error: {e}")
            return None

    def _dt_to_utc(self, dt) -> datetime:
        if isinstance(dt, datetime):
            if dt.tzinfo:
                return dt.astimezone(pytz.UTC).replace(tzinfo=None)
            return dt
        else:
            return datetime.combine(dt, datetime.min.time())

    def _detect_event_type(self, title: str, description: str, location: str) -> str:
        text = f"{title} {description} {location}"
        for kw in self.HEARING_KEYWORDS:
            if kw in text:
                return 'hearing'
        if '立案' in text or '受理' in text:
            return 'filing'
        if '调解' in text:
            return 'mediation'
        if '客户' in text or '咨询' in text or '会见' in text:
            return 'client_meeting'
        if '会议' in text:
            return 'meeting'
        return 'other'

    def _extract_case_number(self, text: str) -> Optional[str]:
        match = re.search(self.CASE_NUMBER_PATTERN, text)
        if match:
            return match.group(0)
        m = re.search(r'案号\s*[:：]?\s*([A-Z0-9\-()（）]+)', text, re.IGNORECASE)
        if m:
            return m.group(1)
        return None

    def _find_or_create_hearing(self, case: Case, start_time: datetime,
                                title: str, location: str) -> Optional[str]:
        try:
            hearing = Hearing.query.filter(
                Hearing.case_id == case.id,
                Hearing.scheduled_at >= start_time - timedelta(minutes=30),
                Hearing.scheduled_at <= start_time + timedelta(minutes=30)
            ).first()

            if not hearing:
                hearing_round = Hearing.query.filter_by(case_id=case.id).count() + 1
                hearing = Hearing(
                    case_id=case.id,
                    hearing_round=hearing_round,
                    hearing_type=self._detect_hearing_type(title),
                    scheduled_at=start_time,
                    location=location,
                    court_room=location if '法院' in location or '法庭' in location else None,
                    status='已排期',
                    preparation_status='未开始'
                )
                db.session.add(hearing)
                db.session.flush()
            return hearing.id
        except Exception as e:
            logger.error(f"Find/create hearing error: {e}")
            return None

    def _detect_hearing_type(self, title: str) -> str:
        if '一审' in title or '民初' in title:
            return '一审开庭'
        if '二审' in title or '民终' in title:
            return '二审开庭'
        if '再审' in title:
            return '再审听证'
        if '调解' in title:
            return '调解'
        if '质证' in title:
            return '质证'
        if '仲裁' in title:
            return '仲裁开庭'
        return '开庭审理'

    def save_to_db(self, events: List[Dict[str, Any]]) -> Dict[str, int]:
        stats = {'processed': 0, 'added': 0, 'updated': 0, 'failed': 0}
        for data in events:
            try:
                stats['processed'] += 1
                existing = CalendarEvent.query.filter_by(event_uid=data['event_uid']).first()
                if existing:
                    for key, val in data.items():
                        if hasattr(existing, key) and val is not None:
                            setattr(existing, key, val)
                    existing.last_synced_at = datetime.utcnow()
                    stats['updated'] += 1
                else:
                    db.session.add(CalendarEvent(**data))
                    stats['added'] += 1
            except Exception as e:
                stats['failed'] += 1
                logger.error(f"Save calendar event error: {e}")
                continue

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Commit calendar events error: {e}")

        return stats


class AnomalyDetector:
    def __init__(self):
        self.tz = pytz.timezone('Asia/Shanghai')

    def detect_all(self) -> List[Dict[str, Any]]:
        results = []
        results.extend(self._detect_time_conflicts())
        results.extend(self._detect_upcoming_unprepared())
        results.extend(self._detect_judge_clashes())
        return results

    def _detect_time_conflicts(self) -> List[Dict[str, Any]]:
        conflicts = []
        now = datetime.utcnow()
        hearings = Hearing.query.filter(
            Hearing.scheduled_at >= now,
            Hearing.status.in_(['已排期', '正常'])
        ).order_by(Hearing.scheduled_at).all()

        lawyer_hearings = {}
        for h in hearings:
            lawyers = [h.case.responsible_lawyer_id] if h.case and h.case.responsible_lawyer_id else []
            if h.attending_lawyers:
                lawyers.extend(h.attending_lawyers)
            for lawyer_id in lawyers:
                if lawyer_id not in lawyer_hearings:
                    lawyer_hearings[lawyer_id] = []
                lawyer_hearings[lawyer_id].append(h)

        for lawyer_id, hs in lawyer_hearings.items():
            for i in range(len(hs)):
                for j in range(i + 1, len(hs)):
                    h1, h2 = hs[i], hs[j]
                    end1 = h1.scheduled_end_at or (h1.scheduled_at + timedelta(hours=2))
                    end2 = h2.scheduled_end_at or (h2.scheduled_at + timedelta(hours=2))
                    if h1.scheduled_at < end2 and h2.scheduled_at < end1:
                        anomaly_text = f"时间冲突: 与{h2.case.case_name if h2.case else '另案'}的{h2.hearing_type or '庭审'}冲突"
                        self._add_anomaly(h1, anomaly_text)
                        self._add_anomaly(h2, f"时间冲突: 与{h1.case.case_name if h1.case else '另案'}的{h1.hearing_type or '庭审'}冲突")
                        conflicts.append({
                            'type': 'time_conflict',
                            'lawyer_id': lawyer_id,
                            'hearing1_id': h1.id,
                            'hearing2_id': h2.id
                        })
        return conflicts

    def _detect_upcoming_unprepared(self) -> List[Dict[str, Any]]:
        anomalies = []
        now = datetime.utcnow()
        threshold = now + timedelta(hours=72)
        hearings = Hearing.query.filter(
            Hearing.scheduled_at > now,
            Hearing.scheduled_at <= threshold,
            Hearing.status.in_(['已排期', '正常']),
            Hearing.preparation_status.in_(['未开始', '进行中'])
        ).all()
        for h in hearings:
            hours_left = (h.scheduled_at - now).total_seconds() / 3600
            if hours_left <= 72:
                tag = '临近开庭准备不足'
                self._add_anomaly(h, tag)
                anomalies.append({'type': 'unprepared', 'hearing_id': h.id})
        return anomalies

    def _detect_judge_clashes(self) -> List[Dict[str, Any]]:
        anomalies = []
        now = datetime.utcnow()
        hearings = Hearing.query.filter(
            Hearing.scheduled_at >= now,
            Hearing.status.in_(['已排期', '正常']),
            Hearing.presiding_judge.isnot(None)
        ).order_by(Hearing.scheduled_at).all()

        judge_hearings = {}
        for h in hearings:
            judge = h.presiding_judge
            if judge not in judge_hearings:
                judge_hearings[judge] = []
            judge_hearings[judge].append(h)

        for judge, hs in judge_hearings.items():
            for i in range(len(hs)):
                for j in range(i + 1, len(hs)):
                    h1, h2 = hs[i], hs[j]
                    if abs((h1.scheduled_at - h2.scheduled_at).total_seconds()) < 3600 * 4:
                        self._add_anomaly(h1, f"同一审判人员集中排期: {judge}")
                        self._add_anomaly(h2, f"同一审判人员集中排期: {judge}")
                        anomalies.append({'type': 'judge_clash', 'judge': judge})
        return anomalies

    def _add_anomaly(self, hearing: Hearing, anomaly_text: str):
        existing = hearing.anomalies or []
        if anomaly_text not in existing:
            existing.append(anomaly_text)
            hearing.anomalies = existing
            if any(k in anomaly_text for k in ['冲突', '不足']):
                hearing.status = '冲突'
        try:
            db.session.flush()
        except Exception:
            pass
