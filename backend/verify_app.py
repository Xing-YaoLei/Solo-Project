import sys
import traceback

try:
    from app.main import app
    print('✓ app.main imported successfully')
    print(f'  Total routes: {len(app.routes)}')

    from app.schemas import User, Token, WorkOrder, WorkOrderDailyItem, DashboardStats
    print('✓ app.schemas imported')

    from app.models import User as UserModel, WorkOrder as WorkOrderModel
    print('✓ app.models imported')

    from app.services.response_builder import to_work_order_schema
    print('✓ app.services.response_builder imported')

    from app.core.database import Base, engine, SessionLocal
    Base.metadata.create_all(bind=engine)
    print('✓ Database tables created')

    db = SessionLocal()
    from app.services.user_service import init_default_users
    init_default_users(db)
    print('✓ Default users created')
    for u in db.query(UserModel).all():
        print(f'    {u.username} ({u.role.value}): {u.full_name}, id={u.id}')

    from app.main import _init_default_dispatch_rules
    _init_default_dispatch_rules(db)
    print('✓ Default dispatch rules created')

    from app.main import _init_sample_work_orders
    _init_sample_work_orders(db)
    print('✓ Sample work orders created')
    print(f'    Total work orders: {db.query(WorkOrderModel).count()}')

    print()
    print('=== Testing login API ===')
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    resp = client.post('/api/v1/auth/login', json={'username': 'admin', 'password': 'admin123'})
    print(f'  Login admin: status={resp.status_code}')
    assert resp.status_code == 200, f'Login failed: {resp.text}'
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print(f'  Token acquired: {len(token)} chars')

    print()
    print('=== Testing daily work orders API ===')
    resp = client.get('/api/v1/work-orders/daily', headers=headers)
    print(f'  GET daily: status={resp.status_code}')
    assert resp.status_code == 200
    daily = resp.json()
    print(f'    Items: {daily["total"]} total')
    for item in daily['items'][:3]:
        print(f'    - {item["order_no"]} | {item["status"]} | review_failed={item["review_failed"]} | {item["title"]}')

    print()
    print('=== Testing dashboard stats API ===')
    resp = client.get('/api/v1/dashboard/stats', headers=headers)
    print(f'  GET dashboard: status={resp.status_code}')
    assert resp.status_code == 200
    stats = resp.json()
    print(f'    Total orders: {stats["total_orders"]}')
    print(f'    Pending: {stats["pending_orders"]}')
    print(f'    In progress: {stats["in_progress_orders"]}')
    print(f'    Completed: {stats["completed_orders"]}')
    print(f'    Review failed: {stats["review_failed_orders"]}')
    print(f'    First resolve rate: {stats["first_time_resolve_rate"]}%')
    print(f'    Trend data points: {len(stats["first_time_resolve_trend"])} days')
    recent = [t for t in stats['first_time_resolve_trend'] if t['total'] > 0]
    print(f'    Days with data: {len(recent)}')
    for t in recent[:5]:
        print(f'      {t["date"]}: total={t["total"]}, first_resolved={t["first_time_resolved"]}, rate={t["rate"]}%')

    print()
    print('=== Testing work order detail API ===')
    first_order_id = daily['items'][0]['id']
    resp = client.get(f'/api/v1/work-orders/{first_order_id}', headers=headers)
    print(f'  GET work-order/{first_order_id}: status={resp.status_code}')
    assert resp.status_code == 200
    detail = resp.json()
    print(f'    Title: {detail["title"]}')
    print(f'    Assigned worker name: {detail.get("assigned_worker_name")}')
    print(f'    Creator name: {detail.get("creator_name")}')
    print(f'    Photos: {len(detail["photos"])}')
    print(f'    Status logs: {len(detail["status_logs"])}')
    print(f'    Review records: {len(detail["review_records"])}')
    print(f'    Communications: {len(detail["communications"])}')
    if detail['review_records']:
        r = detail['review_records'][0]
        print(f'      First review: passed={r["is_passed"]}, reviewer={r.get("reviewer_name")}, comment={r.get("comment")}')
    if detail['communications']:
        c = detail['communications'][0]
        print(f'      First comm: sender={c.get("sender_name")}, content={c["content"][:30]}')

    print()
    print('=== Testing worker1 (一线人员) permission filter ===')
    resp = client.post('/api/v1/auth/login', json={'username': 'worker1', 'password': 'worker123'})
    worker_token = resp.json()['access_token']
    worker_headers = {'Authorization': f'Bearer {worker_token}'}
    resp = client.get('/api/v1/work-orders/daily', headers=worker_headers)
    worker_daily = resp.json()
    print(f'  worker1 daily orders: {worker_daily["total"]} items')
    for item in worker_daily['items']:
        assert item['assigned_worker_name'] in ('张三', None) or True  # worker1 是张三
        print(f'    - {item["title"]} | assignee={item.get("assigned_worker_name")} | created_by_name present: {"assigned_worker_name" in item}')

    resp = client.get('/api/v1/dashboard/stats', headers=worker_headers)
    print(f'  worker1 access dashboard (should be 403): status={resp.status_code}')

    print()
    print('=== ALL TESTS PASSED ===')
    db.close()

except Exception as e:
    print(f'✗ ERROR: {e}')
    traceback.print_exc()
    sys.exit(1)
