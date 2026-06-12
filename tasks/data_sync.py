from celery import shared_task
from etl.clean_receipts import clean_receipts
from etl.clean_inventory import clean_inventory, generate_inventory_ledger_from_snapshots
from etl.clean_pos import clean_pos
from etl.caliber_match import caliber_match
from db.connection import Session


@shared_task(name="tasks.data_sync.sync_all_data")
def sync_all_data():
    session = Session()
    try:
        receipt_count = clean_receipts(session)
        inventory_count = clean_inventory(session)
        pos_count = clean_pos(session)
        ledger_count = generate_inventory_ledger_from_snapshots(session)
        usage_count = caliber_match(session)
        session.commit()
        return {
            "receipt_count": receipt_count,
            "inventory_count": inventory_count,
            "pos_count": pos_count,
            "ledger_count": ledger_count,
            "usage_count": usage_count,
        }
    except Exception:
        session.rollback()
        raise
    finally:
        Session.remove()
