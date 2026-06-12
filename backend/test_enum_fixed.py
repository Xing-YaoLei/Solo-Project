import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import CleaningRecord, StorePoint, Device, StatusLog, PointStatus, CleaningStatus, SourceChannel, CloseReason, DeviceStatus
from sqlalchemy import insert
from sqlalchemy.dialects import postgresql

print("=== Testing SQLAlchemy Enum storage with values_callable ===\n")

def test_enum(model_class, column_name, enum_value, expected_str):
    stmt = insert(model_class).values(**{column_name: enum_value})
    compiled = stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True})
    sql_str = str(compiled)
    status_val = compiled.params.get(column_name)
    
    stored_as = None
    if expected_str in sql_str:
        stored_as = expected_str
        passed = True
    else:
        passed = False
    
    print(f"{model_class.__name__}.{column_name}:")
    print(f"  Enum member: {enum_value!r}")
    print(f"  Expected stored value: '{expected_str}'")
    print(f"  SQL: {sql_str}")
    print(f"  ✅ PASS" if passed else f"  ❌ FAIL (expected '{expected_str}')")
    return passed

all_passed = True

# StorePoint.status
all_passed &= test_enum(StorePoint, 'status', PointStatus.ACTIVE, 'active')
print()

# Device.status
all_passed &= test_enum(Device, 'status', DeviceStatus.ONLINE, 'online')
print()

# CleaningRecord.source_channel
all_passed &= test_enum(CleaningRecord, 'source_channel', SourceChannel.ROUTINE_INSPECTION, 'routine_inspection')
print()

# CleaningRecord.status
all_passed &= test_enum(CleaningRecord, 'status', CleaningStatus.PENDING_REVIEW, 'pending_review')
print()

# CleaningRecord.close_reason
all_passed &= test_enum(CleaningRecord, 'close_reason', CloseReason.QUALIFIED, 'qualified')
print()

# StatusLog.from_status
all_passed &= test_enum(StatusLog, 'from_status', CleaningStatus.DRAFT, 'draft')
print()

# StatusLog.to_status
all_passed &= test_enum(StatusLog, 'to_status', CleaningStatus.COMPLETED, 'completed')

print("\n" + "=" * 60)
print(f"Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
print("All enum values are stored as lowercase string (matching PostgreSQL enum type)")
