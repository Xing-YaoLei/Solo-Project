from app.integrations.base_client import (
    BaseIntegrationClient,
    IntegrationConfig,
    IntegrationConnectionError,
    IntegrationError,
    IntegrationTimeoutError,
    IntegrationAuthError,
)
from app.integrations.case_system_client import (
    CaseSystemClient,
    CaseSystemConfig,
    ExternalCase,
    ExternalCaseFee,
)
from app.integrations.calendar_client import (
    CalendarClient,
    CalendarConfig,
    CalendarEvent,
    CalendarProvider,
    EventType,
)
from app.integrations.email_parser import (
    EmailParser,
    EmailConfig,
    ParsedEmail,
    ParsedAttachment,
    AttachmentType,
)

__all__ = [
    "BaseIntegrationClient",
    "IntegrationConfig",
    "IntegrationError",
    "IntegrationConnectionError",
    "IntegrationTimeoutError",
    "IntegrationAuthError",
    "CaseSystemClient",
    "CaseSystemConfig",
    "ExternalCase",
    "ExternalCaseFee",
    "CalendarClient",
    "CalendarConfig",
    "CalendarEvent",
    "CalendarProvider",
    "EventType",
    "EmailParser",
    "EmailConfig",
    "ParsedEmail",
    "ParsedAttachment",
    "AttachmentType",
]
