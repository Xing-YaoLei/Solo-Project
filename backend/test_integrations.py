import sys
sys.path.insert(0, '.')

print("Testing integrations module imports...")
print("=" * 60)

try:
    from app.integrations.base_client import (
        BaseIntegrationClient,
        IntegrationConfig,
        IntegrationError,
        IntegrationConnectionError,
        IntegrationTimeoutError,
        IntegrationAuthError,
    )
    print("✓ base_client imports OK")
    print(f"  - BaseIntegrationClient: {BaseIntegrationClient}")
    print(f"  - IntegrationConfig: {IntegrationConfig}")
except Exception as e:
    print(f"✗ base_client: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    from app.integrations.case_system_client import (
        CaseSystemClient,
        CaseSystemConfig,
        ExternalCase,
        ExternalCaseFee,
    )
    print("✓ case_system_client imports OK")
    print(f"  - CaseSystemClient: {CaseSystemClient}")
except Exception as e:
    print(f"✗ case_system_client: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    from app.integrations.calendar_client import (
        CalendarClient,
        CalendarConfig,
        CalendarEvent,
        CalendarProvider,
        EventType,
    )
    print("✓ calendar_client imports OK")
    print(f"  - CalendarClient: {CalendarClient}")
    print(f"  - EventType.HEARING: {EventType.HEARING}")
except Exception as e:
    print(f"✗ calendar_client: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    from app.integrations.email_parser import (
        EmailParser,
        EmailConfig,
        ParsedEmail,
        ParsedAttachment,
        AttachmentType,
    )
    print("✓ email_parser imports OK")
    print(f"  - EmailParser: {EmailParser}")
    print(f"  - AttachmentType.INVOICE: {AttachmentType.INVOICE}")
except Exception as e:
    print(f"✗ email_parser: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    from app.integrations import (
        BaseIntegrationClient,
        CaseSystemClient,
        CalendarClient,
        EmailParser,
    )
    print("✓ __init__ exports OK")
    print(f"  - All main classes exported successfully")
except Exception as e:
    print(f"✗ __init__: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("Import tests completed!")
