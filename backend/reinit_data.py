#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from app.core.database import Base, engine, SessionLocal
from app.models import WorkOrder, StatusLog, ReviewRecord, Communication, WorkOrderPhoto, WorkOrderDispatchRule
from app.main import _init_sample_work_orders, _init_default_dispatch_rules
from app.services.user_service import init_default_users

print("=== Reinitializing database data ===")

db = SessionLocal()
try:
    print("  Deleting existing data...")
    db.query(WorkOrderDispatchRule).delete()
    db.query(WorkOrderPhoto).delete()
    db.query(StatusLog).delete()
    db.query(ReviewRecord).delete()
    db.query(Communication).delete()
    db.query(WorkOrder).delete()
    db.commit()
    print("  Tables cleared.")
    
    print("  Re-creating users and rules (if missing)...")
    init_default_users(db)
    _init_default_dispatch_rules(db)
    
    print("  Re-creating sample work orders (with shifted closed_at)...")
    _init_sample_work_orders(db)
    
    total = db.query(WorkOrder).count()
    closed = db.query(WorkOrder).filter(WorkOrder.closed_at.isnot(None)).count()
    from collections import Counter
    dates = db.query(WorkOrder.closed_at).filter(WorkOrder.closed_at.isnot(None)).all()
    date_counts = Counter()
    for (d,) in dates:
        date_counts[d.strftime('%Y-%m-%d')] += 1
    print(f"\n  Total: {total} work orders")
    print(f"  Closed: {closed} orders")
    print(f"  Closed dates distribution:")
    for date in sorted(date_counts.keys()):
        print(f"    {date}: {date_counts[date]}")
finally:
    db.close()
print("\nDone!")
