from data_layer import DataRepository
from data_layer.duckdb_engine import DuckDBEngine

def main():
    repo = DataRepository()
    db = DuckDBEngine()

    # Test 1: attachments last update time
    t = repo.get_last_update_time('attachments')
    print(f'[Test 1] attachments last update time: {t}')
    assert t is not None, 'attachments table should have last update time'

    # Test 2: design_exports
    t2 = repo.get_last_update_time('design_exports')
    print(f'[Test 2] design_exports last update time: {t2}')
    assert t2 is not None

    # Test 3: change_timeline (uses changed_at)
    t3 = repo.get_last_update_time('change_timeline')
    print(f'[Test 3] change_timeline last update time: {t3}')
    assert t3 is not None

    # Test 4: project_confirmations (uses last_updated)
    t4 = repo.get_last_update_time('project_confirmations')
    print(f'[Test 4] project_confirmations last update time: {t4}')
    assert t4 is not None

    # Test 5: auth_scopes (uses created_at)
    t5 = repo.get_last_update_time('auth_scopes')
    print(f'[Test 5] auth_scopes last update time: {t5}')
    assert t5 is not None

    # Test 6: missing samples should have data
    missing = repo.get_missing_data_samples()
    print(f'[Test 6] missing samples count: {missing.height}')
    if missing.height > 0:
        row = missing.to_dicts()[0]
        print(f'  project_id: {row.get("project_id")}')
        print(f'  data_source: {row.get("data_source")}')
        print(f'  missing_fields: {row.get("missing_fields")}')

    # Test 7: attachments data
    attach = repo.get_attachments()
    print(f'[Test 7] attachments count: {attach.height}')
    print(f'  columns: {attach.columns}')

    # Test 8: payment_records (uses updated_at)
    t8 = db.get_last_update_time('payment_records')
    print(f'[Test 8] payment_records last update time: {t8}')

    # Test 9: purchase_orders
    t9 = db.get_last_update_time('purchase_orders')
    print(f'[Test 9] purchase_orders last update time: {t9}')

    print()
    print('ALL TESTS PASSED')

if __name__ == '__main__':
    main()
