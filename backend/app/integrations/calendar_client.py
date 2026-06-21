import logging
import random
from datetime import datetime, timedelta
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

import httpx
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import SettingsConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.integrations.base_client import (
    BaseIntegrationClient,
    IntegrationConfig,
    IntegrationConnectionError,
    IntegrationError,
)
from app.models.approval_node import ApprovalStatus
from app.schemas.case import ApprovalNodeCreate

logger = logging.getLogger(__name__)


class CalendarProvider(StrEnum):
    GOOGLE = "google"
    OUTLOOK = "outlook"


class EventType(StrEnum):
    HEARING = "hearing"
    MEETING = "meeting"
    DEADLINE = "deadline"
    APPROVAL = "approval"


class CalendarConfig(IntegrationConfig):
    model_config = SettingsConfigDict(env_prefix="CALENDAR_", extra="ignore")

    provider: CalendarProvider = CalendarProvider.GOOGLE
    google_client_id: str | None = Field(default=None)
    google_client_secret: str | None = Field(default=None)
    google_refresh_token: str | None = Field(default=None)
    outlook_client_id: str | None = Field(default=None)
    outlook_client_secret: str | None = Field(default=None)
    outlook_tenant_id: str | None = Field(default=None)
    outlook_refresh_token: str | None = Field(default=None)


class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    summary: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    event_type: EventType
    case_id: str | None = None
    lawyer_id: str | None = None
    location: str | None = None
    is_all_day: bool = False


class CalendarClient(BaseIntegrationClient[CalendarEvent]):
    def __init__(
        self,
        config: CalendarConfig | None = None,
        db: AsyncSession | None = None,
    ) -> None:
        super().__init__(
            config=config or CalendarConfig(),
            db=db,
            source_system=f"calendar_{(config or CalendarConfig()).provider.value}",
        )
        self._access_token: str | None = None
        self._token_expiry: datetime | None = None

    async def _authenticate(self) -> str:
        if self._access_token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._access_token

        config = self.config
        if not isinstance(config, CalendarConfig):
            config = CalendarConfig(**config.model_dump())

        try:
            if config.provider == CalendarProvider.GOOGLE:
                token = await self._authenticate_google(config)
            elif config.provider == CalendarProvider.OUTLOOK:
                token = await self._authenticate_outlook(config)
            else:
                raise IntegrationError(f"Unsupported calendar provider: {config.provider}")

            self._access_token = token
            self._token_expiry = datetime.now() + timedelta(minutes=55)
            return token
        except Exception as e:
            raise IntegrationConnectionError(f"Calendar authentication failed: {e}") from e

    async def _authenticate_google(self, config: CalendarConfig) -> str:
        if not config.google_client_id or not config.google_client_secret or not config.google_refresh_token:
            raise IntegrationError("Google Calendar credentials not configured")

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": config.google_client_id,
                    "client_secret": config.google_client_secret,
                    "refresh_token": config.google_refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            response.raise_for_status()
            return response.json()["access_token"]

    async def _authenticate_outlook(self, config: CalendarConfig) -> str:
        if not config.outlook_client_id or not config.outlook_client_secret or not config.outlook_refresh_token:
            raise IntegrationError("Outlook Calendar credentials not configured")

        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        if config.outlook_tenant_id:
            token_url = f"https://login.microsoftonline.com/{config.outlook_tenant_id}/oauth2/v2.0/token"

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                token_url,
                data={
                    "client_id": config.outlook_client_id,
                    "client_secret": config.outlook_client_secret,
                    "refresh_token": config.outlook_refresh_token,
                    "grant_type": "refresh_token",
                    "scope": "Calendars.ReadWrite offline_access",
                },
            )
            response.raise_for_status()
            return response.json()["access_token"]

    async def _make_request(
        self,
        method: str,
        url: str,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if self.use_mock:
            logger.info(f"[MOCK] {method} {url}")
            return {}

        token = await self._authenticate()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                self._access_token = None
                self._token_expiry = None
                return await self._make_request(method, url, params, json)
            raise IntegrationConnectionError(f"HTTP {e.response.status_code}: {e}") from e
        except httpx.HTTPError as e:
            raise IntegrationConnectionError(f"Request failed: {e}") from e

    async def fetch_data(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        event_type: EventType | None = None,
        lawyer_id: str | None = None,
    ) -> list[CalendarEvent]:
        if self.use_mock:
            return await self._generate_mock_data(
                start_time=start_time,
                end_time=end_time,
                event_type=event_type,
                lawyer_id=lawyer_id,
            )

        async def _fetch() -> dict[str, Any]:
            config = self.config
            if not isinstance(config, CalendarConfig):
                config = CalendarConfig(**config.model_dump())

            start = (start_time or datetime.now()).isoformat()
            end = (end_time or datetime.now() + timedelta(days=30)).isoformat()

            if config.provider == CalendarProvider.GOOGLE:
                url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
                params = {
                    "timeMin": start,
                    "timeMax": end,
                    "singleEvents": "true",
                    "orderBy": "startTime",
                }
            else:
                url = "https://graph.microsoft.com/v1.0/me/events"
                params = {
                    "$filter": f"start/dateTime ge '{start}' and end/dateTime le '{end}'",
                    "$orderby": "start/dateTime",
                }

            return await self._make_request("GET", url, params=params)

        try:
            response = await self._retry(_fetch)
            raw_events = self._extract_events_from_response(response)
            return await self.transform_data(raw_events)
        except Exception as e:
            logger.warning(f"Failed to fetch calendar events, falling back to mock: {e}")
            return await self._generate_mock_data(
                start_time=start_time,
                end_time=end_time,
                event_type=event_type,
                lawyer_id=lawyer_id,
            )

    def _extract_events_from_response(self, response: dict[str, Any]) -> list[dict[str, Any]]:
        config = self.config
        if not isinstance(config, CalendarConfig):
            config = CalendarConfig(**config.model_dump())

        if config.provider == CalendarProvider.GOOGLE:
            return response.get("items", [])
        else:
            return response.get("value", [])

    async def get_lawyer_schedule(
        self,
        lawyer_id: str,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> dict[str, Any]:
        await self._start_sync_log()
        try:
            events = await self.fetch_data(
                start_time=start_time,
                end_time=end_time,
                lawyer_id=lawyer_id,
            )
            result = await self._complete_sync(len(events))
            result["lawyer_id"] = lawyer_id
            result["events"] = [e.model_dump() for e in events]
            return result
        except Exception as e:
            await self._fail_sync(e)

    async def get_case_hearings(
        self,
        case_id: str,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> dict[str, Any]:
        if self.use_mock:
            mock_events = await self._generate_mock_data(
                start_time=start_time,
                end_time=end_time,
                event_type=EventType.HEARING,
            )
            for event in mock_events:
                event.case_id = case_id
            return {
                "case_id": case_id,
                "total": len(mock_events),
                "hearings": [e.model_dump() for e in mock_events],
            }

        events = await self.fetch_data(
            start_time=start_time,
            end_time=end_time,
            event_type=EventType.HEARING,
        )
        case_hearings = [e for e in events if e.case_id == case_id]
        return {
            "case_id": case_id,
            "total": len(case_hearings),
            "hearings": [e.model_dump() for e in case_hearings],
        }

    async def get_approval_deadlines(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> dict[str, Any]:
        events = await self.fetch_data(
            start_time=start_time,
            end_time=end_time,
            event_type=EventType.DEADLINE,
        )
        return {
            "total": len(events),
            "deadlines": [e.model_dump() for e in events],
        }

    async def sync_approval_to_calendar(
        self,
        approval_node: ApprovalNodeCreate,
        case_no: str,
    ) -> dict[str, Any]:
        if self.use_mock:
            return {
                "success": True,
                "event_id": f"mock-{uuid4()}",
                "calendar_provider": self.config.provider.value,
            }

        event = CalendarEvent(
            id=str(uuid4()),
            summary=f"[审批] {case_no} - {approval_node.node_name}",
            description=f"案件编号: {case_no}\n审批节点: {approval_node.node_name}\n审批人ID: {approval_node.approver_id}",
            start_time=approval_node.expected_complete_time - timedelta(hours=1),
            end_time=approval_node.expected_complete_time,
            event_type=EventType.APPROVAL,
            case_id=str(approval_node.case_id),
            lawyer_id=str(approval_node.approver_id),
        )

        async def _create() -> dict[str, Any]:
            config = self.config
            if not isinstance(config, CalendarConfig):
                config = CalendarConfig(**config.model_dump())

            if config.provider == CalendarProvider.GOOGLE:
                url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
                payload = self._to_google_event(event)
            else:
                url = "https://graph.microsoft.com/v1.0/me/events"
                payload = self._to_outlook_event(event)

            return await self._make_request("POST", url, json=payload)

        try:
            response = await self._retry(_create)
            event_id = self._extract_event_id(response)
            return {
                "success": True,
                "event_id": event_id,
                "calendar_provider": self.config.provider.value,
            }
        except Exception as e:
            logger.warning(f"Failed to sync approval to calendar: {e}")
            return {
                "success": False,
                "error": str(e),
                "calendar_provider": self.config.provider.value,
            }

    async def sync_schedule_to_approval(
        self,
        event: CalendarEvent,
        case_id: UUID,
        approver_id: UUID,
    ) -> ApprovalNodeCreate:
        order_index = 0
        submit_time = event.start_time - timedelta(days=3)

        return ApprovalNodeCreate(
            case_id=case_id,
            node_name=event.summary,
            approver_id=approver_id,
            order_index=order_index,
            submit_time=submit_time,
            expected_complete_time=event.end_time,
            status=ApprovalStatus.PENDING,
            reason=event.description,
        )

    def _to_google_event(self, event: CalendarEvent) -> dict[str, Any]:
        return {
            "summary": event.summary,
            "description": event.description,
            "start": {
                "dateTime": event.start_time.isoformat(),
                "timeZone": "Asia/Shanghai",
            },
            "end": {
                "dateTime": event.end_time.isoformat(),
                "timeZone": "Asia/Shanghai",
            },
            "location": event.location,
        }

    def _to_outlook_event(self, event: CalendarEvent) -> dict[str, Any]:
        return {
            "subject": event.summary,
            "body": {
                "contentType": "Text",
                "content": event.description or "",
            },
            "start": {
                "dateTime": event.start_time.isoformat(),
                "timeZone": "Asia/Shanghai",
            },
            "end": {
                "dateTime": event.end_time.isoformat(),
                "timeZone": "Asia/Shanghai",
            },
            "location": {
                "displayName": event.location or "",
            },
        }

    def _extract_event_id(self, response: dict[str, Any]) -> str:
        return response.get("id", str(uuid4()))

    async def transform_data(self, raw_data: list[Any]) -> list[CalendarEvent]:
        config = self.config
        if not isinstance(config, CalendarConfig):
            config = CalendarConfig(**config.model_dump())

        events: list[CalendarEvent] = []
        for raw_event in raw_data:
            try:
                if config.provider == CalendarProvider.GOOGLE:
                    event = self._from_google_event(raw_event)
                else:
                    event = self._from_outlook_event(raw_event)
                events.append(event)
            except Exception as e:
                logger.warning(f"Failed to transform calendar event: {e}")
                continue
        return events

    def _from_google_event(self, raw_event: dict[str, Any]) -> CalendarEvent:
        start = raw_event.get("start", {})
        end = raw_event.get("end", {})
        summary = raw_event.get("summary", "")

        event_type = EventType.MEETING
        if "开庭" in summary or "hearing" in summary.lower():
            event_type = EventType.HEARING
        elif "截止" in summary or "deadline" in summary.lower():
            event_type = EventType.DEADLINE
        elif "审批" in summary or "approval" in summary.lower():
            event_type = EventType.APPROVAL

        return CalendarEvent(
            id=raw_event.get("id", ""),
            summary=summary,
            description=raw_event.get("description"),
            start_time=datetime.fromisoformat(start.get("dateTime", start.get("date", ""))),
            end_time=datetime.fromisoformat(end.get("dateTime", end.get("date", ""))),
            event_type=event_type,
            location=raw_event.get("location"),
            is_all_day="date" in start,
        )

    def _from_outlook_event(self, raw_event: dict[str, Any]) -> CalendarEvent:
        start = raw_event.get("start", {})
        end = raw_event.get("end", {})
        summary = raw_event.get("subject", "")

        event_type = EventType.MEETING
        if "开庭" in summary or "hearing" in summary.lower():
            event_type = EventType.HEARING
        elif "截止" in summary or "deadline" in summary.lower():
            event_type = EventType.DEADLINE
        elif "审批" in summary or "approval" in summary.lower():
            event_type = EventType.APPROVAL

        return CalendarEvent(
            id=raw_event.get("id", ""),
            summary=summary,
            description=raw_event.get("body", {}).get("content"),
            start_time=datetime.fromisoformat(start.get("dateTime", "")),
            end_time=datetime.fromisoformat(end.get("dateTime", "")),
            event_type=event_type,
            location=raw_event.get("location", {}).get("displayName"),
            is_all_day=raw_event.get("isAllDay", False),
        )

    async def _generate_mock_data(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        event_type: EventType | None = None,
        lawyer_id: str | None = None,
    ) -> list[CalendarEvent]:
        start = start_time or datetime.now()
        end = end_time or start + timedelta(days=30)

        case_ids = [
            "CASE-000001",
            "CASE-000002",
            "CASE-000003",
        ]
        lawyer_ids = [
            "550e8400-e29b-41d4-a716-446655440000",
            "550e8400-e29b-41d4-a716-446655440001",
        ]
        locations = [
            "北京市朝阳区人民法院",
            "北京市海淀区人民法院",
            "北京市东城区人民法院",
            "线上会议",
            "律所会议室A",
        ]
        event_templates = [
            (EventType.HEARING, "开庭审理 - {case_name}"),
            (EventType.MEETING, "客户会议 - {case_name}"),
            (EventType.DEADLINE, "证据提交截止 - {case_name}"),
            (EventType.APPROVAL, "合同审批 - {case_name}"),
        ]
        case_names = [
            "张某合同纠纷案",
            "王某知识产权案",
            "刘某劳动争议案",
        ]

        events: list[CalendarEvent] = []
        days_range = (end - start).days

        for i in range(min(days_range, 20)):
            day = start + timedelta(days=i)
            num_events = random.randint(0, 3)

            for j in range(num_events):
                if event_type:
                    selected_type = event_type
                    template = next(t for t in event_templates if t[0] == event_type)
                else:
                    template = random.choice(event_templates)
                    selected_type = template[0]

                case_id = random.choice(case_ids)
                case_name = random.choice(case_names)
                selected_lawyer_id = lawyer_id or random.choice(lawyer_ids)

                hour = random.randint(9, 17)
                minute = random.choice([0, 30])
                duration = random.choice([1, 2, 3])

                start_dt = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
                end_dt = start_dt + timedelta(hours=duration)

                event = CalendarEvent(
                    id=f"MOCK-EVENT-{i}-{j}",
                    summary=template[1].format(case_name=case_name),
                    description=f"案件编号: {case_id}\n案件类型: 民事诉讼\n法院: {random.choice(locations)}",
                    start_time=start_dt,
                    end_time=end_dt,
                    event_type=selected_type,
                    case_id=case_id,
                    lawyer_id=selected_lawyer_id,
                    location=random.choice(locations) if selected_type == EventType.HEARING else None,
                    is_all_day=selected_type == EventType.DEADLINE,
                )
                events.append(event)

        logger.info(f"Generated {len(events)} mock calendar events")
        return events
